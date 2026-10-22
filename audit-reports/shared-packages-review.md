# Shared Packages Audit Report

**Repository:** patana (monorepo)
**Audit Date:** 2025-10-22
**Scope:** packages/types, packages/ui, packages/theme, packages/validation, packages/api-client
**Total Source Lines:** 175 across 5 packages

---

## Executive Summary

| Package | Lines | Status | Critical Issues |
|---------|-------|--------|-----------------|
| @patana/types | 148 | Incomplete | Missing API response types, no versioning strategy |
| @patana/ui | 1 | Placeholder | Only re-exports React, no components |
| @patana/theme | 1 | Placeholder | Only 3 color tokens, no design system |
| @patana/validation | 3 | Minimal | Only 2 schemas, no integration with types |
| @patana/api-client | 22 | Duplicates types | Re-declares types from @patana/types, no React Query integration |

**Overall Assessment:** The shared packages are in early scaffold state — minimal implementations with significant gaps in completeness, TypeScript configuration, testing, documentation, and publishing readiness.

---

## Findings Table

| Severity | Package:File:Line | Description | Recommendation |
|----------|-------------------|-------------|----------------|
| Critical | packages/api-client/src/index.ts:2-3 | Type duplication: Session and Booking types re-declared inline instead of importing from @patana/types. Creates maintenance burden and drift risk. | Import Session, Booking from @patana/types. Remove inline declarations. |
| Critical | packages/api-client/src/index.ts:1 | Partial import: Only imports Stay from @patana/types but defines Session, Booking locally. Inconsistent usage. | Import all needed types from @patana/types: Session, Booking, Stay, OwnerBooking, OwnerProfile, etc. |
| Critical | packages/types/src/index.ts | Missing API response types: No types for paginated responses, error responses, or API-specific DTOs. | Add generic ApiResponse<T>, PaginatedResponse<T>, ApiError types. Export all request/response DTOs. |
| Critical | packages/ui/package.json:8-10 | Empty component library: Only dependency is react, exports only React default. No components, hooks, or utilities. | Either implement component library or remove package. If keeping, add base components (Button, Input, Card, etc.) with proper props typing. |
| Critical | packages/theme/src/index.ts:1 | Incomplete design tokens: Only 3 colors (brand, ink, background). No spacing, typography, radii, shadows, breakpoints, z-indices, or semantic tokens. | Expand to full design token set: spacing scale, type scale, border radius, shadows, breakpoints, motion tokens, semantic color aliases (primary, secondary, success, warning, error, surface, etc.). |
| Critical | packages/validation/src/index.ts | No type derivation from Zod: Schemas dont export inferred types. Consumers must duplicate types. | Export inferred types: export type SearchQuery = z.infer<typeof searchQuerySchema>; same for booking. |
| Critical | packages/validation/src/index.ts:2-3 | Validation gaps: No schemas for auth (login/register), property/unit creation, owner registration, payment intent. Only 2 of 10+ API operations covered. | Add schemas for all API request bodies matching @patana/types request interfaces. |
| High | All packages: package.json | No TypeScript configuration: No tsconfig.json in any package. Relies on app-level tsconfig.base.json via extends. Packages cannot be type-checked independently. | Add tsconfig.json to each package with composite: true, declaration: true, declarationMap: true, outDir: dist. Enable project references. |
| High | All packages: package.json | No build output: main and types point to ./src/index.ts (source). No dist/ output, no build scripts. Not publishable to npm. | Add build script (tsc or bundler). Output to dist/ with .d.ts, .js (ESM + CJS). Add exports field with proper conditions. |
| High | All packages: package.json:4 | All packages private: true: Cannot be published to npm registry. Version locked at 0.1.0 for all. No versioning strategy. | Decide publishing strategy: (a) keep private with workspace protocol, (b) publish to private registry, (c) publish to npm. If (b)/(c), set private: false, add publishConfig, automate versioning (changesets). |
| High | packages/api-client/src/index.ts:5 | Hardcoded fallback URL couples to Vite/env. Not portable to other build tools (Next.js, etc.). | Accept baseUrl as required constructor arg. Provide factory helper for Vite env. Document required env var. |
| High | packages/api-client/src/index.ts:6-9 | No React Query integration: Raw fetch wrapper. No caching, deduping, retries, invalidation, or optimistic updates. Apps must wrap manually. | Add React Query hooks: useStays(city), useLogin(), useBook(), useMyBookings(), etc. Export queryKeys for invalidation. |
| High | packages/api-client/src/index.ts:8 | Weak error handling: Throws generic Error with string message. No typed error classes, no status code access, no retry logic. | Create ApiError class with status, code, data. Distinguish auth errors (401), validation (400), not found (404), server (5xx). |
| High | packages/types/src/index.ts:48-53 | Inconsistent optional chaining: Booking.unit is optional but nested unit.property is required. | Make unit?: { name: string; property: { name: string; city: string } } -> unit?: Unit & { property: Pick<Stay, name | city> } or use UnitWithProperty type. |
| High | packages/types/src/index.ts:130 | String date fields: checkIn, checkOut are string not Date. No format enforcement (ISO 8601?). Validation uses z.string().date() but types dont reflect. | Use string with branded type type ISODate = string & { __brand: ISODate } or document ISO 8601 requirement. Consider Date in domain, serialize at boundary. |
| Medium | packages/types/src/index.ts:6 | Single payment method: PaymentMethodType = card - no extensibility for future methods (paypal, bank_transfer, etc.). | Use type PaymentMethodType = card | paypal | bank_transfer | string or enum-like object for extensibility. |
| Medium | packages/types/src/index.ts:44-54 | Booking totalPrice as string: Should be number (cents) or Decimal for precision. String allows invalid formats. | Change to totalPrice: number (cents) or totalPrice: { amount: number; currency: string }. |
| Medium | packages/validation/src/index.ts:3 | Booking schema uses .date(): z.string().date() validates ISO date but checkIn/checkOut in types are plain string. Mismatch. | Align: either change types to branded ISODateString or relax schema to z.string(). |
| Medium | packages/api-client/package.json:9 | Dependency on @patana/types@0.1.0: Hardcoded version. Workspace protocol (workspace:*) preferred for monorepo. | Change to @patana/types: workspace:* (or workspace:^). Enables local development without version bumps. |
| Medium | All packages | No exports field: package.json uses legacy main/types. Modern tooling expects exports with conditionals (import, require, types, default). | Add exports field: ./package.json: ./package.json, .: { types: ./dist/index.d.ts, import: ./dist/index.js, require: ./dist/index.cjs }. |
| Medium | All packages | No test files: Zero tests in any package. No vitest/jest config in packages. | Add vitest.config.ts per package. Test type inference, schema validation, API client error handling. Target >80% coverage. |
| Medium | All packages | No documentation: No README.md, CHANGELOG.md, CONTRIBUTING.md, or API docs (TypeDoc). | Add README per package: purpose, install, usage examples, API reference. Generate TypeDoc on build. |
| Medium | packages/types/src/index.ts | No JSDoc comments: Types lack documentation. IDE hover shows nothing. | Add JSDoc to all exported types: /** User session from auth */ export interface Session { ... }. |
| Low | packages/ui/src/index.ts:1 | Unnecessary default export: export {default as React} from react - consumers should import React directly. | Remove. If package provides React utilities, export named utilities instead. |
| Low | packages/theme/src/index.ts:1 | as const on object: Good for inference, but object is not typed. Should use const theme = { ... } as const satisfies ThemeTokens. | Define ThemeTokens interface, use satisfies for validation + inference. |
| Low | packages/validation/src/index.ts:1 | zod imported as namespace: import {z} from zod - v3 style. v4 uses import { z } from zod (same). No issue but note for future. | No action needed; v3/v4 compatible. |
| Low | packages/api-client/src/index.ts:4 | Class-based API client: PatanaApi class with methods. Harder to tree-shake, test, and compose. | Consider functional approach: createApiClient(baseUrl) returning object with methods. Easier to mock in tests. |

---

## Package-by-Package Analysis

### 1. @patana/types - Core Domain Types

**Strengths:**
- Well-organized sections (Core, Auth, Property, Booking, Owner, API)
- Uses TypeScript interfaces consistently
- No external dependencies (zero-dep)
- Good naming conventions

**Critical Gaps:**
| Issue | Impact |
|-------|--------|
| No generic API response wrappers | Consumers define their own ApiResponse<T> |
| No error response types | Inconsistent error handling across apps |
| String dates without format constraint | Runtime validation/schema mismatch |
| totalPrice as string | Precision/calculation bugs |
| Single PaymentMethodType | Blocks future payment providers |
| No JSDoc | Poor IDE experience |

**Recommended Structure:**
```typescript
// Add to index.ts
export interface ApiResponse<T> { data: T; meta?: ResponseMeta }
export interface PaginatedResponse<T> { items: T[]; nextCursor?: string; hasMore: boolean }
export interface ApiError { code: string; message: string; status: number; details?: Record<string, unknown> }
export type ISODateString = string & { __brand: ISODateString }
export type PaymentMethodType = card | paypal | bank_transfer | (string & {})
```

---

### 2. @patana/ui - Component Library

**Current State:** Essentially empty - only re-exports React.

**Required for Viable Library:**
- **Build config:** tsconfig, bundler (tsup/vite), package exports
- **Component primitives:** Button, Input, Select, Checkbox, Radio, Textarea, Label, Card, Modal, Toast, Tooltip, Dropdown, Tabs, Accordion, Table, Form, Avatar, Badge, Spinner, Skeleton
- **Hooks:** useDisclosure, useToggle, useClickOutside, useMediaQuery, useLocalStorage
- **Utilities:** cn (classnames merge), focusVisible, portal
- **Theme integration:** Consume @patana/theme tokens via CSS variables or context
- **TypeScript:** Strict props with ComponentPropsWithoutRef, forwardRef, polymorphic components
- **Testing:** Storybook + Vitest + Testing Library
- **Accessibility:** ARIA attributes, keyboard navigation, focus management

**Decision Point:** If no immediate need for shared components, **remove this package** to reduce maintenance surface.

---

## Cross-Package Coupling Analysis

```
@patana/types (0 deps) <---------
     ^                            |
     |                            |
@patana/validation (zod)          |
     ^                            |
     |                            |
@patana/api-client (@patana/types) ----  <-- Duplicates types!
     ^
     |
@patana/ui (react)      @patana/theme (0 deps)
     |
     +-- Both consumed by apps independently
```

**Issues:**
1. **api-client -> types**: Correct direction, but api-client duplicates types instead of importing
2. **validation -> types**: Missing! Validation schemas should derive from or mirror types
3. **ui/theme**: No connection - ui should consume theme tokens
4. **No shared tsconfig**: Each package cannot be built/checked in isolation

**Circular Dependency Risk:** Low currently, but will increase if:
- ui imports theme (correct)
- validation imports types (correct)
- api-client imports validation for request validation (would create cycle if validation imports api-client)

---

## Developer Experience Gaps

| Area | Current State | Target State |
|------|---------------|--------------|
| Import paths | @patana/types (source) | @patana/types (dist via exports) |
| IntelliSense | Basic (no JSDoc) | Full JSDoc + type hints |
| Debugging | Source maps missing | Source maps in dist |
| Onboarding | No README/docs | Per-package README + examples |
| Type-checking | Only via apps | npm run typecheck -w @patana/types |
| Testing | None | npm run test -w @patana/validation |
| Versioning | All 0.1.0, private | Changesets or manual with changelog |

---

## Recommended Action Plan

### Phase 1: Foundation (Week 1)
1. Add tsconfig.json to each package with composite: true, declaration: true
2. Add build script using tsc or tsup -> dist/
3. Add exports field to all package.json
4. Change workspace deps to workspace:*
5. Add root tsconfig.base.json references

### Phase 2: Types & Validation (Week 1-2)
1. Complete @patana/types with API response/error types, branded date/price types
2. Add JSDoc to all exported types
3. Expand @patana/validation to cover all request types
4. Export inferred types from validation schemas
5. Align validation date handling with types

### Phase 3: API Client (Week 2)
1. Remove duplicated types, import all from @patana/types
2. Add ApiError class with status/code
3. Add React Query hooks (@tanstack/react-query peer dep)
4. Make baseUrl required, add factory for Vite env
5. Add request/response interceptors for auth refresh

### Phase 4: UI & Theme (Week 3+)
1. **Decision:** Keep or remove @patana/ui
2. If keeping: Implement primitive components + hooks + theme integration
3. Expand @patana/theme to full token set
4. Output CSS custom properties + TypeScript + JSON
5. Make @patana/ui consume @patana/theme tokens

### Phase 5: Quality & Publishing (Ongoing)
1. Add Vitest config + tests to each package (>80% coverage)
2. Add README, CHANGELOG, TypeDoc generation
3. Configure Changesets for versioning/publishing
4. Add CI pipeline: typecheck -> test -> build -> publish
5. Document import patterns and contribution guide

---

## File Structure Target

```
packages/
+-- types/
|   +-- src/
|   |   +-- index.ts          # Main exports
|   |   +-- domain.ts         # Core domain types
|   |   +-- auth.ts           # Auth types
|   |   +-- api.ts            # API request/response types
|   |   +-- branded.ts        # Branded types (ISODate, Currency, etc.)
|   +-- tsconfig.json
|   +-- package.json
|   +-- README.md
|   +-- vitest.config.ts
+-- validation/
|   +-- src/
|   |   +-- index.ts
|   |   +-- auth.ts
|   |   +-- property.ts
|   |   +-- booking.ts
|   |   +-- owner.ts
|   +-- tsconfig.json
|   +-- package.json
|   +-- README.md
|   +-- vitest.config.ts
+-- api-client/
|   +-- src/
|   |   +-- index.ts          # Re-exports
|   |   +-- client.ts         # Core fetch wrapper
|   |   +-- errors.ts         # ApiError class
|   |   +-- hooks.ts          # React Query hooks
|   |   +-- queryKeys.ts      # Query key factories
|   +-- tsconfig.json
|   +-- package.json
|   +-- README.md
|   +-- vitest.config.ts
+-- theme/
|   +-- src/
|   |   +-- index.ts          # Token object + types
|   |   +-- tokens.ts         # Raw token values
|   |   +-- css.ts            # CSS custom properties generator
|   |   +-- types.ts          # ThemeTokens interface
|   +-- tsconfig.json
|   +-- package.json
|   +-- README.md
|   +-- vitest.config.ts
+-- ui/
    +-- src/
    |   +-- index.ts
    |   +-- components/       # Primitive components
    |   +-- hooks/            # Shared hooks
    |   +-- utils/            # cn, portal, etc.
    +-- tsconfig.json
    +-- package.json
    +-- README.md
    +-- vitest.config.ts
```

---

## Conclusion

The shared packages are **not production-ready**. They serve as minimal scaffolds but lack:

1. **Build system** - No compilation, no distributable output
2. **Type completeness** - Missing API contracts, error types, branded primitives
3. **Validation coverage** - Only 2/10+ request schemas
4. **API client utility** - No React Query, weak errors, duplicated types
5. **Design system** - Theme has 3 colors; UI has 0 components
6. **Quality gates** - No tests, no docs, no independent type-checking
7. **Publishing readiness** - All private, no versioning, no exports field

**Priority:** Fix @patana/types and @patana/api-client first (consumed by both apps). Then decide on @patana/ui fate. Build out @patana/validation and @patana/theme in parallel.

---

*Report generated by automated audit. Review findings with team before implementation.*
