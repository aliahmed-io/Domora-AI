# Domora AI

**Spaces managed beautifully.** An architectural-editorial property and tenant management platform built with Next.js App Router, TypeScript, Tailwind CSS, PostgreSQL, Prisma ORM, Recharts, Motion, and scikit-learn.

## Key Capabilities

- **Property Portfolio (`/`)**: Create, edit, archive, and inspect residential & boutique loft properties with live unit counts, scheduled/collected rent, overdue balances, and open maintenance.
- **Interactive SVG Building Explorer (`/explorer`)**: Signature elevation diagram with selectable floors and units, distinct visual states (`Occupied`, `Vacant`, `Maintenance Required`, `Lease Expiring Soon`), abstract unit grid fallback when physical CAD plans are absent, and a unit inspection panel.
- **Tenant Directory (`/tenants`)**: Resident dossiers with search, lease history, payment history, maintenance tickets, notes, and validated document attachments.
- **Lease Management (`/leases`)**: Overlap-protected lease creation, renewal status tracking, +12 month renewal, early termination, and PDF/image document uploads.
- **Rent & Payments (`/payments`)**: Monthly rent obligations, manual full/partial payment recording inside PostgreSQL transactions, outstanding balances, and manual ledger receipts.
- **Maintenance Hub (`/maintenance`)**: `OPEN → ASSIGNED → IN_PROGRESS → RESOLVED → CLOSED` workflow, contractor assignment, and estimated vs. actual cost tracking.
- **Notification Center (`/notifications`)**: Persistent PostgreSQL queue with deterministic `eventKey` deduplication, read/unread state, optional SMTP email delivery, and an on-demand **Run Daily Scheduler** trigger.
- **AI Intelligence (`/intelligence`)**: Level A rule-based analytics (occupancy, overdue balances, 45-day lease expirations, maintenance spend anomalies, collection trends) and Level B predictive analytics comparing Logistic Regression vs. Random Forest on synthetic data.
- **Server-Side Role Switching**: Toggle between **Manager** and **Tenant Demo (Elena Vance)** in the header to verify server-side authorization and tenant-scoped data isolation.

## Tech Stack

- **Frontend**: Next.js 16 App Router, TypeScript (`strict`, `noImplicitAny`, `noUncheckedIndexedAccess`), Tailwind CSS v4, Recharts, Motion, Lucide Icons
- **Backend**: Next.js Route Handlers, Zod validation, PostgreSQL 16, Prisma ORM 7 (`@prisma/adapter-pg`)
- **ML Pipeline**: Python `scikit-learn`, `pandas`, `numpy` (`ml/train_and_evaluate.py`)
- **Testing**: Vitest + React Testing Library

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   cp .env.example .env
   ```

2. **Start PostgreSQL**:
   - **With Docker**:
     ```bash
     docker compose up -d
     ```
   - **Without Docker (embedded PGlite PostgreSQL wire server)**:
     ```bash
     npm run db:local
     ```

3. **Push schema & seed demo data**:
   ```bash
   npx prisma db push --config prisma7.config.ts
   npm run db:seed
   ```

4. **Run the application**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000`.

## Verification & Testing

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Documentation

- [Database ERD](docs/ERD.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Functional & Non-Functional Requirements](docs/REQUIREMENTS.md)
- [Notification Processing](docs/NOTIFICATIONS.md)
- [ML Evaluation Report](docs/ML_EVALUATION.md)
