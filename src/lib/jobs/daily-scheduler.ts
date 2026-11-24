import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";
import { calculateObligationStatus } from "@/lib/domain";
import { daysBetween } from "@/lib/utils";

export interface DailyJobSummary {
  runAt: string;
  obligationsGenerated: number;
  obligationsMarkedOverdue: number;
  leasesFlaggedExpiring: number;
  notificationsCreated: number;
  emailsSent: number;
}

async function sendOptionalEmail(to: string, subject: string, text: string): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  if (!host) return false;

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: Number(process.env.SMTP_PORT ?? 587) === 465,
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            }
          : undefined,
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? "Domora AI <notifications@domora.local>",
      to,
      subject,
      text,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Idempotent daily scheduler:
 * 1. Generates monthly rent obligations for active leases if missing.
 * 2. Updates overdue obligation statuses.
 * 3. Flags leases expiring within 45 days.
 * 4. Enqueues persistent notifications with deterministic eventKeys (preventing duplicates).
 */
export async function runDailyScheduler(now: Date = new Date()): Promise<DailyJobSummary> {
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth() + 1;
  const dateStamp = now.toISOString().slice(0, 10);

  let obligationsGenerated = 0;
  let obligationsMarkedOverdue = 0;
  let leasesFlaggedExpiring = 0;
  let notificationsCreated = 0;
  let emailsSent = 0;

  const activeLeases = await prisma.lease.findMany({
    where: {
      status: { in: ["ACTIVE", "EXPIRING_SOON"] },
    },
    include: {
      tenant: true,
      unit: {
        include: {
          building: {
            include: { property: true },
          },
        },
      },
      obligations: true,
    },
  });

  for (const lease of activeLeases) {
    // 1. Ensure current month obligation exists if lease is active during this month
    const hasCurrentMonth = lease.obligations.some(
      (o) => o.periodYear === currentYear && o.periodMonth === currentMonth
    );

    if (!hasCurrentMonth && lease.startDate <= now && lease.endDate >= now) {
      const dueDate = new Date(
        Date.UTC(currentYear, currentMonth - 1, Math.min(lease.paymentDueDay, 28), 12, 0, 0)
      );
      const initialStatus = calculateObligationStatus(lease.monthlyRent, 0, dueDate, now);

      await prisma.rentObligation.create({
        data: {
          leaseId: lease.id,
          periodYear: currentYear,
          periodMonth: currentMonth,
          dueDate,
          amountDue: lease.monthlyRent,
          amountPaid: 0,
          status: initialStatus,
        },
      });
      obligationsGenerated += 1;
    }

    // 2. Lease expiration check (within 45 days)
    const remainingDays = daysBetween(now, lease.endDate);
    if (remainingDays >= 0 && remainingDays <= 45) {
      if (lease.status === "ACTIVE") {
        await prisma.lease.update({
          where: { id: lease.id },
          data: { status: "EXPIRING_SOON" },
        });
        leasesFlaggedExpiring += 1;
      }

      const eventKey = `LEASE_EXPIRING:${lease.id}:${currentYear}-${String(currentMonth).padStart(2, "0")}`;
      const existing = await prisma.notification.findUnique({ where: { eventKey } });
      if (!existing) {
        const title = `Lease Expiring in ${remainingDays} Days — Unit ${lease.unit.unitNumber}`;
        const message = `${lease.tenant.fullName}'s lease at ${lease.unit.building.property.name} (${lease.unit.unitNumber}) expires on ${lease.endDate.toISOString().slice(0, 10)}.`;
        await prisma.notification.create({
          data: {
            eventKey,
            triggerType: "LEASE_EXPIRING",
            recipientRole: "MANAGER",
            title,
            message,
            relatedEntityType: "Lease",
            relatedEntityId: lease.id,
            deliveryChannel: process.env.SMTP_HOST ? "EMAIL" : "IN_APP",
            deliveryStatus: "SENT",
            sentAt: now,
          },
        });
        notificationsCreated += 1;
      }
    }
  }

  // 3. Recompute overdue obligations & enqueue notifications
  const openObligations = await prisma.rentObligation.findMany({
    where: {
      status: { in: ["PENDING", "PARTIAL", "OVERDUE"] },
    },
    include: {
      lease: {
        include: {
          tenant: true,
          unit: { include: { building: { include: { property: true } } } },
        },
      },
    },
  });

  for (const ob of openObligations) {
    const nextStatus = calculateObligationStatus(ob.amountDue, ob.amountPaid, ob.dueDate, now);
    if (nextStatus !== ob.status) {
      await prisma.rentObligation.update({
        where: { id: ob.id },
        data: { status: nextStatus },
      });
      if (nextStatus === "OVERDUE") {
        obligationsMarkedOverdue += 1;
      }
    }

    const balance = Math.max(0, ob.amountDue - ob.amountPaid);
    if (nextStatus === "OVERDUE" && balance > 0) {
      const eventKey = `RENT_OVERDUE:${ob.id}:${currentYear}-${String(currentMonth).padStart(2, "0")}`;
      const existing = await prisma.notification.findUnique({ where: { eventKey } });
      if (!existing) {
        const title = `Overdue Rent — Unit ${ob.lease.unit.unitNumber} ($${balance.toLocaleString()})`;
        const message = `${ob.lease.tenant.fullName} has an overdue balance of $${balance.toLocaleString()} for ${ob.periodYear}-${String(ob.periodMonth).padStart(2, "0")}.`;
        const emailSent = await sendOptionalEmail(ob.lease.tenant.email, title, message);
        if (emailSent) emailsSent += 1;

        await prisma.notification.create({
          data: {
            eventKey,
            triggerType: "RENT_OVERDUE",
            recipientRole: "MANAGER",
            title,
            message,
            relatedEntityType: "RentObligation",
            relatedEntityId: ob.id,
            deliveryChannel: emailSent ? "EMAIL" : "IN_APP",
            deliveryStatus: "SENT",
            sentAt: now,
          },
        });
        notificationsCreated += 1;
      }
    } else if (nextStatus === "PENDING" || nextStatus === "PARTIAL") {
      const daysUntilDue = daysBetween(now, ob.dueDate);
      if (daysUntilDue >= 0 && daysUntilDue <= 5) {
        const eventKey = `RENT_UPCOMING:${ob.id}`;
        const existing = await prisma.notification.findUnique({ where: { eventKey } });
        if (!existing) {
          const title = `Upcoming Rent Due — Unit ${ob.lease.unit.unitNumber}`;
          const message = `Rent of $${balance.toLocaleString()} is due in ${daysUntilDue} day(s) for ${ob.lease.tenant.fullName}.`;
          await prisma.notification.create({
            data: {
              eventKey,
              triggerType: "RENT_UPCOMING",
              recipientRole: "TENANT",
              recipientId: ob.lease.tenantId,
              title,
              message,
              relatedEntityType: "RentObligation",
              relatedEntityId: ob.id,
              deliveryChannel: "IN_APP",
              deliveryStatus: "SENT",
              sentAt: now,
            },
          });
          notificationsCreated += 1;
        }
      }
    }
  }

  // 4. Vacant unit reminders (monthly cadence)
  const vacantUnits = await prisma.unit.findMany({
    where: { status: "VACANT" },
    include: { building: { include: { property: true } } },
  });

  for (const unit of vacantUnits) {
    const eventKey = `UNIT_VACANT:${unit.id}:${currentYear}-${String(currentMonth).padStart(2, "0")}`;
    const existing = await prisma.notification.findUnique({ where: { eventKey } });
    if (!existing) {
      await prisma.notification.create({
        data: {
          eventKey,
          triggerType: "UNIT_VACANT_REMINDER",
          recipientRole: "MANAGER",
          title: `Vacant Unit Reminder — ${unit.building.property.name} (${unit.unitNumber})`,
          message: `Unit ${unit.unitNumber} (${unit.bedrooms}BR, target $${unit.targetRent.toLocaleString()}/mo) is currently vacant and ready for leasing.`,
          relatedEntityType: "Unit",
          relatedEntityId: unit.id,
          deliveryChannel: "IN_APP",
          deliveryStatus: "SENT",
          sentAt: now,
        },
      });
      notificationsCreated += 1;
    }
  }

  return {
    runAt: dateStamp,
    obligationsGenerated,
    obligationsMarkedOverdue,
    leasesFlaggedExpiring,
    notificationsCreated,
    emailsSent,
  };
}
