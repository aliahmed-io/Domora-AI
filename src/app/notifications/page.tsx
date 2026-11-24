import { DomoraShell } from "@/components/domora-shell";
import {
  NotificationsClient,
  type NotificationRow,
} from "@/components/notifications-client";
import { prisma } from "@/lib/prisma";
import { getShellContext } from "@/lib/server-layout-data";


export default async function NotificationsPage() {
  const { session, unreadNotifications } = await getShellContext();

  const notificationsRaw = await prisma.notification.findMany({
    where:
      session.role === "TENANT" && session.tenantId
        ? { recipientRole: "TENANT", recipientId: session.tenantId }
        : undefined,
    orderBy: { createdAt: "desc" },
  });

  const notifications: NotificationRow[] = notificationsRaw.map((n) => ({
    id: n.id,
    eventKey: n.eventKey,
    triggerType: n.triggerType,
    recipientRole: n.recipientRole,
    title: n.title,
    message: n.message,
    relatedEntityType: n.relatedEntityType,
    relatedEntityId: n.relatedEntityId,
    isRead: n.isRead,
    deliveryChannel: n.deliveryChannel,
    deliveryStatus: n.deliveryStatus,
    createdAt: n.createdAt.toISOString(),
  }));

  return (
    <DomoraShell
      role={session.role}
      displayName={session.displayName}
      unreadNotifications={unreadNotifications}
    >
      <NotificationsClient notifications={notifications} role={session.role} />
    </DomoraShell>
  );
}
