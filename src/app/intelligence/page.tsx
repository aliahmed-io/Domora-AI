import { redirect } from "next/navigation";
import { DomoraShell } from "@/components/domora-shell";
import {
  IntelligenceClient,
  type CollectionTrendPoint,
  type ExpiringLeaseAlert,
  type PredictionRow,
} from "@/components/intelligence-client";
import {
  detectMaintenanceSpendAnomalies,
  loadMlEvaluationReport,
} from "@/lib/intelligence";
import { prisma } from "@/lib/prisma";
import { getShellContext } from "@/lib/server-layout-data";
import { daysBetween } from "@/lib/utils";


export default async function IntelligencePage() {
  const { session, unreadNotifications } = await getShellContext();
  if (session.role === "TENANT") {
    redirect("/");
  }

  const [units, obligations, leases, maintenance, predictionsRaw] =
    await Promise.all([
      prisma.unit.findMany({
        include: { building: { include: { property: true } } },
      }),
      prisma.rentObligation.findMany({
        orderBy: [{ periodYear: "asc" }, { periodMonth: "asc" }],
      }),
      prisma.lease.findMany({
        where: { status: { in: ["ACTIVE", "EXPIRING_SOON"] } },
        include: {
          tenant: true,
          unit: { include: { building: { include: { property: true } } } },
        },
      }),
      prisma.maintenanceRequest.findMany({
        include: {
          unit: { include: { building: { include: { property: true } } } },
        },
      }),
      prisma.predictionRecord.findMany({
        orderBy: { lateProbability: "desc" },
        include: {
          lease: {
            include: {
              tenant: true,
              unit: { include: { building: { include: { property: true } } } },
            },
          },
        },
      }),
    ]);

  const occupiedCount = units.filter((u) => u.status === "OCCUPIED").length;
  const occupancyRate =
    units.length > 0 ? Math.round((occupiedCount / units.length) * 100) : 0;

  const totalOverdue = obligations
    .filter((o) => o.status === "OVERDUE")
    .reduce((sum, o) => sum + Math.max(0, o.amountDue - o.amountPaid), 0);

  // Group obligations by YYYY-MM
  const trendMap = new Map<string, { scheduled: number; collected: number }>();
  for (const ob of obligations) {
    const key = `${ob.periodYear}-${String(ob.periodMonth).padStart(2, "0")}`;
    const prev = trendMap.get(key) ?? { scheduled: 0, collected: 0 };
    trendMap.set(key, {
      scheduled: prev.scheduled + ob.amountDue,
      collected: prev.collected + ob.amountPaid,
    });
  }
  const collectionTrends: CollectionTrendPoint[] = Array.from(
    trendMap.entries()
  ).map(([period, val]) => ({
    period,
    scheduled: Math.round(val.scheduled),
    collected: Math.round(val.collected),
  }));

  const now = new Date();
  const expiringLeases: ExpiringLeaseAlert[] = leases
    .map((l) => ({
      id: l.id,
      unitNumber: l.unit.unitNumber,
      propertyName: l.unit.building.property.name,
      tenantName: l.tenant.fullName,
      endDate: l.endDate.toISOString(),
      daysRemaining: daysBetween(now, l.endDate),
      renewalStatus: l.renewalStatus,
    }))
    .filter((l) => l.daysRemaining >= 0 && l.daysRemaining <= 45)
    .sort((a, b) => a.daysRemaining - b.daysRemaining);

  const unitSpendMap = new Map<
    string,
    { unitId: string; unitNumber: string; propertyName: string; totalSpend: number }
  >();
  for (const m of maintenance) {
    const cost = m.actualCost ?? m.estimatedCost ?? 0;
    const prev = unitSpendMap.get(m.unitId) ?? {
      unitId: m.unitId,
      unitNumber: m.unit.unitNumber,
      propertyName: m.unit.building.property.name,
      totalSpend: 0,
    };
    prev.totalSpend += cost;
    unitSpendMap.set(m.unitId, prev);
  }
  const spendAnomalies = detectMaintenanceSpendAnomalies(
    Array.from(unitSpendMap.values())
  );

  const predictions: PredictionRow[] = predictionsRaw.map((p) => ({
    id: p.id,
    tenantName: p.lease.tenant.fullName,
    unitNumber: p.lease.unit.unitNumber,
    propertyName: p.lease.unit.building.property.name,
    modelName: p.modelName,
    lateProbability: p.lateProbability,
    riskTier: p.riskTier,
    explanation: p.explanation,
  }));

  const mlReport = loadMlEvaluationReport();

  return (
    <DomoraShell
      role={session.role}
      displayName={session.displayName}
      unreadNotifications={unreadNotifications}
    >
      <IntelligenceClient
        occupancyRate={occupancyRate}
        totalOverdue={totalOverdue}
        collectionTrends={collectionTrends}
        expiringLeases={expiringLeases}
        spendAnomalies={spendAnomalies}
        predictions={predictions}
        mlReport={mlReport}
      />
    </DomoraShell>
  );
}
