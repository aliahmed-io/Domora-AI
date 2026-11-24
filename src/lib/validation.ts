import { z } from "zod";

export const propertyCreateSchema = z.object({
  name: z.string().min(2).max(120),
  address: z.string().min(4).max(200),
  city: z.string().min(2).max(80),
  state: z.string().min(2).max(40),
  postalCode: z.string().min(3).max(20),
  propertyType: z.enum(["RESIDENTIAL", "MIXED_USE", "BOUTIQUE_LOFT"]),
  imageUrl: z.string().min(1).optional(),
  buildingName: z.string().min(2).max(100).optional(),
  totalFloors: z.coerce.number().int().min(1).max(60).optional(),
  unitsPerFloor: z.coerce.number().int().min(1).max(20).optional(),
  hasPhysicalPlan: z.boolean().optional(),
});

export const propertyUpdateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  address: z.string().min(4).max(200).optional(),
  city: z.string().min(2).max(80).optional(),
  state: z.string().min(2).max(40).optional(),
  postalCode: z.string().min(3).max(20).optional(),
  propertyType: z.enum(["RESIDENTIAL", "MIXED_USE", "BOUTIQUE_LOFT"]).optional(),
  archived: z.boolean().optional(),
});

export const unitCreateSchema = z.object({
  floorId: z.string().min(1),
  buildingId: z.string().min(1),
  unitNumber: z.string().min(1).max(20),
  bedrooms: z.coerce.number().int().min(0).max(10),
  bathrooms: z.coerce.number().min(0.5).max(10),
  areaSqFt: z.coerce.number().int().min(150).max(15000),
  targetRent: z.coerce.number().positive().max(100000),
  status: z.enum(["VACANT", "OCCUPIED", "MAINTENANCE"]).default("VACANT"),
});

export const tenantCreateSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(7).max(30),
  emergencyContact: z.string().max(160).optional(),
  notes: z.string().max(2000).optional(),
});

export const tenantUpdateSchema = tenantCreateSchema.partial();

export const leaseCreateSchema = z
  .object({
    unitId: z.string().min(1),
    tenantId: z.string().min(1),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    monthlyRent: z.coerce.number().positive().max(100000),
    securityDeposit: z.coerce.number().min(0).max(200000),
    paymentDueDay: z.coerce.number().int().min(1).max(28),
    renewalStatus: z.enum(["PENDING", "RENEWING", "NOT_RENEWING"]).default("PENDING"),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "Lease end date must be after start date",
    path: ["endDate"],
  });

export const leaseUpdateSchema = z.object({
  renewalStatus: z.enum(["PENDING", "RENEWING", "NOT_RENEWING"]).optional(),
  action: z.enum(["TERMINATE_EARLY", "RENEW"]).optional(),
  terminationReason: z.string().max(500).optional(),
  newEndDate: z.coerce.date().optional(),
});

export const paymentCreateSchema = z.object({
  obligationId: z.string().min(1),
  amount: z.coerce.number().positive().max(200000),
  paidAt: z.coerce.date().optional(),
  method: z.enum(["BANK_TRANSFER", "CHECK", "CASH", "MANUAL_ACH"]),
  referenceCode: z.string().max(80).optional(),
  notes: z.string().max(500).optional(),
});

export const maintenanceCreateSchema = z.object({
  unitId: z.string().min(1),
  tenantId: z.string().optional(),
  title: z.string().min(3).max(140),
  description: z.string().min(5).max(2000),
  category: z.enum(["PLUMBING", "ELECTRICAL", "HVAC", "STRUCTURAL", "APPLIANCE", "GENERAL"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  estimatedCost: z.coerce.number().min(0).max(100000).optional(),
});

export const maintenanceUpdateSchema = z.object({
  status: z.enum(["OPEN", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
  contractorId: z.string().nullable().optional(),
  actualCost: z.coerce.number().min(0).max(100000).optional(),
  notes: z.string().max(2000).optional(),
});

export const ALLOWED_UPLOAD_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const documentUploadSchema = z.object({
  title: z.string().min(2).max(140),
  fileName: z.string().min(1).max(200),
  mimeType: z.enum(ALLOWED_UPLOAD_MIME_TYPES),
  sizeBytes: z.coerce.number().int().positive().max(MAX_UPLOAD_SIZE_BYTES),
  category: z.enum(["LEASE", "TENANT_ID", "MAINTENANCE", "RECEIPT"]),
  tenantId: z.string().optional(),
  leaseId: z.string().optional(),
  maintenanceRequestId: z.string().optional(),
});
