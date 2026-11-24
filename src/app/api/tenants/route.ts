import { NextResponse } from "next/server";
import { AuthorizationError, getServerSession, requireManagerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tenantCreateSchema } from "@/lib/validation";

export async function GET() {
  try {
    const session = await getServerSession();
    const where =
      session.role === "TENANT" && session.tenantId
        ? { id: session.tenantId }
        : undefined;

    const tenants = await prisma.tenant.findMany({
      where,
      orderBy: { fullName: "asc" },
      include: {
        leases: {
          orderBy: { startDate: "desc" },
          include: {
            unit: {
              include: { building: { include: { property: true } } },
            },
            payments: { orderBy: { paidAt: "desc" } },
            obligations: { orderBy: { dueDate: "desc" } },
          },
        },
        maintenanceRequests: { orderBy: { createdAt: "desc" } },
        documents: { orderBy: { uploadedAt: "desc" } },
      },
    });

    return NextResponse.json({ tenants });
  } catch {
    return NextResponse.json({ error: "Failed to load tenants" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireManagerSession();
    const body = await request.json();
    const parsed = tenantCreateSchema.parse(body);

    const tenant = await prisma.tenant.create({
      data: {
        fullName: parsed.fullName,
        email: parsed.email,
        phone: parsed.phone,
        emergencyContact: parsed.emergencyContact,
        notes: parsed.notes,
      },
    });

    return NextResponse.json({ tenant }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create tenant" },
      { status: 400 }
    );
  }
}
