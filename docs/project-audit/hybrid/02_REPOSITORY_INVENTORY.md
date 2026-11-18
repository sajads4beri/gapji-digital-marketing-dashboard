# 02 — REPOSITORY INVENTORY & ASSET CLASSIFICATION (کاتالوگ مخزن و طبقه‌بندی دارایی‌ها)
## شناسنامه کدهای پروژه، ساختار پکیج‌ها و وضعیت شاخه‌ها

---

## 1. WORKSPACE STRUCTURE & REPOSITORY ROOTS (ساختار ریشه مونورپو)

| File / Folder (مسیر) | Category (دسته‌بندی) | Purpose & Ownership (کارکرد و نقش) | Audit Classification (ارزیابی فارنزیک) |
| :--- | :--- | :--- | :--- |
| `apps/web/` | Application | فرانت‌اند Next.js 14 App Router | ۲۰ صفحه پیاده‌شده با استیت موقت؛ ۹ صفحه غایب |
| `apps/api/` (شاخه فعال) | Application | بک‌اند NestJS با TypeORM | اسکلت اولیه مسدود در کامیت `9f5b8d7` (فقط کمپین ساده) |
| `F:/marketing-platform-backend`| Repository Branch | بک‌اند توسعه‌یافته با Prisma 5.22 | ۱۶ ماژول و ۴۸ مدل پریزما؛ در حال اجرا روی پورت ۳۰۰۱ |
| `packages/shared/` | Shared Package | تایپ‌ها و DTOهای مشترک مونورپو | ناقص (فقط چند اینترفیس ساده کمپین)؛ نیازمند به‌روزرسانی |
| `audit-reports/` | Audit Archive | گزارش‌های ممیزی اولیه و گذشته | آرشیو تاریخی (شامل HTML و PDF ممیزی نسخه B2.5.0) |
| `docs/project-audit/` | Audit Directory | مستندات این ممیزی و نقشه راه ۱۰۰٪ | ایجاد شده به عنوان دایرکتوری اختصاصی و حفاظت‌شده |
| `docker-compose.yml` | Infrastructure | کانتینر داکر PostgreSQL 15 | فعال روی پورت ۵۴۳۲ با ولوم ذخیره‌سازی پایدار |
| `.env.example` | Configuration | قالب متغیرهای محیطی | امن و بدون اطلاعات حساس محرمانه |
| `marketing-platform-phase1-frontend-pages-1.pdf` | Specification | سند ۲۹ صفحه‌ای اختصاصی فرانت‌اند | مرجع اصلی و بدون تناقض کلیه نیازمندی‌ها |
| `apps/web/scripts/` | Verification | ۳۷ اسکریپت تست تشخیصی خودکار | ۲۸ اسکریپت PASS و ۹ اسکریپت FAIL با شواهد تفکیک‌شده |
