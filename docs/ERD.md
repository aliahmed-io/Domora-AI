# Domora AI — Database Entity-Relationship Diagram

Domora AI uses **PostgreSQL** with **Prisma ORM** (`prisma/schema.prisma`, initial migration in `prisma/migrations/0001_init/migration.sql`).

```mermaid
erDiagram
    Property ||--o{ Building : contains
    Building ||--o{ Floor : has
    Building ||--o{ Unit : contains
    Floor ||--o{ Unit : organizes
    Unit ||--o{ Lease : leased_via
    Unit ||--o{ MaintenanceRequest : receives
    Tenant ||--o{ Lease : signs
    Tenant ||--o{ MaintenanceRequest : submits
    Tenant ||--o{ Document : owns
    Lease ||--o{ RentObligation : generates
    Lease ||--o{ Payment : settles
    Lease ||--o{ Document : attaches
    Lease ||--o{ PredictionRecord : evaluated_by
    RentObligation ||--o{ Payment : paid_by
    RentObligation ||--o{ PredictionRecord : scored_for
    Contractor ||--o{ MaintenanceRequest : assigned_to
    MaintenanceRequest ||--o{ Document : attaches

    Property {
        string id PK
        string name
        string address
        string city
        string state
        string postalCode
        enum propertyType
        datetime archivedAt
    }

    Building {
        string id PK
        string propertyId FK
        string name
        string code
        int totalFloors
        boolean hasPhysicalPlan
    }

    Floor {
        string id PK
        string buildingId FK
        int floorNumber
        string label
    }

    Unit {
        string id PK
        string floorId FK
        string buildingId FK
        string unitNumber
        int bedrooms
        float bathrooms
        int areaSqFt
        float targetRent
        enum status
    }

    Tenant {
        string id PK
        string fullName
        string email UK
        string phone
        string emergencyContact
        string demoAccountKey UK
    }

    Lease {
        string id PK
        string unitId FK
        string tenantId FK
        datetime startDate
        datetime endDate
        float monthlyRent
        float securityDeposit
        int paymentDueDay
        enum status
        enum renewalStatus
    }

    RentObligation {
        string id PK
        string leaseId FK
        int periodMonth
        int periodYear
        datetime dueDate
        float amountDue
        float amountPaid
        enum status
    }

    Payment {
        string id PK
        string obligationId FK
        string leaseId FK
        float amount
        datetime paidAt
        enum method
        boolean isVerifiedBankTx
        string recordedBy
    }

    Contractor {
        string id PK
        string name
        string specialty
        string phone
        string email
        float hourlyRate
    }

    MaintenanceRequest {
        string id PK
        string unitId FK
        string tenantId FK
        string contractorId FK
        string title
        enum category
        enum priority
        enum status
        float estimatedCost
        float actualCost
    }

    Document {
        string id PK
        string title
        string fileName
        string mimeType
        int sizeBytes
        string storagePath
        enum category
    }

    Notification {
        string id PK
        string eventKey UK
        enum triggerType
        enum recipientRole
        boolean isRead
        enum deliveryChannel
        enum deliveryStatus
    }

    PredictionRecord {
        string id PK
        string leaseId FK
        string obligationId FK
        enum modelName
        float lateProbability
        enum riskTier
        boolean isSyntheticDemo
    }
```

## Key Relational Constraints
- **`RentObligation`**: `@@unique([leaseId, periodYear, periodMonth])` prevents duplicate monthly billing cycles.
- **`Notification`**: `@@unique([eventKey])` guarantees zero duplicate notifications for the same event.
- **`Lease`**: Server-side transaction verifies `hasOverlappingActiveLease` before creating an active lease on any `Unit`.
- **`Payment`**: Always recorded inside `prisma.$transaction`, atomically updating `RentObligation.amountPaid` and `RentObligation.status`, with `isVerifiedBankTx = false` for manual ledger entries.
