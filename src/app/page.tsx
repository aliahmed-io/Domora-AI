import Link from "next/link";
import { DomoraShell } from "@/components/domora-shell";
import { PortfolioClient, type PropertySummary } from "@/components/portfolio-client";
import { prisma } from "@/lib/prisma";
import { getShellContext } from "@/lib/server-layout-data";
import { formatCurrency, formatDate } from "@/lib/utils";


export default async function HomePage() {
  const { session, unreadNotifications } = await getShellContext();

  if (session.role === "TENANT" && session.tenantId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      include: {
        leases: {
          where: { status: { in: ["ACTIVE", "EXPIRING_SOON"] } },
          include: {
            unit: { include: { building: { include: { property: true } } } },
            obligations: { orderBy: { dueDate: "desc" }, take: 3 },
          },
        },
        maintenanceRequests: { orderBy: { createdAt: "desc" }, take: 4 },
      },
    });

    const activeLease = tenant?.leases[0];

    return (
      <DomoraShell
        role={session.role}
        displayName={session.displayName}
        unreadNotifications={unreadNotifications}
      >
        <div className="space-y-8">
          <section className="border border-[#C5A88A] bg-[#FAF5EE] p-8 sm:p-12">
            <h1 className="font-display text-4xl sm:text-5xl text-[#262824]">
              Welcome home, {tenant?.fullName ?? "Resident"}.
            </h1>
            <p className="text-sm text-[#5A5C56] mt-2 max-w-2xl">
              Your portal displays only your assigned residence, active lease
              terms, rent payment ledger, and maintenance requests.
            </p>

            {activeLease && (
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-4 gap-6 pt-6 border-t border-[#C5A88A]/60">
                <div>
                  <span className="text-xs text-[#5A5C56]">Residence</span>
                  <p className="font-display text-2xl mt-1">
                    {activeLease.unit.building.property.name}
                  </p>
                  <p className="font-mono-num text-xs text-[#8C4A3D]">
                    Unit {activeLease.unit.unitNumber}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-[#5A5C56]">Monthly Rent</span>
                  <p className="font-mono-num text-2xl mt-1">
                    {formatCurrency(activeLease.monthlyRent)}
                  </p>
                  <p className="text-xs text-[#5A5C56]">
                    Due day {activeLease.paymentDueDay}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-[#5A5C56]">Lease Term Ends</span>
                  <p className="font-mono-num text-xl mt-1">
                    {formatDate(activeLease.endDate)}
                  </p>
                  <p className="text-xs text-[#6F795E]">{activeLease.status}</p>
                </div>
                <div className="flex items-center sm:justify-end gap-2">
                  <Link
                    href="/payments"
                    className="bg-[#262824] text-[#FAF5EE] px-4 py-2 text-xs font-medium"
                  >
                    View Ledger
                  </Link>
                  <Link
                    href="/maintenance"
                    className="border border-[#C5A88A] px-4 py-2 text-xs font-medium"
                  >
                    Request Repair
                  </Link>
                </div>
              </div>
            )}
          </section>
        </div>
      </DomoraShell>
    );
  }

  const properties = await prisma.property.findMany({
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

  const summaries: PropertySummary[] = properties.map((p) => {
    const units = p.buildings.flatMap((b) => b.units);
    const totalUnits = units.length;
    const occupiedUnits = units.filter((u) => u.status === "OCCUPIED").length;
    const vacantUnits = units.filter((u) => u.status === "VACANT").length;
    const openMaintenance = units.reduce(
      (sum, u) => sum + u.maintenanceRequests.length,
      0
    );

    let monthlyScheduledRent = 0;
    let collectedRent = 0;
    let overdueAmount = 0;

    for (const u of units) {
      for (const lease of u.leases) {
        monthlyScheduledRent += lease.monthlyRent;
        for (const ob of lease.obligations) {
          if (ob.periodYear === currentYear && ob.periodMonth === currentMonth) {
            collectedRent += ob.amountPaid;
          }
          if (ob.status === "OVERDUE") {
            overdueAmount += Math.max(0, ob.amountDue - ob.amountPaid);
          }
        }
      }
    }

    return {
      id: p.id,
      name: p.name,
      address: p.address,
      city: p.city,
      state: p.state,
      postalCode: p.postalCode,
      propertyType: p.propertyType,
      imageUrl: p.imageUrl,
      archivedAt: p.archivedAt ? p.archivedAt.toISOString() : null,
      totalUnits,
      occupiedUnits,
      vacantUnits,
      monthlyScheduledRent,
      collectedRent,
      overdueAmount,
      openMaintenance,
    };
  });

  return (
    <DomoraShell
      role={session.role}
      displayName={session.displayName}
      unreadNotifications={unreadNotifications}
    >
      <PortfolioClient initialProperties={summaries} />
    </DomoraShell>
  );
}
