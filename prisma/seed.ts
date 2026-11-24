import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ??
    "postgresql://domora:domora_dev_password@127.0.0.1:5432/domora_ai?schema=public",
  max: 1,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding Domora AI PostgreSQL database...");

  // Clean slate for idempotent seeding
  await prisma.predictionRecord.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.document.deleteMany();
  await prisma.maintenanceRequest.deleteMany();
  await prisma.contractor.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.rentObligation.deleteMany();
  await prisma.lease.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.floor.deleteMany();
  await prisma.building.deleteMany();
  await prisma.property.deleteMany();

  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth(); // 0-indexed

  const monthDate = (offsetMonths: number, day: number) =>
    new Date(Date.UTC(y, m + offsetMonths, day, 12, 0, 0));

  // 1. Properties & Buildings
  const courtyard = await prisma.property.create({
    data: {
      name: "The Courtyard Residence",
      address: "418 Travertine Way",
      city: "Santa Barbara",
      state: "CA",
      postalCode: "93101",
      propertyType: "RESIDENTIAL",
      imageUrl: "/images/courtyard-residence.jpg",
      buildings: {
        create: {
          name: "Main Courtyard Pavilion",
          code: "CRP-A",
          totalFloors: 4,
          hasPhysicalPlan: true,
          architectureNotes:
            "Warm travertine facade with recessed bronze balconies and central olive courtyard.",
        },
      },
    },
    include: { buildings: true },
  });

  const oliveGrove = await prisma.property.create({
    data: {
      name: "Olive Grove Villas",
      address: "112 Arroyo Seco Lane",
      city: "Pasadena",
      state: "CA",
      postalCode: "91103",
      propertyType: "RESIDENTIAL",
      imageUrl: "/images/olive-grove-villas.jpg",
      buildings: {
        create: {
          name: "West Pavilion",
          code: "OGV-W",
          totalFloors: 2,
          hasPhysicalPlan: true,
          architectureNotes:
            "Low-rise sandstone and cantilevered cedar eaves around a manicured courtyard.",
        },
      },
    },
    include: { buildings: true },
  });

  const sandstoneLofts = await prisma.property.create({
    data: {
      name: "Sandstone Atelier Lofts",
      address: "890 Mercer Street",
      city: "Portland",
      state: "OR",
      postalCode: "97209",
      propertyType: "BOUTIQUE_LOFT",
      imageUrl: "/images/sandstone-atelier-lofts.jpg",
      buildings: {
        create: {
          name: "Atelier North",
          code: "SAL-N",
          totalFloors: 3,
          hasPhysicalPlan: false,
          architectureNotes:
            "Adaptive-reuse loft building without physical CAD elevation; rendered as abstract unit grid.",
        },
      },
    },
    include: { buildings: true },
  });

  const b1 = courtyard.buildings[0]!;
  const b2 = oliveGrove.buildings[0]!;
  const b3 = sandstoneLofts.buildings[0]!;

  // Helper to create floors & units
  async function createFloorsAndUnits(
    buildingId: string,
    floorCount: number,
    unitsPerFloor: number,
    baseRent: number
  ) {
    const createdUnits = [];
    for (let f = 1; f <= floorCount; f++) {
      const floor = await prisma.floor.create({
        data: {
          buildingId,
          floorNumber: f,
          label: f === floorCount ? `Floor ${f} — Penthouse` : `Floor ${f}`,
        },
      });
      for (let u = 1; u <= unitsPerFloor; u++) {
        const unitNumber = `${f}0${u}`;
        const bedrooms = u === unitsPerFloor ? 3 : u % 2 === 0 ? 2 : 1;
        const unit = await prisma.unit.create({
          data: {
            floorId: floor.id,
            buildingId,
            unitNumber,
            bedrooms,
            bathrooms: bedrooms === 1 ? 1 : bedrooms - 0.5,
            areaSqFt: 680 + bedrooms * 310,
            targetRent: baseRent + f * 150 + bedrooms * 450,
            status: "VACANT",
            gridRow: f,
            gridCol: u,
          },
        });
        createdUnits.push(unit);
      }
    }
    return createdUnits;
  }

  const b1Units = await createFloorsAndUnits(b1.id, 4, 4, 2100);
  const b2Units = await createFloorsAndUnits(b2.id, 2, 4, 2400);
  const b3Units = await createFloorsAndUnits(b3.id, 3, 4, 1850);

  // 2. Tenants (fictional demo data)
  const tenantSpecs = [
    {
      fullName: "Elena Vance",
      email: "elena.vance@domora.demo",
      phone: "+1 (805) 555-0142",
      emergencyContact: "Julian Vance — +1 (805) 555-0199",
      notes: "Architect; prefers digital receipts. Demo tenant account.",
      demoAccountKey: "demo-tenant-elena",
    },
    {
      fullName: "Marcus Chen",
      email: "marcus.chen@domora.demo",
      phone: "+1 (805) 555-0168",
      emergencyContact: "Mei Chen — +1 (415) 555-0112",
      notes: "Long-term resident, punctual ACH transfers.",
      demoAccountKey: null,
    },
    {
      fullName: "Soraia Al-Mansoor",
      email: "soraia.almansoor@domora.demo",
      phone: "+1 (626) 555-0127",
      emergencyContact: "Tariq Al-Mansoor — +1 (626) 555-0188",
      notes: "Requested lease renewal review 30 days prior.",
      demoAccountKey: null,
    },
    {
      fullName: "Henrik Lindqvist",
      email: "henrik.lindqvist@domora.demo",
      phone: "+1 (503) 555-0174",
      emergencyContact: "Astrid Lindqvist — +1 (503) 555-0133",
      notes: "Industrial designer; quiet studio hours.",
      demoAccountKey: null,
    },
    {
      fullName: "Nadia Kowalski",
      email: "nadia.kowalski@domora.demo",
      phone: "+1 (805) 555-0191",
      emergencyContact: "Piotr Kowalski — +1 (805) 555-0155",
      notes: "Recently submitted partial payment due to travel.",
      demoAccountKey: null,
    },
    {
      fullName: "Devon Brooks",
      email: "devon.brooks@domora.demo",
      phone: "+1 (626) 555-0104",
      emergencyContact: "Maya Brooks — +1 (626) 555-0149",
      notes: "Has two-year residency history.",
      demoAccountKey: null,
    },
    {
      fullName: "Camille Laurent",
      email: "camille.laurent@domora.demo",
      phone: "+1 (503) 555-0182",
      emergencyContact: "Luc Laurent — +1 (503) 555-0121",
      notes: "Boutique ceramicist; studio loft lease.",
      demoAccountKey: null,
    },
    {
      fullName: "Arthur Pendelton",
      email: "arthur.pendelton@domora.demo",
      phone: "+1 (805) 555-0136",
      emergencyContact: "Clara Pendelton — +1 (805) 555-0161",
      notes: "Prefers check payments on the 1st.",
      demoAccountKey: null,
    },
  ];

  const tenants = [];
  for (const spec of tenantSpecs) {
    tenants.push(await prisma.tenant.create({ data: spec }));
  }

  // 3. Assign Leases across properties (leaving some units VACANT and some MAINTENANCE)
  const leaseAssignments = [
    { unit: b1Units[0]!, tenant: tenants[0]!, startOffset: -8, endOffset: 4, dueDay: 1, paidCurrent: "PAID" },
    { unit: b1Units[1]!, tenant: tenants[1]!, startOffset: -11, endOffset: 1, dueDay: 1, paidCurrent: "OVERDUE" }, // Expiring soon + overdue
    { unit: b1Units[2]!, tenant: tenants[4]!, startOffset: -5, endOffset: 7, dueDay: 5, paidCurrent: "PARTIAL" },
    { unit: b1Units[4]!, tenant: tenants[7]!, startOffset: -10, endOffset: 2, dueDay: 1, paidCurrent: "PAID" },
    { unit: b1Units[5]!, tenant: tenants[2]!, startOffset: -6, endOffset: 6, dueDay: 1, paidCurrent: "PAID" },
    { unit: b1Units[8]!, tenant: tenants[5]!, startOffset: -11, endOffset: 1, dueDay: 1, paidCurrent: "PAID" }, // Expiring soon
    { unit: b2Units[0]!, tenant: tenants[2]!, startOffset: -9, endOffset: 3, dueDay: 1, paidCurrent: "PAID" },
    { unit: b2Units[1]!, tenant: tenants[5]!, startOffset: -4, endOffset: 8, dueDay: 5, paidCurrent: "PENDING" },
    { unit: b3Units[0]!, tenant: tenants[3]!, startOffset: -7, endOffset: 5, dueDay: 1, paidCurrent: "PAID" },
    { unit: b3Units[1]!, tenant: tenants[6]!, startOffset: -11, endOffset: 1, dueDay: 1, paidCurrent: "OVERDUE" },
  ];

  const createdLeases = [];

  for (const item of leaseAssignments) {
    const startDate = monthDate(item.startOffset, 1);
    const endDate = monthDate(item.endOffset, 25);
    const isExpiringSoon = item.endOffset <= 1;

    await prisma.unit.update({
      where: { id: item.unit.id },
      data: { status: "OCCUPIED" },
    });

    const lease = await prisma.lease.create({
      data: {
        unitId: item.unit.id,
        tenantId: item.tenant.id,
        startDate,
        endDate,
        monthlyRent: item.unit.targetRent,
        securityDeposit: item.unit.targetRent,
        paymentDueDay: item.dueDay,
        status: isExpiringSoon ? "EXPIRING_SOON" : "ACTIVE",
        renewalStatus: isExpiringSoon ? "PENDING" : "RENEWING",
      },
    });
    createdLeases.push({ lease, paidCurrent: item.paidCurrent });

    // Generate 4 months of obligations (-3, -2, -1, 0) for realistic financial trends
    for (const offset of [-3, -2, -1, 0]) {
      const dueDate = monthDate(offset, item.dueDay);
      const periodYear = dueDate.getUTCFullYear();
      const periodMonth = dueDate.getUTCMonth() + 1;

      let amountPaid = item.unit.targetRent;
      let status: "PAID" | "PARTIAL" | "OVERDUE" | "PENDING" = "PAID";

      if (offset === 0) {
        if (item.paidCurrent === "OVERDUE") {
          amountPaid = 0;
          status = "OVERDUE";
        } else if (item.paidCurrent === "PARTIAL") {
          amountPaid = Math.round(item.unit.targetRent * 0.55);
          status = "PARTIAL";
        } else if (item.paidCurrent === "PENDING") {
          amountPaid = 0;
          status = "PENDING";
        }
      }

      const obligation = await prisma.rentObligation.create({
        data: {
          leaseId: lease.id,
          periodYear,
          periodMonth,
          dueDate,
          amountDue: item.unit.targetRent,
          amountPaid,
          status,
        },
      });

      if (amountPaid > 0) {
        await prisma.payment.create({
          data: {
            obligationId: obligation.id,
            leaseId: lease.id,
            amount: amountPaid,
            paidAt: monthDate(offset, Math.min(item.dueDay + 1, 28)),
            method: offset % 2 === 0 ? "BANK_TRANSFER" : "MANUAL_ACH",
            referenceCode: `MAN-${periodYear}${String(periodMonth).padStart(2, "0")}-${item.unit.unitNumber}`,
            notes: "Manually recorded rent payment (non-gateway ledger entry).",
            isVerifiedBankTx: false,
            recordedBy: "Claire Moreau",
          },
        });
      }
    }
  }

  // Mark 2 units in MAINTENANCE status for Building Explorer richness
  await prisma.unit.update({
    where: { id: b1Units[3]!.id },
    data: { status: "MAINTENANCE" },
  });
  await prisma.unit.update({
    where: { id: b2Units[2]!.id },
    data: { status: "MAINTENANCE" },
  });

  // 4. Contractors & Maintenance Requests
  const contractor1 = await prisma.contractor.create({
    data: {
      name: "Vanguard Mechanical & HVAC",
      specialty: "HVAC & Hydronic Systems",
      phone: "+1 (805) 555-0211",
      email: "dispatch@vanguardhvac.demo",
      hourlyRate: 135,
    },
  });
  const contractor2 = await prisma.contractor.create({
    data: {
      name: "Alder & Stone Plumbing",
      specialty: "Plumbing & Fixtures",
      phone: "+1 (805) 555-0244",
      email: "service@alderstone.demo",
      hourlyRate: 120,
    },
  });
  const contractor3 = await prisma.contractor.create({
    data: {
      name: "Kestrel Architectural Millwork",
      specialty: "Structural & Custom Glazing",
      phone: "+1 (503) 555-0290",
      email: "studio@kestrelmillwork.demo",
      hourlyRate: 145,
    },
  });
  const contractors = [contractor1, contractor2, contractor3];

  await prisma.maintenanceRequest.createMany({
    data: [
      {
        unitId: b1Units[3]!.id,
        contractorId: contractors[0]!.id,
        title: "Chilled-water fan coil calibration",
        description: "Primary bedroom HVAC damper oscillating; requires actuator replacement.",
        category: "HVAC",
        priority: "HIGH",
        status: "IN_PROGRESS",
        estimatedCost: 680,
        notes: "Parts ordered from supplier.",
      },
      {
        unitId: b1Units[0]!.id,
        tenantId: tenants[0]!.id,
        contractorId: contractors[1]!.id,
        title: "Kitchen brass mixer cartridge drip",
        description: "Slow drip at unlacquered brass faucet handle.",
        category: "PLUMBING",
        priority: "LOW",
        status: "ASSIGNED",
        estimatedCost: 220,
      },
      {
        unitId: b2Units[2]!.id,
        contractorId: contractors[2]!.id,
        title: "Terrace cedar louver refinishing",
        description: "Pre-leasing exterior timber screen weather sealing.",
        category: "STRUCTURAL",
        priority: "MEDIUM",
        status: "OPEN",
        estimatedCost: 1450,
      },
      {
        unitId: b1Units[4]!.id,
        tenantId: tenants[7]!.id,
        contractorId: contractors[1]!.id,
        title: "Radiant floor manifold pressure check",
        description: "Completed annual pressure test and valve bleed.",
        category: "PLUMBING",
        priority: "MEDIUM",
        status: "RESOLVED",
        estimatedCost: 340,
        actualCost: 315,
        resolvedAt: monthDate(0, 10),
      },
      {
        unitId: b3Units[0]!.id,
        tenantId: tenants[3]!.id,
        contractorId: contractors[2]!.id,
        title: "Steel casement window seal replacement",
        description: "Replaced acoustic perimeter gasket on north studio bay.",
        category: "STRUCTURAL",
        priority: "HIGH",
        status: "CLOSED",
        estimatedCost: 1900,
        actualCost: 2150,
        resolvedAt: monthDate(-1, 18),
      },
    ],
  });

  // 5. Documents
  await prisma.document.createMany({
    data: [
      {
        title: "Executed Lease — Unit 101 (Elena Vance)",
        fileName: "courtyard-101-lease-signed.pdf",
        mimeType: "application/pdf",
        sizeBytes: 428190,
        storagePath: "/uploads/courtyard-101-lease-signed.pdf",
        category: "LEASE",
        tenantId: tenants[0]!.id,
        leaseId: createdLeases[0]!.lease.id,
      },
      {
        title: "Executed Lease — Unit 102 (Marcus Chen)",
        fileName: "courtyard-102-lease-signed.pdf",
        mimeType: "application/pdf",
        sizeBytes: 391040,
        storagePath: "/uploads/courtyard-102-lease-signed.pdf",
        category: "LEASE",
        tenantId: tenants[1]!.id,
        leaseId: createdLeases[1]!.lease.id,
      },
    ],
  });

  // 6. Notifications (deduplicated eventKeys)
  const ym = `${y}-${String(m + 1).padStart(2, "0")}`;
  await prisma.notification.createMany({
    data: [
      {
        eventKey: `RENT_OVERDUE:seed-102:${ym}`,
        triggerType: "RENT_OVERDUE",
        recipientRole: "MANAGER",
        title: "Overdue Rent — Unit 102 (Marcus Chen)",
        message: "Monthly rent obligation for Unit 102 is past due. Follow up with a payment reminder.",
        relatedEntityType: "Lease",
        relatedEntityId: createdLeases[1]!.lease.id,
        deliveryChannel: "IN_APP",
        deliveryStatus: "SENT",
        sentAt: now,
      },
      {
        eventKey: `LEASE_EXPIRING:seed-102:${ym}`,
        triggerType: "LEASE_EXPIRING",
        recipientRole: "MANAGER",
        title: "Lease Expiring Soon — Unit 102",
        message: "Marcus Chen's lease expires within 45 days. Renewal decision pending.",
        relatedEntityType: "Lease",
        relatedEntityId: createdLeases[1]!.lease.id,
        deliveryChannel: "IN_APP",
        deliveryStatus: "SENT",
        sentAt: now,
      },
      {
        eventKey: `MAINTENANCE_CREATED:seed-104`,
        triggerType: "MAINTENANCE_CREATED",
        recipientRole: "MANAGER",
        title: "High-Priority HVAC Work — Unit 104",
        message: "Chilled-water fan coil calibration assigned to Vanguard Mechanical & HVAC.",
        relatedEntityType: "Unit",
        relatedEntityId: b1Units[3]!.id,
        deliveryChannel: "IN_APP",
        deliveryStatus: "SENT",
        sentAt: now,
      },
      {
        eventKey: `RENT_UPCOMING:seed-101:${ym}`,
        triggerType: "RENT_UPCOMING",
        recipientRole: "TENANT",
        recipientId: tenants[0]!.id,
        title: "Rent Receipt Confirmed — Unit 101",
        message: "Your current month rent ledger entry has been recorded as paid.",
        relatedEntityType: "Lease",
        relatedEntityId: createdLeases[0]!.lease.id,
        isRead: true,
        deliveryChannel: "IN_APP",
        deliveryStatus: "SENT",
        sentAt: now,
      },
    ],
  });

  // 7. Advisory Prediction Records (Synthetic Demo)
  await prisma.predictionRecord.createMany({
    data: [
      {
        leaseId: createdLeases[1]!.lease.id,
        modelName: "RANDOM_FOREST",
        lateProbability: 0.74,
        riskTier: "HIGH",
        featureSnapshot: {
          lease_tenure_months: 11,
          prior_late_payments_count: 2,
          avg_days_past_due: 6.4,
          recent_partial_payment_flag: 0,
        },
        explanation:
          "Elevated advisory risk driven by 2 prior late payments and 6.4 avg days past due. Synthetic demo model.",
        isSyntheticDemo: true,
      },
      {
        leaseId: createdLeases[2]!.lease.id,
        modelName: "RANDOM_FOREST",
        lateProbability: 0.48,
        riskTier: "MEDIUM",
        featureSnapshot: {
          lease_tenure_months: 5,
          prior_late_payments_count: 1,
          avg_days_past_due: 2.1,
          recent_partial_payment_flag: 1,
        },
        explanation:
          "Moderate advisory risk due to recent partial payment flag. Synthetic demo model.",
        isSyntheticDemo: true,
      },
      {
        leaseId: createdLeases[0]!.lease.id,
        modelName: "RANDOM_FOREST",
        lateProbability: 0.08,
        riskTier: "LOW",
        featureSnapshot: {
          lease_tenure_months: 8,
          prior_late_payments_count: 0,
          avg_days_past_due: 0.0,
          recent_partial_payment_flag: 0,
        },
        explanation:
          "Low advisory risk — consistent on-time payment history across 8 months. Synthetic demo model.",
        isSyntheticDemo: true,
      },
    ],
  });

  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error("Seed error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
