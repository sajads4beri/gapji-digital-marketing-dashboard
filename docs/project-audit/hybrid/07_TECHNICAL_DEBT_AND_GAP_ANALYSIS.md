# 07 — TECHNICAL DEBT & GAP ANALYSIS (تحلیل جامع بدهی فنی و مغایرت‌ها)
## رجیستری بدهی‌های فنی، نقاط آسیب‌پذیری و مغایرت با سند مصوب

---

## 1. TECHNICAL DEBT REGISTER (ثبت تفصیلی بدهی‌های فنی)

| Debt ID | Category | Summary & Impact (شرح بدهی و اثر فنی) | Severity | Planned Phase |
| :--- | :--- | :--- | :---: | :---: |
| **DEBT-001** | Git / Arch | تفکیک دوشاخه‌ای گیت بین فرانت‌اند و بک‌اند و عدم ادغام در یک مونورپوی واحد | `P0 - Blocker` | PHASE-001 |
| **DEBT-002** | Security | نشت اطلاعات لیدها برای نقش Sales Agent در لایه Mock به دلیل عدم فیلتر کاربر | `P0 - Critical` | PHASE-003/009 |
| **DEBT-003** | Scope Gap | غیبت کامل ۹ صفحه از ۲۹ صفحه مندرج در سند پی‌دی‌اف در ساختار کدهای فرانت‌اند | `P1 - High` | PHASE-011/013 |
| **DEBT-004** | Stack Gap | عدم نصب پکیج‌های الزامی سند (TanStack Query, Zod, Form, @dnd-kit, Zustand) | `P1 - High` | PHASE-002 |
| **DEBT-005** | Reliability | تکیه بر داده‌های فرضی مرورگر (LocalStorage Fallback) به جای وب‌سرویس زنده | `P1 - High` | PHASE-002–010 |
| **DEBT-006** | Type Safety | خالی بودن ۸۵ درصد پکیج `@gapji/shared` از اینترفیس‌های دامنه کسب‌وکار | `P1 - High` | PHASE-001 |
| **DEBT-007** | DevOps | نبود پایپ‌لاین تست و بیلد خودکار CI/CD در ریپازیتوری گیت‌هاب | `P2 - Medium` | PHASE-014 |
| **DEBT-008** | Performance | نبود سرور پس‌زمینه ردیس و BullMQ جهت پردازش ایمپورت اکسل‌های چندهزارتایی | `P2 - Medium` | PHASE-008 |
