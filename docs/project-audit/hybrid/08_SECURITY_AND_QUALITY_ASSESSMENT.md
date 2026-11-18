# 08 — SECURITY & QUALITY ASSESSMENT (ارزیابی امنیت و کیفیت نرم‌افزار)
## ممیزی امنیت استاتیک، سطوح دسترسی ۶ نقش، ارزیابی OWASP و استانداردهای کیفی

---

## 1. AUTHENTICATION & SESSION ARCHITECTURE (معماری احراز هویت و نشست)

- **In-Memory Access Tokens**: توکن دسترسی در حافظه جاوااسکریپت (`memoryAccessToken`) نگهداری می‌شود و در `localStorage` ذخیره نمی‌گردد که مانع از آسیب‌پذیری در برابر سرقت توکن از طریق XSS می‌شود.
- **HttpOnly Refresh Cookies**: تمدید خودکار نشست کاربر از طریق کوکی امن `HttpOnly` با فلگ `SameSite: Lax` انجام می‌گیرد.
- **Argon2id Password Hashing**: رمزهای عبور کاربران در دیتابیس با استاندارد قدرتمند Argon2 هش می‌شوند.
- **Concurrent Request Queueing**: رهگیر خطای ۴۰۱ در `apps/web/src/lib/api.ts` درخواست‌های موازی را در صف نگه می‌دارد تا تنها یک درخواست تمدید توکن ارسال شود و از تداخل نشست جلوگیری گردد.

---

## 2. RBAC & DATA ISOLATION ENFORCEMENT (کنترل سطح دسترسی و ایزولاسیون داده‌ها)

- **Phone Number Masking**: شماره موبایل مشتریان بالقوه برای نقش‌های غیرمجاز به صورت `۰۹۱۲***۴۵۶۷` ماسک می‌شود. در فاز ۹، ماسک کردن به سطح سرور منتقل می‌شود تا از نشت شماره کامل در ترافیک شبکه جلوگیری شود.
- **Multi-Tenant Scoping**: تمام جداول پایگاه داده در Prisma دارای کلید خارجی `organizationId` هستند تا از عدم تداخل اطلاعات سازمان‌های مختلف اطمینان حاصل شود.
- **Resolution of ITEM-08 Bug**: شرط `where: { assignedToId: user.id }` در فاز ۳ برای نقش `sales_agent` در سرویس بک‌اند اعمال می‌گردد.
