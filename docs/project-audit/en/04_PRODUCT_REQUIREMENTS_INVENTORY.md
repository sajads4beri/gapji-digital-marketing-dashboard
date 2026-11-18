# 04 — PRODUCT REQUIREMENTS INVENTORY
## Complete Extraction & Classification of All 350 Product Requirements from the Official Specification

---

## 1. REQUIREMENT TAXONOMY & CLASSIFICATION

Every requirement extracted from `marketing-platform-phase1-frontend-pages-1.pdf` (Pages 1 to 29) is classified into one of the following canonical categories:

- **FR** (Functional Requirement): Core business logic, workflows, mutations, and user actions.
- **UI** (User Interface / UX Requirement): Layout, visual elements, animations, and interactions.
- **BR** (Business Rule): Calculations, formulas, field validations, and domain constraints.
- **DR** (Data Requirement): Persistence models, relations, field structures, and attributes.
- **SEC** (Security Requirement): Authentication, authorization, RBAC, masking, and session policies.
- **INT** (Integration Requirement): External systems, file imports, webhooks, and third-party APIs.
- **REP** (Reporting Requirement): Metrics, aggregations, charts, and file exports.
- **NFR** (Non-Functional Requirement): Performance, responsiveness, and accessibility.

---

## 2. SECTION 1: APPLICATION SHELL & COMMON COMPONENTS (PAGES 3–4)

| Req ID | PDF Page | Category | Module | Requirement Description & Acceptance Criteria |
| :--- | :---: | :---: | :--- | :--- |
| `REQ-001` | P. 3 | UI/FR | Shell | **Global Header**: Display active organization logo and name with switcher menu; global search for leads (name/phone) and campaigns (name); notification bell with unread badge counter; user profile menu (name, role, profile link, logout action). |
| `REQ-002` | P. 3 | UI/SEC | Shell | **Collapsible Navigation Sidebar**: 3 workspace groups: "عملکرد" (Performance), "فروش و لید" (Sales & Leads), "اجرا و دانش" (Execution & Knowledge), plus bottom "تنظیمات" (Settings). Filter items strictly by user role permissions. Highlight active item with accent color and side indicator bar. Support collapsed icon-only mode and mobile drawer. |
| `REQ-003` | P. 3 | UI | Shell | **Hierarchical Breadcrumbs**: Render on all detail pages (Campaign, Lead, Webinar, SOP). Hierarchy pattern: `[Workspace] -> [List View] -> [Item Name]`. |
| `REQ-004` | P. 3 | UI/UX | Shell | **Page Title Bar**: Display clear Persian page title, optional short description, and right-aligned action buttons. Restrict to maximum 1 Primary Action button per page. |
| `REQ-005` | P. 3 | UI/UX | Shell | **Content Area Constraints**: Max width 1440px for dashboards and data tables; max width 800px for reading/content pages (SOP, Meeting Minutes, Learning). |
| `REQ-006` | P. 3 | UI/UX | Shell | **Toast Notifications**: System feedback for operations (success, error, warning). Auto-dismiss after 5 seconds; error toasts must NEVER auto-dismiss until dismissed by user. |
| `REQ-007` | P. 3 | UI/FR | Common | **DataTable Component**: Column visibility toggles, sort on column header click, server-side pagination (sizes 20/50/100), multi-row selection with bulk action bar, totals summary row when needed, compact mode, clickable rows, loading skeleton state, and empty state with action button. |
| `REQ-008` | P. 3 | UI/FR | Common | **FilterBar Component**: Jalali date range picker with quick presets (Today, 7 Days, 30 Days, This Month, Last Month), multi-select dropdowns, search input, "Clear Filters" button, and automatic synchronization of filter state into URL query params. |
| `REQ-009` | P. 3 | UI/REP| Common | **KpiCard Component**: Display metric title, primary numeric value, unit, percentage change vs previous period with directional arrow and color coding, optional target progress bar, and formula explanation tooltip triggered via "?" icon. |
| `REQ-010` | P. 3 | UI/REP| Common | **Accessible Charts**: Line, Bar, and Funnel charts with hover tooltips, clickable legend items, Jalali date axis, and an accessible data table alternative for screen readers. |
| `REQ-011` | P. 4 | UI/UX | Common | **StatusBadge Component**: Always render text + semantic color + optional icon. Never rely exclusively on color to convey status. |
| `REQ-012` | P. 4 | UI/FR | Common | **PersianDatePicker Component**: Support single date and date range selection. Week must start on Saturday (شنبه). Automatically convert Persian Jalali dates to Gregorian ISO strings upon submission/API dispatch. |
| `REQ-013` | P. 4 | UI/BR | Common | **MoneyInput / MoneyText**: Input with automatic thousand separators, accepting both Persian and English digits. Display currency unit suffix (Toman or Rial, unified system-wide). |
| `REQ-014` | P. 4 | UI/UX | Common | **Drawer & Modal Dialogs**: Right-anchored Drawer for fast view/edit without page unload; Modal for confirmations and compact forms. Show unsaved changes warning when closing a dirty form. |
| `REQ-015` | P. 4 | UI/BR | Common | **FormField Component**: Label, input slot, helper text, error message beneath input, mandatory asterisk (*). Validate both on submit and on input blur. |
| `REQ-016` | P. 4 | UI/FR | Common | **Wizard Component**: Step indicator bar, automatic draft saving every 30 seconds, return to previous step capability, and final review summary screen. |
| `REQ-017` | P. 4 | UI/FR | Common | **Kanban Board Component**: Categorized columns with badge counters, draggable cards, and optimistic UI updates with automatic rollback on network/server error. |
| `REQ-018` | P. 4 | UI/DR | Common | **Timeline Component**: Chronological event feed displaying event type icon, title, Shamsi timestamp, and author avatar; sorted newest to oldest. |
| `REQ-019` | P. 4 | UI/UX | Common | **UserSelect / Avatar**: Searchable user dropdown displaying user avatars with initials fallback. |
| `REQ-020` | P. 4 | UI/UX | Common | **EmptyState & ErrorState**: Empty state displays icon, one-sentence explanation, and CTA button. Error state displays error message and "Try Again" (تلاش دوباره) retry button. |
| `REQ-021` | P. 4 | UI/SEC| Common | **ConfirmDialog Component**: Mandatory confirmation for irreversible/high-impact actions (delete, lead rejection, meeting minutes email dispatch) with explicit destruction consequences. |

---

## 3. SECTION 2: DATA & STATUS DISPLAY RULES (PAGES 4–5)

| Req ID | PDF Page | Category | Module | Requirement Description & Acceptance Criteria |
| :--- | :---: | :---: | :--- | :--- |
| `REQ-022` | P. 4 | BR/UI | Formatting | **Currency Formatting**: Format numbers with thousand separators and Persian digits, unit beside number (e.g. "۱۲٬۵۰۰٬۰۰۰ تومان"). In cards, abbreviate large numbers (e.g. "۱۲٫۵ میلیون") with full exact amount in tooltip. |
| `REQ-023` | P. 4 | BR/UI | Formatting | **Percentage Formatting**: Format with 1 decimal place (e.g. "٪۲۳٫۵"). Explicitly prefix positive changes with "+" and negative changes with "−". |
| `REQ-024` | P. 4 | BR/UI | Formatting | **Jalali Date Formatting**: Format as `YYYY/MM/DD` (e.g. `۱۴۰۵/۰۸/۰۷`). Short date in tables/lists; full date with time in details views. Use "دیروز/امروز" (Yesterday/Today) for events within 48 hours. |
| `REQ-025` | P. 5 | SEC/UI | Privacy | **Mobile Number Formatting & Masking**: Format standard phone as `0912 123 4567`. For unauthorized roles (non-admin/non-sales), mask middle digits as `0912***4567`. Provide one-click Copy and Call action buttons. |
| `REQ-026` | P. 5 | BR/UI | Calculations| **Undefined / Zero-Denominator Handling**: When a metric cannot be computed (e.g. zero division), display an em-dash ("—") with tooltip explanation. NEVER display "0". |
| `REQ-027` | P. 5 | BR/UI | Formatting | **Lower-is-Better Metric Logic**: For cost metrics CPL (Cost per Lead) and CAC (Customer Acquisition Cost), a decrease is positive (green) and an increase is negative (red). |
| `REQ-028` | P. 5 | BR/UI | Taxonomy | **Standard Domain Status Colors**:  <br>- Campaign: Draft (Gray), Scheduled (Blue), Active (Green), Paused (Orange), Completed (Neutral), Archived (Light Gray).  <br>- Campaign Health: Healthy (Green), Needs Attention (Yellow), At Risk (Red).  <br>- Lead: New, Contacted, Qualified, Proposal, Customer, Lost.  <br>- Task: Not Started, In Progress, Waiting, Done, Overdue (Red text badge with delay count).  <br>- Equipment: Ready, Incomplete, Not Procured.  <br>- Idea: New, Under Review, Approved, Implemented, Rejected. |
| `REQ-029` | P. 5 | NFR/UI | State | **Mandatory Universal 3 States**: Every page and list view must support Loading Skeleton, Empty State with explanation and action, and Error State with retry button. All list pages must preserve active filters in URL query parameters. |

---

## 4. SECTION 3: 29 PRODUCT PAGES REQUIREMENTS (PAGES 6–24)

### 4.1 General Workspace (Pages 1–3)
- `REQ-030` to `REQ-038` (**Page 1: Login & Organization Selection** - `/login`, `/forgot-password`, `/select-org`): Centered modal layout, email/mobile input, password with toggle show/hide, forgot password recovery dispatch (SMS/Email), multi-tenant org selector cards, remember last active org in storage, inline password error below field (not toast), disabled spinner submit button.
- `REQ-039` to `REQ-047` (**Page 2: Role-based Home Page** - `/`): 12-column widget grid tailored dynamically per active user role:
  - Employer/Client: Cost/Lead/ROI cards, trend chart, lagging KPIs list, team activity summary.
  - Marketing Manager: Campaign warning alerts, overdue tasks, upcoming 7-day events.
  - Campaign Manager: Active campaigns missing today's cost entries, quick "Add Cost" and "Import" shortcuts.
  - Sales Agent: Today's follow-up queue (name, phone, time), new leads, personal conversion rate, direct call action.
  - Content Creator: Assigned tasks, weekly calendar, incomplete equipment checklist.
  - Independent loading and error boundaries per widget; empty widget messages tailored to role.
- `REQ-048` to `REQ-056` (**Page 3: Notifications Center** - `/notifications`): Topbar drawer showing last 10 notifications; full page with notification list and preferences tab; unread badge counter capped at "+99"; notification items show type icon, summary text, relative time, unread indicator dot; preferences matrix for event type vs delivery channel (in-app, email) with toggle switches; "Mark all as read" action.

### 4.2 Workspace 1: Performance & Analytics (Pages 4–13)
- `REQ-057` to `REQ-067` (**Page 4: Executive Performance Dashboard** - `/performance/dashboard`): Filter bar with date range, campaign multi-select, platform multi-select, and "Compare with previous period" toggle; 6 KPI cards (Total Spend, Total Leads, CPL, Conversion Rate, CAC, ROAS) with delta % and progress bar; two trend charts (spend trend, lead trend); 5-stage conversion funnel (Clicks -> Leads -> Qualified -> Proposal -> Customer); platform share breakdown chart; top campaigns table with health badges; dynamic alerts sidebar with "Create Task" button; PDF/Excel export.
- `REQ-068` to `REQ-077` (**Page 5: Campaigns Management** - `/campaigns`): Table listing all campaigns with name, type, status, date range, budget, actual spend, budget consumption progress bar, lead count, CPL, and owner avatar; row warning indicator when spend exceeds budget; row actions (duplicate, pause/resume, archive); Excel export; new campaign button.
- `REQ-078` to `REQ-090` (**Page 6: Campaign Creation & Edit Wizard** - `/campaigns/new`, `/:id/edit`): 6-step wizard:
  - Step 1: Name, type, goal, start/end dates, owner, description.
  - Step 2: Target audience selection (multi-select with search) + "New Audience" modal.
  - Step 3: Platform allocation table (platform, budget, volume/target, notes; live budget sum).
  - Step 4: KPI selection and target setting per metric.
  - Step 5: Landing page URL selection and automatic UTM link generation per platform.
  - Step 6: Full review summary screen with "Edit" step shortcuts.
  - Auto-save draft every 30s and on step transition; warning if platform budget sum exceeds campaign budget.
- `REQ-091` to `REQ-104` (**Page 7: Campaign Details** - `/campaigns/:id`): Persistent header (name, status, dates, owner, edit/copy/pause actions) with 8 tab panels:
  - Tab 1 (Summary): Real vs target KPI cards, Strengths & Weaknesses columns, recommended actions with "Create Task" CTA.
  - Tab 2 (Platforms): Platform performance table + "Add Cost" modal.
  - Tab 3 (Leads): Mini conversion funnel + campaign leads data table.
  - Tab 4 (Landing): Landing page URL, UTM links table, form submission counts.
  - Tab 5 (SMS): SMS dispatch log and recipient delivery stats.
  - Tab 6 (Schedule & Equipment): Execution timeline + equipment checklist.
  - Tab 7 (Tasks): Filtered task list tied to this campaign.
  - Tab 8 (Analysis): Calculated metrics compared against benchmark averages of peer campaigns.
- `REQ-105` to `REQ-113` (**Page 8: Ad Platforms Catalog** - `/performance/platforms`): Catalog table (name, type, ingestion method [manual/API/import], status, active campaigns count); slide-over drawer to configure custom fields and export templates; warning before disabling a platform currently active in campaigns.
- `REQ-114` to `REQ-123` (**Page 9: Marketing Costs Management** - `/performance/costs`): Top summary bar (total spend under active filter, spend by platform horizontal bar); costs data table; slide-over drawer for single cost entry (campaign, platform, date, volume, amount, notes); batch entry table with Excel paste support; fast entry mode keeping form open for next entry.
- `REQ-124` to `REQ-134` (**Page 10: Universal Data Import** - `/performance/imports`): Import history table (date, data type, filename, user, valid/error rows count, status); 4-step wizard:
  - Step 1: Select data type (costs, leads, SMS results, webinar attendees) + drag-and-drop file upload.
  - Step 2: Column mapping table (file column -> system field) with sample preview.
  - Step 3: 20-row validation preview + error summary table + duplicate handling choice (skip or update).
  - Step 4: Execution progress bar with background processing capability.
- `REQ-135` to `REQ-145` (**Page 11: KPI Metrics & Rules** - `/performance/kpis`): 3 tabs:
  - Tab 1 (KPIs): Metric name, scope (org/campaign), target, current value, progress, period.
  - Tab 2 (Metrics & Formula Builder): Default read-only metrics + custom metrics builder with formula syntax validator in Persian.
  - Tab 3 (Alert Rules): Sentence builder syntax (`IF [Metric] [> / <] [Value] THEN [Message] AND [Action]`).
- `REQ-146` to `REQ-154` (**Page 12: Target Audiences** - `/performance/audiences`): Cards/table toggle view; audience details drawer showing demographics, interests, tags, and table of campaigns targeting this persona.
- `REQ-155` to `REQ-165` (**Page 13: Landing Pages & UTM Builder** - `/performance/landing`): Landing pages table with connection status, 7-day leads, total leads; live UTM builder with instant parameter preview; UTM generation history table; setup guide accordions for Google Ads and GA4.

### 4.3 Workspace 2: Sales & Leads (Pages 14–18)
- `REQ-166` to `REQ-177` (**Page 14: Leads Inbox** - `/leads`): Leads data table (name, masked phone with copy/call, source, campaign, UTM, date, status, assigned agent, next follow-up date); filters including "Without Follow-up"; bulk action bar for re-assigning and status batch updates; warning badge for leads untouched > 24 hours; duplicate phone alert during manual entry.
- `REQ-178` to `REQ-188` (**Page 15: Lead Kanban Pipeline** - `/leads/board`): 6-column pipeline board (New, Contacted, Qualified, Proposal, Customer, Lost); column headers with count and total deal value; draggable cards; mandatory reason modal when dragging to "Lost"; mandatory deal value modal when dragging to "Customer".
- `REQ-189` to `REQ-201` (**Page 16: Lead Details & Journey** - `/leads/:id`): Two-column layout: Left = Profile & actions, Right = Chronological journey timeline (ad click -> landing -> form -> assignment -> calls -> notes -> deals); quick call outcome form sticky above timeline; next follow-up date/time scheduler.
- `REQ-202` to `REQ-211` (**Page 17: SMS Dispatches** - `/leads/sms`): SMS campaign dispatches list; dispatch details view with delivery breakdown (total, delivered, failed, response, unit cost) and recipient logs with masked numbers; import SMS results CSV; "Create Lead from Responders" action.
- `REQ-212` to `REQ-222` (**Page 18: Webinars** - `/leads/webinars`): Webinar list; webinar details view with 4 tabs (Info, Attendees, Equipment, Tasks); mini conversion funnel (Registered -> Attended -> Converted to Lead); "Convert Attendees to Leads" action with duplicate preview modal.

### 4.4 Workspace 3: Execution & Knowledge (Pages 18–23)
- `REQ-223` to `REQ-234` (**Page 19: Task Management** - `/work/tasks`): Top toggles for "My Tasks / Team Tasks" and "List / Kanban"; grouped list view (Overdue, Today, This Week, Later); quick add single input above list; task details drawer with subtasks, markdown description, @mentions in comments, and SOP reference link.
- `REQ-235` to `REQ-244` (**Page 20: Marketing Calendar** - `/work/calendar`): Full month and week grid view starting on Saturday (Friday highlighted); multi-day campaign execution bars; webinar, meeting, and task deadline markers; click date cell to create event; drag event to reschedule; mobile day agenda list view.
- `REQ-245` to `REQ-253` (**Page 21: Equipment Logistics** - `/work/equipment`): Two views: "Shortages" (default, grouped by event date) and "All Equipment"; equipment checklist per campaign/webinar; warning alert when unprocured equipment is needed within < 3 days.
- `REQ-254` to `REQ-263` (**Page 22: Meeting Minutes** - `/work/meetings`): List of meetings; 800px reading view for minute details; agenda, attendees avatars, discussions, decisions; action items table with one-click "Convert to Task"; email dispatch with preview modal and version history.
- `REQ-264` to `REQ-274` (**Page 23: Standard Operating Procedures / SOP** - `/work/sops`): Categorized card grid; clean reading mode (800px) with print stylesheet; numbered steps, checklist, and attachment downloads; "Create Task from SOP" action; version history sidebar.
- `REQ-275` to `REQ-284` (**Page 24: Team Learning & Training** - `/work/learning`): Two tabs: "Library" and "My Courses", plus manager tab "Team Progress"; embedded video player with playback speed and resume playback; course completion checklist and employee progress matrix.
- `REQ-285` to `REQ-294` (**Page 25: Growth Ideas Board** - `/work/ideas`): Quick idea submission input; categorized card grid; one-click upvoting with vote retraction; manager status updater; "Convert Idea to Task" action.
- `REQ-295` to `REQ-303` (**Page 26: Activity Report & Audit Trail** - `/work/activity`): User and date filters; summary cards (tasks completed on time %, calls logged, costs entered); employee comparison table; real-time activity feed with entity hyperlinks.

### 4.5 Settings (Pages 23–24)
- `REQ-304` to `REQ-314` (**Page 27: Users & Roles** - `/settings/users`): User management table (name, email/mobile, role, status, last login); slide-over drawer to invite users; 29-page permission access matrix table (rows = operations, columns = 6 roles); enforce at least 1 active admin per organization.
- `REQ-315` to `REQ-324` (**Page 28: Organization Settings** - `/settings/organization`): Multi-tab taxonomy manager (campaign types, lead sources, lead pipeline stages, loss reasons, cost categories); draggable order re-arrangement; disable-only protection for options in active use.
- `REQ-325` to `REQ-335` (**Page 29: WordPress Integration** - `/settings/wordpress`): Connection status card (Connected/Disconnected, last lead received timestamp, 7-day lead count); API secret key generator; field mapping table (WordPress form field -> system lead field); rejected webhook payload logs.

---

## 5. SECTION 4 & 5: TECH STACK & ARCHITECTURAL MANDATES (PAGES 26–29)

| Req ID | PDF Page | Category | Module | Requirement Description & Acceptance Criteria |
| :--- | :---: | :---: | :--- | :--- |
| `REQ-336` | P. 26 | NFR/UI | Framework | **Next.js App Router**: Route groups `(auth)` and `(app)` with clean URL structures. |
| `REQ-337` | P. 26 | NFR/UI | Architecture| **Server vs Client Components**: Use Server Components for shell and read-only pages (e.g. SOPs); use Client Components for interactive forms and dashboards. |
| `REQ-338` | P. 26 | SEC/NFR | Security | **Route Middleware Protection**: Verify session cookies and role-based permissions in `middleware.ts`. |
| `REQ-339` | P. 26 | UI/NFR | Styling | **Tailwind RTL Classes**: Use logical classes (`start/end`, `ms/me`, `ps/pe`) exclusively to prevent LTR layout bugs. |
| `REQ-340` | P. 26 | UI/NFR | Design | **CSS Design Tokens**: Read all colors and spacing from CSS custom properties to support theme customization. |
| `REQ-341` | P. 26 | NFR/DR | Data Layer | **TanStack Query (React Query)**: Manage all server state via `useQuery` and `useMutation` with strict key structures. |
| `REQ-342` | P. 26 | UI/FR | Data Layer | **Optimistic Mutations**: Implement `onMutate` with rollback in `onError` on Kanban board updates. |
| `REQ-343` | P. 27 | SEC/INT | HTTP Layer | **Axios API Client**: Global client with `/api/v1` base URL, 401 token refresh queue, and standardized error interceptor. |
| `REQ-344` | P. 27 | BR/NFR | Validation | **Zod Schemas**: Strict schema definition for every mutation with centralized Persian error messages. |
| `REQ-345` | P. 27 | BR/FR | Hygiene | **Input Normalization**: Transform Persian/Arabic digits, remove commas from amounts, and normalize Iranian mobile numbers inside schemas. |
| `REQ-346` | P. 27 | UI/FR | Forms | **TanStack Form**: Manage dynamic arrays (platform rows, meeting action items) and multi-step wizards with dirty checking. |
| `REQ-347` | P. 27 | NFR/UI | State | **Zustand Stores**: Pure client-side state for `authStore` (user, permissions, `can()`), `uiStore` (sidebar, table dense mode), and `wizardStore`. |
| `REQ-348` | P. 28 | UI/NFR | Icons | **Lucide Icons**: Consistent 16/20px icons with 1.75 stroke; add Persian `aria-label`; flip directional arrows in RTL (`rtl:rotate-180`). |
| `REQ-349` | P. 28 | UI/NFR | Animation | **Framer Motion**: Subtle animations (150-250ms) respecting `reducedMotion`; smooth drawer and modal entrances. |
| `REQ-350` | P. 29 | UI/FR | Drag & Drop | **@dnd-kit**: High-performance drag-and-drop between Kanban columns for leads and tasks. |
