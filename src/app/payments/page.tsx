import { DomoraShell } from "@/components/domora-shell";
import { PaymentsClient, type ObligationRow } from "@/components/payments-client";
import { prisma } from "@/lib/prisma";
import { getShellContext } from "@/lib/server-layout-data";


export default async function PaymentsPage() {
  const { session, unreadNotifications } = await getShellContext();

  const obligationsRaw = await prisma.rentObligation.findMany({
    where:
      session.role === "TENANT" && session.tenantId
        ? { lease: { tenantId: session.tenantId } }
        : undefined,
    orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }, { dueDate: "desc" }],
    include: {
      lease: {
        include: {
          tenant: true,
          unit: { include: { building: { include: { property: true } } } },
        },
      },
      payments: { orderBy: { paidAt: "desc" } },
    },
  });

  const obligations: ObligationRow[] = obligationsRaw.map((ob) => ({
    id: ob.id,
    periodYear: ob.periodYear,
    periodMonth: ob.periodMonth,
    dueDate: ob.dueDate.toISOString(),
    amountDue: ob.amountDue,
    amountPaid: ob.amountPaid,
    status: ob.status,
    tenantName: ob.lease.tenant.fullName,
    propertyName: ob.lease.unit.building.property.name,
    unitNumber: ob.lease.unit.unitNumber,
    payments: ob.payments.map((p) => ({
      id: p.id,
      amount: p.amount,
      paidAt: p.paidAt.toISOString(),
      method: p.method,
      referenceCode: p.referenceCode,
      isVerifiedBankTx: p.isVerifiedBankTx,
      recordedBy: p.recordedBy,
    })),
  }));

  return (
    <DomoraShell
      role={session.role}
      displayName={session.displayName}
      unreadNotifications={unreadNotifications}
    >
      <PaymentsClient obligations={obligations} role={session.role} />
    </DomoraShell>
  );
}
