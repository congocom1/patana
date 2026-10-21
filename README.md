# Patana

Two React/TypeScript apps, one NestJS API, PostgreSQL with Prisma module schemas.

## Setup

Requires Node.js 22+, npm and Docker.

```bash
cp .env.example .env
docker compose up -d
npm install
npm run prisma:generate -w @patana/api
npm run prisma:migrate -w @patana/api
npm run dev:api
npm run dev:customer
npm run dev:owner
```

Run each dev command in a separate terminal. The API defaults to http://localhost:4000/api; customer to 5173 and owner to 5174.

## Security and readiness

- Credentials are hashed with salted scrypt; use a unique strong JWT_SECRET (32+ chars) and TLS at the reverse proxy.
- Authenticated customer booking creation computes prices server-side and locks a unit during availability conflict checks.
- Booking dates treat check-out as exclusive. Pending and confirmed reservations block overlapping requests. This policy should be revisited if requests have an expiration deadline.
- Owner endpoints enforce property ownership. Owner approval and booking confirmation workflows are **not yet** implemented.
- **Payments are disabled.** Do not charge customers, report payments as collected, or publish as production-ready before implementing provider webhooks, idempotency, reconciliation, audit logs, and end-to-end security tests.
- Schema migrations, email verification, account recovery, rate limits, cookie/token hardening, CSRF strategy, upload security, comprehensive admin tools, monitoring, and load testing still need work.
- The customer and owner dashboards are first functional slices, not a complete product.

## Validation

```bash
npm run typecheck
npm run build
```

CI runs these checks after dependency installation.
