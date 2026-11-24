import { describe, expect, it } from "vitest";
import {
  calculateObligationStatus,
  computeUnitVisualState,
  hasOverlappingActiveLease,
} from "@/lib/domain";
import { detectMaintenanceSpendAnomalies } from "@/lib/intelligence";
import { documentUploadSchema, leaseCreateSchema } from "@/lib/validation";

describe("Domora AI Domain Logic", () => {
  it("prevents conflicting overlapping active leases on the same unit", () => {
    const existing = [
      {
        id: "lease-1",
        startDate: new Date("2026-01-01T00:00:00Z"),
        endDate: new Date("2026-12-31T00:00:00Z"),
        status: "ACTIVE",
      },
      {
        id: "lease-old",
        startDate: new Date("2025-01-01T00:00:00Z"),
        endDate: new Date("2025-12-31T00:00:00Z"),
        status: "TERMINATED",
      },
    ];

    expect(
      hasOverlappingActiveLease(
        existing,
        new Date("2026-06-01T00:00:00Z"),
        new Date("2027-05-31T00:00:00Z")
      )
    ).toBe(true);

    expect(
      hasOverlappingActiveLease(
        existing,
        new Date("2027-01-01T00:00:00Z"),
        new Date("2027-12-31T00:00:00Z")
      )
    ).toBe(false);
  });

  it("computes rent obligation statuses accurately for paid, partial, pending, and overdue", () => {
    const due = new Date("2026-11-05T12:00:00Z");
    const beforeDue = new Date("2026-11-02T12:00:00Z");
    const afterDue = new Date("2026-11-10T12:00:00Z");

    expect(calculateObligationStatus(2400, 2400, due, afterDue)).toBe("PAID");
    expect(calculateObligationStatus(2400, 1200, due, beforeDue)).toBe("PARTIAL");
    expect(calculateObligationStatus(2400, 0, due, beforeDue)).toBe("PENDING");
    expect(calculateObligationStatus(2400, 1200, due, afterDue)).toBe("OVERDUE");
  });

  it("resolves unit visual states with correct precedence", () => {
    const now = new Date("2026-11-24T00:00:00Z");
    const soonEnd = new Date("2026-12-15T00:00:00Z");
    const farEnd = new Date("2027-06-01T00:00:00Z");

    expect(
      computeUnitVisualState({
        unitStatus: "OCCUPIED",
        openMaintenanceCount: 1,
        activeLeaseEndDate: soonEnd,
        now,
      })
    ).toBe("MAINTENANCE");

    expect(
      computeUnitVisualState({
        unitStatus: "OCCUPIED",
        openMaintenanceCount: 0,
        activeLeaseEndDate: soonEnd,
        now,
      })
    ).toBe("EXPIRING_SOON");

    expect(
      computeUnitVisualState({
        unitStatus: "OCCUPIED",
        openMaintenanceCount: 0,
        activeLeaseEndDate: farEnd,
        now,
      })
    ).toBe("OCCUPIED");

    expect(
      computeUnitVisualState({
        unitStatus: "VACANT",
        openMaintenanceCount: 0,
        activeLeaseEndDate: null,
        now,
      })
    ).toBe("VACANT");
  });

  it("detects maintenance spend anomalies exceeding 1.6x portfolio average", () => {
    const anomalies = detectMaintenanceSpendAnomalies([
      { unitId: "u1", unitNumber: "101", propertyName: "A", totalSpend: 200 },
      { unitId: "u2", unitNumber: "102", propertyName: "A", totalSpend: 300 },
      { unitId: "u3", unitNumber: "103", propertyName: "A", totalSpend: 2200 },
    ]);

    expect(anomalies).toHaveLength(1);
    expect(anomalies[0]?.unitNumber).toBe("103");
  });

  it("rejects invalid lease date ranges and disallowed upload MIME types", () => {
    const badLease = leaseCreateSchema.safeParse({
      unitId: "u1",
      tenantId: "t1",
      startDate: "2026-12-01",
      endDate: "2026-01-01",
      monthlyRent: 2400,
      securityDeposit: 2400,
      paymentDueDay: 1,
    });
    expect(badLease.success).toBe(false);

    const badUpload = documentUploadSchema.safeParse({
      title: "Script",
      fileName: "payload.exe",
      mimeType: "application/x-msdownload",
      sizeBytes: 1024,
      category: "LEASE",
    });
    expect(badUpload.success).toBe(false);
  });
});
