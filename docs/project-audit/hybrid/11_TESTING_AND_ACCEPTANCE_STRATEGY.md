# 11 — Testing and Acceptance Strategy | استراتژی جامع تست و پذیرش
## Gapji Digital Marketing Platform Deep Audit | ممیزی عمیق پلتفرم دیجیتال مارکتینگ گپ‌جی

---

## 1. Testing Philosophy & Verification Levels | فلسفه تست و سطوح راستی‌آزمایی

استراتژی تست و تضمین کیفیت پلتفرم گپ‌جی منطبق بر هرم تست استاندار (**Testing Pyramid**) طراحی شده است. اولویت اصلی بر آزمون‌های سریع، قطعی و مستقل لایه واحد (Unit) و قراردادهای تایپ در قاعده هرم قرار دارد که توسط آزمون‌های ایزوله یکپارچگی (Integration)، آزمون‌های بصری کامپوننت‌ها (Component) و در نهایت سناریوهای سرتاسری جریان کاربر (End-to-End) پشتیبانی می‌شود.

The testing strategy follows the **Testing Pyramid**, prioritizing fast, deterministic unit tests and contract validations at the base, supported by isolated integration tests, component visual verifications, and automated end-to-end user journey validations.

```mermaid
graph BT
    subgraph Pyramid["Verification Levels | سطوح راستی‌آزمایی"]
        E2E["Level 4: End-to-End Workflows (Playwright)<br/>جریان‌های کاربر سرتاسری"]
        Integration["Level 3: Backend API Integration Tests (NestJS + Supertest)<br/>یکپارچگی پایگاه‌داده و سرویس‌ها"]
        Component["Level 2: Frontend Component Tests (React Testing Library)<br/>رندرینگ و تعاملات کامپوننت"]
        Unit["Level 1: Unit & Contract Tests (Node.js / ts-node / assert)<br/>الگوریتم‌های محاسباتی و تاریخ"]
    end

    Unit --> Component
    Component --> Integration
    Integration --> E2E
```

---

## 2. Testing Levels & Tooling Registry | ثبت سطوح تست و ابزارهای مورد استفاده

| Testing Level (سطح تست) | Primary Tooling (ابزار اصلی) | Target Scope (دامنه هدف) | Execution Environment (محیط اجرا) | Gating Policy (سیاست دروازه ورود) |
| :--- | :--- | :--- | :--- | :--- |
| **Level 1: Unit Tests**<br/>تست‌های واحد | `ts-node`, `node:assert`, Jest | Date algorithms (تقویم جلالی), formulas (فرمول‌های KPI), DTO transformations | In-memory, zero DB required (حافظه رم بدون پایگاه‌داده) | **Mandatory on every commit** (اجباری در هر کامیت، قبولی ۱۰۰٪) |
| **Level 2: Component Tests**<br/>تست کامپوننت‌ها | React Testing Library, Vitest | Common primitives (DataTable, FilterBar, KpiCard, Wizard) | Virtual DOM (jsdom) | **Mandatory on PR** (اجباری در پول‌ریکوئست) |
| **Level 3: API Integration**<br/>تست‌های یکپارچگی وب‌سرویس | NestJS Testing, Supertest | Controller routing, validation pipes, Prisma transactions | Isolated PostgreSQL test container (پایگاه‌داده تستی ایزوله) | **Mandatory on PR** (اجباری قبل از ادغام) |
| **Level 4: Security & RBAC**<br/>تست‌های امنیت و دسترسی | Standalone verification scripts | Permissions matrix, data ownership, token rotation | Sandboxed test database | **Mandatory before release** (اجباری قبل از انتشار) |
| **Level 5: End-to-End (E2E)**<br/>تست سرتاسری جریان کاربر | Playwright | Critical user journeys (Login -> Campaign -> Cost -> Lead) | Headless Chromium browser | **Mandatory before release** (اجباری در استقرار نهایی) |

---

## 3. Existing Test Suites & Execution Instructions | سوئیت‌های تست موجود و راهنمای اجرا

پروژه در حال حاضر شامل **۳۸ اسکریپت راستی‌آزمایی** در `apps/web/scripts` و **۲۱ فایل آزمون یکپارچگی** در `apps/api/src/modules/` می‌باشد.

The project currently contains **38 verification scripts** in `apps/web/scripts` and **21 integration spec files** in `apps/api/src/modules/`.

### Verified Non-Destructive In-Memory Tests | آزمون‌های غیرمخرب و بدون نیاز به پایگاه‌داده:
این آزمون‌ها بدون دستکاری پایگاه‌داده یا ساختار مخزن در فاز ممیزی اجرا شده و با موفقیت ۱۰۰٪ سپری شدند:

```bash
# 1. Jalali Calendar & Leap Year Engine (11,323 days verification: 1390-1420)
# راستی‌آزمایی موتور تقویم جلالی و سال‌های کبیسه در ۱۱٬۳۲۳ روز متوالی
node apps/web/scripts/test-persian-date.mjs

# 2. PDF Roles & Permissions Matrix Verification (18 verification items)
# راستی‌آزمایی ماتریس نقش‌ها و مجوزهای دسترسی سند مشخصات (۱۸ مورد)
node apps/web/scripts/test-permissions-matrix.mjs

# 3. Lead CRM Hardening & Canonical Sales Agent Ownership (11 scenarios)
# راستی‌آزمایی ایزولاسیون سرنخ‌ها و تفکیک دسترسی کارشناسان فروش (۱۱ سناریو)
node apps/web/scripts/test-permissions-hardening-gap01-gap03.mjs

# 4. Sidebar, Navigation, Pure Light Mode & shadcn/ui Conformance
# راستی‌آزمایی منوی ناوبری، تم روشن خالص و انطباق با استایل‌های shadcn/ui
node apps/web/scripts/test-sidebar-darkmode-shadcn-iransans.mjs

# 5. FilterBar Bidirectional Query Persistence & Date Ranges
# راستی‌آزمایی نوار فیلتر و همگام‌سازی دوطرفه با پارامترهای آدرس URL
node apps/web/scripts/test-filter-service.mjs

# 6. DataTable Sorting, Server Pagination, & Density Modes
# راستی‌آزمایی مرتب‌سازی، صفحه‌بندی سمت سرور و تراکم جدول داده‌ها
node apps/web/scripts/test-data-table.mjs

# 7. Backend CampaignsService Unit Tests (Mock Prisma)
# آزمون واحد سرویس کمپین‌های بک‌اند با استفاده از ساختار ماک
pnpm --filter @gapji/api test
```

---

## 4. Test Environment Isolation & Database Reset Policy | سیاست ایزولاسیون محیط تست و ریست پایگاه‌داده

برای اجرای ایمن ۲۱ فایل آزمون یکپارچگی بک‌اند (`*.integration.spec.ts`) بدون ایجاد تداخل با داده‌های اصلی سیستم:

To safely run the 21 backend integration specs without corrupting development or production data:

1. **Dedicated Test Database (پایگاه‌داده مجزای تستی):**
   آزمون‌های یکپارچگی الزماً باید به یک دیتابیس تستی کاملاً مستقل از طریق متغیر محیطی `DATABASE_URL_TEST` متصل گردند:
   `postgresql://postgres:postgres@localhost:5432/gapji_marketing_test`
2. **Automated Migration & Seed Harness (آماده‌سازی خودکار دیتابیس تست):**
   پیش از اجرای آزمون‌های یکپارچگی، پایگاه‌داده تستی ریست و داده‌های پایه بارگذاری می‌شوند:
   ```bash
   pnpm --filter @gapji/api prisma migrate reset --force --skip-seed
   pnpm --filter @gapji/api ts-node prisma/seed.ts
   ```
3. **Transactional Rollback (عقب‌گرد تراکنش‌ها):**
   هر سوئیت آزمون عملیات خود را درون یک تراکنش مجزای PostgreSQL اجرا کرده و در پایان تست با دستور `ROLLBACK` داده‌ها را پاکسازی می‌کند تا هیچ‌گونه اثر جانبی (Side Effect) میان آزمون‌ها باقی نماند.

---

## 5. Quality Gates for CI/CD Pipeline | دروازه‌های کیفیت در خط لوله یکپارچه‌سازی مداوم

برای تضمین سلامت معماری و پایداری کد در استقرار نسخه‌ها، خط لوله CI/CD موظف به رعایت ۴ دروازه کنترل کیفیت متوالی است:

To maintain 100% technical and architectural integrity, the CI/CD pipeline enforces the following four sequential quality gates:

```mermaid
flowchart LR
    G1["Gate 1: Static Analysis<br/>(تحلیل ایستای کدهای TypeScript و لینت)"] --> G2["Gate 2: Unit Tests<br/>(تست‌های محاسباتی و تقویم جلالی)"]
    G2 --> G3["Gate 3: Integration Tests<br/>(یکپارچگی وب‌سرویس و دسترسی‌ها)"]
    G3 --> G4["Gate 4: Production Build<br/>(کامپایل تمیز Next.js و NestJS)"]
```

1. **Gate 1: Static Analysis (تحلیل ایستا):** دستورات `pnpm lint` و `pnpm tsc --noEmit` باید بدون هیچ‌گونه خطا (Error) یا هشدار متوقف‌کننده سپری شوند.
2. **Gate 2: Unit Tests (تست‌های واحد):** کلیه آزمون‌های واحد در پروژه‌های `apps/api` و `apps/web` باید با نرخ قبولی ۱۰۰٪ پاس شوند.
3. **Gate 3: Integration Tests (تست‌های یکپارچگی):** مشخصات آزمون یکپارچگی با پایگاه‌داده ایزوله تستی با موفقیت کامل اجرا گردند.
4. **Gate 4: Production Build (کامپایل نهایی تولید):** بیلد نهایی بسته‌های `@gapji/shared`، `@gapji/api` و `@gapji/web` با دستور `pnpm build` بدون خطا تولید گردد.
