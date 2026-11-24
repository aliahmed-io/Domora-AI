import { NextResponse } from "next/server";
import { AuthorizationError, getServerSession, requireManagerSession } from "@/lib/auth";
import { calculateObligationStatus } from "@/lib/domain";
import { prisma } from "@/lib/prisma";
import { paymentCreateSchema } from "@/lib/validation";

export async function GET() {
  try {
    const session = await getServerSession();
    const leaseFilter =
      session.role === "TENANT" && session.tenantId
        ? { tenantId: session.tenantId }
        : undefined;

    const obligations = await prisma.rentObligation.findMany({
      where: leaseFilter ? { lease: leaseFilter } : undefined,
      orderBy: [{ dueDate: "desc" }],
      include: {
        lease: {
          include: {
            tenant: true,
            unit: { include: { building: { include: { property: true } } } },
          },
        },
        payments: {
          orderBy: { paidAt: "desc" },
        },
      },
    });

    return NextResponse.json({ obligations });
  } catch {
    return NextResponse.json({ error: "Failed to load rent ledger" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireManagerSession();
    const body = await request.json();
    const parsed = paymentCreateSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      const obligation = await tx.rentObligation.findUniqueOrThrow({
        where: { id: parsed.obligationId },
      });

      const remaining = Math.max(0, obligation.amountDue - obligation.amountPaid);
      if (parsed.amount > remaining + 0.01) {
        throw new Error(
          `Payment amount ($${parsed.amount}) exceeds remaining balance ($${remaining.toFixed(2)}).`
        );
      }

      const paidAt = parsed.paidAt ?? new Date();
      const payment = await tx.payment.create({
        data: {
          obligationId: obligation.id,
          leaseId: obligation.leaseId,
          amount: parsed.amount,
          paidAt,
          method: parsed.method,
          referenceCode:
            parsed.referenceCode ||
            `MAN-${Date.now().toString(36).toUpperCase()}`,
          notes: parsed.notes,
          isVerifiedBankTx: false, // Manual ledger entry; never confused with verified bank settlement
          recordedBy: session.displayName,
        },
      });

      const nextAmountPaid = Number((obligation.amountPaid + parsed.amount).toFixed(2));
      const nextStatus = calculateObligationStatus(
        obligation.amountDue,
        nextAmountPaid,
        obligation.dueDate
      );

      const updatedObligation = await tx.rentObligation.update({
        where: { id: obligation.id },
        data: {
          amountPaid: nextAmountPaid,
          status: nextStatus,
        },
      });

      return { payment, obligation: updatedObligation };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to record payment" },
      { status: 400 }
    );
  }
}
