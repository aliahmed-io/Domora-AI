import { NextResponse } from "next/server";
import { AuthorizationError, requireManagerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unitCreateSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    await requireManagerSession();
    const body = await request.json();
    const parsed = unitCreateSchema.parse(body);

    const floor = await prisma.floor.findUniqueOrThrow({
      where: { id: parsed.floorId },
      include: { units: true },
    });

    const unit = await prisma.unit.create({
      data: {
        floorId: parsed.floorId,
        buildingId: parsed.buildingId,
        unitNumber: parsed.unitNumber,
        bedrooms: parsed.bedrooms,
        bathrooms: parsed.bathrooms,
        areaSqFt: parsed.areaSqFt,
        targetRent: parsed.targetRent,
        status: parsed.status,
        gridRow: floor.floorNumber,
        gridCol: floor.units.length + 1,
      },
    });

    return NextResponse.json({ unit }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create unit" },
      { status: 400 }
    );
  }
}
