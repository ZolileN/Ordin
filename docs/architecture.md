# Architecture

## Overview

Ordin is a multi-tenant business integrity platform built as a modular Next.js application. The architecture follows a service-oriented pattern with clear domain boundaries.

```
┌─────────────────────────────────────────────────────────┐
│                     Next.js App                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │   UI     │  │  Server  │  │   API Routes         │  │
│  │  Pages   │  │  Actions │  │   (Auth)             │  │
│  └────┬─────┘  └────┬─────┘  └──────────┬───────────┘  │
│       │              │                    │              │
│  ┌────┴──────────────┴────────────────────┴──────────┐ │
│  │                  Service Layer                       │ │
│  │  Subscription │ Audit │ Control Engine │ Storage     │ │
│  └──────────────────────┬─────────────────────────────┘ │
│                          │                               │
│  ┌───────────────────────┴─────────────────────────────┐ │
│  │              Prisma ORM + PostgreSQL                 │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Key Design Decisions

### Multi-Tenancy

All business data is scoped to `organizationId`. Authorization helpers in `src/lib/tenant.ts` enforce access at the service layer. Never trust client-side authorization.

### Control Engine

The control engine (`src/lib/control-engine/`) is generic. Each control type implements reconciliation logic against normalized records. The Revenue Integrity control (`revenue-integrity.ts`) is the first production implementation.

Future controls (Invoices→Payments, PO→Supplier Invoice, etc.) plug into the same execution framework via `executeControlRun()`.

### Data Ingestion

A connector interface (`src/lib/connectors/types.ts`) abstracts data sources. MVP implements `FileConnector` for CSV/XLSX. Future connectors (Sage, Xero, REST API) implement the same interface.

### Subscription Enforcement

Plan limits are defined in `src/lib/constants.ts` and enforced centrally via `src/lib/subscription/subscription-service.ts`. UI components never hardcode limits.

### Audit Trail

All significant actions create `AuditEvent` records via `src/lib/audit/audit-service.ts`.

## Directory Structure

```
src/
├── actions/          # Server actions (auth, controls, data, exceptions)
├── app/              # Next.js App Router pages
│   ├── (app)/        # Authenticated app routes
│   └── (auth)/       # Login/signup
├── components/       # React components
│   ├── controls/
│   ├── exceptions/
│   ├── layout/
│   └── ui/
├── lib/
│   ├── audit/
│   ├── connectors/
│   ├── control-engine/
│   ├── entity-resolution/
│   ├── storage/
│   └── subscription/
└── types/
prisma/
├── schema.prisma
└── seed.ts
```

## Deployment

Designed for Vercel + PostgreSQL (Neon, Supabase, or RDS). File storage uses local filesystem in development; swap `STORAGE_TYPE` for S3/R2 in production.
