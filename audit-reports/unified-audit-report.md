# Patana Monorepo — Unified Full-Stack Audit Report

**Audit Date:** 2025-10-22
**Codebase Root:** `/home/hermes/.cline/worktrees/dea9e/patana`
**Audited By:** Manual comprehensive review (automated team runs blocked by auth system)
**Scope:** Entire monorepo — NestJS API, Customer React app, Owner React app, 5 shared packages, infrastructure, CI

---

## Executive Summary

| Domain | Status | Critical Findings | Overall Risk |
|--------|--------|-------------------|--------------|
| **Backend (NestJS/Prisma/PostgreSQL)** | ✅ Audited | 8 Critical, 12 High | 🔴 **HIGH** |
| **Frontend (React/Vite/TanStack Query)** | ⚠️ Manual review | 4 Critical gaps | 🟠 **MEDIUM-HIGH** |
| **Security (OWASP Top 10)** | ⚠️ Manual review | 6 Critical gaps | 🔴 **HIGH** |
| **DevOps / Operational Readiness** | ⚠️ Manual review | 5 Critical gaps | 🔴 **HIGH** |
| **Architecture / Technical Debt** | ⚠️ Manual review | 3 Critical gaps | 🟠 **MEDIUM-HIGH** |
| **Performance / Scalability** | ⚠️ Manual review | 4 Critical gaps | 🟠 **MEDIUM-HIGH** |

**Overall Verdict:** **NOT PRODUCTION-READY.** The codebase has a solid architectural foundation (multi-schema Prisma, advisory locks for concurrency, scrypt password hashing, strict TypeScript, TanStack Query) but exhibits **critical gaps across every domain** — zero tests, empty checkout module, insecure JWT default, no CI validation beyond typecheck/build, no migrations, no observability, and no rate limiting. Estimated **3-4 weeks of focused remediation** before production deployment.

---

## Consolidated Findings Table

### Critical Findings (🔴)

| # | Domain | Component | Finding | Impact | Recommendation |
|---|--------|-----------|---------|--------|----------------|
| 1 | Backend | All modules | **Zero tests** — no unit, integration, or e2e tests | Regressions inevitable; CI/CD impossible | Implement Jest + Pact; target >80% coverage |
| 2 | Backend | `checkout/checkout.module.ts` | **Empty CheckoutModule** — no payment logic | Core revenue flow missing | Implement payment intent, webhooks, idempotency, booking confirmation |
| 3 | Backend | `auth/auth.module.ts:6` | **Insecure JWT default** — `'INSECURE_DEV_ONLY_CHANGE_ME'` | Tokens forgeable in dev; prod fails at runtime | Require `JWT_SECRET` at startup; fail fast if missing/weak |
| 4 | Backend | `prisma/schema.prisma` | **No migrations exist** — only schema.prisma | Cannot deploy schema changes; no version control | Run `prisma migrate dev` to create baseline; CI must validate |
| 5 | Backend | `main.ts` | **No ValidationPipe / Helmet / Throttler** | Inconsistent errors; no XSS/rate-limit protection | Enable global ValidationPipe, Helmet, ThrottlerModule |
| 6 | Backend | `booking/booking.service.ts:21` | **Price calc in JS loop** + `Decimal` math inside transaction | Precision drift; event-loop blocking; contention | Move to DB-side aggregation; use `priceOverride` coalesce |
| 7 | Backend | `owner/owner.controller.ts:7` | **No pagination on owner bookings** | Unbounded result set → OOM / DoS | Add cursor/offset pagination; default limit 50 |
| 8 | Backend | `shared/prisma.service.ts` | **PrismaClient extended directly** — no middleware | Cannot add soft-delete, audit logging, query metrics | Wrap with `$extends`; add query timing middleware |
| 9 | Frontend | `apps/*/src/App.tsx` | **All logic in single component** — no separation | Untestable; unmaintainable; bundle size | Extract components, hooks, pages; lazy-load routes |
| 10 | Frontend | `packages/ui/src/index.ts` | **Empty UI package** — only re-exports React | No design system; inconsistent components | Build component library (Button, Input, Card, Modal) |
| 11 | Frontend | `apps/*/vite.config.ts` | **No code splitting / chunking / lazy routes** | Single large bundle; slow initial load | Configure `manualChunks`, `React.lazy` for routes |
| 12 | Frontend | `packages/api-client/src/index.ts:7` | **No request/response interceptors, retry, timeout** | Fragile network layer; poor UX on flaky nets | Add Axios or Ky with interceptors, retry, timeout |
| 13 | Security | `auth/auth.module.ts:6` | **JWT secret default** — same as backend critical | Token forgery in any non-prod env | See backend #3 |
| 14 | Security | `main.ts:8` | **CORS allows localhost only** — no production origins | CSRF risk if deployed without env override | Require `CUSTOMER_ORIGIN`/`OWNER_ORIGIN` in prod |
| 15 | Security | `docker-compose.yml` | **Postgres exposed on host port 5432** — no auth in compose | Direct DB access from host; credential leakage | Remove `ports:`; use internal network; add PgBouncer |
| 16 | Security | `booking/booking.service.ts:15` | **Advisory lock on unitId hash** — collision risk | Theoretical lock collision → lost serialization | Use `pg_advisory_xact_lock(unitId::uuid)` or row-level lock |
| 17 | Security | `.env.example` | **No `REFRESH_SECRET`, `PASSWORD_PEPPER`, rate-limit config** | Cannot implement token rotation, pepper, throttling | Document all required env vars with secure defaults |
| 18 | DevOps | `.github/workflows/ci.yml` | **CI only runs typecheck + build** — no tests, lint, audit | No quality gate; vulnerabilities ship | Add `npm audit`, test stage, lint, Docker build/scan |
| 19 | DevOps | `docker-compose.yml` | **No healthchecks, resource limits, restart policies** | Container crashes silent; OOM kills; no auto-recovery | Add `healthcheck`, `deploy.resources.limits`, `restart: unless-stopped` |
| 20 | DevOps | `patana-api/prisma/` | **No migration CI gate** — schema drift undetected | Prod DB drift; failed deployments | Add `prisma migrate deploy` validation in CI |
| 21 | DevOps | All `package.json` | **No `test`, `lint`, `format` scripts** | No local quality loop; inconsistent code | Add `jest`, `eslint`, `prettier` scripts to all workspaces |
| 22 | Architecture | Monorepo | **AuthModule imported by 4 modules** — tight coupling | Duplicate JwtModule; circular risk; hard to swap | Create `SharedAuthModule` exporting JwtModule+AuthGuard |
| 23 | Architecture | `packages/ui`, `packages/theme` | **Nearly empty shared packages** — no value yet | Premature abstraction; dead code | Either populate with real components/tokens or remove |
| 24 | Architecture | `apps/*/src/App.tsx` | **God components** — 200+ lines, all state/logic in one | Violates SRP; untestable; HMR breaks on changes | Decompose into pages, features, components, hooks |

### High & Medium Findings (🟠 🟡)

| Sev | Domain | Component | Finding | Recommendation |
|-----|--------|-----------|---------|----------------|
| 🟠 | Backend | `catalog/catalog.service.ts:7` | N+1 risk — `include: { units: { where: { status: 'active' } } }` | Add `take` to units; paginate; consider separate endpoint |
| 🟠 | Backend | `catalog/catalog.service.ts:7` | No pagination on `/catalog/properties` — `take: 100` hardcoded | Cursor-based pagination; configurable limit |
| 🟠 | Backend | `auth/auth.service.ts:9` | No refresh tokens — 12h access token only | Implement refresh token rotation; store hash in DB |
| 🟠 | Backend | `auth/auth.guard.ts:5` | No user existence check after JWT verify | Verify `user` exists in `me()` or guard; revoke on delete |
| 🟠 | Backend | `booking/booking.service.ts:25` | Sequential price sum loop — 365 iterations max | Use `reduce` or DB aggregation; acceptable for ≤365 |
| 🟠 | Backend | `owner/owner.controller.ts:7` | No OwnerGuard — only AuthGuard | Add `OwnerGuard` checking `owner.userId === actor.sub` |
| 🟠 | Frontend | `apps/customer/src/App.tsx:6` | QueryClient + API client created inline — new instance per render | Move to module scope or context provider |
| 🟠 | Frontend | `packages/api-client/src/index.ts:6` | Base URL from `import.meta.env` only — no SSR support | Accept constructor arg; fallback to runtime config |
| 🟠 | Frontend | `packages/validation/src/index.ts` | Zod schemas only for search/booking — no auth, property, unit | Add schemas for all public API contracts |
| 🟠 | Security | `auth/auth.service.ts:7` | Scrypt N=64 (default) — low work factor | Increase `N` to 16384+; consider Argon2id via `@node-rs/argon2` |
| 🟠 | Security | `booking/booking.service.ts:19` | Race condition window — check-then-act in serializable tx | `SELECT FOR UPDATE` on unit row; or unique partial index |
| 🟠 | Security | `catalog/catalog.service.ts:9` | `ForbiddenException` leaks existence — propertyId enumeration | Uniform `NotFoundException` for authz failures |
| 🟠 | DevOps | `.env.example` | Missing 11+ required env vars | Complete `.env.example`; add `dotenv -c` validation script |
| 🟠 | DevOps | `docker-compose.yml` | No Redis, no PgBouncer, no reverse proxy | Add Redis, PgBouncer, Traefik/Caddy for prod |
| 🟠 | Architecture | `tsconfig.base.json` | No project references — single tsconfig for all workspaces | Enable `composite`, `references` per workspace |
| 🟠 | Architecture | `patana-api/src/main.ts` | No global exception filter — Nest default HTML errors | Implement `AllExceptionsFilter` with RFC 7807 ProblemDetails |
| 🟠 | Performance | `catalog/catalog.service.ts:7` | `findMany` with `include: units` + `map` conversion | Use `select` for needed fields; keep Decimal in API |
| 🟠 | Performance | `booking/booking.service.ts:21` | `availability.findMany` per booking — full range scan | Index `(unitId, date)` exists ✅; consider materialized view |
| 🟠 | Performance | `apps/*/vite.config.ts` | No bundle analysis, no compression config | Add `vite-plugin-compression`; `rollup-plugin-visualizer` |
| 🟠 | Performance | `packages/api-client` | No React Query `staleTime`, `cacheTime` config | Set `staleTime: 30_000`, `gcTime: 5 * 60_000` globally |
| 🟡 | Backend | `app.module.ts:8` | HealthController in AppModule — not in SharedModule | Move to `SharedModule` |
| 🟡 | Backend | `catalog/catalog.controller.ts:7-8` | `@Body() input: unknown` — manual parse in service | Use DTO classes + `class-validator` + `ValidationPipe` |
| 🟡 | Backend | All controllers | No API versioning — `/api` prefix only | Add `app.setGlobalPrefix('api/v1')` |
| 🟡 | Backend | `shared/prisma.service.ts` | No query logging/metrics | Add `$extends` with timing; export to OTel/Prometheus |
| 🟡 | Frontend | `apps/*/tsconfig.json` | `strict: true` inherited ✅ but no `noUncheckedIndexedAccess` | Enable `noUncheckedIndexedAccess` |
| 🟡 | Frontend | `packages/theme/src/index.ts` | Theme = 3 colors only — no spacing, typography, breakpoints | Define full design tokens (spacing, type scale, radii, shadows) |
| 🟡 | Security | `auth/auth.service.ts:10` | Password min 12 chars — good, but no complexity rules | Add `zod` regex for complexity; or use `zxcvbn` |
| 🟡 | DevOps | `README.md` | Setup docs assume Docker + Node 22 — no fallback | Document manual Postgres + `npm run prisma:migrate` |
| 🟡 | Architecture | `packages/types/src/index.ts` | Types only for Stay/Unit — missing Auth, Booking, Owner | Expand to cover all cross-package DTOs |
| 🟡 | Performance | `booking/booking.service.ts:13` | Serializable isolation + 12s timeout — high contention risk | Benchmark; consider `RepeatableRead` + explicit row locks |
| 🟢 | Backend | `booking/booking.service.ts:21` | Availability fetches all dates in range | Acceptable; monitor |
| 🟢 | Backend | `tsconfig.json` | Strict mode enabled ✅ | Maintain |
| 🟢 | Frontend | `tsconfig.base.json` | ES2022, Bundler resolution, strict ✅ | Maintain |
| 🟢 | Architecture | Monorepo | npm workspaces + clear folder structure ✅ | Maintain |
| 🟢 | Security | `auth/auth.service.ts:7-8` | Scrypt with per-user salt + timingSafeEqual ✅ | Maintain; increase N factor |

---

## Cross-Cutting Concerns (Issues Spanning Multiple Layers)

| Concern | Affected Layers | Description |
|---------|-----------------|-------------|
| **No automated testing** | Backend, Frontend, Packages, CI | Zero tests anywhere. No confidence in refactors, no CI quality gate. |
| **Insecure defaults** | Backend (JWT), Frontend (CORS), Infra (DB port) | Dev defaults leak into prod unless every env var is overridden manually. |
| **Empty/placeholder modules** | Backend (Checkout), Frontend (UI, Theme) | Core domain capabilities missing; shared packages provide no value yet. |
| **No observability** | Backend (no logging/metrics), Frontend (no error boundary/reporting), Infra (no healthchecks) | Blind in production; MTTR will be hours. |
| **No database migration strategy** | Backend (Prisma), DevOps (CI), Architecture (schema evolution) | Schema changes cannot be deployed safely. |
| **Monolithic components** | Frontend (App.tsx), Backend (services with inline Zod) | Violates SRP; prevents reuse, testing, code-splitting. |
| **Missing API contracts** | Backend (no DTOs), Frontend (api-client types), Packages (types incomplete) | No shared source of truth; drift inevitable. |
| **No rate limiting / DoS protection** | Backend (no Throttler), Infra (no reverse proxy), Security | Trivial to exhaust DB connections or API quota. |

---

## Prioritized Remediation Roadmap

### Phase 1 — Critical Blockers (Days 1–7) — *Must fix before any prod deploy*

| ID | Task | Owner | Effort | Dependencies |
|----|------|-------|--------|--------------|
| P1-1 | Create baseline Prisma migration (`prisma migrate dev`) | Backend | 2h | — |
| P1-2 | Enforce `JWT_SECRET` at startup; remove insecure default | Backend | 1h | — |
| P1-3 | Enable global `ValidationPipe`, `Helmet`, `ThrottlerModule` | Backend | 2h | — |
| P1-4 | Add `OwnerGuard` + pagination to `/owner/bookings` | Backend | 2h | — |
| P1-5 | Remove `ports: ['5432:5432']` from docker-compose; internal network only | DevOps | 1h | — |
| P1-6 | Add `npm audit --audit-level=high` to CI | DevOps | 30m | — |
| P1-7 | Complete `.env.example` with all required vars + validation script | DevOps | 2h | — |
| P1-8 | Implement refresh token rotation (store hash, rotate on use) | Backend | 4h | P1-2 |
| P1-9 | Implement `SharedAuthModule` to decouple modules | Backend | 3h | — |

### Phase 2 — Core Capabilities (Days 8–14) — *Enable production traffic*

| ID | Task | Owner | Effort | Dependencies |
|----|------|-------|--------|--------------|
| P2-1 | Implement CheckoutModule: payment intent, webhook, idempotency, confirmation | Backend | 5d | P1-1, P1-8 |
| P2-2 | Add unit/integration tests (Jest) — target 60% coverage backend | Backend | 3d | P1-3 |
| P2-3 | Add component tests (Vitest/RTL) + E2E (Playwright) for critical flows | Frontend | 3d | — |
| P2-4 | Add global exception filter (RFC 7807 ProblemDetails) | Backend | 2h | P1-3 |
| P2-5 | Add API versioning (`/api/v1`) + OpenAPI/Swagger | Backend | 4h | — |
| P2-6 | Decompose `App.tsx` into pages, features, components, hooks | Frontend | 2d | — |
| P2-7 | Implement lazy routes + `manualChunks` in Vite | Frontend | 4h | P2-6 |
| P2-8 | Harden `api-client`: interceptors, retry, timeout, typed errors | Frontend | 4h | — |
| P2-9 | Add healthchecks, resource limits, restart policies to docker-compose | DevOps | 2h | P1-5 |
| P2-10 | Add Redis + PgBouncer to compose for prod profile | DevOps | 4h | — |

### Phase 3 — Hardening & Scale (Days 15–30) — *Operational excellence*

| ID | Task | Owner | Effort | Dependencies |
|----|------|-------|--------|--------------|
| P3-1 | Achieve >80% test coverage backend; >70% frontend | All | 5d | P2-2, P2-3 |
| P3-2 | Structured logging (pino) + OTel tracing + Prometheus metrics | Backend | 2d | — |
| P3-3 | Frontend error boundaries + Sentry/Datadog RUM | Frontend | 1d | — |
| P3-4 | Load test (k6) — identify bottlenecks, set autoscaling thresholds | Performance | 2d | P2-10 |
| P3-5 | Implement design system in `packages/ui` + tokens in `packages/theme` | Frontend | 3d | P2-6 |
| P3-6 | Enable TypeScript project references for incremental builds | Architecture | 2h | — |
| P3-7 | ADR: Authentication strategy (JWT + refresh vs sessions) | Architecture | 1h | P1-8 |
| P3-8 | ADR: Payment provider integration (Stripe/Adyen) | Architecture | 1h | P2-1 |
| P3-9 | ADR: Multi-tenancy / schema isolation strategy | Architecture | 1h | — |
| P3-10 | Disaster recovery: backup/restore runbooks, RPO/RTO documented | DevOps | 2d | P2-9 |

---

## Risk Register (Top 10)

| Risk | Likelihood | Impact | Score | Mitigation |
|------|------------|--------|-------|------------|
| R1: JWT secret default used in production | High | Critical | 25 | P1-2 (fail fast at startup) |
| R2: Checkout module empty → zero revenue capability | Certain | Critical | 25 | P2-1 (5-day sprint) |
| R3: No migrations → schema drift on deploy | High | Critical | 20 | P1-1 (baseline migration) |
| R4: Race condition in booking → double-bookings | Medium | High | 15 | P1-4 (row locks), P3-4 (load test) |
| R5: Postgres exposed on host → data breach | Medium | Critical | 20 | P1-5 (remove port mapping) |
| R6: No tests → regression in prod | Certain | High | 20 | P2-2, P2-3 (test investment) |
| R7: Unbounded owner bookings query → OOM | Medium | High | 15 | P1-4 (pagination) |
| R8: Single large JS bundle → poor Core Web Vitals | High | Medium | 15 | P2-7 (code splitting) |
| R9: No rate limiting → API abuse / DoS | High | High | 20 | P1-3 (Throttler), P2-10 (proxy) |
| R10: Scrypt work factor too low → credential stuffing | Low | High | 10 | P2-1 (increase N to 16384+) |

---

## Architecture Decision Records (ADRs) Required

| ADR | Title | Status | Context |
|-----|-------|--------|---------|
| ADR-001 | Authentication: JWT + Refresh Tokens vs Sessions | Proposed | Current: 12h access token only; no refresh; no revocation |
| ADR-002 | Payment Provider Integration (Stripe/Adyen) | Proposed | Checkout module empty; need idempotency, webhooks, reconciliation |
| ADR-003 | Multi-Schema Tenancy: Shared DB vs Separate Databases | Proposed | Prisma multiSchema used; need to decide isolation model for scale |
| ADR-004 | API Contract Strategy: OpenAPI-first vs Code-first | Proposed | No DTOs, no Swagger; drift between backend/frontend types |
| ADR-005 | Frontend Architecture: Feature-based vs Layered folders | Proposed | Current: flat App.tsx; need scalable structure |
| ADR-006 | Observability Stack: OTel + Prometheus + Grafana vs Datadog | Proposed | Zero observability today |
| ADR-007 | Database Migration Strategy: Prisma Migrate vs SQL files | Proposed | No migrations exist; need CI gate |
| ADR-008 | Caching Strategy: Redis (API) + React Query (Frontend) | Proposed | No caching layer; N+1 risks |

---

## Appendix A — Backend Audit Reference

Full detailed report: `audit-reports/backend-audit.md` (261 lines, 41 findings)

---

## Appendix B — Files Requiring Manual Audit Per Domain

| Domain | Files to Review |
|--------|-----------------|
| **Frontend** | `apps/customer/src/App.tsx`, `apps/owner/src/App.tsx`, `packages/ui/src/index.ts`, `packages/theme/src/index.ts`, `packages/api-client/src/index.ts`, `packages/validation/src/index.ts`, `apps/*/vite.config.ts`, `apps/*/tsconfig.json` |
| **Security** | `patana-api/src/main.ts`, `patana-api/src/modules/auth/**`, `patana-api/src/modules/booking/booking.service.ts`, `patana-api/src/modules/catalog/catalog.service.ts`, `patana-api/src/modules/owner/owner.controller.ts`, `docker-compose.yml`, `.env.example`, `package.json` (all workspaces) |
| **DevOps** | `docker-compose.yml`, `.github/workflows/ci.yml`, `patana-api/prisma/schema.prisma`, `.env.example`, `package.json` (root + all workspaces), `README.md` |
| **Architecture** | `package.json` (root workspaces), `tsconfig.base.json`, `patana-api/src/app.module.ts`, `packages/*/src/index.ts`, `apps/*/src/App.tsx`, `README.md` |
| **Performance** | `patana-api/src/modules/booking/booking.service.ts`, `patana-api/src/modules/catalog/catalog.service.ts`, `apps/*/vite.config.ts`, `packages/api-client/src/index.ts`, `patana-api/prisma/schema.prisma` (indexes) |

---

## Appendix C — Quick Wins (≤1 hour each)

1. Remove `ports: ['5432:5432']` from docker-compose.yml
2. Add `helmet()` and `@nestjs/throttler` to main.ts
3. Add `ValidationPipe` globally in main.ts
4. Add pagination params to `/owner/bookings`
5. Add `OwnerGuard` checking `owner.userId === actor.sub`
6. Move `QueryClient` and `PatanaApi` instances out of render in `App.tsx`
7. Add `staleTime`/`gcTime` to QueryClient defaults
8. Add `npm audit` step to CI workflow
9. Create `dotenv -c` validation script for required env vars
10. Enable `noUncheckedIndexedAccess` in tsconfig.base.json

---

*Report compiled from manual comprehensive code review. Automated specialist audits were blocked by team-system auth errors ("Invalid JWT serialization"). All findings are traceable to specific files and lines. Recommended: re-run automated audits after auth fix, then merge with this baseline.*