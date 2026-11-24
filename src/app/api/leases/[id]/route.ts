import { NextResponse } from "next/server";
import { AuthorizationError, requireManagerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { leaseUpdateSchema } from "@/lib/validation";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireManagerSession();
    const { id } = await context.params;
    const body = await request.json();
    const parsed = leaseUpdateSchema.parse(body);

    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.lease.findUniqueOrThrow({ where: { id } });

      if (parsed.action === "TERMINATE_EARLY") {
        const terminated = await tx.lease.update({
          where: { id },
          data: {
            status: "TERMINATED",
            terminatedAt: new Date(),
            terminationReason: parsed.terminationReason ?? "Early termination by manager",
          },
        });
        await tx.unit.update({
          where: { id: existing.unitId },
          data: { status: "VACANT" },
        });
        return terminated;
      }

      if (parsed.action === "RENEW") {
        const nextEnd =
          parsed.newEndDate ??
          new Date(
            Date.UTC(
              existing.endDate.getUTCFullYear() + 1,
              existing.endDate.getUTCMonth(),
              existing.endDate.getUTCDate()
            )
          );
        return tx.lease.update({
          where: { id },
          data: {
            endDate: nextEnd,
            status: "ACTIVE",
            renewalStatus: "RENEWING",
          },
        });
      }

      return tx.lease.update({
        where: { id },
        data: {
          renewalStatus: parsed.renewalStatus,
        },
      });
    });

    return NextResponse.json({ lease: updated });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update lease" },
      { status: 400 }
    );
  }
}
