import { redirect } from "next/navigation";
import { DomoraShell } from "@/components/domora-shell";
import {
  BuildingExplorer,
  type ExplorerBuilding,
} from "@/components/building-explorer";
import { computeUnitVisualState } from "@/lib/domain";
import { prisma } from "@/lib/prisma";
import { getShellContext } from "@/lib/server-layout-data";


export default async function ExplorerPage({
  searchParams,
}: {
  searchParams: Promise<{ propertyId?: string }>;
}) {
  const { session, unreadNotifications } = await getShellContext();
  if (session.role === "TENANT") {
    redirect("/");
  }

  const params = await searchParams;

  const buildingsRaw = await prisma.building.findMany({
    where: { property: { archivedAt: null } },
    orderBy: { createdAt: "asc" },
    include: {
      property: true,
      floors: {
        orderBy: { floorNumber: "asc" },
        include: {
          units: {
            orderBy: { unitNumber: "asc" },
            include: {
              leases: {
                where: { status: { in: ["ACTIVE", "EXPIRING_SOON"] } },
                include: {
                  tenant: true,
                  obligations: true,
                },
              },
              maintenanceRequests: {
                where: { status: { in: ["OPEN", "ASSIGNED", "IN_PROGRESS"] } },
              },
            },
          },
        },
      },
    },
  });

  const now = new Date();
  const buildings: ExplorerBuilding[] = buildingsRaw.map((b) => ({
    id: b.id,
    propertyId: b.propertyId,
    propertyName: b.property.name,
    propertyAddress: `${b.property.address}, ${b.property.city}`,
    name: b.name,
    code: b.code,
    hasPhysicalPlan: b.hasPhysicalPlan,
    architectureNotes: b.architectureNotes,
    floors: b.floors.map((f) => ({
      id: f.id,
      floorNumber: f.floorNumber,
      label: f.label,
      units: f.units.map((u) => {
        const activeLease = u.leases[0] ?? null;
        const outstandingBalance = activeLease
          ? activeLease.obligations.reduce(
              (sum, ob) => sum + Math.max(0, ob.amountDue - ob.amountPaid),
              0
            )
          : 0;

        const visualState = computeUnitVisualState({
          unitStatus: u.status,
          openMaintenanceCount: u.maintenanceRequests.length,
          activeLeaseEndDate: activeLease?.endDate ?? null,
          now,
        });

        return {
          id: u.id,
          unitNumber: u.unitNumber,
          bedrooms: u.bedrooms,
          bathrooms: u.bathrooms,
          areaSqFt: u.areaSqFt,
          targetRent: u.targetRent,
          visualState,
          activeLease: activeLease
            ? {
                id: activeLease.id,
                tenantId: activeLease.tenantId,
                tenantName: activeLease.tenant.fullName,
                tenantEmail: activeLease.tenant.email,
                monthlyRent: activeLease.monthlyRent,
                startDate: activeLease.startDate.toISOString(),
                endDate: activeLease.endDate.toISOString(),
                status: activeLease.status,
                outstandingBalance,
              }
            : null,
          openMaintenance: u.maintenanceRequests.map((m) => ({
            id: m.id,
            title: m.title,
            priority: m.priority,
            status: m.status,
          })),
        };
      }),
    })),
  }));

  return (
    <DomoraShell
      role={session.role}
      displayName={session.displayName}
      unreadNotifications={unreadNotifications}
    >
      <BuildingExplorer
        buildings={buildings}
        initialPropertyId={params.propertyId}
      />
    </DomoraShell>
  );
}
