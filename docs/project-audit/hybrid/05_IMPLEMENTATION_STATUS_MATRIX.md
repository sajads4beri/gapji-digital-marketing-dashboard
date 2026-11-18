# 05 — IMPLEMENTATION STATUS MATRIX (ماتریس وضعیت پیاده‌سازی نیازمندی‌ها)
## تطبیق نیازمندی‌ها با کدهای موجود، شواهد فنی و وضعیت ارزیابی ۸ گانه

---

## 1. STATUS TAXONOMY (دسته‌بندی وضعیت‌های ۸ گانه)

1. `PRODUCTION_READY`: Backed by real PostgreSQL database persistence, active NestJS API endpoints, connected Next.js UI, validated RBAC, and passing automated regression tests.
2. `IMPLEMENTED_AND_TESTED`: Implemented in frontend components and validated by passing unit/integration scripts (currently using mock storage/simulated layer).
3. `IMPLEMENTED_UNVERIFIED`: Code exists in the repository, but has not been verified by an automated test script.
4. `PARTIALLY_IMPLEMENTED`: Partial feature logic or UI exists, but key workflows, fields, or validation rules are missing.
5. `UI_ONLY`: Visual interface exists with static or placeholder data; no state mutations or data layer connections are active.
6. `NOT_IMPLEMENTED`: Completely absent from both frontend and backend codebases.
7. `BLOCKED`: Implementation cannot proceed until a prerequisite architectural blocker is resolved.
8. `UNCLEAR`: Specification requirement contains contradictory or underspecified business logic requiring clarification.

---

## 2. 29 PRODUCT PAGES IMPLEMENTATION MATRIX (ماتریس ارزیابی صفحات ۲۹ گانه)

| Page # | Route (مسیر) | Module (ماژول) | Frontend Status | Backend Status | Evidence & Forensic Analysis (شواهد و ارزیابی) | Assigned Phase |
| :---: | :--- | :--- | :---: | :---: | :--- | :---: |
| **P-01** | `/login`, `/select-org` | Auth | `PARTIALLY_IMPLEMENTED` | `IMPLEMENTED_AND_TESTED` (backend branch) | Frontend calls real API; falls back to mock. Backend has full JWT/Argon2. Monorepo unmerged. | PHASE-003 |
| **P-02** | `/` | Home | `IMPLEMENTED_AND_TESTED` | `PARTIALLY_IMPLEMENTED` | 12-col grid renders correctly per role. Data backed by mock storage. Needs real aggregation API. | PHASE-004 |
| **P-03** | `/notifications` | Notifications | `NOT_IMPLEMENTED` | `IMPLEMENTED_UNVERIFIED` (backend branch) | Header drawer has basic list, but full page and channel switch preferences are missing. | PHASE-013 |
| **P-04** | `/performance/dashboard`| Analytics | `PARTIALLY_IMPLEMENTED` | `IMPLEMENTED_AND_TESTED` (backend branch) | Charts are mock SVG. Real API in backend branch has `/dashboard` endpoint. Wire together. | PHASE-005 |
| **P-05** | `/campaigns` | Campaigns | `IMPLEMENTED_AND_TESTED` | `IMPLEMENTED_AND_TESTED` | Table, filters, budget consumption bar work. Backend has basic TypeORM and rich Prisma API. | PHASE-006 |
| **P-06** | `/campaigns/new` | Campaigns | `PARTIALLY_IMPLEMENTED` | `IMPLEMENTED_AND_TESTED` (backend branch) | 6 steps exist in frontend. Drafts save in localStorage. Wire to backend allocations API. | PHASE-006 |
| **P-07** | `/campaigns/:id` | Campaigns | `PARTIALLY_IMPLEMENTED` | `PARTIALLY_IMPLEMENTED` | 8 tabs rendered in UI. Tabs 1-5 use mock data; tabs 6-8 partially wired. Needs consolidated API. | PHASE-006 |
| **P-08** | `/performance/platforms`| Platforms | `IMPLEMENTED_AND_TESTED` | `IMPLEMENTED_AND_TESTED` (backend branch) | Platforms table and drawer work. Active campaigns count works. Wire to Prisma `/platforms`. | PHASE-007 |
| **P-09** | `/performance/costs` | Costs | `IMPLEMENTED_AND_TESTED` | `IMPLEMENTED_AND_TESTED` (backend branch) | Summary bar, costs table, single/batch entry work. Passed 4 test scripts. Connect to API. | PHASE-007 |
| **P-10** | `/performance/imports` | Imports | `PARTIALLY_IMPLEMENTED` | `PARTIALLY_IMPLEMENTED` (backend branch) | 4-step wizard UI works. In-browser CSV parsing works. Missing backend BullMQ worker for large files. | PHASE-008 |
| **P-11** | `/performance/kpis` | KPIs | `PARTIALLY_IMPLEMENTED` | `PARTIALLY_IMPLEMENTED` (backend branch) | 3 tabs exist. Metric formula builder syntax parser is client-side. Alert rules need backend evaluation. | PHASE-012 |
| **P-12** | `/performance/audiences`| Audiences | `IMPLEMENTED_AND_TESTED` | `IMPLEMENTED_AND_TESTED` (backend branch) | Cards/table toggle and details drawer work. Connect to Prisma `/audiences`. | PHASE-012 |
| **P-13** | `/performance/landing` | Landing | `IMPLEMENTED_AND_TESTED` | `IMPLEMENTED_AND_TESTED` (backend branch) | Table, live UTM builder, parameter preview work. Connect to Prisma `/landing` & `/utm`. | PHASE-012 |
| **P-14** | `/leads` | Leads | `IMPLEMENTED_AND_TESTED` | `IMPLEMENTED_AND_TESTED` (backend branch) | DataTable, bulk actions, phone copy/call work. **Bug ITEM-08**: Sales lead isolation missing in mock. | PHASE-009 |
| **P-15** | `/leads/board` | Leads | `IMPLEMENTED_AND_TESTED` | `IMPLEMENTED_AND_TESTED` (backend branch) | 6 columns, deal value sums, reason modals work. Drag-and-drop needs `@dnd-kit`. Connect to API. | PHASE-009 |
| **P-16** | `/leads/:id` | Leads | `IMPLEMENTED_AND_TESTED` | `IMPLEMENTED_AND_TESTED` (backend branch) | 2-col layout, profile card, quick call form, chronological timeline work. Connect to API. | PHASE-009 |
| **P-17** | `/leads/sms` | SMS | `IMPLEMENTED_AND_TESTED` | `IMPLEMENTED_AND_TESTED` (backend branch) | Dispatches table, recipient logs, masked phone numbers work. Connect to Prisma `/sms`. | PHASE-009 |
| **P-18** | `/leads/webinars` | Webinars | `IMPLEMENTED_AND_TESTED` | `IMPLEMENTED_AND_TESTED` (backend branch) | 4 tabs (Info, Attendees, Equipment, Tasks), conversion funnel work. Connect to Prisma `/webinars`. | PHASE-009 |
| **P-19** | `/work/tasks` | Tasks | `IMPLEMENTED_AND_TESTED` | `IMPLEMENTED_AND_TESTED` (backend branch) | List/Kanban toggle, grouping, quick add, task drawer work. Connect to Prisma `/tasks`. | PHASE-010 |
| **P-20** | `/work/calendar` | Calendar | `NOT_IMPLEMENTED` | `IMPLEMENTED_UNVERIFIED` (backend branch) | Missing from `apps/web`. Backend branch has `CalendarEvent` model and basic module. | PHASE-013 |
| **P-21** | `/work/equipment` | Equipment | `NOT_IMPLEMENTED` | `IMPLEMENTED_UNVERIFIED` (backend branch) | Missing from `apps/web`. Backend branch has `EquipmentItem` and `EventEquipment` models. | PHASE-013 |
| **P-22** | `/work/meetings` | Meetings | `NOT_IMPLEMENTED` | `IMPLEMENTED_UNVERIFIED` (backend branch) | Missing from `apps/web`. Backend branch has `Meeting` and `MeetingActionItem` models. | PHASE-013 |
| **P-23** | `/work/sops` | SOP | `NOT_IMPLEMENTED` | `IMPLEMENTED_UNVERIFIED` (backend branch) | Missing from `apps/web`. Backend branch has `Sop` and `SopVersion` models. | PHASE-013 |
| **P-24** | `/work/learning` | Learning | `NOT_IMPLEMENTED` | `IMPLEMENTED_UNVERIFIED` (backend branch) | Missing from `apps/web`. Backend branch has `LearningResource` model. | PHASE-013 |
| **P-25** | `/work/ideas` | Ideas | `NOT_IMPLEMENTED` | `IMPLEMENTED_UNVERIFIED` (backend branch) | Missing from `apps/web`. Backend branch has `Idea` and `IdeaVote` models. | PHASE-013 |
| **P-26** | `/work/activity` | Activity | `NOT_IMPLEMENTED` | `IMPLEMENTED_UNVERIFIED` (backend branch) | Missing from `apps/web`. Backend branch has `UserActivityLog` model. | PHASE-013 |
| **P-27** | `/settings/users` | Settings | `IMPLEMENTED_AND_TESTED` | `IMPLEMENTED_AND_TESTED` (backend branch) | User table and 29-page permission matrix work. Connect to Prisma `/users` & `/roles`. | PHASE-011 |
| **P-28** | `/settings/organization`| Settings | `IMPLEMENTED_AND_TESTED` | `IMPLEMENTED_AND_TESTED` (backend branch) | Multi-tab taxonomy manager works. Disable-only protection works. Connect to API. | PHASE-011 |
| **P-29** | `/settings/wordpress` | Integration | `NOT_IMPLEMENTED` | `IMPLEMENTED_UNVERIFIED` (backend branch) | Missing from `apps/web`. Backend branch has `WordpressIntegration` & `WordpressWebhookLog` models. | PHASE-011 |
