# 11 — TESTING & ACCEPTANCE STRATEGY (راهبرد آزمون و کنترل کیفیت)
## ساختار هرم تست، نتایج اجرای ۳۷ اسکریپت تستی و آزمون‌های اعتبارسنجی فارسی

---

## 1. TESTING PYRAMID ARCHITECTURE (هرم تست و تضمین کیفیت)

```
                  / \
                 /   \
                / E2E \       Playwright: تست فرآیندهای کاربری در ۲۹ صفحه
               /-------\
              /  Integ  \     Supertest + Prisma Test DB: تست وب‌سرویس‌ها و وب‌هوک
             /-----------\
            /  Component  \   React Testing Library: آزمون ظاهر، مودال‌ها و کشوها
           /---------------\
          /   Unit Tests    \ Vitest / Node: آزمون تاریخ شمسی، فرمول‌ها و اعتبارسنجی
         +-------------------+
```

---

## 2. AUDIT RESULTS OF 37 VERIFICATION SCRIPTS (نتایج اجرای ۳۷ اسکریپت تستی)

- **۲۸ اسکریپت PASS (۷۵.۷٪ قبولی)**: شامل تست‌های تاریخ شمسی (`test-persian-date.mjs`)، فیلترها (`test-filter-service.mjs`)، جدول داده (`test-data-table-advanced.mjs`)، مدیریت هزینه‌ها (`verify-cost-management.js`) و برد کانبان (`verify-kanban-lifecycle.js`).
- **۹ اسکریپت FAIL (۲۴.۳٪ خطا)**:
  1. `test-auth-p0-1.mjs`: شکست سناریوی SCEN-18 به دلیل نام ثابت سازمان در هدر.
  2. `test-permissions-matrix.mjs`: شکست آیتم ITEM-08 به دلیل نشت لیدها میان کارشناسان فروش در لایه Mock.
  3. `verify-campaign-creation.js`: شکست ثبت کمپین در بک‌اند به دلیل خطای ۴۰۰ اعتبارسنجی DTO.
  4. `verify-dashboard.js`: شکست چند فیلد محاسباتی در سرویس داشبورد بک‌اند.
  5. ۵ اسکریپت وابسته به اعتبارسنجی‌های تکمیلی و DTOهای توزیع‌شده.
- **راهکار قطعی**: کلیه ۹ خطای شناسایی‌شده در فازهای ۱ تا ۶ نقشه راه با تست‌های رگرسیون برطرف و سبز خواهند شد.
