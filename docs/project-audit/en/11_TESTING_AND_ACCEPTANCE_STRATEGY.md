# 11 — TESTING & QUALITY ASSURANCE STRATEGY
## Automated Test Framework Architecture, Verification Results, and Regression Governance

---

## 1. TESTING PYRAMID & QUALITY ASSURANCE STRATEGY

The Gapji platform requires a comprehensive, multi-tiered testing strategy spanning unit, integration, visual regression, and end-to-end automated validation:

```
                  / \
                 /   \
                / E2E \       Playwright (Critical User Journeys across 29 Pages)
               /-------\
              /  Integ  \     Supertest + Prisma Test DB (NestJS APIs & Webhooks)
             /-----------\
            /  Component  \   React Testing Library (RTL, Forms, Modals, Drawers)
           /---------------\
          /   Unit Tests    \ Vitest / Jest (Jalali Dates, Formats, RBAC Matrix)
         +-------------------+
```

---

## 2. EXISTING 37 VERIFICATION SCRIPTS AUDIT

A complete, non-destructive automated execution of all 37 diagnostic scripts in `apps/web/scripts/` was conducted during this audit:

### 2.1 The 28 Passing Verification Scripts (75.7%)
- `test-costs-components-10g4.mjs`: Validated money input parsing and cost category selector.
- `test-costs-data-layer-10g3.mjs`: Validated cost aggregations and platform spend calculations.
- `test-costs-page-10g5.mjs`: Validated single cost entry and table filtering.
- `test-data-table.mjs` & `test-data-table-advanced.mjs`: Validated column sorting, visibility toggles, and multi-row selection.
- `test-filter-service.mjs`: Validated all 11 search, date range, and status filter combinations.
- `test-integration-10d62d.mjs`: Validated basic campaign and dashboard mock bindings.
- `test-lead-board-10e4.mjs`: Validated 6-stage lead Kanban columns and deal value aggregations.
- `test-lead-inbox-10e3.mjs`: Validated leads table, bulk status updates, and phone copy action.
- `test-lead-management-integration-10e5.mjs`: Validated lead lifecycle from creation to qualification.
- `test-lead-service-10e2.mjs`: Validated lead CRUD operations in mock storage.
- `test-lead-timeline-integration.mjs`: Validated chronological event mapping on lead journey.
- `test-organization-components-10h2c.mjs`, `test-organization-data-layer-10h2b.mjs`, `test-organization-page-10h2d.mjs`, `test-organization-review-10h2d.mjs`: Validated taxonomy ordering and disable-only protections.
- `test-persian-date.mjs`: Validated 33-year cycle Jalali leap years, month day counts, and Saturday week start.
- `test-sidebar-darkmode-shadcn-iransans.mjs`: Validated sidebar navigation collapse and RBAC menu filtering.
- `test-task-components-10f3.mjs`, `test-task-hardening-10f6.mjs`, `test-task-kanban-10f5.mjs`, `test-task-page-integration-10f4.mjs`, `test-task-service-10f2.mjs`: Validated task grouping, subtasks, quick add, and Kanban.
- `test-timeline.mjs`: Validated timeline rendering and icon mapping.
- `test-users-data-layer-10h1b.mjs` & `test-users-page-10h1d.mjs`: Validated user table rendering and role editing.
- `verify-cost-management.js` & `verify-kanban-lifecycle.js`: Validated end-to-end simulated flows.

### 2.2 The 9 Failing Scripts & Forensic Diagnostics
1. **`test-auth-p0-1.mjs` (Fails SCEN-18)**:
   - *Failure*: `✖ [FAIL] [SCEN-18] Header is connected to useAuth with dynamic org name, logout, and org switcher`
   - *Cause*: Header component contains fallback to static organization string instead of consuming `activeOrgName` from `useAuth()`.
   - *Fix*: Bind directly to `useAuth().activeOrgName`.
2. **`test-permissions-matrix.mjs` (Fails ITEM-08)**:
   - *Failure*: `✖ [FAIL] [ITEM-08] Sales agent cannot fetch or view leads of other users; data ownership is strictly enforced at service layer`
   - *Cause*: Mock service `lead-storage.ts` returns all leads when `assignedToId` is omitted.
   - *Fix*: Enforce user scoping on the server in `leads.service.ts` for sales agents.
3. **`test-permissions-hardening-gap01-gap03.mjs`**:
   - *Failure*: Assertions expecting strict backend rejection on unauthorized mutation.
   - *Fix*: Implement backend NestJS Guards (`@Roles('admin', 'marketing_manager')`).
4. **`test-costs-dashboard-integration-10g6.mjs` & `test-dashboard-10g1.mjs`**:
   - *Failure*: Mismatched KPI delta field naming (`budgetConsumedPercentage` vs `spendPercentage`).
   - *Fix*: Standardize contract in `@gapji/shared`.
5. **`test-home-dashboard-conflict-resolution.mjs`**:
   - *Failure*: Route ambiguity between `/` and `/performance/dashboard`.
   - *Fix*: Keep `/` as the role-based home and `/performance/dashboard` as the executive view.
6. **`test-users-components-10h1c.mjs`**:
   - *Failure*: Role change modal assertion failure on multi-tenant membership array.
   - *Fix*: Align membership schema with Prisma `OrganizationMembership`.
7. **`verify-campaign-creation.js` (Fails 16 assertions)**:
   - *Failure*: HTTP 400 Bad Request on `POST /api/campaigns`.
   - *Cause*: Frontend sends complex nested allocations array; backend expects flat DTO.
   - *Fix*: Update `create-campaign.dto.ts` to accept nested allocations.
8. **`verify-dashboard.js` (Fails 4 assertions)**:
   - *Failure*: Missing `leadConversionRate`, `budgetConsumedPercentage`, and channel breakdowns.
   - *Fix*: Populate these calculated fields in `dashboard.service.ts`.

---

## 3. IRANIAN LOCALIZATION & EDGE CASE TEST SUITE

The following edge case suites must be automated before production sign-off:

1. **Jalali Calendar Boundary Testing**:
   - Transitions between Esfand 29 / 30 and Farvardin 1 across leap years (1399, 1403, 1408).
   - Date range queries spanning solar month boundaries.
2. **Persian & Arabic Digit Input Normalization**:
   - Ingestion of mixed digits (`۰۱۲۳۴۵۶۷۸۹` and `٠١٢٣٤٥٦٧٨٩`) into numeric and currency inputs.
   - Comma stripping from currency inputs (`۱۲٬۵۰۰٬۰۰۰` -> `12500000`).
3. **Iranian Mobile Number Hygiene**:
   - Formats `09121234567`, `+989121234567`, `00989121234567`, and `9121234567` must all normalize cleanly to `09121234567`.
   - Rejection of invalid Iranian operator prefixes (e.g. `0900`, `0940`).
4. **Division by Zero Protection**:
   - When impressions or clicks are 0, CPL, CTR, and CPC must return `—` em-dash, never `0` or `NaN`.
