import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession, DEFAULT_DEMO_TENANT_EMAIL } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const roleSwitchSchema = z.object({
  role: z.enum(["MANAGER", "TENANT"]),
  tenantId: z.string().optional(),
});

export async function GET() {
  const session = await getServerSession();
  const demoTenant = await prisma.tenant.findFirst({
    where: { email: DEFAULT_DEMO_TENANT_EMAIL },
    select: { id: true, fullName: true, email: true },
  });
  return NextResponse.json({ session, demoTenant });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = roleSwitchSchema.parse(body);

    let tenantId = parsed.tenantId ?? null;
    if (parsed.role === "TENANT" && !tenantId) {
      const demoTenant = await prisma.tenant.findFirst({
        where: { email: DEFAULT_DEMO_TENANT_EMAIL },
        select: { id: true },
      });
      tenantId = demoTenant?.id ?? null;
    }

    const response = NextResponse.json({
      role: parsed.role,
      tenantId,
    });

    response.cookies.set("domora_role", parsed.role, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });

    if (parsed.role === "TENANT" && tenantId) {
      response.cookies.set("domora_tenant_id", tenantId, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      });
    } else {
      response.cookies.delete("domora_tenant_id");
    }

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid role payload" },
      { status: 400 }
    );
  }
}
