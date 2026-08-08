# Data Model

## Hierarchy

```
Organization
  ├── Users (via Membership)
  ├── Subscription (Plan)
  ├── Entities
  │     └── Branches
  ├── DataSources
  │     └── Datasets
  │           ├── DatasetColumns
  │           └── DatasetRecords
  ├── Controls
  │     ├── ControlSources
  │     ├── ControlRules
  │     └── ControlRuns
  │           ├── Matches
  │           └── Exceptions
  │                 ├── Comments
  │                 ├── Evidence
  │                 └── Resolutions
  ├── Notifications
  └── AuditEvents
```

## Key Models

### Organization
Top-level tenant. All data is scoped here.

### Control
A business integrity check with sources, rules, tolerance, and schedule.

### ControlRun
One execution of a control. Produces matches, exceptions, and metrics.

### Exception
A detected inconsistency with severity, financial impact, lifecycle status, and resolution workflow.

### Dataset
Uploaded and normalized data. Records contain both `rawData` and `normalized` JSON.

## Canonical Fields

When mapping uploaded files, columns map to canonical fields:

- `external_id` — Primary identifier
- `customer` / `supplier` — Party name
- `reference` — Cross-system reference
- `date` — Transaction date
- `status` — Record status
- `amount` — Monetary value
- `quantity`, `product`, `branch`, `currency`

## Enums

See `prisma/schema.prisma` for the complete list of enums including:
- `SubscriptionPlan`, `MembershipRole`, `ControlStatus`
- `MatchStatus`, `ExceptionType`, `ExceptionSeverity`, `ExceptionStatus`
- `AuditAction`, `NotificationType`
