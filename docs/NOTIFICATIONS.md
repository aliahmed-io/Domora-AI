# Domora AI — Notification Processing & Daily Scheduler

## 1. Persistent Notification Queue

All notifications are stored in the PostgreSQL `Notification` table (`prisma/schema.prisma`) with:
- `triggerType`: `RENT_UPCOMING`, `RENT_OVERDUE`, `LEASE_EXPIRING`, `MAINTENANCE_CREATED`, `MAINTENANCE_STATUS_CHANGED`, `UNIT_VACANT_REMINDER`
- `recipientRole` & `recipientId`
- `relatedEntityType` & `relatedEntityId`
- `isRead` (boolean read/unread state)
- `deliveryChannel` (`IN_APP` by default; `EMAIL` when `SMTP_HOST` is configured)
- `deliveryStatus` (`PENDING`, `SENT`, `FAILED`)

## 2. Duplicate Prevention (`eventKey`)

`Notification.eventKey` has a database-level `UNIQUE` constraint (`@@unique([eventKey])`):
- `RENT_OVERDUE:{obligationId}:{YYYY-MM}`
- `RENT_UPCOMING:{obligationId}`
- `LEASE_EXPIRING:{leaseId}:{YYYY-MM}`
- `UNIT_VACANT:{unitId}:{YYYY-MM}`
- `MAINTENANCE_CREATED:{requestId}`
- `MAINTENANCE_STATUS:{requestId}:{nextStatus}`

Running the daily scheduler multiple times on the same day or month will never emit duplicate notifications.

## 3. Triggering the Daily Scheduler

- **HTTP Endpoint**: `POST /api/jobs/daily` (authorized by `x-cron-secret: $CRON_SECRET` header or an active `MANAGER` session).
- **UI Trigger**: Click **"Run Daily Scheduler"** in `/notifications` to execute `runDailyScheduler()` and inspect the live summary.
- **Optional SMTP**: Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM` in `.env` to enable Nodemailer email dispatch.
