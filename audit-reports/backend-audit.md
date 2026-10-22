# Patana API Backend Audit Report

**Audit Date:** 2025-10-21  
**Codebase Path:** `/home/hermes/.cline/worktrees/dea9e/patana/patana-api`  
**Auditor:** Senior Backend Engineer  
**Scope:** Full backend audit covering architecture, database, API design, auth, business logic, security, performance, and testing

---

## Executive Summary

The Patana API is a NestJS/TypeScript/Prisma/PostgreSQL backend for a property booking platform. While the codebase demonstrates good foundational patterns (multi-schema Prisma, advisory locks for concurrency, scrypt password hashing), it has **critical gaps** in testing, security hardening, API design standards, and production readiness. The checkout module is entirely empty, and there are no database migrations.

**Overall Risk Level:** 🔴 **HIGH** - Not production-ready without significant remediation

---

## Findings Summary Table

| Severity | Category | Count |
|----------|----------|-------|
| 🔴 Critical | Security, Architecture, Testing | 8 |
| 🟠 High | Database, Auth, Business Logic | 12 |
| 🟡 Medium | API Design, Performance, Code Quality | 15 |
| 🟢 Low | Maintainability, Documentation | 6 |
| **Total** | | **41** |

---

## Detailed Findings

### 1. Code Quality & Architecture

| # | Severity | File | Line | Description | Impact | Recommendation |
|---|----------|------|------|-------------|--------|----------------|
| 1 | 🔴 Critical | **All modules** | N/A | **Zero test coverage** - No unit, integration, or e2e tests exist anywhere in the codebase | Cannot verify correctness; regressions inevitable; CI/CD impossible | Implement test strategy: Jest for unit/integration, Pact/Swagger for contract tests; target >80% coverage |
| 2 | 🔴 Critical | `checkout/checkout.module.ts` | 1-3 | **Empty CheckoutModule** - No service, controller, or logic for payment processing | Core business capability missing; bookings cannot be completed | Implement checkout flow: payment intent creation, webhook handling, booking confirmation, idempotency |
| 3 | 🟠 High | `app.module.ts` | 8 | **Tight coupling via AuthModule imports** - Catalog, Booking, Owner all import AuthModule directly instead of using shared exports | Violates modularity; duplicate JwtModule registration; harder to maintain | Create `SharedAuthModule` exporting JwtModule/AuthGuard; import once in AppModule |
| 4 | 🟠 High | `catalog/catalog.service.ts`, `booking/booking.service.ts` | Various | **Inline Zod validation in services** instead of DTO classes + ValidationPipe | Business logic mixed with validation; not reusable; harder to document | Create DTO classes with `class-validator` decorators; enable global `ValidationPipe` in main.ts |
| 5 | 🟡 Medium | `catalog/catalog.controller.ts:7-8` | 7-8 | **Unknown input type** - `@Body() input: unknown` with manual parsing in service | Type safety lost; no OpenAPI schema generation | Use typed DTOs: `@Body() dto: CreatePropertyDto` |
| 6 | 🟡 Medium | `shared/prisma.service.ts` | 1-3 | **PrismaService extends PrismaClient directly** - No middleware, logging, or query instrumentation | Cannot add soft-delete, audit logging, or query metrics globally | Use composition over inheritance; implement `PrismaClient` wrapper with `$extends` |
| 7 | 🟡 Medium | All controllers | N/A | **No API versioning** in route prefixes | Breaking changes will require new routes or break clients | Add version prefix: `app.setGlobalPrefix('api/v1')` |
| 8 | 🟢 Low | `app.module.ts` | 1-9 | **HealthController registered in AppModule** instead of dedicated SharedModule | Minor architectural inconsistency | Move to SharedModule or dedicated HealthModule |
---

### 2. Database & Prisma

| # | Severity | File | Line | Description | Impact | Recommendation |
|---|----------|------|------|-------------|--------|----------------|
| 9 | 🔴 Critical | `prisma/schema.prisma` | N/A | **No migration files exist** - Only schema.prisma present | Cannot deploy schema changes safely; no version control for DB; production deployment blocked | Run `prisma migrate dev` to create initial migration; commit migrations to git |
| 10 | 🔴 Critical | `prisma/schema.prisma` | 42, 56, 79, 94 | **Missing foreign key indexes** on `ownerId` (Property), `propertyId` (Unit), `customerId` (Booking), `bookingId` (Payment) | Slow JOINs and FK constraint checks; full table scans on relation queries | Add `@@index([ownerId])`, `@@index([propertyId])`, `@@index([customerId])`, `@@index([bookingId])` |
| 11 | 🟠 High | `shared/prisma.service.ts` | 1-3 | **No connection pool configuration** - Uses Prisma defaults (pool size = num_cpus + 1) | Connection exhaustion under load; unpredictable latency | Configure `datasource db { provider = "postgresql" url = env("DATABASE_URL") connection_limit = 20 }` |
| 12 | 🟠 High | `prisma/schema.prisma` | 10-21 | **User.role is free-text String** - No enum constraint; default 'customer' | Data integrity risk; typo-prone; no type safety | Use Prisma enum: `role Role @default(CUSTOMER)` with `enum Role { CUSTOMER OWNER ADMIN }` |
| 13 | 🟠 High | `prisma/schema.prisma` | 76-91 | **Booking.status is free-text String** - No enum; default 'pending' | Invalid statuses possible; no workflow enforcement | Use enum: `status BookingStatus @default(PENDING)` with `enum BookingStatus { PENDING CONFIRMED CANCELLED COMPLETED }` |
| 14 | 🟡 Medium | `prisma/schema.prisma` | 66-75 | **Availability.date uses DateTime @db.Date** but unique index on `(unitId, date)` | Timezone ambiguity; date comparisons may behave unexpectedly | Use `DateTime @db.Timestamp(0)` with UTC normalization; or keep `@db.Date` but document TZ handling |
| 15 | 🟡 Medium | `prisma/schema.prisma` | 92-102 | **Payment.providerReference is @unique but nullable** - PostgreSQL allows multiple NULLs in unique index | Duplicate NULL provider references possible | Make non-nullable or use partial unique index: `@@unique([providerReference], where: { providerReference: { not: null } })` |
| 16 | 🟡 Medium | `prisma/schema.prisma` | 31-39 | **Customer model in `booking` schema** but references `User` in `shared` schema | Cross-schema relation requires multi-schema support; potential FK issues | Verify multi-schema FK works; consider moving Customer to `shared` schema |
| 17 | 🟢 Low | `prisma/schema.prisma` | 1-4 | **`multiSchema` preview feature enabled** - May change in future Prisma versions | Potential breaking changes on upgrade | Monitor Prisma releases; test thoroughly on upgrades |

---

### 3. API Design

| # | Severity | File | Line | Description | Impact | Recommendation |
|---|----------|------|------|-------------|--------|----------------|
| 18 | 🔴 Critical | `main.ts` | 4-10 | **No global ValidationPipe, ExceptionFilter, or Interceptor** - Validation, error formatting, and transformation handled ad-hoc | Inconsistent error responses; no automatic DTO validation; security risk from unvalidated input | Add in main.ts: `app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))`; create `HttpExceptionFilter` |
| 19 | 🟠 High | `main.ts` | 8 | **CORS configured without credentials** - `origin` array but no `credentials: true` | Cookies/auth headers won't work cross-origin if needed | Add `credentials: true` if using cookies; otherwise document token-only auth |
| 20 | 🟠 High | All controllers | N/A | **No pagination on list endpoints** - `properties`, `mine`, `bookings` return unbounded results | Memory exhaustion; slow responses; poor UX | Add pagination DTO: `page`, `limit`, `cursor`; implement cursor-based pagination |
| 21 | 🟠 High | `catalog/catalog.service.ts:7` | 7 | **Hardcoded `take: 100`** on properties list | Arbitrary limit; no way to fetch more; inconsistent UX | Remove hardcoded limit; use pagination |
| 22 | 🟡 Medium | `auth/auth.controller.ts` | 5-6 | **No rate limiting on `/auth/register` and `/auth/login`** | Brute-force and enumeration attacks feasible | Add `@UseGuards(ThrottlerGuard)` with `ThrottlerModule` config |
| 23 | 🟡 Medium | `booking/booking.controller.ts` | 1-8 | **No idempotency key support** for booking creation | Duplicate bookings on network retry; no client-side deduplication | Add `Idempotency-Key` header support; store keys with TTL |
| 24 | 🟡 Medium | All endpoints | N/A | **No OpenAPI/Swagger documentation** | No API discovery; manual integration testing; poor DX | Add `@nestjs/swagger`; decorate DTOs/controllers with `@ApiProperty`, `@ApiOperation` |
| 25 | 🟢 Low | `catalog/catalog.controller.ts:5` | 5 | **`city` query param not validated** - Length checked in service but no DTO | Inconsistent validation location | Add query DTO with `@IsOptional() @IsString() @MaxLength(120)` |
---

### 4. Authentication & Authorization

| # | Severity | File | Line | Description | Impact | Recommendation |
|---|----------|------|------|-------------|--------|----------------|
| 26 | 🔴 Critical | `auth/auth.module.ts` | 5 | **Hardcoded insecure JWT secret default** - `'INSECURE_DEV_ONLY_CHANGE_ME'` | If deployed without env var, tokens are trivially forgeable | Remove default; fail fast if `JWT_SECRET` not set (already in main.ts but module loads first) |
| 27 | 🔴 Critical | `auth/auth.guard.ts` | 5 | **AuthGuard doesn't verify user existence** - Only validates JWT signature/expiry | Deleted/deactivated users can still access API until token expires | In `canActivate`, query DB for user by `sub`; check `isActive` flag; throw if not found |
| 28 | 🟠 High | `auth/auth.service.ts` | 9 | **12-hour access token with no refresh token mechanism** | Long-lived tokens increase blast radius of theft; no way to revoke | Implement refresh tokens (short-lived access + long-lived refresh); store refresh token hash in DB |
| 29 | 🟠 High | `auth/auth.service.ts` | 7-8 | **Password hashing uses scrypt but no pepper/secret** - Only per-user salt | If DB leaked, offline cracking possible despite scrypt | Add server-side pepper from env var: `scryptSync(password, salt + pepper, 64)` |
| 30 | 🟠 High | `auth/auth.service.ts` | 16 | **Login doesn't differentiate "user not found" vs "wrong password"** - Good for enumeration prevention | Actually this is GOOD - maintains current behavior | Keep current behavior; document intentionally |
| 31 | 🟠 High | `owner/owner.controller.ts:6` | 6 | **Any authenticated user can register as Owner** - No approval workflow | Unverified owners can create properties; `verificationStatus` field unused | Add admin approval flow; restrict Owner registration to verified users; add `OwnerGuard` |
| 32 | 🟡 Medium | `booking/booking.service.ts:26` | 26 | **Customer upserted on every booking** - `upsert({ where: { userId }, create: { userId } })` | Race condition: two concurrent bookings may create duplicate Customer rows (unique constraint prevents but causes error) | Use `findUnique` first; only create if not exists; or handle P2002 error |
| 33 | 🟡 Medium | `auth/auth.guard.ts` | 5 | **No token revocation/blacklist mechanism** - Logout doesn't invalidate tokens | Compromised tokens valid until expiry; no forced logout | Implement token blocklist (Redis) or short access + refresh token rotation |
| 34 | 🟢 Low | `auth/auth.service.ts` | 10-11 | **Email validation regex is basic** - `/^\S+@\S+\.\S+$/` | May reject valid emails; accept invalid ones | Use `class-validator` `@IsEmail()` or stricter regex |
---

### 5. Business Logic: Booking & Concurrency

| # | Severity | File | Line | Description | Impact | Recommendation |
|---|----------|------|------|-------------|--------|----------------|
| 35 | 🔴 Critical | `booking/booking.service.ts` | 13-29 | **Serializable isolation + Advisory lock combination** - May cause deadlocks or serialization failures under contention | High abort rates under load; advisory lock at transaction level may not serialize as intended | Choose ONE: either `Serializable` isolation OR advisory lock (recommended); test under load |
| 36 | 🔴 Critical | `booking/booking.service.ts` | 19-20 | **Check-then-act race on availability** - Reads availability, then creates booking; another tx could book in between | Double-booking possible despite advisory lock if availability not locked | Lock availability rows: `SELECT ... FOR UPDATE` on availability within same transaction |
| 37 | 🟠 High | `booking/booking.service.ts` | 24-25 | **Price calculation in application loop** - Iterates nights in JS, sums Decimal | Slow for long stays; rounding errors possible; not atomic | Move to SQL: `SELECT SUM(COALESCE(price_override, unit.price_per_night)) FROM availability ...` |
| 38 | 🟠 High | `booking/booking.service.ts` | 27 | **Booking created with `status: 'pending'` but no expiration** | Pending bookings block inventory indefinitely; no cleanup job | Add `expiresAt` timestamp; cron job to cancel expired pending bookings |
| 39 | 🟠 High | `booking/booking.service.ts` | 19 | **Conflict check only on `pending`/`confirmed`** - Doesn't check `cancelled` bookings | Cancelled bookings don't free dates immediately if status not updated | Ensure cancellation sets status and frees availability; consider `completed` status |
| 40 | 🟡 Medium | `booking/booking.service.ts` | 11-12 | **Date parsing uses `new Date(s + 'T00:00:00.000Z')`** - Assumes UTC midnight | Timezone issues if client sends local dates; DST edge cases | Use `date-fns` or `luxon` for explicit TZ handling; validate client sends UTC dates |
| 41 | 🟡 Medium | `booking/booking.service.ts` | 15 | **Advisory lock uses `hashtextextended(unitId::text, 0)`** - Hash collision possible (though unlikely) | Theoretical collision could allow concurrent booking on different units | Use `hashtextextended(unitId::text, 0)::bigint` for 64-bit; or use `pg_try_advisory_xact_lock` with unitId hash |

---

### 6. Owner Module Authorization

| # | Severity | File | Line | Description | Impact | Recommendation |
|---|----------|------|------|-------------|--------|----------------|
| 42 | 🟠 High | `owner/owner.controller.ts` | 1-8 | **No dedicated OwnerGuard** - Relies on AuthGuard + manual checks in service | Inconsistent authorization; owner endpoints accessible by customers | Create `OwnerGuard` that verifies `req.actor.role === 'owner'` AND owner record exists |
| 43 | 🟠 High | `owner/owner.controller.ts:7` | 7 | **`GET /owner/bookings` returns ALL bookings** - No pagination, filtering, or status selection | Performance issues with many bookings; no way to filter pending/confirmed | Add query params: `status`, `page`, `limit`, `dateFrom`, `dateTo` |
| 44 | 🟡 Medium | `owner/owner.controller.ts:6` | 6 | **Owner registration uses `upsert`** - Allows updating businessName without verification | Owner can change business name without re-verification | Separate create vs update; require re-verification on name change |
| 45 | 🟢 Low | `prisma/schema.prisma:27` | 27 | **`verificationStatus` field exists but unused** - Default 'pending', no workflow | Feature gap; owners never get verified | Implement verification workflow: admin review → approved/rejected; email notifications |

---

### 7. Performance & N+1 Queries

| # | Severity | File | Line | Description | Impact | Recommendation |
|---|----------|------|------|-------------|--------|----------------|
| 46 | 🟠 High | `catalog/catalog.service.ts:7` | 7 | **N+1 query risk** - `findMany` with `include: { units: { where: { status: 'active' } } }` loads ALL units per property | If 100 properties with 10 units each = 1000 units in memory; no pagination | Add pagination; consider separate `units` endpoint; or use `take` on units |
| 47 | 🟡 Medium | `catalog/catalog.service.ts:8` | 8 | **`mine` endpoint loads all properties + units without pagination** | Owner with many properties gets huge response | Add pagination |
| 48 | 🟡 Medium | `owner/owner.controller.ts:7` | 7 | **Bookings query loads nested relations** - `unit.property.owner` without limit | Deep nesting; potential large payloads | Flatten response; add pagination; select only needed fields |
---

### 8. Security

| # | Severity | File | Line | Description | Impact | Recommendation |
|---|----------|------|------|-------------|--------|----------------|
| 51 | 🟠 High | `main.ts` | 4-10 | **No Helmet middleware** - Missing security headers (CSP, HSTS, X-Frame-Options, etc.) | Vulnerable to clickjacking, MIME sniffing, XSS vectors | Add `app.use(helmet())` with configured CSP |
| 52 | 🟠 High | `main.ts` | 8 | **No rate limiting** - Global or per-endpoint | DoS, brute-force, enumeration attacks | Add `@nestjs/throttler`; configure global + stricter auth limits |
| 53 | 🟡 Medium | `auth/auth.service.ts` | 7 | **scrypt parameters hardcoded** - `N=64` (implicit via keylen), no CPU/memory cost tuning | May be too weak for future hardware; not configurable | Use `scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 })` or Argon2id |
| 54 | 🟡 Medium | `catalog/catalog.service.ts:4` | 4 | **Zod `strict()` on input but no sanitization** - XSS possible if description rendered unsafed | Stored XSS if frontend doesn't escape | Sanitize HTML fields (DOMPurify) or enforce plain text |
| 55 | 🟢 Low | `main.ts:8` | 8 | **CORS origins from env but no validation** - If env not set, defaults to localhost | Misconfiguration in production could allow unexpected origins | Validate origins array; log warning in production if defaults used |

---

### 9. Missing Features & Technical Debt

| # | Severity | File | Line | Description | Impact | Recommendation |
|---|----------|------|------|-------------|--------|----------------|
| 56 | 🔴 Critical | `checkout/checkout.module.ts` | 1-3 | **Entire checkout module empty** - No payment integration, no booking confirmation | Cannot complete bookings; core revenue flow missing | Priority 1: Implement Stripe/Adyen integration; webhook handling; idempotency |
| 57 | 🟠 High | `booking/booking.service.ts` | N/A | **No booking cancellation logic** | Customers cannot cancel; owners cannot reject | Implement `cancelBooking` with status transitions, availability release, refunds |
| 58 | 🟠 High | `owner/owner.controller.ts` | N/A | **No owner approval/rejection of pending bookings** | `status` field exists but no workflow | Add `PATCH /owner/bookings/:id/approve|reject`; notify customer |
| 59 | 🟡 Medium | `shared/health.controller.ts` | 1-3 | **Health check doesn't verify DB connectivity** | Kubernetes liveness/readiness probes will pass even if DB down | Add `prisma.$queryRaw`SELECT 1` in health check |
| 60 | 🟡 Medium | `prisma/schema.prisma:103-113` | 103-113 | **Notification model exists but no service/controller** | Dead code; notifications never sent | Implement notification service; email/push; preferences |
| 61 | 🟢 Low | `package.json` | 13-23 | **No linting/formatting in scripts** - No `lint`, `format`, `prettier` | Inconsistent code style; harder reviews | Add ESLint + Prettier; `husky` pre-commit hooks |
---

## Priority Remediation Plan

### Phase 1: Critical Blockers (Week 1-2)
1. **Create Prisma migrations** - `prisma migrate dev --name init`
2. **Implement CheckoutModule** - Payment integration (Stripe recommended)
3. **Add global ValidationPipe + ExceptionFilter** in `main.ts`
4. **Remove insecure JWT default** - Fail fast if `JWT_SECRET` missing
5. **Add AuthGuard user existence check** - Query DB for user in `canActivate`

### Phase 2: Security & Auth Hardening (Week 2-3)
6. **Implement refresh token flow** - Short access (15min) + refresh (30d) tokens
7. **Add rate limiting** - ThrottlerModule with auth endpoint overrides
8. **Add Helmet middleware** - Security headers
9. **Implement token revocation** - Redis blocklist or refresh token rotation
10. **Add password pepper** - Server-side secret in scrypt

### Phase 3: Database & Performance (Week 3-4)
11. **Add missing FK indexes** - Run migration
12. **Configure connection pool** - `connection_limit` in schema or PrismaClient options
13. **Fix booking concurrency** - Choose advisory lock OR serializable; lock availability rows
14. **Move price calculation to SQL** - Single query with SUM
15. **Add booking expiration** - `expiresAt` + cron job

### Phase 4: API Quality & Testing (Week 4-6)
16. **Create DTO classes** - Replace inline Zod with class-validator DTOs
17. **Add pagination** - All list endpoints
18. **Implement OwnerGuard** - Role-based access control
19. **Add OpenAPI/Swagger** - Full documentation
20. **Write tests** - Unit (services), Integration (controllers), E2E (critical flows)

### Phase 5: Missing Features (Ongoing)
21. **Booking cancellation** - Status transitions, availability release
22. **Owner approval workflow** - Booking approve/reject, verification flow
23. **Notification system** - Email, in-app, preferences
24. **Idempotency keys** - All mutating endpoints
25. **Observability** - Logging, metrics, tracing

---

## Configuration Checklist for Production

| Setting | Current | Required | Status |
|---------|---------|----------|--------|
| `JWT_SECRET` | Optional default | Required, 32+ chars | ❌ Missing |
| `DATABASE_URL` | Required | Required | ✅ Schema only |
| `CUSTOMER_ORIGIN` | Default localhost | Production domain | ❌ Missing |
| `OWNER_ORIGIN` | Default localhost | Production domain | ❌ Missing |
| `PORT` | Default 4000 | Any | ⚠️ Default OK |
| Prisma connection pool | Default | `connection_limit=20` | ❌ Missing |
| Rate limiting config | None | ThrottlerModule config | ❌ Missing |
| Refresh token config | None | `REFRESH_SECRET`, TTL | ❌ Missing |
| Password pepper | None | `PASSWORD_PEPPER` | ❌ Missing |
| Payment provider keys | None | Stripe/Adyen keys | ❌ Missing |

---

## Appendix: File Structure Overview

```
patana-api/
├── prisma/
│   └── schema.prisma          # Multi-schema DB design (no migrations)
├── src/
│   ├── main.ts                # Bootstrap (missing ValidationPipe, Helmet, Throttler)
│   ├── app.module.ts          # Root module (tight coupling via AuthModule imports)
│   └── modules/
│       ├── auth/
│       │   ├── auth.module.ts     # JWT config (insecure default)
│       │   ├── auth.service.ts    # Register/login/me (scrypt, no refresh)
│       │   ├── auth.controller.ts # Endpoints (no rate limiting)
│       │   └── auth.guard.ts      # JWT validation (no user existence check)
│       ├── catalog/
│       │   ├── catalog.module.ts  # Imports AuthModule directly
│       │   ├── catalog.service.ts # Properties/units (N+1 risk, inline Zod)
│       │   └── catalog.controller.ts
│       ├── booking/
│       │   ├── booking.module.ts
│       │   ├── booking.service.ts # Advisory lock + serializable, price calc in JS
│       │   └── booking.controller.ts
│       ├── owner/
│       │   ├── owner.module.ts
│       │   └── owner.controller.ts # No OwnerGuard, no pagination
│       ├── checkout/
│       │   └── checkout.module.ts  # EMPTY - Critical gap
│       └── shared/
│           ├── prisma.service.ts   # Extends PrismaClient (no middleware)
│           ├── prisma.module.ts    # Global module
│           └── health.controller.ts # Basic health (no DB check)
├── package.json               # No test, lint, format scripts
├── tsconfig.json              # Strict mode enabled ✅
└── nest-cli.json              # Basic config
```

---

## Conclusion

The Patana API has a **solid foundation** with thoughtful decisions (multi-schema Prisma, advisory locks, scrypt hashing, strict TypeScript), but **critical production gaps** prevent deployment:

1. **No tests** - Highest risk for reliability
2. **Empty checkout module** - Core revenue flow missing
3. **No migrations** - Cannot deploy schema changes
4. **Insecure JWT default** - Immediate security risk
5. **No validation pipe/exception filter** - Inconsistent error handling
6. **Booking concurrency flaws** - Race conditions despite advisory locks
7. **No rate limiting/Helmet** - Basic security missing

**Recommendation:** Do not deploy to production until Phase 1-2 complete. Invest 3-4 weeks in remediation before feature work.

---

*Report generated by automated audit with manual review. All findings should be verified in context before remediation.*
| 49 | 🟡 Medium | `shared/prisma.service.ts` | 1-3 | **No query logging or metrics** - Cannot identify slow queries in production | Blind to performance issues | Add Prisma `$extends` with query timing middleware; integrate with DataDog/OTel |
| 50 | 🟢 Low | `booking/booking.service.ts:21` | 21 | **Availability query fetches all dates in range** - Could be many rows for long stays | Memory pressure for 365-night bookings | Acceptable for ≤365 nights; monitor |