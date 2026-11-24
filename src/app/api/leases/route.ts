import { NextResponse } from "next/server";
import { AuthorizationError, getServerSession, requireManagerSession } from "@/lib/auth";
import { calculateObligationStatus, hasOverlappingActiveLease } from "@/lib/domain";
import { prisma } from "@/lib/prisma";
import { leaseCreateSchema } from "@/lib/validation";

export async function GET() {
  try {
    const session = await getServerSession();
    const where =
      session.role === "TENANT" && session.tenantId
        ? { tenantId: session.tenantId }
        : undefined;

    const leases = await prisma.lease.findMany({
      where,
      orderBy: { startDate: "desc" },
      include: {
        tenant: true,
        unit: {
          include: {
            building: { include: { property: true } },
          },
        },
        obligations: {
          orderBy: { dueDate: "desc" },
        },
        documents: true,
      },
    });

    return NextResponse.json({ leases });
  } catch {
    return NextResponse.json({ error: "Failed to fetch leases" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireManagerSession();
    const body = await request.json();
    const parsed = leaseCreateSchema.parse(body);

    const created = await prisma.$transaction(async (tx) => {
      const existingLeases = await tx.lease.findMany({
        where: { unitId: parsed.unitId },
        select: { id: true, startDate: true, endDate: true, status: true },
      });

      if (hasOverlappingActiveLease(existingLeases, parsed.startDate, parsed.endDate)) {
        throw new Error(
          "Conflicting active lease exists for this unit during the selected date range."
        );
      }

      const now = new Date();
      const daysUntilEnd = Math.ceil(
        (parsed.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      const initialStatus = daysUntilEnd <= 45 ? "EXPIRING_SOON" : "ACTIVE";

      const lease = await tx.lease.create({
        data: {
          unitId: parsed.unitId,
          tenantId: parsed.tenantId,
          startDate: parsed.startDate,
          endDate: parsed.endDate,
          monthlyRent: parsed.monthlyRent,
          securityDeposit: parsed.securityDeposit,
          paymentDueDay: parsed.paymentDueDay,
          status: initialStatus,
          renewalStatus: parsed.renewalStatus,
        },
      });

      await tx.unit.update({
        where: { id: parsed.unitId },
        data: { status: "OCCUPIED" },
      });

      // Generate initial obligation for current month if lease is active now
      if (parsed.startDate <= now && parsed.endDate >= now) {
        const year = now.getUTCFullYear();
        const month = now.getUTCMonth() + 1;
        const dueDate = new Date(
          Date.UTC(year, month - 1, Math.min(parsed.paymentDueDay, 28), 12, 0, 0)
        );
        await tx.rentObligation.create({
          data: {
            leaseId: lease.id,
            periodYear: year,
            periodMonth: month,
            dueDate,
            amountDue: parsed.monthlyRent,
            amountPaid: 0,
            status: calculateObligationStatus(parsed.monthlyRent, 0, dueDate, now),
          },
        });
      }

      return lease;
    });

    return NextResponse.json({ lease: created }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create lease" },
      { status: 400 }
    );
  }
}
