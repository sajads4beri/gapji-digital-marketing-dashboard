# 11 — Testing and Acceptance Strategy
## Gapji Digital Marketing Platform Deep Audit

---

## 1. Testing Philosophy & Verification Levels

The testing strategy follows the **Testing Pyramid**, prioritizing fast, deterministic unit tests and contract validations at the base, supported by isolated integration tests, component visual verifications, and automated end-to-end user journey validations.

```mermaid
graph BT
    subgraph Pyramid["Verification Levels"]
        E2E["Level 4: End-to-End Workflows (Playwright)"]
        Integration["Level 3: Backend API Integration Tests (NestJS + Supertest)"]
        Component["Level 2: Frontend Component Tests (React Testing Library)"]
        Unit["Level 1: Unit & Contract Tests (Node.js / ts-node / assert)"]
    end

    Unit --> Component
    Component --> Integration
    Integration --> E2E
```

---

## 2. Testing Levels & Tooling Registry

| Testing Level | Primary Tooling | Target Scope | Execution Environment | Gating Policy |
| :--- | :--- | :--- | :--- | :--- |
| **Level 1: Unit Tests** | `ts-node`, `node:assert`, Jest | Date algorithms, formulas, DTO transformations, pure functions | In-memory, zero DB required | **Mandatory on every commit** (100% pass) |
| **Level 2: Component Tests** | React Testing Library, Vitest | Common primitives (DataTable, FilterBar, KpiCard, Wizard) | Virtual DOM (jsdom) | **Mandatory on PR** |
| **Level 3: API Integration** | NestJS Testing, Supertest | Controller routing, validation pipes, Prisma transactions | Isolated PostgreSQL test container | **Mandatory on PR** |
| **Level 4: Security & RBAC** | Standalone verification scripts | Permissions matrix, data ownership, token rotation | Sandboxed test database | **Mandatory before release** |
| **Level 5: End-to-End (E2E)**| Playwright | Critical user journeys (Login -> Campaign -> Cost -> Lead) | Headless Chromium browser | **Mandatory before release** |

---

## 3. Existing Test Suites & Execution Instructions

The project currently contains **38 verification scripts** in `apps/web/scripts` and **21 integration spec files** in `apps/api/src/modules/`.

### Verified Non-Destructive In-Memory Tests:
These test suites can be safely executed in any environment without database mutation:

```bash
# 1. Jalali Calendar & Leap Year Engine (11,323 days verification)
node apps/web/scripts/test-persian-date.mjs

# 2. PDF Roles & Permissions Matrix Verification (18 verification items)
node apps/web/scripts/test-permissions-matrix.mjs

# 3. Lead CRM Hardening & Canonical Sales Agent Ownership (11 scenarios)
node apps/web/scripts/test-permissions-hardening-gap01-gap03.mjs

# 4. Sidebar, Navigation, Pure Light Mode & shadcn/ui Conformance
node apps/web/scripts/test-sidebar-darkmode-shadcn-iransans.mjs

# 5. FilterBar Bidirectional Query Persistence & Date Ranges
node apps/web/scripts/test-filter-service.mjs

# 6. DataTable Sorting, Server Pagination, & Density Modes
node apps/web/scripts/test-data-table.mjs

# 7. Backend CampaignsService Unit Tests (Mock Prisma)
pnpm --filter @gapji/api test
```

---

## 4. Test Environment Isolation & Database Reset Policy

To safely run the 21 backend integration specs (`*.integration.spec.ts`) without corrupting development or production data:

1. **Dedicated Test Database:**
   Integration tests must connect to a separate test database configured via `DATABASE_URL_TEST`:
   `postgresql://postgres:postgres@localhost:5432/gapji_marketing_test`
2. **Automated Migration & Seed Harness:**
   Before executing the integration suite, the test harness automatically executes:
   ```bash
   pnpm --filter @gapji/api prisma migrate reset --force --skip-seed
   pnpm --filter @gapji/api ts-node prisma/seed.ts
   ```
3. **Transactional Rollback:**
   Each test suite wraps its mutations in a PostgreSQL transaction that is rolled back upon completion (`ROLLBACK`), ensuring zero data leakage between test runs.

---

## 5. Quality Gates for CI/CD Pipeline

To maintain 100% technical and architectural integrity, the CI/CD pipeline enforces the following four sequential quality gates:

```mermaid
flowchart LR
    G1["Gate 1: Static Analysis<br/>(ESLint & TypeScript)"] --> G2["Gate 2: Unit Tests<br/>(Pure functions & Dates)"]
    G2 --> G3["Gate 3: Integration Tests<br/>(API & RBAC Matrix)"]
    G3 --> G4["Gate 4: Production Build<br/>(Next.js & NestJS Build)"]
```

1. **Gate 1: Static Analysis:** `pnpm lint` and `pnpm tsc --noEmit` must complete with 0 errors and 0 warnings.
2. **Gate 2: Unit Tests:** 100% of unit tests in `apps/api` and `apps/web` must pass.
3. **Gate 3: Integration Tests:** Database integration specs must pass against the isolated test database.
4. **Gate 4: Production Build:** `pnpm build` must compile `@gapji/shared`, `@gapji/api`, and `@gapji/web` cleanly.
