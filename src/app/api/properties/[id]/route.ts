import { NextResponse } from "next/server";
import { AuthorizationError, requireManagerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { propertyUpdateSchema } from "@/lib/validation";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireManagerSession();
    const { id } = await context.params;
    const body = await request.json();
    const parsed = propertyUpdateSchema.parse(body);

    const updated = await prisma.property.update({
      where: { id },
      data: {
        name: parsed.name,
        address: parsed.address,
        city: parsed.city,
        state: parsed.state,
        postalCode: parsed.postalCode,
        propertyType: parsed.propertyType,
        archivedAt:
          parsed.archived === undefined
            ? undefined
            : parsed.archived
              ? new Date()
              : null,
      },
    });

    return NextResponse.json({ property: updated });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update property" },
      { status: 400 }
    );
  }
}
