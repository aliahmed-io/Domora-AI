import { NextResponse } from "next/server";
import { AuthorizationError, getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { maintenanceCreateSchema } from "@/lib/validation";

export async function GET() {
  try {
    const session = await getServerSession();
    const where =
      session.role === "TENANT" && session.tenantId
        ? { tenantId: session.tenantId }
        : undefined;

    const [requests, contractors] = await Promise.all([
      prisma.maintenanceRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          unit: { include: { building: { include: { property: true } } } },
          tenant: true,
          contractor: true,
          documents: true,
        },
      }),
      prisma.contractor.findMany({ orderBy: { name: "asc" } }),
    ]);

    return NextResponse.json({ requests, contractors });
  } catch {
    return NextResponse.json(
      { error: "Failed to load maintenance requests" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    const body = await request.json();
    const parsed = maintenanceCreateSchema.parse(body);

    const tenantId =
      session.role === "TENANT" && session.tenantId
        ? session.tenantId
        : parsed.tenantId ?? null;

    if (session.role === "TENANT" && session.tenantId) {
      const activeLease = await prisma.lease.findFirst({
        where: {
          unitId: parsed.unitId,
          tenantId: session.tenantId,
          status: { in: ["ACTIVE", "EXPIRING_SOON"] },
        },
      });
      if (!activeLease) {
        throw new AuthorizationError(
          "Tenants can only submit maintenance requests for their assigned unit."
        );
      }
    }

    const created = await prisma.$transaction(async (tx) => {
      const req = await tx.maintenanceRequest.create({
        data: {
          unitId: parsed.unitId,
          tenantId,
          title: parsed.title,
          description: parsed.description,
          category: parsed.category,
          priority: parsed.priority,
          status: "OPEN",
          estimatedCost: parsed.estimatedCost,
        },
        include: {
          unit: { include: { building: { include: { property: true } } } },
        },
      });

      if (parsed.priority === "URGENT" || parsed.priority === "HIGH") {
        await tx.unit.update({
          where: { id: parsed.unitId },
          data: { status: "MAINTENANCE" },
        });
      }

      const eventKey = `MAINTENANCE_CREATED:${req.id}`;
      await tx.notification.upsert({
        where: { eventKey },
        update: {},
        create: {
          eventKey,
          triggerType: "MAINTENANCE_CREATED",
          recipientRole: "MANAGER",
          title: `New ${parsed.priority} Maintenance — Unit ${req.unit.unitNumber}`,
          message: `${parsed.title} (${parsed.category}) reported at ${req.unit.building.property.name}.`,
          relatedEntityType: "MaintenanceRequest",
          relatedEntityId: req.id,
          deliveryChannel: "IN_APP",
          deliveryStatus: "SENT",
          sentAt: new Date(),
        },
      });

      return req;
    });

    return NextResponse.json({ request: created }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create maintenance request",
      },
      { status: 400 }
    );
  }
}
