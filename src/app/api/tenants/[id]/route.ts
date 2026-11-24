import { NextResponse } from "next/server";
import { AuthorizationError, requireManagerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tenantUpdateSchema } from "@/lib/validation";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireManagerSession();
    const { id } = await context.params;
    const body = await request.json();
    const parsed = tenantUpdateSchema.parse(body);

    const tenant = await prisma.tenant.update({
      where: { id },
      data: parsed,
    });

    return NextResponse.json({ tenant });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update tenant" },
      { status: 400 }
    );
  }
}
