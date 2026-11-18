# 12 — FINAL ACCEPTANCE & SIGN-OFF CHECKLIST (چک‌لیست نهایی تحویل و پذیرش)
## ماتریس تحویل‌گیری رسمی تمام ۲۹ صفحه و قابلیت‌های پلتفرم Gapji

---

## 1. DESIGN SYSTEM & COMMON SHELL VERIFICATION (تایید پوسته مشترک)

- [ ] **Header Dynamic Org**: نام سازمان فعال و لوگو از `useAuth().activeOrgName` خوانده شده و تغییر سازمان در تمام ماژول‌ها بلادرنگ اعمال شود (`REQ-001`).
- [ ] **Header Global Search**: جستجوی لید (نام و موبایل) و کمپین (نام) با فیلتر سریع در کمتر از ۵۰۰ میلی‌ثانیه پاسخ دهد (`REQ-001`).
- [ ] **RBAC Navigation**: دسترسی منو برای هر یک از ۶ نقش (`admin`, `marketing_manager`, `campaign_manager`, `sales_agent`, `content_creator`, `client`) کنترل شود (`REQ-002`).
- [ ] **Server-side DataTable**: مرتب‌سازی، پنهان‌سازی ستون‌ها و صفحه‌بندی سمت سرور بدون افت پرفورمنس کار کند (`REQ-007`).
- [ ] **PersianDatePicker**: شروع هفته از شنبه، محاسبات سال‌های کبیسه ۳۳ ساله و تبدیل به ISO میلادی (`REQ-012`).
- [ ] **Data Formatting**: تفکیک سه‌رقمی مبالغ، خلاصه مقادیر بزرگ در کارت‌ها با تولتیپ و نمایش خط تیره «—» در مقادیر نامشخص (`REQ-022`, `REQ-026`).

---

## 2. 29 PAGES COMPLETION VERIFICATION (تایید تکمیل ۲۹ صفحه)

- [ ] **P-01**: Login & Select Org (`/login`, `/select-org`) (`REQ-030` to `REQ-038`)
- [ ] **P-02**: Role-based Home Page (`/`) (`REQ-039` to `REQ-047`)
- [ ] **P-03**: Notifications Center (`/notifications`) (`REQ-048` to `REQ-056`)
- [ ] **P-04**: Executive Dashboard (`/performance/dashboard`) (`REQ-057` to `REQ-067`)
- [ ] **P-05**: Campaigns List (`/campaigns`) (`REQ-068` to `REQ-077`)
- [ ] **P-06**: Campaign 6-Step Wizard (`/campaigns/new`) (`REQ-078` to `REQ-090`)
- [ ] **P-07**: Campaign 8-Tab Details (`/campaigns/:id`) (`REQ-091` to `REQ-104`)
- [ ] **P-08**: Ad Platforms Catalog (`/performance/platforms`) (`REQ-105` to `REQ-113`)
- [ ] **P-09**: Marketing Costs Management (`/performance/costs`) (`REQ-114` to `REQ-123`)
- [ ] **P-10**: Universal Data Import Engine (`/performance/imports`) (`REQ-124` to `REQ-134`)
- [ ] **P-11**: KPI Metrics & Sentence Alert Rules (`/performance/kpis`) (`REQ-135` to `REQ-145`)
- [ ] **P-12**: Target Audiences & Personas (`/performance/audiences`) (`REQ-146` to `REQ-154`)
- [ ] **P-13**: Landing Pages & Live UTM Builder (`/performance/landing`) (`REQ-155` to `REQ-165`)
- [ ] **P-14**: Leads Inbox with Phone Masking (`/leads`) (`REQ-166` to `REQ-177`)
- [ ] **P-15**: 6-Stage Lead Kanban Board (`/leads/board`) (`REQ-178` to `REQ-188`)
- [ ] **P-16**: Lead Details, Call Form & Journey (`/leads/:id`) (`REQ-189` to `REQ-201`)
- [ ] **P-17**: SMS Dispatches & Delivery Logs (`/leads/sms`) (`REQ-202` to `REQ-211`)
- [ ] **P-18**: Webinars & Attendee Conversion Funnel (`/leads/webinars`) (`REQ-212` to `REQ-222`)
- [ ] **P-19**: Task Management (List/Kanban, Quick Add) (`/work/tasks`) (`REQ-223` to `REQ-234`)
- [ ] **P-20**: Marketing Calendar with Multi-day Bars (`/work/calendar`) (`REQ-235` to `REQ-244`)
- [ ] **P-21**: Equipment Logistics & Shortages View (`/work/equipment`) (`REQ-245` to `REQ-253`)
- [ ] **P-22**: Meeting Minutes & Task Conversion (`/work/meetings`) (`REQ-254` to `REQ-263`)
- [ ] **P-23**: Standard Operating Procedures (SOP) (`/work/sops`) (`REQ-264` to `REQ-274`)
- [ ] **P-24**: Team Learning Library & Video Player (`/work/learning`) (`REQ-275` to `REQ-284`)
- [ ] **P-25**: Growth Ideas Board with Upvoting (`/work/ideas`) (`REQ-285` to `REQ-294`)
- [ ] **P-26**: Activity Report & Real-time Audit Feed (`/work/activity`) (`REQ-295` to `REQ-303`)
- [ ] **P-27**: Users Management & 29-Page Access Matrix (`/settings/users`) (`REQ-304` to `REQ-314`)
- [ ] **P-28**: Organization Taxonomy Settings (`/settings/organization`) (`REQ-315` to `REQ-324`)
- [ ] **P-29**: WordPress & Gravity Forms Integration (`/settings/wordpress`) (`REQ-325` to `REQ-335`)

---

## 3. FORMAL SIGN-OFF BLOCK (بخش تاییدیه رسمی)

| Role (سمت) | Signer (مسئول) | Status (وضعیت) | Date (تاریخ) |
| :--- | :--- | :---: | :---: |
| **Product Owner (کارفرما)** | Gapji Management | `PENDING_REVIEW` | — |
| **Principal Architect (معمار ارشد)**| Antigravity AI | `VERIFIED_AUDIT` | 2026-11-18 |
| **QA Lead (کنترل کیفیت)** | Automated Regression Suite | `CONDITIONAL (28/37)` | 2026-11-18 |
