import { DomoraShell } from "@/components/domora-shell";
import {
  LeasesClient,
  type LeaseOptionTenant,
  type LeaseOptionUnit,
  type LeaseRow,
} from "@/components/leases-client";
import { prisma } from "@/lib/prisma";
import { getShellContext } from "@/lib/server-layout-data";


export default async function LeasesPage() {
  const { session, unreadNotifications } = await getShellContext();

  const [leasesRaw, unitsRaw, tenantsRaw] = await Promise.all([
    prisma.lease.findMany({
      where:
        session.role === "TENANT" && session.tenantId
          ? { tenantId: session.tenantId }
          : undefined,
      orderBy: { startDate: "desc" },
      include: {
        tenant: true,
        unit: { include: { building: { include: { property: true } } } },
        documents: true,
      },
    }),
    prisma.unit.findMany({
      orderBy: [{ buildingId: "asc" }, { unitNumber: "asc" }],
      include: { building: { include: { property: true } } },
    }),
    prisma.tenant.findMany({
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true },
    }),
  ]);

  const leases: LeaseRow[] = leasesRaw.map((l) => ({
    id: l.id,
    unitId: l.unitId,
    unitNumber: l.unit.unitNumber,
    propertyName: l.unit.building.property.name,
    tenantName: l.tenant.fullName,
    tenantId: l.tenantId,
    startDate: l.startDate.toISOString(),
    endDate: l.endDate.toISOString(),
    monthlyRent: l.monthlyRent,
    securityDeposit: l.securityDeposit,
    paymentDueDay: l.paymentDueDay,
    status: l.status,
    renewalStatus: l.renewalStatus,
    documentCount: l.documents.length,
  }));

  const units: LeaseOptionUnit[] = unitsRaw.map((u) => ({
    id: u.id,
    label: `${u.building.property.name} — Unit ${u.unitNumber}`,
    targetRent: u.targetRent,
    status: u.status,
  }));

  const tenants: LeaseOptionTenant[] = tenantsRaw;

  return (
    <DomoraShell
      role={session.role}
      displayName={session.displayName}
      unreadNotifications={unreadNotifications}
    >
      <LeasesClient
        leases={leases}
        units={units}
        tenants={tenants}
        role={session.role}
      />
    </DomoraShell>
  );
}
