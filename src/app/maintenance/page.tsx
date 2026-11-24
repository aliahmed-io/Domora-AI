import { DomoraShell } from "@/components/domora-shell";
import {
  MaintenanceClient,
  type ContractorOption,
  type MaintenanceRow,
  type MaintenanceUnitOption,
} from "@/components/maintenance-client";
import { prisma } from "@/lib/prisma";
import { getShellContext } from "@/lib/server-layout-data";


export default async function MaintenancePage() {
  const { session, unreadNotifications } = await getShellContext();

  const [requestsRaw, unitsRaw, contractorsRaw] = await Promise.all([
    prisma.maintenanceRequest.findMany({
      where:
        session.role === "TENANT" && session.tenantId
          ? { tenantId: session.tenantId }
          : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        unit: { include: { building: { include: { property: true } } } },
        tenant: true,
        contractor: true,
      },
    }),
    prisma.unit.findMany({
      where:
        session.role === "TENANT" && session.tenantId
          ? {
              leases: {
                some: {
                  tenantId: session.tenantId,
                  status: { in: ["ACTIVE", "EXPIRING_SOON"] },
                },
              },
            }
          : undefined,
      orderBy: [{ buildingId: "asc" }, { unitNumber: "asc" }],
      include: { building: { include: { property: true } } },
    }),
    prisma.contractor.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, specialty: true },
    }),
  ]);

  const requests: MaintenanceRow[] = requestsRaw.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    category: r.category,
    priority: r.priority,
    status: r.status,
    estimatedCost: r.estimatedCost,
    actualCost: r.actualCost,
    createdAt: r.createdAt.toISOString(),
    resolvedAt: r.resolvedAt ? r.resolvedAt.toISOString() : null,
    unitNumber: r.unit.unitNumber,
    propertyName: r.unit.building.property.name,
    tenantName: r.tenant?.fullName ?? null,
    contractorId: r.contractorId,
    contractorName: r.contractor?.name ?? null,
  }));

  const units: MaintenanceUnitOption[] = unitsRaw.map((u) => ({
    id: u.id,
    label: `${u.building.property.name} — Unit ${u.unitNumber}`,
  }));

  const contractors: ContractorOption[] = contractorsRaw;

  return (
    <DomoraShell
      role={session.role}
      displayName={session.displayName}
      unreadNotifications={unreadNotifications}
    >
      <MaintenanceClient
        requests={requests}
        units={units}
        contractors={contractors}
        role={session.role}
      />
    </DomoraShell>
  );
}
