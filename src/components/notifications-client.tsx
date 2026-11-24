"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Play, CheckCircle2, Mail, Inbox } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import type { DemoRole } from "@/lib/auth";
import type { DailyJobSummary } from "@/lib/jobs/daily-scheduler";

export interface NotificationRow {
  id: string;
  eventKey: string;
  triggerType: string;
  recipientRole: string;
  title: string;
  message: string;
  relatedEntityType: string;
  relatedEntityId: string;
  isRead: boolean;
  deliveryChannel: string;
  deliveryStatus: string;
  createdAt: string;
}

interface NotificationsClientProps {
  notifications: NotificationRow[];
  role: DemoRole;
}

export function NotificationsClient({
  notifications,
  role,
}: NotificationsClientProps) {
  const router = useRouter();
  const [runningJob, setRunningJob] = useState(false);
  const [jobSummary, setJobSummary] = useState<DailyJobSummary | null>(null);

  async function toggleRead(n: NotificationRow) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: n.id, isRead: !n.isRead }),
    });
    router.refresh();
  }

  async function handleRunDailyJob() {
    setRunningJob(true);
    try {
      const res = await fetch("/api/jobs/daily", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.summary) {
        setJobSummary(data.summary as DailyJobSummary);
        router.refresh();
      }
    } finally {
      setRunningJob(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#C5A88A] pb-5">
        <div>
          <p className="font-mono-num text-xs uppercase tracking-[0.2em] text-[#8C4A3D]">
            Persistent Queue · Idempotent Event Deduplication
          </p>
          <h1 className="font-display text-4xl text-[#262824] mt-1">
            Notification Center
          </h1>
          <p className="text-sm text-[#5A5C56] mt-1">
            Automated alerts for rent due dates, overdue balances, lease
            expirations, maintenance updates, and vacant units.
          </p>
        </div>

        {role === "MANAGER" && (
          <button
            type="button"
            disabled={runningJob}
            onClick={handleRunDailyJob}
            className="inline-flex items-center gap-2 bg-[#262824] text-[#FAF5EE] px-4 py-2 text-sm font-medium hover:bg-[#3A3D37] disabled:opacity-50 cursor-pointer"
          >
            <Play className="h-4 w-4" />
            <span>{runningJob ? "Running Scheduler..." : "Run Daily Scheduler"}</span>
          </button>
        )}
      </div>

      {jobSummary && (
        <div className="border border-[#6F795E] bg-[#E5E9DF] p-4 text-xs space-y-1">
          <p className="font-medium text-[#262824] flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-[#6F795E]" />
            <span>Daily Scheduler Completed ({jobSummary.runAt})</span>
          </p>
          <p className="font-mono-num text-[#262824]">
            Obligations generated: {jobSummary.obligationsGenerated} · Overdue
            flagged: {jobSummary.obligationsMarkedOverdue} · Expiring leases:{" "}
            {jobSummary.leasesFlaggedExpiring} · New deduplicated notifications:{" "}
            {jobSummary.notificationsCreated} · Emails sent: {jobSummary.emailsSent}
          </p>
        </div>
      )}

      <div className="border border-[#C5A88A] bg-[#FAF5EE] divide-y divide-[#C5A88A]/50">
        {notifications.length === 0 ? (
          <div className="p-8 text-sm text-[#5A5C56]">
            No notifications in queue.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={cn(
                "p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors",
                !n.isRead ? "bg-[#FAF5EE]" : "bg-[#F5EBDF]/60 opacity-80"
              )}
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {!n.isRead && (
                    <span className="h-2 w-2 bg-[#8C4A3D] inline-block" />
                  )}
                  <span className="font-mono-num text-[11px] px-2 py-0.5 border border-[#C5A88A] bg-[#F5EBDF]">
                    {n.triggerType}
                  </span>
                  <span className="font-mono-num text-[#5A5C56]">
                    {n.recipientRole}
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono-num text-[#5A5C56]">
                    {n.deliveryChannel === "EMAIL" ? (
                      <Mail className="h-3 w-3" />
                    ) : (
                      <Inbox className="h-3 w-3" />
                    )}
                    {n.deliveryChannel} · {n.deliveryStatus}
                  </span>
                </div>

                <h3 className="font-medium text-[#262824] flex items-center gap-2">
                  <Bell className="h-3.5 w-3.5 text-[#8C4A3D]" />
                  <span>{n.title}</span>
                </h3>
                <p className="text-xs text-[#5A5C56]">{n.message}</p>
                <p className="font-mono-num text-[11px] text-[#5A5C56]">
                  Key: {n.eventKey} · Entity: {n.relatedEntityType} ·{" "}
                  {formatDate(n.createdAt)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => toggleRead(n)}
                className="self-start sm:self-center shrink-0 border border-[#C5A88A] px-3 py-1.5 text-xs hover:bg-[#EDE0D0] cursor-pointer"
              >
                {n.isRead ? "Mark Unread" : "Mark Read"}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
