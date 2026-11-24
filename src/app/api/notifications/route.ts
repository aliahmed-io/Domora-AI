import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const patchNotificationSchema = z.object({
  id: z.string().min(1),
  isRead: z.boolean(),
});

export async function GET() {
  try {
    const session = await getServerSession();
    const where =
      session.role === "TENANT" && session.tenantId
        ? { recipientRole: "TENANT" as const, recipientId: session.tenantId }
        : undefined;

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ notifications });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession();
    const body = await request.json();
    const parsed = patchNotificationSchema.parse(body);

    const existing = await prisma.notification.findUniqueOrThrow({
      where: { id: parsed.id },
    });

    if (
      session.role === "TENANT" &&
      (existing.recipientRole !== "TENANT" || existing.recipientId !== session.tenantId)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.notification.update({
      where: { id: parsed.id },
      data: { isRead: parsed.isRead },
    });

    return NextResponse.json({ notification: updated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update notification" },
      { status: 400 }
    );
  }
}
