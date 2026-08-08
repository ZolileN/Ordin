# Development

## Environment Variables

```bash
DATABASE_URL=          # PostgreSQL connection string (see below)
AUTH_SECRET=           # NextAuth secret (generate with openssl rand -base64 32)
NEXT_PUBLIC_APP_URL=   # App URL (http://localhost:3000 for dev)
STORAGE_TYPE=local     # local | s3 (future)
STORAGE_LOCAL_PATH=./uploads
```

### Database connection

**P1000 authentication failed** means `DATABASE_URL` in `.env` does not match a running Postgres instance.

| Setup | `DATABASE_URL` |
|-------|----------------|
| Docker (`docker compose up -d`) | `postgresql://ordin:ordin@localhost:5432/ordin?schema=public` |
| Neon / cloud | Paste the connection string from your provider dashboard |

After copying `.env.example` to `.env`, update `DATABASE_URL` and `AUTH_SECRET` before running `npm run db:setup`.

## Database

```bash
# Start local Postgres (Docker)
docker compose up -d

# Push schema changes
npm run db:push

# Seed demo data
npm run db:seed

# Full setup (schema + seed)
npm run db:setup
```

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch
```

Tests cover:
- Revenue integrity reconciliation
- Entity resolution
- Normalization utilities
- Subscription plan limits
- Severity and integrity score calculation

## Code Conventions

- Business logic in `src/lib/`, not in components
- Server actions in `src/actions/`
- Tenant scoping via `requireMembership()`
- Plan limits via subscription service, never hardcoded in UI
- Audit events for all significant state changes

## Adding Features

Work in vertical slices. After each phase, ensure the app still runs:

1. Schema changes → `prisma db push`
2. Service layer → `src/lib/`
3. Server actions → `src/actions/`
4. UI → `src/app/` and `src/components/`
5. Tests for business logic
6. Update docs if architecture changes
