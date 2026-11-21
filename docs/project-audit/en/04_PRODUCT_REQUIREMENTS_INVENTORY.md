# 04 — Product Requirements Inventory
## Gapji Digital Marketing Platform Deep Audit

---

## 1. Requirements Extraction Methodology

This inventory provides an exhaustive, line-by-line extraction of all documented capabilities from the official product specification document:
- **Title:** `marketing-platform-phase1-frontend-pages-1.pdf` (سند اختصاصی تیم فرانت‌اند — فاز اول)
- **Scope:** 29 Product Pages, Application Shell, Common Primitives, Formatting Standards, and Architecture Rules.
- **Direction & Language:** Persian RTL with Shamsi (Solar Hijri) calendar support.
- **Exclusions from Phase 1:** Growth Assistant (Roshdyar / رشدیار), AI assistants, native mobile apps, and push notifications.

Every extracted requirement is assigned a deterministic, unique identifier (`REQ-001` through `REQ-099`) and classified under canonical technical categories:
- `FR`: Functional Requirement
- `NFR`: Non-Functional Requirement
- `UIX`: UI / UX Requirement
- `BR`: Business Rule
- `DATA`: Data & Persistence Requirement
- `SEC`: Security & Authorization Requirement
- `INT`: Integration Requirement
- `REP`: Reporting & Export Requirement

---

## 2. Complete Requirements Catalog (REQ-001 to REQ-099)

### 2.1 Application Shell & Layout (PDF p. 3, §1-1)

| Req ID | PDF Page | Category | Title & Summary | Requirement Description & Specification Rules |
| :--- | :---: | :---: | :--- | :--- |
| `REQ-001` | p. 3 | `FR` | Active Organization Selector | Header must display active organization logo and name with a dropdown menu allowing instant switching between authorized organizations. |
| `REQ-002` | p. 3 | `FR` | Header Global Search | Search bar in top header enabling rapid cross-entity search: leads by full name or phone number, campaigns by campaign name. |
| `REQ-003` | p. 3 | `UIX` | Notification Indicator | Bell icon in header displaying an unread count badge (capped at `+99`) that opens a flyout drawer showing the last 10 notifications. |
| `REQ-004` | p. 3 | `FR` | User Profile & Logout | User avatar and menu showing user full name, current active role, link to user profile settings, and session logout trigger. |
| `REQ-005` | p. 3 | `UIX` | 3 Workspace Sidebar | Collapsible sidebar grouping navigation into 3 primary workspaces: Performance (عملکرد), Sales & Leads (فروش و لید), Execution & Knowledge (اجرا و دانش), plus bottom Settings (تنظیمات). |
| `REQ-006` | p. 3 | `SEC` | Role-Filtered Navigation | Sidebar items are rendered strictly if the active user role has authorized access to the underlying feature. Inaccessible menu items are hidden. |
| `REQ-007` | p. 3 | `UIX` | Active Nav Highlighting | Currently active navigation item must be highlighted with accent color, distinct background tint, and side indicator bar. |
| `REQ-008` | p. 3 | `UIX` | Sidebar Collapse & Mobile | Sidebar supports icon-only collapsed mode on desktop with floating tooltips and transforms into an overlay slide-out drawer on mobile viewports. |
| `REQ-009` | p. 3 | `UIX` | Detail Breadcrumb | Detail pages (Campaign, Lead, Webinar, SOP) must display breadcrumb hierarchy: `Workspace -> List -> Item Name`. |
| `REQ-010` | p. 3 | `UIX` | Page Title & Primary CTA | Standardized page header containing page title, optional short description, and at most one Primary action button aligned to opposite side. |
| `REQ-011` | p. 3 | `UIX` | Responsive Content Width | Content area width is constrained to max 1440px for dashboards and data tables, and max 800px for reading/content pages (SOP, Meetings, Learning). |
| `REQ-012` | p. 3 | `UIX` | Toast Feedback System | Transient toast notifications for operation outcomes: Success, Warning, Error. Success/warning auto-dismiss after 5s; error toasts remain visible until dismissed. |

---

### 2.2 Shared Common UI Components (PDF p. 3-4, §1-2)

| Req ID | PDF Page | Category | Title & Summary | Requirement Description & Specification Rules |
| :--- | :---: | :---: | :--- | :--- |
| `REQ-013` | p. 3 | `UIX` | DataTable Column Toggle | User can toggle visibility of optional table columns via a column selector dropdown menu. |
| `REQ-014` | p. 3 | `UIX` | DataTable Header Sorting | Clicking table column headers triggers alphabetical, numeric, or date sorting (ascending, descending, neutral). |
| `REQ-015` | p. 3 | `FR` | Server-Side Pagination | Server-side pagination with selectable page size options: 20, 50, and 100 rows per page. |
| `REQ-016` | p. 3 | `FR` | Multi-Select Batch Actions | Multi-select checkboxes on table rows that reveal a floating bottom batch action bar upon selection. |
| `REQ-017` | p. 3 | `UIX` | Table Footer Totals | Aggregate summary footer row displaying column totals or weighted averages where applicable (e.g. Campaign spend, Lead totals). |
| `REQ-018` | p. 3 | `UIX` | Table Density Mode | Toggle between standard and compact row heights, with user preference persisted in local storage. |
| `REQ-019` | p. 3 | `UIX` | Clickable Row Navigation | Clicking any table row (outside checkboxes/actions) navigates directly to the entity's detail view. |
| `REQ-020` | p. 3 | `UIX` | Table Loading & Empty State | Displays animated skeleton rows during data loading and a tailored empty state with action button when zero records match filters. |
| `REQ-021` | p. 3 | `UIX` | FilterBar Shamsi Presets | Shamsi date range picker with rapid quick-select presets: Today (امروز), 7 Days (۷ روز), 30 Days (۳۰ روز), This Month (این ماه), Last Month (ماه قبل). |
| `REQ-022` | p. 3 | `FR` | FilterBar URL Persistence | Multi-select filters, search query, and active date range must be synchronized bidirectionally with URL search parameters. Includes "Clear all filters" button. |
| `REQ-023` | p. 3 | `UIX` | KpiCard Metric Display | KPI card showing metric title, primary value, unit, delta percentage vs previous period (+/- arrow and color), optional target progress bar, and formula tooltip icon (`?`). |
| `REQ-024` | p. 3 | `UIX` | Accessible Charts | Line, Bar, and Funnel charts with hover tooltips, interactive clickable legends, Shamsi date X-axis, and an accessible data table alternative. |
| `REQ-025` | p. 4 | `UIX` | StatusBadge Component | Status badges must combine visible text with color and optional icon. Color alone must never be used to convey state. |
| `REQ-026` | p. 4 | `FR` | Persian Date Picker | Single date and date range picker where week starts on Saturday. Automatically converts selected dates to UTC ISO strings upon API dispatch. |
| `REQ-027` | p. 4 | `UIX` | Money Formatting Inputs | Numerical input supporting thousands separators, accepting Persian and English numerals, displaying unified organization monetary unit (Toman/Rial). |
| `REQ-028` | p. 4 | `UIX` | Drawer & Modal Primitives | Drawers for rapid inspect/edit workflows without leaving current screen; Modals for confirmations and concise forms; warns user if exiting with unsaved changes. |
| `REQ-029` | p. 4 | `UIX` | FormField Validation | Label, input, helper text, error message displayed beneath input, required asterisk indicator. Validates on blur and on submit. |
| `REQ-030` | p. 4 | `UIX` | Multi-Step Wizard Engine | Step indicator bar, auto-save drafts every 30s and on step transition, back button, and final confirmation summary before submission. |
| `REQ-031` | p. 4 | `UIX` | Drag-and-Drop Kanban Board | Columns with item counters, draggable cards, optimistic UI update on drop with automatic rollback to previous column on server failure. |
| `REQ-032` | p. 4 | `UIX` | Chronological Timeline | Event feed displaying event-type icon, title, Shamsi timestamp, actor avatar, sorted chronologically from newest to oldest. |
| `REQ-033` | p. 4 | `UIX` | Searchable UserSelect | Searchable user dropdown and user avatar displaying capitalized name initials. |
| `REQ-034` | p. 4 | `UIX` | Standard Empty/Error State | Empty state with icon, single sentence explanation, action button; Error state with clear error message and "Try again" retry button. |
| `REQ-035` | p. 4 | `UIX` | Destructive ConfirmDialog | Modal dialog for irreversible operations (deletion, lead rejection, meeting minutes dispatch) specifying exact consequences. |

---

### 2.3 Data Formatting Standards & Lifecycle Rules (PDF p. 4-5, §2)

| Req ID | PDF Page | Category | Title & Summary | Requirement Description & Specification Rules |
| :--- | :---: | :---: | :--- | :--- |
| `REQ-036` | p. 4 | `BR` | Monetary Display Standard | Formatted with thousands separator and Persian digits with currency unit beside number (e.g. `۱۲٬۵۰۰٬۰۰۰ تومان`). Cards abbreviate large numbers (`۱۲٫۵ میلیون`) with full number in tooltip. |
| `REQ-037` | p. 4 | `BR` | Percentage Display Standard | Exactly 1 decimal place (`۲۳٫۵٪`), positive change prefixed with `+`, negative change prefixed with `−`. |
| `REQ-038` | p. 4 | `BR` | Shamsi Date Format | Format `۱۴۰۵/۰۸/۰۷` in short tables, full date with time in detail views. Relative terms ("دیروز/امروز") for recent events. |
| `REQ-039` | p. 5 | `SEC` | Mobile Number Masking | Formatted as `0912 123 4567`. For unauthorized roles, masked as `0912***4567` with copy button and call trigger button. |
| `REQ-040` | p. 5 | `BR` | Undefined Metric Dash `—` | When a metric cannot be computed (e.g. division by zero), display em-dash `—` with tooltip explaining reason. Never display false `0`. |
| `REQ-041` | p. 5 | `BR` | "Lower is Better" KPI Rule | For cost-per metrics (CPL, CAC), a decrease is positive (green) and an increase is negative (red). |
| `REQ-042` | p. 5 | `BR` | Campaign Statuses | 6 lifecycle states: Draft (پیشنویس, grey), Planned (برنامه‌ریزی‌شده, blue), Active (فعال, green), Paused (متوقف, orange), Completed (پایان‌یافته, neutral), Archived (بایگانی, light grey). |
| `REQ-043` | p. 5 | `BR` | Campaign Health Badges | 3 indicators: Healthy (سالم), Needs Attention (نیازمند توجه), Weak (ضعیف), each with distinct label, color, and icon. |
| `REQ-044` | p. 5 | `BR` | Lead Status Taxonomy | 6 pipeline stages: New (جدید), Contacted (تماس گرفته شد), Qualified (واجد شرایط), Proposal (پیشنهاد), Customer (مشتری), Lost/Rejected (ردشده). |
| `REQ-045` | p. 5 | `BR` | Task Lifecycle & Overdue | Todo (انجام نشده), In Progress (در جریان), Waiting (در انتظار), Done (انجام شد), Overdue (عقب‌افتاده) with red badge displaying overdue duration ("۲ روز تأخیر"). |
| `REQ-046` | p. 5 | `BR` | Equipment Statuses | 3 readiness states: Ready (آماده), Incomplete (ناقص), Not Prepared (تهیه نشده). |
| `REQ-047` | p. 5 | `BR` | Idea Lifecycle States | 5 states: New (جدید), Under Review (در بررسی), Approved (تأیید شده), Executed (اجرا شده), Rejected (ردشده). |
| `REQ-048` | p. 5 | `UIX` | Universal Page States | Every page must implement all 3 standard states: Skeleton Loading, Empty State with action button, Error State with retry button. List pages preserve filters in URL. |

---

### 2.4 Product Pages Specifications (PDF p. 6-24, §3)

| Req ID | PDF Page | Category | Title & Summary | Requirement Description & Specification Rules |
| :--- | :---: | :---: | :--- | :--- |
| `REQ-049` | p. 6 | `FR` | Page 1: Auth & Org Selection | Central login card, email/mobile input, password reveal toggle, forgot password link, post-login organization selection cards with user role badge, inline password error, remember last org. |
| `REQ-050` | p. 6 | `UIX` | Page 2: Home Page Grid | 12-column widget grid where each widget is an independent card with title, content, and "View all" deep link pre-filtered to matching page. |
| `REQ-051` | p. 7 | `FR` | Page 2: Role-Tailored Home | Client: Cost/Lead/ROI cards, trend chart, overdue KPIs, team activity; Manager: Campaign alerts, overdue tasks, 7-day upcoming events; Campaign Manager: Active campaigns without logged cost today, shortcuts to log cost & import; Sales: Today's follow-ups with direct call & log, new leads, conversion rate; Content/Webinar: My tasks, week calendar, incomplete equipment. |
| `REQ-052` | p. 7 | `FR` | Page 3: Notifications Hub | Route `/notifications` and header drawer. Header drawer shows 10 recent notifications. Full page features notifications list and Settings tab (Event Type × Channel matrix with toggles), mark all read, navigate to entity on click, unread counter max `+99`. |
| `REQ-053` | p. 8 | `UIX` | Page 4: Exec Dashboard Filters | Row 1: Filter bar with Shamsi date range, multi-campaign selector, multi-platform selector, and "Compare with previous period" switch. |
| `REQ-054` | p. 8 | `FR` | Page 4: Exec Dashboard 6 KPIs | Row 2: 6 KPI cards: Total Cost, Lead Count, CPL, Conversion Rate, CAC, ROAS (each showing value, delta %, goal progress). |
| `REQ-055` | p. 8 | `UIX` | Page 4: Dashboard Trend Charts | Row 3: Two synchronized trend charts: Cost Trend over time, Lead Volume Trend over time. |
| `REQ-056` | p. 8 | `UIX` | Page 4: Funnel & Platform Share | Row 4: Conversion Funnel (Click -> Lead -> Qualified -> Proposal -> Customer with drop-off % per stage) + Platform Share Chart. |
| `REQ-057` | p. 8 | `FR` | Page 4: Dashboard Campaigns Table| Row 5: Campaigns summary table showing Name, Status, Cost, Leads, CPL, Conversion Rate, Health indicator badge. |
| `REQ-058` | p. 8 | `FR` | Page 4: Dashboard Alerts Panel | Alerts panel (sidebar or bottom) showing alert text, related campaign, problematic metric & value, and "Create Task" shortcut button. |
| `REQ-059` | p. 8 | `REP` | Page 4: Dashboard Export & Links | PDF & Excel report export. Clicking KPI card navigates to campaigns list sorted by that metric. Clicking campaign row opens Campaign Details. |
| `REQ-060` | p. 8-9 | `FR` | Page 5: Campaigns List Table | Columns: Name, Type, Status, Date range, Budget, Actual spend, Budget consumption progress bar, Leads, CPL, Owner avatar. Filter bar: Type, Status, Owner, Date range, Search by name. |
| `REQ-061` | p. 9 | `FR` | Page 5: Campaign Row Operations | Row actions: Copy campaign, Pause/Resume, Archive, Excel export. Warning indicator if spend exceeds budget. Empty state with "Create Campaign" button. |
| `REQ-062` | p. 9 | `FR` | Page 6: Campaign Wizard (6 Steps)| Step 1: Basics (Name, Type, Objective, Dates, Owner, Description); Step 2: Target Audience (search multi-select + modal create); Step 3: Platform Budgets (Platform, budget, quantity, note, total footer); Step 4: KPI Target selection & goals; Step 5: Landing page & UTM generator; Step 6: Full review summary with step edit links. |
| `REQ-063` | p. 10 | `FR` | Page 6: Wizard Auto-Save & Rules | Auto-save draft every 30s and upon step transition. Fixed bottom bar: Previous / Save Draft / Next. Warning if platform budgets exceed total campaign budget. |
| `REQ-064` | p. 10 | `UIX` | Page 7: Campaign Details Header | Fixed header with Name, Status, Date range, Owner, and actions (Edit, Copy, Pause/Resume). Tab navigation with active tab persisted in URL. Lazy-loads tabs on click. |
| `REQ-065` | p. 10 | `FR` | Page 7: Campaign 8 Tabs | Summary (KPIs, Strengths & Weaknesses columns, Suggested Actions); Platforms (table + Log Cost button); Leads (mini funnel + campaign leads table); Landing (URL, UTM links, form counts); SMS (deliveries & numbers, conditional visibility); Schedule & Equipment (timeline + equipment checklist); Tasks (linked tasks); Analysis (metrics vs type averages). |
| `REQ-066` | p. 11 | `FR` | Page 8: Platforms Management | Table: Name, Type, Data retrieval method (Manual/API/Import), Status (Active/Inactive), Active campaigns count. Edit drawer: Name, Type, Method, Inputs definition (field name, type, required), Outputs definition (report columns). Add platform from template. Deactivation warning: "Currently used in X campaigns". |
| `REQ-067` | p. 11 | `FR` | Page 9: Costs Tracking Table | Top summary bar: Total spend with active filter, spend by platform horizontal bar. Filter bar. Table: Date, Campaign, Platform, Quantity, Amount, Source (Manual/Import), Creator, Note. |
| `REQ-068` | p. 11-12| `FR` | Page 9: Costs Entry Drawers | Quick log drawer: Campaign, Platform, Date, Quantity, Amount, Description (clears only amount for rapid consecutive entry). Batch entry table with Excel paste support. Row edit/delete with confirm dialog. Navigate to Import. |
| `REQ-069` | p. 12 | `FR` | Page 10: Import History List | History table: Date, Data type, File name, User, Valid/Error row counts, Status badge. "New Import" primary button. |
| `REQ-070` | p. 12 | `FR` | Page 10: Import 4-Step Wizard | Step 1: Select data type & drag-and-drop file upload; Step 2: Column mapping table (file column -> system field) with sample values; Step 3: 20-row preview + summary (valid, duplicate, error counts) + errors list; Step 4: Execution progress bar & outcome. |
| `REQ-071` | p. 12-13| `FR` | Page 10: Import Actions & Rules | Download sample file, save column mapping for reuse, download error file, duplicate handling strategy ("Ignore" vs "Update"). Background execution allows leaving page. |
| `REQ-072` | p. 13 | `FR` | Page 11: KPI & Metrics Engine | Tab 1: KPIs table (Metric, Scope, Target, Current value, Progress, Period); Tab 2: Metrics list (read-only defaults + custom metrics), Formula builder (variables, operators, preview on sample campaign, Persian validation); Tab 3: Alert rules sentence builder ("If [Metric] is [greater/less than] [Value], trigger [Message] and [Suggested Action]"), Direction of improvement toggle. |
| `REQ-073` | p. 13-14| `FR` | Page 12: Target Audiences | Card list / Table, Details page (demographics + table of campaigns using audience with spend, leads, CPL, conversion rate). Create form: Name, Age range, Gender, Cities, Interests tags, Channel, Description. Delete restricted to unused audiences. |
| `REQ-074` | p. 14 | `FR` | Page 13: Landing & UTM Builder | Landings table: Title, URL, Connection status, 7-day leads, Total leads, Inactive warning if no leads in 30 days, HTTPS validation. UTM Builder: Target landing, Source platform, Medium, Campaign, Content, Term; Live generated URL preview, Copy button, History table, GA4 guide. |
| `REQ-075` | p. 14-15| `FR` | Page 14: Leads Inbox Table | Columns: Name, Phone (masked + copy), Source, Campaign, Ad/UTM, Creation date, Status, Sales agent, Next follow-up date. Filters: Status, Sales agent, Campaign, Source, Date range, "Without follow-up". Primary buttons: "New Lead" manual modal & "Import". |
| `REQ-076` | p. 15 | `FR` | Page 14: Leads Batch & Mobile | Batch actions: Bulk assign to sales agent, Bulk change status. Warning indicator if lead is "New" for > 24 hours. Duplicate check on manual creation ("Number already registered" + link to existing lead). Mobile card list with direct call button. Excel export. |
| `REQ-077` | p. 15-16| `FR` | Page 15: Lead Follow-up Kanban | 6 horizontal scrollable columns (New, Contacted, Qualified, Proposal, Customer, Lost). Column header: Status, count, total deal value. Draggable cards: Name, Campaign badge, Phone, Next follow-up (red if overdue), Agent avatar. Dragging to Lost opens reason modal; Customer opens deal value modal. Mobile status menu fallback. |
| `REQ-078` | p. 16 | `UIX` | Page 16: Lead Journey Header | Top journey bar: Source -> Campaign -> Current Status -> Customer/Lost. Two columns: Right = Specs and actions, Left = Chronological activity timeline. Mobile stacks specs above timeline. |
| `REQ-079` | p. 16 | `FR` | Page 16: Lead Quick Call Logging | Specs: Demographics, UTM, Agent, Deal value, Lost reason, Next follow-up. Timeline: Ad click, Landing visit, Form submit, Assignment, Calls, Notes, Status changes, Proposal, Won/Lost. Quick call logging form permanently docked above timeline. Add note, Set reminder, Change status, Reassign. |
| `REQ-080` | p. 16-17| `FR` | Page 17: SMS Broadcasts | List view: Date, Campaign, Snippet, Sent, Delivered, Cost. Details view: Summary stats (Total, Delivered, Failed, Replies, Cost per SMS) + Recipients table (masked phone, status, timestamp, reply). Import delivery results, convert respondents to leads, Excel export. |
| `REQ-081` | p. 17-18| `FR` | Page 18: Webinar Lifecycle | List view: Title, Date, Status, Registered, Attended, Campaign. Details view with 4 tabs: Info, Attendees (Name, Phone, Registered, Attended, Converted to lead), Equipment checklist, Linked tasks. Mini funnel: Registered -> Attended -> Lead. Import attendees/presence, convert attendees to leads with new vs duplicate preview. |
| `REQ-082` | p. 18 | `FR` | Page 19: Operational Tasks | Switches: "My Tasks" vs "Team Tasks", "List View" vs "Board View". Grouped list: Overdue, Today, This week, Later, Completed. Details drawer: Title, Description, Assignee, Deadline, Priority, Status, Entity link, SOP link, Subtasks checklist, Comments with @mentions, History log. Quick inline add field. Create task from SOP template. Overdue badge with "X days overdue". |
| `REQ-083` | p. 18-19| `FR` | Page 20: Shamsi Calendar | Month/Week switch, Today button, Event type filter and color legend, Jalali month grid, Day click to create event/task, Drag to reschedule, Event details drawer (Title, Type, Date/Time, Assignee, Entity link, Equipment readiness status). Multi-day campaign bars, Webinar events, Meetings, Task deadlines. Week starts Saturday, Friday distinct color. Mobile agenda view. |
| `REQ-084` | p. 19-20| `FR` | Page 21: Equipment Management | Two views: "Shortages" (default) and "All Equipment". Shortages grouped by execution date (item, campaign/webinar, status [ready/incomplete/not prepared], responsible person, deadline, warning if incomplete < 3 days to event). All Equipment table with status/assignee filters. Equipment templates list. Change readiness status from list, Add equipment, Apply template. |
| `REQ-085` | p. 20 | `FR` | Page 22: Meeting Minutes | Meetings list (Title, Date, Attendees avatars, Dispatch status). Reading page (800px max width). Form: Title, Date/Time, Attendees, Agenda, Decisions, Action items table (Description, Assignee, Deadline, Convert to task status). Dispatch status (recipients list & delivery time). "Send to all" with email preview & confirmation. "Convert action items to tasks". Version history. |
| `REQ-086` | p. 20-21| `FR` | Page 23: SOP Knowledge Base | Categorized card list, Reading page (800px) with edit mode. Details: Objective, Scope, Owner, Numbered procedure steps, Checklist, Attachments. Sidebar version selector & history list. "Create task from SOP" prominent button. Edit SOP (Manager only), Publish new version, Search, Draft vs Published badge, Clean print stylesheet. |
| `REQ-087` | p. 21 | `FR` | Page 24: Learning & LMS Hub | Regular user tabs: "Library" and "My Courses"; Manager tab: "Team Progress". Library cards (Title, Category, Software, Duration) with filters. Inline video/article player with "Completed" button. Video player with speed control and resume playback timestamp. My Courses with progress bars. Team Progress matrix (User × Course with completion status). Manager assign course to user. |
| `REQ-088` | p. 21-22| `FR` | Page 25: Ideas Incubator | Quick submit field at top, Status filter, Card list (Title, Short description, Submitter, Date, Related campaign, Votes count, Status). Details drawer: Description, Status history, Linked task, Execution result. 1-click upvoting (reversible). Manager change status. "Convert to task" button. "Log execution result" for implemented ideas. Executed ideas highlighted. |
| `REQ-089` | p. 22-23| `FR` | Page 26: Activity Report Feed | Role filter (Manager sees all / Users see own activity only), Date range filter, Summary KPI cards (Tasks completed, On-time completion %, Calls logged, Costs logged), Team comparison table (User, Tasks completed, In-progress, Overdue, Calls, Last activity), Live activity feed ("Ali Mohammadi changed lead X status to Qualified" + timestamp + link). Excel export. |
| `REQ-090` | p. 23 | `FR` | Page 27: Users & RBAC Matrix | Tab 1 Users table: Name, Email/Mobile, Role, Status (Active/Invited/Inactive), Last login. Invite user drawer (Email, Role), Change user role, Deactivate user with impact confirmation modal, Resend invitation. Tab 2 Permissions Matrix (Rows = Operations, Columns = Roles, Cells = Checkmark toggles). Guarantee at least one active Admin per organization. Admin role transfer workflow. |
| `REQ-091` | p. 23-24| `FR` | Page 28: Organization Settings | Taxonomy management tabs: Campaign Types, Lead Sources, Lead Statuses with pipeline group (Open/Won/Lost), Lost Reasons, Cost Categories. General settings tab: Org name, Logo upload, Monetary unit (Toman/Rial), Timezone. Drag-and-drop reordering, Active/Inactive toggle, Usage counter, Deletion restriction on in-use items ("Used in X records; only deactivation allowed"). |
| `REQ-092` | p. 24 | `FR` | Page 29: WordPress Connection | Connection status card (Connected/Disconnected, Last lead received timestamp, 7-day lead count). API key generation (shown once with copy button, revokes previous key with confirmation). Setup guide steps (Download plugin, Install, Enter key, Test). "Test Connection" button. Field mapping table (WordPress form field -> Lead system field). Rejected webhooks log table. |

---

### 2.5 Technical Architecture & Non-Functional Directives (PDF p. 26-29, §4-5)

| Req ID | PDF Page | Category | Title & Summary | Requirement Description & Specification Rules |
| :--- | :---: | :---: | :--- | :--- |
| `REQ-093` | p. 26 | `NFR` | Next.js App Router Structure | Directory structure with `(auth)` and `(app)` route groups. Route protection via `middleware.ts`, `loading.tsx` and `error.tsx` per segment, RTL root layout (`<html lang="fa" dir="rtl">`), local Persian fonts (Vazirmatn / IRANSans). |
| `REQ-094` | p. 26 | `UIX` | shadcn/ui RTL Tokens | shadcn/ui components customized for RTL with Tailwind logical properties (`start/end`, `ms/me/ps/pe`, `rotate-180:rtl`), semantic CSS design tokens for colors/spacing to support theme customization. |
| `REQ-095` | p. 26 | `NFR` | TanStack Query Server State | All read queries via `useQuery`, mutations via `useMutation`. Structured query keys (`['campaigns', 'list', filters]`). Automatic invalidation (logging cost or updating lead invalidates dashboard & campaign list). Optimistic updates with rollback for Kanban. Polling `refetchInterval` for background jobs. Lazy tab loading (`enabled: isSelected`). |
| `REQ-096` | p. 27 | `NFR` | Axios Centralized API Client | Shared `apiClient` instance with versioned baseURL (`/api/v1`), interceptor for 401 token refresh queue with HttpOnly cookies, error interceptor normalizing server error payload (`code`, `message`, `fields`). Module API functions called exclusively via TanStack Query hooks. Old request cancellation on filter switch via `AbortController`. `onUploadProgress` for file imports. |
| `REQ-097` | p. 27 | `NFR` | Zod Form Validation Engine | Zod schemas for all forms with TypeScript type inference (`z.infer`). Centralized Persian error message mapping. Input conversion inside schema: Persian digits to English numerals, thousands separator removal, mobile normalization. Business rules: end date after start date, positive amounts, valid Iranian mobile. TanStack Form integration with onBlur/onSubmit validation and server error mapping (`setErrorMap`). |
| `REQ-098` | p. 27 | `NFR` | Zustand Client State | Zustand stores strictly for client-only UI state (no server caching duplication): `authStore` (user, active organization, role, permissions `can()`), `uiStore` (sidebar collapsed, table density, active tabs, persisted in localStorage), `wizardStore` (multi-step draft persistence across steps). |
| `REQ-099` | p. 28 | `UIX` | Lucide & Framer Motion | Lucide icons with consistent sizing/stroke, Persian aria-labels for icon-only buttons, RTL inverted direction arrows, centralized entity icon mapping. Framer Motion for subtle transitions (drawers, modals, tabs, toast, dashboard card entry), duration 150-250ms, respect `prefers-reduced-motion`. |
