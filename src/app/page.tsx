import { DomoraShell } from "@/components/domora-shell";
import { LandingPage } from "@/components/landing-page";
import { prisma } from "@/lib/prisma";
import { getShellContext } from "@/lib/server-layout-data";

export default async function HomePage() {
  const { session, unreadNotifications } = await getShellContext();

  const properties = await prisma.property.findMany({
    where: { archivedAt: null },
    orderBy: { createdAt: "asc" },
    include: {
      buildings: {
        include: {
          units: {
            include: {
              leases: {
                where: { status: { in: ["ACTIVE", "EXPIRING_SOON"] } },
                include: { obligations: true },
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
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth() + 1;

  const allUnits = properties.flatMap((p) =>
    p.buildings.flatMap((b) => b.units)
  );
  const occupiedCount = allUnits.filter((u) => u.status === "OCCUPIED").length;
  const occupancyPct =
    allUnits.length > 0 ? Math.round((occupiedCount / allUnits.length) * 100) : 0;

  let monthlyScheduledRent = 0;
  let collectedMtd = 0;
  let overdueTotal = 0;
  let openMaintenance = 0;

  for (const u of allUnits) {
    openMaintenance += u.maintenanceRequests.length;
    for (const l of u.leases) {
      monthlyScheduledRent += l.monthlyRent;
      for (const ob of l.obligations) {
        if (ob.periodYear === currentYear && ob.periodMonth === currentMonth) {
          collectedMtd += ob.amountPaid;
        }
        if (ob.status === "OVERDUE") {
          overdueTotal += Math.max(0, ob.amountDue - ob.amountPaid);
        }
      }
    }
  }

  return (
    <DomoraShell
      role={session.role}
      displayName={session.displayName}
      unreadNotifications={unreadNotifications}
    >
      <LandingPage
        role={session.role}
        stats={{
          propertyCount: properties.length,
          unitCount: allUnits.length,
          occupancyPct,
          monthlyScheduledRent,
          collectedMtd,
          overdueTotal,
          openMaintenance,
        }}
        properties={properties.map((p) => ({
          id: p.id,
          name: p.name,
          city: p.city,
          state: p.state,
          imageUrl: p.imageUrl,
          unitCount: p.buildings.reduce((s, b) => s + b.units.length, 0),
        }))}
      />
    </DomoraShell>
  );
}
