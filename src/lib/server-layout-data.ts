import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getShellContext() {
  const session = await getServerSession();

  const unreadNotifications = await prisma.notification.count({
    where:
      session.role === "TENANT" && session.tenantId
        ? {
            recipientRole: "TENANT",
            recipientId: session.tenantId,
            isRead: false,
          }
        : {
            isRead: false,
          },
  });

  return {
    session,
    unreadNotifications,
  };
}
