import type { UnitVisualStateKey } from "./tokens";
import { daysBetween } from "./utils";

export interface LeaseWindow {
  id: string;
  startDate: Date;
  endDate: Date;
  status: string;
}

/**
 * Prevents conflicting active leases for the same unit.
 * Any ACTIVE or EXPIRING_SOON lease whose [startDate, endDate] overlaps
 * with the candidate [newStart, newEnd] is considered a conflict.
 */
export function hasOverlappingActiveLease(
  existingLeases: LeaseWindow[],
  newStart: Date,
  newEnd: Date,
  excludeLeaseId?: string
): boolean {
  return existingLeases.some((lease) => {
    if (excludeLeaseId && lease.id === excludeLeaseId) return false;
    if (lease.status !== "ACTIVE" && lease.status !== "EXPIRING_SOON") {
      return false;
    }
    return lease.startDate <= newEnd && lease.endDate >= newStart;
  });
}

/**
 * Computes the next obligation status from amounts and due date.
 */
export function calculateObligationStatus(
  amountDue: number,
  amountPaid: number,
  dueDate: Date,
  now: Date = new Date()
): "PAID" | "PARTIAL" | "OVERDUE" | "PENDING" {
  if (amountPaid >= amountDue - 0.01) {
    return "PAID";
  }
  if (now > dueDate) {
    return "OVERDUE";
  }
  if (amountPaid > 0) {
    return "PARTIAL";
  }
  return "PENDING";
}

/**
 * Determines the visual state of a unit for the Building Explorer SVG.
 * Priority: MAINTENANCE > EXPIRING_SOON > OCCUPIED > VACANT
 */
export function computeUnitVisualState(params: {
  unitStatus: "VACANT" | "OCCUPIED" | "MAINTENANCE";
  openMaintenanceCount: number;
  activeLeaseEndDate?: Date | null;
  now?: Date;
}): UnitVisualStateKey {
  const now = params.now ?? new Date();

  if (params.unitStatus === "MAINTENANCE" || params.openMaintenanceCount > 0) {
    return "MAINTENANCE";
  }

  if (params.activeLeaseEndDate) {
    const remainingDays = daysBetween(now, params.activeLeaseEndDate);
    if (remainingDays >= 0 && remainingDays <= 45) {
      return "EXPIRING_SOON";
    }
    return "OCCUPIED";
  }

  if (params.unitStatus === "OCCUPIED") {
    return "OCCUPIED";
  }

  return "VACANT";
}
