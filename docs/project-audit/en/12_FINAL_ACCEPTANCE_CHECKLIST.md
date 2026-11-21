# 12 — Final Acceptance Checklist
## Gapji Digital Marketing Platform Deep Audit

---

## 1. Product Capabilities & Screen Completeness (29/29 Pages)

### General Screens (Pages 1 to 3)
- [x] **Page 1: Auth & Org Selection (`/login`, `/select-org`):** Central login card, password reveal toggle, inline validation, multi-org selection cards, token rotation active.
- [x] **Page 2: Role-Based Home (`/`):** 12-column widget grid with independent loading/error states and tailored views for Client, Manager, Campaign Manager, Sales Agent, Content Creator.
- [ ] **Page 3: Notifications Hub (`/notifications`):** Header drawer with 10 recent notifications; full page with notifications list and Settings tab (Event Type × Channel matrix with toggles); unread counter capped at `+99`. *(Scheduled in `PHASE-002`)*

### Workspace 1: Performance (Pages 4 to 13)
- [x] **Page 4: Executive Dashboard (`/performance/dashboard`):** 6 KPI cards, synchronized Cost and Lead trend charts, conversion funnel, platform share chart, campaigns summary table, alerts panel.
- [x] **Page 5: Campaigns List (`/performance/campaigns`):** Campaigns data table, status badges, budget progress bar, row actions (Copy, Pause/Resume, Archive), filter bar.
- [x] **Page 6: Campaign Wizard (`/performance/campaigns/new`):** 6-step creation wizard, audience selection, platform budget allocation table, KPI target inputs, UTM generator, 30s auto-save draft.
- [x] **Page 7: Campaign Details (`/performance/campaigns/:id`):** Fixed header with actions, active tab URL persistence, 8 tabs (Summary, Platforms, Leads, Landing, SMS, Schedule, Tasks, Analysis).
- [x] **Page 8: Platforms Management (`/performance/platforms`):** Platforms table, template library, inputs/outputs definition drawer, deactivation check ("Used in X campaigns").
- [x] **Page 9: Costs Tracking (`/performance/costs`):** Summary bar, filter bar, costs table, quick log drawer with amount auto-clear, editable batch entry table with Excel paste.
- [x] **Page 10: Data Import (`/performance/imports`):** Ingestion history table, 4-step wizard (File, Column Mapping, 20-row preview with error summary, Result), background processing.
- [x] **Page 11: KPI & Metrics Engine (`/performance/kpis`):** KPIs table, formula builder with variables and operator buttons, Persian formula validator, sentence-based alert rules builder.
- [x] **Page 12: Target Audiences (`/performance/audiences`):** Audiences card/table view, demographic details, linked campaigns performance table, deletion check for unused audiences.
- [x] **Page 13: Landing & UTM (`/performance/landing`):** Landings table with 30-day inactivity alert, live UTM link builder with live preview, UTM history table, GA4 guide.

### Workspace 2: Sales & Leads (Pages 14 to 18)
- [x] **Page 14: Lead Inbox (`/leads`):** Leads data table, masked mobile numbers (`0912***4567`) with copy button, batch assignment, batch status change, duplicate mobile warning, mobile card view.
- [x] **Page 15: Lead Follow-up Kanban (`/leads/board`):** 6 horizontal scrollable status columns, draggable cards with overdue red date, optimistic update with rollback, Lost reason modal, Customer deal value modal.
- [x] **Page 16: Lead Details & Journey (`/leads/:id`):** Journey summary bar, split layout (specs + chronological timeline), docked quick call logging form, add notes, reminders, status changes.
- [x] **Page 17: SMS Broadcasts (`/leads/sms`):** Broadcasts list, campaign details view with summary stats, recipient numbers table, import delivery results, convert respondents to leads.
- [x] **Page 18: Webinar Lifecycle (`/leads/webinars`):** Webinars list, details view with 4 tabs (Info, Attendees, Equipment, Tasks), mini funnel (Registered -> Attended -> Lead), convert attendees to leads.

### Workspace 3: Execution & Knowledge (Pages 19 to 26)
- [x] **Page 19: Operational Tasks (`/work/tasks`):** Switches for "My Tasks" vs "Team Tasks" and "List" vs "Board", grouped list (Overdue, Today, Week, Later), task details drawer, subtasks, @mentions comments.
- [x] **Page 20: Shamsi Calendar (`/work/calendar`):** Jalali month/week grid, week starts Saturday, Friday distinct color, drag-and-drop event rescheduling, event drawer, campaign multi-day execution bars.
- [ ] **Page 21: Equipment Management (`/work/equipment`):** "Shortages" view grouped by date with `< 3 days` alert; "All Equipment" table; equipment templates; apply template to campaign/webinar. *(Scheduled in `PHASE-003`)*
- [ ] **Page 22: Meeting Minutes (`/work/meetings`):** Meetings list, 800px reading view, meeting form with action items table, "Send to all" email preview, "Convert action items to tasks" pipeline, version history. *(Scheduled in `PHASE-004`)*
- [ ] **Page 23: SOP Knowledge Base (`/work/sops`):** Categorized card list, 800px reading view with edit mode, procedure steps and checklists, version history, "Create task from SOP" button, print CSS stylesheet. *(Scheduled in `PHASE-005`)*
- [ ] **Page 24: Learning & LMS Hub (`/work/learning`):** "Library" and "My Courses" tabs, manager "Team Progress" matrix, video player with playback speed and resume timestamp, course assignment. *(Scheduled in `PHASE-006`)*
- [ ] **Page 25: Ideas Incubator (`/work/ideas`):** Quick submit field, 1-click reversible upvotes, details drawer, manager status change, "Convert to task" button, highlighted execution results. *(Scheduled in `PHASE-007`)*
- [ ] **Page 26: Activity Report (`/work/activity`):** Role-filtered report (managers see all, users see own), summary KPI cards, team comparison table, live activity feed with deep entity links, Excel export. *(Scheduled in `PHASE-008`)*

### Settings (Pages 27 to 29)
- [x] **Page 27: Users & Roles (`/settings/users`):** Users data table, invite user drawer, role assignment, deactivate user with impact warning modal, permissions matrix table.
- [x] **Page 28: Organization Settings (`/settings/organization`):** Taxonomy management tabs (Campaign types, Lead sources, Lead statuses, Lost reasons, Cost categories), general settings, in-use delete restriction.
- [ ] **Page 29: WordPress Connection (`/settings/wordpress`):** Connection status card, API key generation with rotation confirmation, setup guide, test connection, field mapping table, rejected webhooks log. *(Scheduled in `PHASE-009`)*

---

## 2. Non-Functional, Security & Localization Sign-Off

### Security & Access Control
- [x] Passwords hashed with salted Argon2id.
- [x] Access tokens kept in browser memory only (zero localStorage exposure).
- [x] Refresh tokens transmitted via secure, HttpOnly, SameSite=Lax cookies with family rotation.
- [x] Multi-tenancy isolation strictly enforced via `organizationId` scoping in all queries.
- [x] Sales agent lead isolation strictly restricts agents to owned leads (`assignedToId = user.id`).
- [x] Client role prohibited from invoking mutation endpoints on campaigns, costs, or imports.
- [x] Mobile numbers masked as `0912***4567` for unauthorized roles.
- [x] Parameterized SQL statements enforced via Prisma ORM (zero SQL injection vulnerabilities).
- [ ] Helmet security headers active in NestJS bootstrap. *(Scheduled in `PHASE-010`)*
- [ ] Rate limiting active on login and refresh endpoints. *(Scheduled in `PHASE-010`)*

### Persian RTL & Iranian Localization
- [x] Root layout enforces `<html lang="fa" dir="rtl">`.
- [x] Local Vazirmatn Persian fonts loaded across weights (Light to Black).
- [x] Standalone Jalali calendar engine verified across 11,323 consecutive days (1390-1420).
- [x] Currency values formatted with thousands separators and Persian digits (`۱۲٬۵۰۰٬۰۰۰ تومان`).
- [x] Single decimal place percentage formatting (`۲۳٫۵٪`) with `+` and `−` symbols.
- [x] "Lower is better" rule properly inverts green/red color logic for CPL and CAC.
- [x] Undefined metrics render em-dash `—` with tooltip reason; never renders false `0`.

### UI/UX Consistency & States
- [x] All data tables implement column visibility, sorting, server pagination, and empty states.
- [x] All list pages synchronize active filters bidirectionally with URL search parameters.
- [x] Standardized 3-state rendering pattern (Skeleton Loading, Empty State with CTA, Error State with Retry) applied across all views.
- [x] Toast feedback configured (auto-close 5s; error stays open until dismissed).
- [x] Draggable Kanban boards implement optimistic updates with automatic rollback on error.
