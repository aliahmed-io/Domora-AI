# Domora AI — Architecture Documentation

## 1. High-Level Architecture

Domora AI is built as a cohesive, full-stack **Next.js 16 App Router** monolith backed by **PostgreSQL** and **Prisma ORM**, with an optional offline **Python scikit-learn** training & evaluation pipeline (`ml/train_and_evaluate.py`).

- **Presentation Layer**: React 19 Server Components fetch initial state directly from PostgreSQL (`force-dynamic` for live operational accuracy), paired with interactive Client Components using Tailwind CSS, Recharts, Motion, and custom SVG architectural elevations.
- **API & Validation Layer**: Next.js Route Handlers (`src/app/api/*`) validate all payloads with **Zod** (`src/lib/validation.ts`), enforce **server-side role authorization** (`src/lib/auth.ts`), and execute multi-table mutations inside `prisma.$transaction`.
- **Domain Logic Layer**: Pure, unit-testable functions in `src/lib/domain.ts` and `src/lib/intelligence.ts` handle lease overlap checks, rent obligation status transitions, unit visual state precedence, and maintenance spend anomaly detection.
- **Scheduled Processing Layer**: `src/lib/jobs/daily-scheduler.ts` runs idempotent daily rent generation, overdue detection, lease expiration alerts, and deduplicated notification queuing.

## 2. Role-Based Access Control (Demo & Production Pattern)

- **`MANAGER`**: Full portfolio administration across all properties, buildings, units, tenants, leases, payments, maintenance requests, notifications, and AI intelligence.
- **`TENANT`**: Server-side scoped access (`assertTenantOrManagerAccess` and filtered Prisma queries) restricted strictly to the tenant's assigned unit, lease, rent obligations/payments, maintenance requests, and notifications.
- Manager-only routes (`/explorer`, `/intelligence`) redirect tenant sessions server-side, and write endpoints (`POST /api/properties`, `POST /api/leases`, `POST /api/payments`, etc.) return `403 Forbidden` for tenant sessions.
