# Patana production-release gate

The project is **NOT production-ready** merely because code compiles.

## Completed foundations
- Strictly required JWT signing secret; no development fallback.
- JWT verification requires issuer, audience and HS256.
- API security headers, explicitly allowed browser origins, and basic request throttling.
- Server-side booking prices and serialized unit locking.
- Database and build validation in CI.

## Mandatory before launch
- Auth: email verification, recovery, credential-stuffing protection and centralized account/session revocation.
- Scale: production-grade distributed rate limiting; current in-process throttle is not distributed.
- Bookings: database-backed idempotency, pending hold expiry, cancellation/confirmation workflows, unit-level locking tests with concurrent requests, immutable audit records.
- Payments: real payment provider, webhook signature verification, idempotent event processing, refunds, reconciliation and payout controls. Payment capture remains disabled.
- Owner and admin RBAC with verification workflow, moderation and audit logging.
- PostgreSQL migration baseline with repeatable backup/restore exercise, monitoring and alerting.
- UI: accessible, complete customer and owner dashboards, error handling, mobile QA.
- Browser-to-backend integration tests, security tests, release smoke tests.
- Deployment: TLS, managed secrets, S3 object storage, CI/CD with approvals, rollback and staging.

No real customers or payment credentials should be onboarded until the above release gates have passed.
