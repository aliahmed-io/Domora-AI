import { NextResponse } from "next/server";
import { AuthorizationError, getServerSession, requireManagerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ALLOWED_UPLOAD_MIME_TYPES,
  MAX_UPLOAD_SIZE_BYTES,
  documentUploadSchema,
} from "@/lib/validation";

export async function GET() {
  try {
    const session = await getServerSession();
    const where =
      session.role === "TENANT" && session.tenantId
        ? { tenantId: session.tenantId }
        : undefined;

    const documents = await prisma.document.findMany({
      where,
      orderBy: { uploadedAt: "desc" },
    });

    return NextResponse.json({ documents });
  } catch {
    return NextResponse.json({ error: "Failed to load documents" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireManagerSession();
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "Missing file upload" }, { status: 400 });
      }
      if (!ALLOWED_UPLOAD_MIME_TYPES.includes(file.type as (typeof ALLOWED_UPLOAD_MIME_TYPES)[number])) {
        return NextResponse.json(
          { error: `Unsupported file type: ${file.type}. Allowed: PDF, JPEG, PNG, WEBP.` },
          { status: 400 }
        );
      }
      if (file.size > MAX_UPLOAD_SIZE_BYTES) {
        return NextResponse.json(
          { error: "File exceeds maximum allowed size of 5 MB." },
          { status: 400 }
        );
      }

      const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const parsed = documentUploadSchema.parse({
        title: String(formData.get("title") ?? safeFileName),
        fileName: safeFileName,
        mimeType: file.type,
        sizeBytes: file.size,
        category: String(formData.get("category") ?? "LEASE"),
        tenantId: formData.get("tenantId") ? String(formData.get("tenantId")) : undefined,
        leaseId: formData.get("leaseId") ? String(formData.get("leaseId")) : undefined,
        maintenanceRequestId: formData.get("maintenanceRequestId")
          ? String(formData.get("maintenanceRequestId"))
          : undefined,
      });

      const doc = await prisma.document.create({
        data: {
          title: parsed.title,
          fileName: parsed.fileName,
          mimeType: parsed.mimeType,
          sizeBytes: parsed.sizeBytes,
          storagePath: `/uploads/${Date.now()}-${parsed.fileName}`,
          category: parsed.category,
          tenantId: parsed.tenantId,
          leaseId: parsed.leaseId,
          maintenanceRequestId: parsed.maintenanceRequestId,
        },
      });

      return NextResponse.json({ document: doc }, { status: 201 });
    }

    const body = await request.json();
    const parsed = documentUploadSchema.parse(body);
    const safeFileName = parsed.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");

    const doc = await prisma.document.create({
      data: {
        title: parsed.title,
        fileName: safeFileName,
        mimeType: parsed.mimeType,
        sizeBytes: parsed.sizeBytes,
        storagePath: `/uploads/${Date.now()}-${safeFileName}`,
        category: parsed.category,
        tenantId: parsed.tenantId,
        leaseId: parsed.leaseId,
        maintenanceRequestId: parsed.maintenanceRequestId,
      },
    });

    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to validate document" },
      { status: 400 }
    );
  }
}
