# Domora AI — Functional & Non-Functional Requirements

## Functional Requirements

1. **Property Portfolio**: Create, edit, archive/restore, and inspect properties with live unit counts, scheduled/collected rent, overdue balances, and open maintenance counts.
2. **Building Explorer**: Interactive SVG building elevation with selectable floors and units, distinct visual states (Occupied, Vacant, Maintenance Required, Lease Expiring Soon), abstract unit grid fallback when physical CAD plans are absent, and a unit detail inspection panel.
3. **Tenant Directory**: Add/edit tenants, search directory, view lease history, payment history, maintenance tickets, notes, and attach validated documents.
4. **Lease Management**: Create leases with overlap prevention, manage renewal status, renew terms, perform early termination, and upload lease documents.
5. **Rent & Payments**: Generate monthly rent obligations, record manual full/partial payments transactionally, track outstanding balances, and view manual receipts (never confused with verified bank transactions).
6. **Maintenance Hub**: Create requests (manager or tenant), progress statuses (`OPEN` → `ASSIGNED` → `IN_PROGRESS` → `RESOLVED` → `CLOSED`), assign contractors, and track estimated vs. actual costs.
7. **Notification Center**: Persistent database-backed queue with duplicate prevention, read/unread state, and scheduled daily job execution.
8. **AI Intelligence**: Level A rule-based analytics (occupancy, overdue, expirations, spend anomalies, collection trends) and Level B predictive analytics comparing Logistic Regression vs. Random Forest with synthetic-data & non-punitive disclaimers.

## Non-Functional Requirements

- **Type Safety**: TypeScript `strict`, `noImplicitAny`, `noUncheckedIndexedAccess`.
- **Data Integrity**: PostgreSQL foreign keys, unique constraints, and `prisma.$transaction` for financial and lease state transitions.
- **Security**: Server-side authorization checks on every API route and server page; validated file uploads (MIME allowlist + 5 MB cap + sanitized filenames).
- **Accessibility**: Semantic HTML, keyboard-accessible SVG unit controls (`tabIndex`, `Enter`/`Space`, `aria-label`), WCAG AA contrast, and `prefers-reduced-motion` support.
