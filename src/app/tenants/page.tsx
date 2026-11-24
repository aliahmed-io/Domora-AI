import { DomoraShell } from "@/components/domora-shell";
import { TenantsClient, type TenantRecord } from "@/components/tenants-client";
import { prisma } from "@/lib/prisma";
import { getShellContext } from "@/lib/server-layout-data";


export default async function TenantsPage() {
  const { session, unreadNotifications } = await getShellContext();

  const tenantsRaw = await prisma.tenant.findMany({
    where:
      session.role === "TENANT" && session.tenantId
        ? { id: session.tenantId }
        : undefined,
    orderBy: { fullName: "asc" },
    include: {
      leases: {
        orderBy: { startDate: "desc" },
        include: {
          unit: { include: { building: { include: { property: true } } } },
          payments: { orderBy: { paidAt: "desc" } },
        },
      },
      maintenanceRequests: { orderBy: { createdAt: "desc" } },
      documents: { orderBy: { uploadedAt: "desc" } },
    },
  });

  const tenants: TenantRecord[] = tenantsRaw.map((t) => ({
    id: t.id,
    fullName: t.fullName,
    email: t.email,
    phone: t.phone,
    emergencyContact: t.emergencyContact,
    notes: t.notes,
    leases: t.leases.map((l) => ({
      id: l.id,
      unitNumber: l.unit.unitNumber,
      propertyName: l.unit.building.property.name,
      monthlyRent: l.monthlyRent,
      status: l.status,
      startDate: l.startDate.toISOString(),
      endDate: l.endDate.toISOString(),
    })),
    payments: t.leases
      .flatMap((l) => l.payments)
      .map((p) => ({
        id: p.id,
        amount: p.amount,
        paidAt: p.paidAt.toISOString(),
        method: p.method,
        referenceCode: p.referenceCode,
      })),
    maintenanceRequests: t.maintenanceRequests.map((m) => ({
      id: m.id,
      title: m.title,
      status: m.status,
      priority: m.priority,
    })),
    documents: t.documents.map((d) => ({
      id: d.id,
      title: d.title,
      fileName: d.fileName,
      category: d.category,
      uploadedAt: d.uploadedAt.toISOString(),
    })),
  }));

  return (
    <DomoraShell
      role={session.role}
      displayName={session.displayName}
      unreadNotifications={unreadNotifications}
    >
      <TenantsClient tenants={tenants} role={session.role} />
    </DomoraShell>
  );
}
