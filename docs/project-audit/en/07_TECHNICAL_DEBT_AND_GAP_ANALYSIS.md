# 07 — TECHNICAL DEBT & GAP ANALYSIS REGISTER
## Exhaustive Registry of Architectural Flaws, Technical Debt, and Missing Capabilities

---

## 1. TECHNICAL DEBT SEVERITY MATRIX

| Debt ID | Category | Title & Summary | Severity | Blast Radius | Est. Remediation | Phase |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **DEBT-001** | Architecture | **Unmerged Git Branches (Frontend vs Backend Monorepo Split)** | `P0 - Blocker` | Repository-wide | 2-3 Days | PHASE-001 |
| **DEBT-002** | Security | **Sales Agent Lead Scoping Bug (Test Failure ITEM-08)** | `P0 - Critical` | Data Privacy | 1 Day | PHASE-003/009 |
| **DEBT-003** | Product Gap | **9 Completely Missing Frontend Pages from PDF Specification** | `P1 - High` | 31% of Product | 8 Days | PHASE-011/013 |
| **DEBT-004** | Architecture | **Missing Mandated Tech Stack Packages in `apps/web`** | `P1 - High` | Frontend-wide | 3 Days | PHASE-002 |
| **DEBT-005** | Reliability | **Dual-Layer LocalStorage Mock Fallback Anti-Pattern** | `P1 - High` | Data Integrity | 4 Days | PHASE-002–010 |
| **DEBT-006** | Type Safety | **`packages/shared` Missing 85% of Domain Entity Types** | `P1 - High` | Full Monorepo | 2 Days | PHASE-001 |
| **DEBT-007** | DevOps | **Absence of Standard Automated CI/CD Test Runner** | `P2 - Medium` | Deployment | 2 Days | PHASE-014 |
| **DEBT-008** | UX / Access | **Lack of Accessible Keyboard Drag-and-Drop in Kanban** | `P2 - Medium` | Accessibility | 2 Days | PHASE-009/010 |
| **DEBT-009** | Architecture | **Absence of Server-Side Background Task Processing (BullMQ)** | `P2 - Medium` | Performance | 3 Days | PHASE-008 |

---

## 2. DEEP DIVE INTO CRITICAL DEBTS & AUDIT EVIDENCE

### 2.1 DEBT-001: The Unmerged Git Branches
- **Forensic Evidence**:
  - `git branch -a` shows `feature/frontend-foundation` (commit `094df4b`) and `feature/backend-foundation` (commit `4a53906`) both branched from scaffold commit `9f5b8d7`.
  - In `zero_vapor_blasts_11h11` (frontend branch), `apps/api` contains only 1 TypeORM module (`campaigns`).
  - In `marketing-platform-backend` (backend branch), `apps/api` contains 16 NestJS modules with Prisma ORM and 48 relational models.
- **Root Cause**: Two teams or parallel tasks worked independently without continuous integration into `main`.
- **Remediation Plan**: Merge `feature/backend-foundation` into the active worktree, standardize database tooling on Prisma 5.22, and remove the obsolete TypeORM files.

### 2.2 DEBT-002: Sales Agent Lead Data Leakage (Test ITEM-08)
- **Forensic Evidence**: Execution of `node apps/web/scripts/test-permissions-matrix.mjs` resulted in:
  ```
  ✖ [FAIL] [ITEM-08] Sales agent cannot fetch or view leads of other users;
                     data ownership is strictly enforced at service layer
  ```
- **Code Inspection**: In `apps/web/src/features/leads/utils/lead-storage.ts`, `getAll(filters)` only filters by `assignedToId` if explicitly passed in `filters`. If a sales agent navigates to `/leads` without query params, the mock service returns ALL organizational leads, violating Section 3.2 (Page 14) of the PDF:
  > "نقش‌ها: کارشناس فروش (فقط لیدهای خود)، مدیر"
- **Remediation Plan**: Enforce user ID scoping directly within the backend NestJS service layer (`where: { assignedToId: user.id }` for `sales_agent`) and replicate this constraint in the frontend service adapter.

### 2.3 DEBT-003: 9 Completely Missing Frontend Pages
- **Forensic Evidence**: Recursive inspection of `apps/web/src/app` confirmed that the following routes do not exist:
  1. `/notifications` (PDF Page 3)
  2. `/work/calendar` (PDF Page 20)
  3. `/work/equipment` (PDF Page 21)
  4. `/work/meetings` (PDF Page 22)
  5. `/work/sops` (PDF Page 23)
  6. `/work/learning` (PDF Page 24)
  7. `/work/ideas` (PDF Page 25)
  8. `/work/activity` (PDF Page 26)
  9. `/settings/wordpress` (PDF Page 29)
- **Remediation Plan**: Construct the dedicated pages, layouts, and feature folders in `PHASE-011` and `PHASE-013`.

### 2.4 DEBT-004: Missing Mandated Tech Stack Packages
- **Forensic Evidence**: `apps/web/package.json` contains:
  ```json
  "dependencies": {
    "next": "14.2.3",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@gapji/shared": "file:../../packages/shared",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.2",
    "lucide-react": "^0.365.0",
    "axios": "^1.6.8",
    "date-fns": "^3.6.0"
  }
  ```
  The following mandated libraries (PDF Pages 26-29) are completely absent:
  - `@tanstack/react-query` (Server state management & invalidation)
  - `@tanstack/react-form` (Dynamic array form handling)
  - `zod` (Validation schemas & input normalization)
  - `zustand` (Client session & UI state management)
  - `@dnd-kit/core` & `@dnd-kit/sortable` (Kanban drag-and-drop)
  - `framer-motion` (Accessible transitions)
  - `recharts` (Accessible charts)
- **Remediation Plan**: Install and configure these libraries in `PHASE-002`.

### 2.5 DEBT-005: Dual-Layer Mock Storage Anti-Pattern
- **Forensic Evidence**:
  - `lead-storage.ts`, `costs.storage.ts`, `task-storage.ts`, and `users.storage.ts` utilize browser `localStorage` and global memory arrays.
  - Multi-user scenarios, concurrent updates, and cross-browser synchronization are impossible.
- **Remediation Plan**: Replace mock storage calls with `useQuery` and `useMutation` hooks calling real NestJS endpoints backed by PostgreSQL.
