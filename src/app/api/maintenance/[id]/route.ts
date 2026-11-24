import { NextResponse } from "next/server";
import { AuthorizationError, requireManagerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { maintenanceUpdateSchema } from "@/lib/validation";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireManagerSession();
    const { id } = await context.params;
    const body = await request.json();
    const parsed = maintenanceUpdateSchema.parse(body);

    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.maintenanceRequest.findUniqueOrThrow({
        where: { id },
        include: { unit: true },
      });

      const nextStatus = parsed.status ?? existing.status;
      const isResolvedOrClosed = nextStatus === "RESOLVED" || nextStatus === "CLOSED";

      const req = await tx.maintenanceRequest.update({
        where: { id },
        data: {
          status: nextStatus,
          contractorId:
            parsed.contractorId === undefined ? existing.contractorId : parsed.contractorId,
          actualCost: parsed.actualCost ?? existing.actualCost,
          notes: parsed.notes ?? existing.notes,
          resolvedAt: isResolvedOrClosed ? existing.resolvedAt ?? new Date() : null,
        },
        include: { unit: true, tenant: true, contractor: true },
      });

      // If resolved/closed and no other open requests on unit, restore unit status
      if (isResolvedOrClosed) {
        const remainingOpen = await tx.maintenanceRequest.count({
          where: {
            unitId: req.unitId,
            id: { not: req.id },
            status: { in: ["OPEN", "ASSIGNED", "IN_PROGRESS"] },
          },
        });
        if (remainingOpen === 0 && req.unit.status === "MAINTENANCE") {
          const activeLease = await tx.lease.findFirst({
            where: {
              unitId: req.unitId,
              status: { in: ["ACTIVE", "EXPIRING_SOON"] },
            },
          });
          await tx.unit.update({
            where: { id: req.unitId },
            data: { status: activeLease ? "OCCUPIED" : "VACANT" },
          });
        }
      }

      if (parsed.status && parsed.status !== existing.status) {
        const eventKey = `MAINTENANCE_STATUS:${req.id}:${nextStatus}`;
        await tx.notification.upsert({
          where: { eventKey },
          update: {},
          create: {
            eventKey,
            triggerType: "MAINTENANCE_STATUS_CHANGED",
            recipientRole: req.tenantId ? "TENANT" : "MANAGER",
            recipientId: req.tenantId,
            title: `Maintenance ${nextStatus.replace("_", " ")} — Unit ${req.unit.unitNumber}`,
            message: `Work order "${req.title}" transitioned from ${existing.status} to ${nextStatus}.`,
            relatedEntityType: "MaintenanceRequest",
            relatedEntityId: req.id,
            deliveryChannel: "IN_APP",
            deliveryStatus: "SENT",
            sentAt: new Date(),
          },
        });
      }

      return req;
    });

    return NextResponse.json({ request: updated });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update maintenance request" },
      { status: 400 }
    );
  }
}
