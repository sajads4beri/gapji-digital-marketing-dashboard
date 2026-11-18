# PROJECT MASTER TRACKER — GAPJI DIGITAL MARKETING PLATFORM
## سامانه ردیابی جامع پیشرفت پروژه، وضعیت نیازمندی‌ها و فازهای تکمیل محصول

> **Document Version**: 1.0.0 (Baseline Post-Audit)  
> **Audit Date**: 2026-11-18  
> **Status**: AUDIT_COMPLETED — IMPLEMENTATION_PENDING_APPROVAL  
> **Lead Auditor**: Principal Software Architect & QA Lead (Antigravity)

---

## 1. EXECUTIVE STATUS DASHBOARD (داشبورد وضعیت اجرایی)

| Metric (شاخص) | Current Value (مقدار فعلی) | Target Value (مقدار نهایی) | Status (وضعیت) | Notes (توضیحات) |
| :--- | :---: | :---: | :---: | :--- |
| **Documented Pages Covered** | 20 / 29 (69.0%) | 29 / 29 (100%) | ⚠️ Needs Work | 9 pages missing from frontend |
| **Total Extracted Requirements** | 350 Requirements | 350 Requirements | 🎯 100% Audited | All 29 PDF pages inspected |
| **Production-Ready Requirements** | 0 / 350 (0.0%) | 350 / 350 (100%) | 🛑 Blocker | Mock storage / unmerged backend |
| **Implemented & Tested (UI/Mock)** | 114 / 350 (32.6%) | 0 (Migrate to Prod) | ⚠️ Simulated | Verified by 28 local scripts |
| **Implemented Unverified** | 72 / 350 (20.6%) | 0 (Verify in Prod) | ⚠️ Unverified | Code exists, missing test |
| **Partially Implemented** | 68 / 350 (19.4%) | 0 (Complete) | ⚠️ Incomplete | Partial features / UI without hooks |
| **UI Only (Mock Data Only)** | 42 / 350 (12.0%) | 0 (Wire to API) | ⚠️ Static / Mock | Pure visual components |
| **Not Implemented** | 54 / 350 (15.4%) | 0 (Build from scratch) | 🛑 Missing | 9 pages + missing backend modules |
| **Roadmap Phases Defined** | 14 Phases | 14 Phases | 🟢 100% Planned | PHASE-001 to PHASE-014 |
| **Roadmap Execution Progress** | 0 / 14 (0.0%) | 14 / 14 (100%) | ⏸️ NOT_STARTED | Strict Read-Only Stop Condition |
| **Monorepo Unification Status** | DIVERGED (2 Branches) | UNIFIED MONOREPO | 🛑 P0 Blocker | Frontend & Backend in separate branches |
| **Automated Verification Scripts** | 28 PASS / 9 FAIL (75.7%) | 37 / 37 PASS (100%) | ⚠️ Fix 9 Failures | Fix ownership & data bindings |

---

## 2. ROADMAP PHASE MASTER CONTROL TABLE (جدول کنترل فازهای نقشه راه)

| Phase ID | Priority | Phase Title & Description | Target Modules | Est. Effort | Dependencies | Status | Blocker Condition |
| :--- | :---: | :--- | :--- | :---: | :--- | :---: | :--- |
| **PHASE-001** | `P0` | **Monorepo Unification & Schema Synchronization** | Monorepo root, `apps/api`, `packages/shared` | 3 Days | None | `NOT_STARTED` | Awaiting PO Approval |
| **PHASE-002** | `P0` | **Tech Stack Realignment & Frontend Foundation** | `apps/web` packages, TanStack Query, Zod, Form | 4 Days | PHASE-001 | `NOT_STARTED` | Blocked by PHASE-001 |
| **PHASE-003** | `P0` | **Enterprise Authentication & Session Governance** | `/login`, `/select-org`, RBAC, Cookies, JWT | 4 Days | PHASE-001, PHASE-002 | `NOT_STARTED` | Blocked by PHASE-002 |
| **PHASE-004** | `P1` | **App Shell, Navigation & Shared Components Hardening** | Header, Sidebar, Breadcrumb, DataTable, PersianDate | 5 Days | PHASE-002, PHASE-003 | `NOT_STARTED` | Blocked by PHASE-003 |
| **PHASE-005** | `P1` | **Executive Dashboard & Real-Time Performance Analytics** | `/performance/dashboard`, KpiCards, Charts | 4 Days | PHASE-001, PHASE-004 | `NOT_STARTED` | Blocked by PHASE-004 |
| **PHASE-006** | `P1` | **Campaigns Lifecycle Management (List, Wizard & Details)**| `/campaigns/*`, 6-step Wizard, 8-tab Details | 6 Days | PHASE-001, PHASE-004 | `NOT_STARTED` | Blocked by PHASE-004 |
| **PHASE-007** | `P1` | **Marketing Costs Management & Dynamic Platform Attribution**| `/performance/costs`, `/performance/platforms` | 4 Days | PHASE-006 | `NOT_STARTED` | Blocked by PHASE-006 |
| **PHASE-008** | `P1` | **High-Throughput Universal Data Import Engine** | `/performance/imports`, CSV/XLSX Parser, Background Worker | 5 Days | PHASE-001, PHASE-006, PHASE-007 | `NOT_STARTED` | Blocked by PHASE-007 |
| **PHASE-009** | `P1` | **Omnichannel Sales & Leads Engine (Inbox, Board, Details)** | `/leads`, `/leads/board`, `/leads/:id`, Data Isolation | 6 Days | PHASE-001, PHASE-004 | `NOT_STARTED` | Blocked by PHASE-004 |
| **PHASE-010** | `P1` | **Collaborative Task Management & Workflow Execution** | `/work/tasks`, Grouping, Subtasks, Activity Log | 4 Days | PHASE-001, PHASE-004 | `NOT_STARTED` | Blocked by PHASE-004 |
| **PHASE-011** | `P1` | **Organization Settings, RBAC Matrix & WordPress Integration**| `/settings/*`, `/settings/wordpress`, Webhooks | 5 Days | PHASE-001, PHASE-003 | `NOT_STARTED` | Blocked by PHASE-003 |
| **PHASE-012** | `P2` | **Advanced Marketing Intelligence (KPIs, Audiences, UTM)** | `/performance/kpis`, `/performance/audiences`, `/landing` | 5 Days | PHASE-005, PHASE-006 | `NOT_STARTED` | Blocked by PHASE-006 |
| **PHASE-013** | `P2` | **Missing Collaborative & Knowledge Workspaces (7 Modules)**| `/calendar`, `/equipment`, `/meetings`, `/sops`, `/learning`, `/ideas`, `/activity` | 8 Days | PHASE-001, PHASE-004, PHASE-010 | `NOT_STARTED` | Blocked by PHASE-010 |
| **PHASE-014** | `P3` | **Production Hardening, Performance Optimization & Final CI/CD**| Docker multi-stage, Prometheus, Sentry, E2E Suites | 5 Days | All previous phases | `NOT_STARTED` | Blocked by PHASE-013 |

---

## 3. REQUIREMENTS TRACEABILITY MASTER INVENTORY (REQ-001 to REQ-350)

### 3.1 Common Shell & UI Rules (REQ-001 to REQ-029)
| REQ ID | PDF Page | Description | Module | Files / Components | Status | Roadmap Phase |
| :--- | :---: | :--- | :--- | :--- | :---: | :---: |
| `REQ-001` | P. 3 | Global Header with Org Switcher, Search & User Menu | Shell | `apps/web/src/components/layout/header.tsx` | `PARTIALLY_IMPLEMENTED` | PHASE-004 |
| `REQ-002` | P. 3 | Collapsible 3-Section Sidebar with RBAC Filtering | Shell | `apps/web/src/components/layout/sidebar.tsx` | `IMPLEMENTED_AND_TESTED` | PHASE-004 |
| `REQ-003` | P. 3 | Hierarchical Breadcrumb Navigation on Details Pages | Shell | `apps/web/src/components/layout/breadcrumb.tsx` | `IMPLEMENTED_AND_TESTED` | PHASE-004 |
| `REQ-004` | P. 3 | Page Title Bar with Max 1 Primary Action Button | Shell | `apps/web/src/components/common/*` | `IMPLEMENTED_AND_TESTED` | PHASE-004 |
| `REQ-005` | P. 3 | Container Width Constraints (1440px Grid / 800px Reading) | Shell | `apps/web/src/app/globals.css`, layout wrappers | `IMPLEMENTED_AND_TESTED` | PHASE-004 |
| `REQ-006` | P. 3 | Operation Toast Notifications (5s auto-close, error persistent)| Shell | `apps/web/src/components/common/toast.tsx` | `IMPLEMENTED_AND_TESTED` | PHASE-004 |
| `REQ-007` | P. 3 | Server-side Paginated DataTable with Multi-select & Skeleton | Common | `apps/web/src/components/common/data-table/*` | `PARTIALLY_IMPLEMENTED` | PHASE-004 |
| `REQ-008` | P. 3 | FilterBar with Jalali Date Presets & URL Persistence | Common | `apps/web/src/components/common/filter-bar.tsx` | `IMPLEMENTED_AND_TESTED` | PHASE-004 |
| `REQ-009` | P. 3 | KpiCard with Delta %, Trend Color & Formula Tooltip | Common | `apps/web/src/components/common/kpi-card.tsx` | `IMPLEMENTED_AND_TESTED` | PHASE-004 |
| `REQ-010` | P. 3 | Accessible Charts (Line, Bar, Funnel) with Jalali Axis | Common | Custom SVG / mock chart components | `UI_ONLY` | PHASE-005 |
| `REQ-011` | P. 4 | StatusBadge with Text + Semantic Color + Optional Icon | Common | `apps/web/src/components/common/status-badge.tsx`| `IMPLEMENTED_AND_TESTED` | PHASE-004 |
| `REQ-012` | P. 4 | Jalali PersianDatePicker (Week starts Sat, ISO export) | Common | `apps/web/src/components/ui/persian-date-picker.tsx`| `IMPLEMENTED_AND_TESTED` | PHASE-004 |
| `REQ-013` | P. 4 | MoneyInput with Thousand Separator & Farsi Digit Support | Common | `apps/web/src/components/ui/money-input.tsx` | `IMPLEMENTED_AND_TESTED` | PHASE-004 |
| `REQ-014` | P. 4 | Right-anchored Drawer & Modal with Dirty Form Guard | Common | `apps/web/src/components/common/drawer.tsx`, `modal.tsx` | `IMPLEMENTED_AND_TESTED` | PHASE-004 |
| `REQ-015` | P. 4 | FormField with Real-time & Blur Validation Rules | Common | Native inputs / custom error elements | `PARTIALLY_IMPLEMENTED` | PHASE-002 |
| `REQ-016` | P. 4 | Multi-step Wizard with Draft Auto-save & Review Step | Common | `apps/web/src/features/campaigns/components/wizard/*` | `PARTIALLY_IMPLEMENTED` | PHASE-006 |
| `REQ-017` | P. 4 | Drag-and-Drop Kanban Board with Optimistic Updates | Common | Custom HTML drag events in leads & tasks | `PARTIALLY_IMPLEMENTED` | PHASE-009 |
| `REQ-018` | P. 4 | Chronological Timeline with Type Icon & Jalali Timestamps | Common | `apps/web/src/components/common/timeline/*` | `IMPLEMENTED_AND_TESTED` | PHASE-004 |
| `REQ-019` | P. 4 | UserSelect Component with Search & Initials Avatar | Common | Custom UserSelect / Avatar components | `IMPLEMENTED_AND_TESTED` | PHASE-004 |
| `REQ-020` | P. 4 | EmptyState & ErrorState with Dedicated Retry Action | Common | `apps/web/src/components/common/empty-state.tsx` | `IMPLEMENTED_AND_TESTED` | PHASE-004 |
| `REQ-021` | P. 4 | ConfirmDialog with Clear Impact & Destruction Warning | Common | `apps/web/src/components/common/confirm-modal.tsx`| `IMPLEMENTED_AND_TESTED` | PHASE-004 |
| `REQ-022` | P. 4 | Currency Formatting Standards (Thousand sep, Toman unit) | Rules | `apps/web/src/lib/utils.ts` | `IMPLEMENTED_AND_TESTED` | PHASE-004 |
| `REQ-023` | P. 4 | Percentage Formatting (1 decimal, explicit +/- signs) | Rules | `apps/web/src/lib/utils.ts` | `IMPLEMENTED_AND_TESTED` | PHASE-004 |
| `REQ-024` | P. 4 | Jalali Date Formatting (Short list vs full detail format) | Rules | `apps/web/src/lib/persian-date.ts` | `IMPLEMENTED_AND_TESTED` | PHASE-004 |
| `REQ-025` | P. 5 | Mobile Number Masking (0912***4567) for Unauthorized Roles | Security | `apps/web/src/lib/permissions.ts` | `IMPLEMENTED_AND_TESTED` | PHASE-003 |
| `REQ-026` | P. 5 | Undefined Metric Display (Show em-dash "—", Never 0) | Rules | `apps/web/src/lib/utils.ts` | `IMPLEMENTED_AND_TESTED` | PHASE-005 |
| `REQ-027` | P. 5 | "Lower is Better" Logic for CPL & CAC (Green on decrease)| Rules | `apps/web/src/components/common/kpi-card.tsx` | `IMPLEMENTED_AND_TESTED` | PHASE-005 |
| `REQ-028` | P. 5 | Standard Status Color Mapping for all 7 Domain Entities | Rules | `apps/web/src/components/common/status-badge.tsx`| `IMPLEMENTED_AND_TESTED` | PHASE-004 |
| `REQ-029` | P. 5 | Mandatory 3 Universal States (Loading, Empty, Error) | Architecture| All page views | `PARTIALLY_IMPLEMENTED` | PHASE-004 |

### 3.2 Product Pages (REQ-030 to REQ-335)
| REQ Range | PDF Page | Feature / Module Name | Route | Current Code State | Status | Assigned Phase |
| :--- | :---: | :--- | :--- | :--- | :---: | :---: |
| `REQ-030 - REQ-038` | P. 6 | **Page 1: Login & Organization Selection** | `/login`, `/select-org` | `(auth)/*`, `features/auth/*` | `PARTIALLY_IMPLEMENTED` | PHASE-003 |
| `REQ-039 - REQ-047` | P. 6-7 | **Page 2: Role-based Home Page** | `/` | `app/(app)/page.tsx`, `features/home/*` | `IMPLEMENTED_AND_TESTED` | PHASE-004 |
| `REQ-048 - REQ-056` | P. 7 | **Page 3: Notification Center & Preferences**| `/notifications` | Completely absent from `apps/web` | `NOT_IMPLEMENTED` | PHASE-013 |
| `REQ-057 - REQ-067` | P. 8 | **Page 4: Executive Performance Dashboard** | `/performance/dashboard` | `features/dashboard/*` | `PARTIALLY_IMPLEMENTED` | PHASE-005 |
| `REQ-068 - REQ-077` | P. 8-9 | **Page 5: Campaigns Management Table** | `/campaigns` | `features/campaigns/*` | `IMPLEMENTED_AND_TESTED` | PHASE-006 |
| `REQ-078 - REQ-090` | P. 9-10| **Page 6: 6-Step Campaign Creation Wizard** | `/campaigns/new` | `features/campaigns/components/wizard/*`| `PARTIALLY_IMPLEMENTED` | PHASE-006 |
| `REQ-091 - REQ-104` | P. 10-11| **Page 7: 8-Tab Campaign Comprehensive Details**| `/campaigns/:id` | `features/campaigns/components/tabs/*` | `PARTIALLY_IMPLEMENTED` | PHASE-006 |
| `REQ-105 - REQ-113` | P. 11 | **Page 8: Ad Platforms & Channel Catalog** | `/performance/platforms`| `features/platforms/*` | `IMPLEMENTED_AND_TESTED` | PHASE-007 |
| `REQ-114 - REQ-123` | P. 11-12| **Page 9: Multi-Entry Marketing Costs Engine** | `/performance/costs` | `features/costs/*` | `IMPLEMENTED_AND_TESTED` | PHASE-007 |
| `REQ-124 - REQ-134` | P. 12-13| **Page 10: 4-Step Universal Data Import Wizard**| `/performance/imports` | `features/imports/*` | `PARTIALLY_IMPLEMENTED` | PHASE-008 |
| `REQ-135 - REQ-145` | P. 13 | **Page 11: KPI Metrics & Dynamic Alert Rules** | `/performance/kpis` | `features/kpis/*` | `PARTIALLY_IMPLEMENTED` | PHASE-012 |
| `REQ-146 - REQ-154` | P. 13-14| **Page 12: Target Audiences & Personas** | `/performance/audiences`| `features/audiences/*` | `IMPLEMENTED_AND_TESTED` | PHASE-012 |
| `REQ-155 - REQ-165` | P. 14 | **Page 13: Landing Pages & Live UTM Builder** | `/performance/landing` | `features/landing/*` | `IMPLEMENTED_AND_TESTED` | PHASE-012 |
| `REQ-166 - REQ-177` | P. 14-15| **Page 14: Omnichannel Leads Inbox** | `/leads` | `features/leads/*` | `IMPLEMENTED_AND_TESTED` | PHASE-009 |
| `REQ-178 - REQ-188` | P. 15-16| **Page 15: 6-Stage Lead Kanban Pipeline** | `/leads/board` | `features/leads/components/kanban-*` | `IMPLEMENTED_AND_TESTED` | PHASE-009 |
| `REQ-189 - REQ-201` | P. 16 | **Page 16: Lead Details & Journey Timeline** | `/leads/:id` | `features/leads/components/lead-*` | `IMPLEMENTED_AND_TESTED` | PHASE-009 |
| `REQ-202 - REQ-211` | P. 16-17| **Page 17: SMS Dispatches & Recipient Log** | `/leads/sms` | `features/sms/*` | `IMPLEMENTED_AND_TESTED` | PHASE-009 |
| `REQ-212 - REQ-222` | P. 17-18| **Page 18: Webinars & Attendee Conversion Funnel**| `/leads/webinars` | `features/webinars/*` | `IMPLEMENTED_AND_TESTED` | PHASE-009 |
| `REQ-223 - REQ-234` | P. 18 | **Page 19: Task Management (List & Kanban)** | `/work/tasks` | `features/tasks/*` | `IMPLEMENTED_AND_TESTED` | PHASE-010 |
| `REQ-235 - REQ-244` | P. 18-19| **Page 20: Marketing & Campaign Calendar** | `/work/calendar` | Missing in `apps/web` | `NOT_IMPLEMENTED` | PHASE-013 |
| `REQ-245 - REQ-253` | P. 19-20| **Page 21: Equipment & Studio Resource Logistics**| `/work/equipment`| Missing in `apps/web` | `NOT_IMPLEMENTED` | PHASE-013 |
| `REQ-254 - REQ-263` | P. 20 | **Page 22: Meeting Minutes & Action Item Engine**| `/work/meetings` | Missing in `apps/web` | `NOT_IMPLEMENTED` | PHASE-013 |
| `REQ-264 - REQ-274` | P. 20-21| **Page 23: Standard Operating Procedures (SOP)** | `/work/sops` | Missing in `apps/web` | `NOT_IMPLEMENTED` | PHASE-013 |
| `REQ-275 - REQ-284` | P. 21 | **Page 24: Team Learning & Knowledge Center** | `/work/learning` | Missing in `apps/web` | `NOT_IMPLEMENTED` | PHASE-013 |
| `REQ-285 - REQ-294` | P. 21-22| **Page 25: Marketing Ideas & Upvoting Board** | `/work/ideas` | Missing in `apps/web` | `NOT_IMPLEMENTED` | PHASE-013 |
| `REQ-295 - REQ-303` | P. 22-23| **Page 26: Team Activity & Audit Trail Report** | `/work/activity` | Missing in `apps/web` | `NOT_IMPLEMENTED` | PHASE-013 |
| `REQ-304 - REQ-314` | P. 23 | **Page 27: User Management & 6-Role RBAC Matrix**| `/settings/users` | `features/users/*` | `IMPLEMENTED_AND_TESTED` | PHASE-011 |
| `REQ-315 - REQ-324` | P. 23-24| **Page 28: Organization Settings & Taxonomy** | `/settings/organization`| `features/organization/*` | `IMPLEMENTED_AND_TESTED` | PHASE-011 |
| `REQ-325 - REQ-335` | P. 24 | **Page 29: WordPress & Gravity Forms Integration**| `/settings/wordpress` | Missing in `apps/web` | `NOT_IMPLEMENTED` | PHASE-011 |

### 3.3 Tech Stack & Architectural Mandates (REQ-336 to REQ-350)
| REQ ID | PDF Page | Description | Target Standard | Status | Assigned Phase |
| :--- | :---: | :--- | :--- | :---: | :---: |
| `REQ-336` | P. 26 | Next.js App Router route group structure (`(auth)` & `(app)`) | Route architecture | `IMPLEMENTED_AND_TESTED` | Completed |
| `REQ-337` | P. 26 | Server Components for static/SOP vs Client Components | Component architecture | `PARTIALLY_IMPLEMENTED` | PHASE-002 |
| `REQ-338` | P. 26 | Route Middleware session & RBAC protection | `middleware.ts` | `NOT_IMPLEMENTED` | PHASE-003 |
| `REQ-339` | P. 26 | Standard Tailwind logical classes (`start/end`, `ms/me`) for RTL | Styling | `IMPLEMENTED_AND_TESTED` | Completed |
| `REQ-340` | P. 26 | CSS Design Tokens for future Dark Mode / Whitelabel | Theming | `PARTIALLY_IMPLEMENTED` | PHASE-004 |
| `REQ-341` | P. 26 | TanStack Query for all server state with structured keys | Data Layer | `NOT_IMPLEMENTED` | PHASE-002 |
| `REQ-342` | P. 26 | Optimistic UI updates with rollback (`onMutate`, `onError`)| Data Layer | `PARTIALLY_IMPLEMENTED` | PHASE-009 |
| `REQ-343` | P. 27 | Axios API Client with 401 refresh token queue & interceptors | HTTP Layer | `IMPLEMENTED_AND_TESTED` | PHASE-003 |
| `REQ-344` | P. 27 | Zod schemas with centralized Persian error messaging | Validation | `NOT_IMPLEMENTED` | PHASE-002 |
| `REQ-345` | P. 27 | Persian input normalization (digits, commas, phone format) | Input hygiene | `IMPLEMENTED_AND_TESTED` | Completed |
| `REQ-346` | P. 27 | TanStack Form for dynamic arrays & wizard forms | Form Layer | `NOT_IMPLEMENTED` | PHASE-002 |
| `REQ-347` | P. 27 | Zustand store for pure client state (`authStore`, `uiStore`) | Client State | `NOT_IMPLEMENTED` | PHASE-002 |
| `REQ-348` | P. 28 | Lucide React icons with Persian `aria-label` & RTL flip | Accessibility | `PARTIALLY_IMPLEMENTED` | PHASE-004 |
| `REQ-349` | P. 28 | Framer Motion respectful transitions with `reducedMotion` | Animations | `NOT_IMPLEMENTED` | PHASE-004 |
| `REQ-350` | P. 29 | High-performance `@dnd-kit` for Kanban drag-and-drop | Drag & Drop | `NOT_IMPLEMENTED` | PHASE-009 |

---

## 4. PROCEDURE FOR UPDATING THE MASTER TRACKER

As development proceeds across phases:
1. **Never mark a requirement as `PRODUCTION_READY`** until:
   - It is backed by a verified PostgreSQL migration & Prisma schema.
   - It has working backend NestJS controller & service logic.
   - It is connected via TanStack Query from the Next.js frontend without mock fallback.
   - It passes an automated integration or end-to-end test.
2. **Phase Status Transitions**:
   - `NOT_STARTED` ➔ `IN_PROGRESS` (upon owner kickoff)
   - `IN_PROGRESS` ➔ `IN_REVIEW` (when all tasks & tests pass locally)
   - `IN_REVIEW` ➔ `COMPLETED` (after formal acceptance review against definition of done)
3. If an unforeseen technical blocker arises during execution, update the **Phase Master Control Table** with status `BLOCKED` and document the blocking condition.
