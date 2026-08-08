# Ordin

**Business Integrity Platform**

> Know where your business doesn't agree with itself.

Ordin is a multi-tenant SaaS platform that sits above a company's existing business systems and continuously verifies that related records agree.

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL database

### Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL and AUTH_SECRET

# Set up database
npm run db:setup

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Demo Account

After seeding:

- **Email:** `demo@acme.services`
- **Password:** `demo1234`

The demo organization "Acme Services" includes ~1,000 orders, ~950 invoices, and a pre-configured Revenue Integrity control.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** NextAuth.js (credentials)
- **UI:** Tailwind CSS, Radix UI, Recharts
- **Validation:** Zod
- **Testing:** Vitest

## Core Features

- Multi-tenant organization isolation
- Subscription plans (Starter / Growth / Business) with feature enforcement
- CSV/XLSX data ingestion with column mapping
- Generic control engine with Revenue Integrity as first control
- Exception management (assign, comment, evidence, resolve)
- Business integrity dashboard with financial exposure
- Full audit trail

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm test` | Run test suite |
| `npm run db:setup` | Push schema + seed data |
| `npm run db:seed` | Seed demo data only |

## Documentation

See the `docs/` directory:

- [Architecture](docs/architecture.md)
- [Product](docs/product.md)
- [Data Model](docs/data-model.md)
- [Controls](docs/controls.md)
- [Pricing](docs/pricing.md)
- [Development](docs/development.md)

## License

Proprietary
