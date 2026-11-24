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
              },
            },
          },
        },
      },
    },
  });

  const allUnits = properties.flatMap((p) =>
    p.buildings.flatMap((b) => b.units)
  );
  const occupiedCount = allUnits.filter((u) => u.status === "OCCUPIED").length;
  const occupancyPct =
    allUnits.length > 0 ? Math.round((occupiedCount / allUnits.length) * 100) : 0;
  const monthlyScheduledRent = allUnits.reduce(
    (sum, u) => sum + u.leases.reduce((ls, l) => ls + l.monthlyRent, 0),
    0
  );

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
