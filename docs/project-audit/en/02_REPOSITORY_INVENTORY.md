# 02 — REPOSITORY INVENTORY & ASSET CLASSIFICATION
## Comprehensive Codebase Catalog and Resource Inventory

---

## 1. REPOSITORY STRUCTURE & WORKSPACE OVERVIEW

The repository is structured as a **pnpm Monorepo** managed via `pnpm-workspace.yaml`.

```
<root>/
├── apps/
│   ├── api/                 # NestJS Backend Application
│   └── web/                 # Next.js 14 Frontend Application
├── packages/
│   └── shared/              # Shared TypeScript contracts and DTOs
├── audit-reports/           # Legacy forensic audit reports (HTML & PDF)
├── docs/                    # Dedicated Audit Documentation Directory (project-audit)
├── docker-compose.yml       # PostgreSQL 15 container definition
├── pnpm-workspace.yaml      # Monorepo workspace configuration
├── package.json             # Root scripts and workspace orchestration
├── tsconfig.json            # Monorepo base TypeScript configuration
└── marketing-platform-phase1-frontend-pages-1.pdf # Product Specification PDF
```

---

## 2. ROOT & CONFIGURATION ARTIFACTS

| File Path | Category | Purpose | Status | Audit Findings & Notes |
| :--- | :--- | :--- | :---: | :--- |
| `package.json` | Manifest | Root workspace scripts and dependencies | Valid | Configures `dev`, `build`, `start`, `db:up`, `db:down`. Uses `pnpm@9.15.4`. |
| `pnpm-lock.yaml` | Lockfile | Dependency lockfile for workspace | Valid | Resolves dependencies across root, api, web, and shared. |
| `pnpm-workspace.yaml` | Monorepo | Declares `apps/*` and `packages/*` workspaces | Valid | Correctly links `apps/api`, `apps/web`, and `packages/shared`. |
| `docker-compose.yml` | Infrastructure| Runs PostgreSQL 15 container | Valid | Exposes port 5432, mounts persistent volume `gapji_postgres_data`. |
| `.env.example` | Configuration | Environment variables template | Valid | Safe template with default database credentials and JWT placeholder. |
| `.gitignore` | Git | Exclusion patterns for monorepo | Valid | Properly ignores `node_modules`, `.next`, `dist`, `.env`. |
| `tsconfig.json` | Compiler | Monorepo base TypeScript compiler options | Valid | Target ES2022, module NodeNext, strict mode enabled. |
| `marketing-platform-phase1-frontend-pages-1.pdf` | Specification | Official 29-page Product Specification | Valid | The primary source of truth for all requirements and layouts. |
| `audit-reports/GAPJI_FULL_PROJECT_AUDIT_B2.5.0.html` | Legacy Report | Previous forensic audit report | Historical | Documented B2.5.0 audit state and 47 Prisma models. |

---

## 3. SHARED PACKAGE (`packages/shared`)

| File Path | Purpose | Completeness | Deficiencies & Gaps |
| :--- | :--- | :---: | :--- |
| `package.json` | Defines `@gapji/shared` workspace package | 100% | Properly configured for internal monorepo consumption. |
| `tsconfig.json` | Shared TypeScript configuration | 100% | Emits declarations to `dist/`. |
| `src/index.ts` | Shared domain interfaces and endpoints | 15% | **Severe Gap**: Contains only `Campaign`, `CampaignStats`, `CampaignStatus`, and `CreateCampaignDto`. Completely lacks types for Users, Leads, Costs, Tasks, Audiences, UTMs, Webinars, etc. |

---

## 4. BACKEND APPLICATION (`apps/api`) — CURRENT WORKTREE vs BACKEND BRANCH

### 4.1 Current Worktree State (`apps/api/src/`)
| File Path | Category | Purpose | Status |
| :--- | :--- | :--- | :---: |
| `package.json` | Manifest | NestJS 10, TypeORM, Swagger, PostgreSQL | Outdated (uses TypeORM) |
| `src/main.ts` | Entry Point | Bootstraps NestJS, Swagger docs at `/docs`, CORS, global pipes | Minimal |
| `src/app.module.ts` | Core Module | Imports Config, TypeORM, CampaignsModule, DatabaseModule | Single Module |
| `src/config/configuration.ts` | Config | Maps environment variables to configuration object | Valid |
| `src/config/env.validation.ts` | Config | Validates environment variables on startup | Valid |
| `src/database/database.module.ts`| Database | Configures TypeORM database connection | Bare |
| `src/modules/campaigns/*` (6 files) | Feature Module | Campaigns controller, service, entity, DTOs | Single entity only |

### 4.2 Backend Branch State (`feature/backend-foundation` in `F:/marketing-platform-backend`)
| Module Directory | Files Count | Key Capabilities & Controllers |
| :--- | :---: | :--- |
| `prisma/schema.prisma` | 1 File | **48 Models**: Multi-tenancy, Auth, Campaigns, Leads, Costs, Tasks, Webinars, etc. |
| `src/modules/auth/` | 12 Files | Local login, JWT refresh token, HttpOnly cookie handling, Argon2 password hashing |
| `src/modules/campaigns/` | 8 Files | Campaign CRUD, platform allocations, health metric calculation |
| `src/modules/leads/` | 10 Files | Leads inbox, status transition, timeline activity tracking, lost reasons |
| `src/modules/costs/` | 8 Files | Cost entries, category attribution, bulk import |
| `src/modules/dashboard/` | 6 Files | Executive KPI aggregation, funnel conversion calculations |
| `src/modules/tasks/` | 7 Files | Task CRUD, Kanban status moves, assignee scoping |
| `src/modules/users/` | 8 Files | User invitation, role management, 6-role permission matrix |
| `src/modules/organization/` | 7 Files | Multi-tenant organization settings, taxonomy customization |
| `src/modules/platforms/` | 5 Files | Ad platform catalog, integration credentials |
| `src/modules/audiences/` | 5 Files | Target audience personas, demographic tagging |
| `src/modules/landing/` | 6 Files | Landing page tracking, UTM link generator |
| `src/modules/imports/` | 7 Files | CSV/XLSX data import job tracking, row parsing |
| `src/modules/kpis/` | 6 Files | KPI definitions, custom alert threshold rules |
| `src/modules/sms/` | 6 Files | SMS campaign dispatches, recipient delivery logs |
| `src/modules/webinars/` | 6 Files | Webinar events, attendee tracking, lead conversion |
| `src/modules/calendar/` | 5 Files | Calendar events, campaign timeline bindings |

---

## 5. FRONTEND APPLICATION (`apps/web`)

### 5.1 Route Inventory (`apps/web/src/app/`)
| Route Path | Type | Target Module | Implemented? | Notes |
| :--- | :--- | :--- | :---: | :--- |
| `app/layout.tsx` | Layout | Root Layout | Yes | Configures Vazirmatn font, RTL dir, AuthProvider |
| `app/globals.css` | Styles | Tailwind Design Tokens | Yes | Custom CSS variables and Iranian font styles |
| `app/(auth)/layout.tsx` | Layout | Auth Layout | Yes | Centered card, no sidebar |
| `app/(auth)/login/page.tsx` | Page | Login Page | Yes | Email/mobile + password, inline error |
| `app/(auth)/forgot-password/page.tsx`| Page | Forgot Password | Yes | Dispatches mock SMS / Email recovery |
| `app/(auth)/select-org/page.tsx` | Page | Org Selection | Yes | Organization cards with user roles |
| `app/(app)/layout.tsx` | Layout | App Shell Layout | Yes | Header, Sidebar, Breadcrumb, Toast container |
| `app/(app)/page.tsx` | Page | Role-Based Home | Yes | 12-column widget grid per active role |
| `app/(app)/campaigns/page.tsx` | Page | Campaigns List | Yes | DataTable with budget bar and filters |
| `app/(app)/campaigns/new/page.tsx` | Page | Create Campaign | Yes | 6-step creation wizard |
| `app/(app)/campaigns/[id]/page.tsx` | Page | Campaign Details | Yes | 8-tab comprehensive detail view |
| `app/(app)/campaigns/[id]/edit/page.tsx`| Page | Edit Campaign | Yes | Re-uses 6-step wizard with prefilled data |
| `app/(app)/performance/dashboard/page.tsx`| Page | Executive Dashboard | Yes | 6 KPI cards, trend charts, funnel |
| `app/(app)/performance/platforms/page.tsx`| Page | Ad Platforms | Yes | Platforms table and drawer editor |
| `app/(app)/performance/costs/page.tsx` | Page | Costs Management | Yes | Summary bar, costs table, quick/bulk modal |
| `app/(app)/performance/imports/page.tsx` | Page | Data Imports | Yes | Import history table and 4-step wizard modal |
| `app/(app)/performance/kpis/page.tsx` | Page | KPIs & Rules | Yes | 3 tabs: KPIs, Metrics, Alert rules |
| `app/(app)/performance/audiences/page.tsx`| Page | Audiences List | Yes | Cards/table grid with persona tags |
| `app/(app)/performance/audiences/[id]/page.tsx`| Page | Audience Detail | Yes | Linked campaigns and demographic specs |
| `app/(app)/performance/landing/page.tsx` | Page | Landing & UTM | Yes | Landing pages table and live UTM builder |
| `app/(app)/leads/page.tsx` | Page | Leads Inbox | Yes | DataTable, bulk action bar, phone copy |
| `app/(app)/leads/board/page.tsx` | Page | Lead Kanban | Yes | 6-column pipeline board with modals |
| `app/(app)/leads/[id]/page.tsx` | Page | Lead Details | Yes | Profile card, call form, journey timeline |
| `app/(app)/leads/sms/page.tsx` | Page | SMS Dispatches | Yes | SMS dispatches list |
| `app/(app)/leads/sms/[id]/page.tsx` | Page | SMS Detail | Yes | Recipient logs with masked phone numbers |
| `app/(app)/leads/webinars/page.tsx` | Page | Webinars List | Yes | Webinar event cards and creation drawer |
| `app/(app)/leads/webinars/[id]/page.tsx` | Page | Webinar Detail | Yes | Attendees table, conversion funnel |
| `app/(app)/work/tasks/page.tsx` | Page | Tasks Management | Yes | List / Kanban toggle, quick add, drawer |
| `app/(app)/settings/users/page.tsx` | Page | Users & Roles | Yes | User table and 29-page access matrix |
| `app/(app)/settings/organization/page.tsx`| Page | Org Settings | Yes | Multi-tab taxonomy management |
| `app/(app)/notifications/page.tsx` | Page | Notification Center | **NO** | Missing (Page 3 of PDF) |
| `app/(app)/work/calendar/page.tsx` | Page | Calendar Grid | **NO** | Missing (Page 20 of PDF) |
| `app/(app)/work/equipment/page.tsx` | Page | Equipment Logistics | **NO** | Missing (Page 21 of PDF) |
| `app/(app)/work/meetings/page.tsx` | Page | Meeting Minutes | **NO** | Missing (Page 22 of PDF) |
| `app/(app)/work/sops/page.tsx` | Page | SOP Knowledge Base | **NO** | Missing (Page 23 of PDF) |
| `app/(app)/work/learning/page.tsx` | Page | Team Learning | **NO** | Missing (Page 24 of PDF) |
| `app/(app)/work/ideas/page.tsx` | Page | Ideas Board | **NO** | Missing (Page 25 of PDF) |
| `app/(app)/work/activity/page.tsx` | Page | Activity Log | **NO** | Missing (Page 26 of PDF) |
| `app/(app)/settings/wordpress/page.tsx`| Page | WordPress Integration| **NO** | Missing (Page 29 of PDF) |

---

## 6. TEST & VERIFICATION SCRIPTS INVENTORY (`apps/web/scripts/`)

The repository contains **37 standalone diagnostic scripts** in `apps/web/scripts/`:
- **33 `test-*.mjs` scripts**: Evaluate component logic, data services, permissions, Shamsi calendar math, and formatting rules.
- **4 `verify-*.js` scripts**: Perform end-to-end simulated scenarios (auth, campaign creation, costs, dashboard, kanban).
- **Execution Summary**: 28 passed, 9 failed. Every failure was isolated and documented in `07_TECHNICAL_DEBT_AND_GAP_ANALYSIS.md`.
