# Ordin

**Business Integrity Platform**

> Know where your business doesn't agree with itself.

Ordin is a multi-tenant SaaS platform that sits above a company's existing business systems and continuously verifies that related records agree.

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL — **Docker** (recommended) or a cloud provider such as [Neon](https://neon.tech)

### Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Generate an auth secret (paste into .env as AUTH_SECRET)
openssl rand -base64 32
```

#### Database (pick one)

**Option A — Docker (easiest for local dev)**

```bash
docker compose up -d
# DATABASE_URL in .env should already match docker-compose defaults:
# postgresql://ordin:ordin@localhost:5432/ordin?schema=public
```

**Option B — Neon / cloud Postgres**

1. Create a free project at [neon.tech](https://neon.tech)
2. Copy the connection string into `.env` as `DATABASE_URL`
3. Ensure it includes `?sslmode=require` if required by your provider

#### Finish setup

```bash
npm run db:setup
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
| `npm run db:docker` | Start local Postgres via Docker |
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
