# ۰۵ — ماتریس تطبیق نیازمندی‌ها با کد واقعی و وضعیت پیاده‌سازی
## پلتفرم کنترل فرآیندهای دیجیتال مارکتینگ و مدیریت کمپین گپجی

---

## ۱. تعاریف وضعیت‌های هشت‌گانه ممیزی

هر یک از ۹۹ نیازمندی استخراج‌شده بر اساس شواهد مستقیم کدهای موجود به یکی از ۸ وضعیت زیر تفکیک شده است:

1. `PRODUCTION_READY` (آماده بهره‌برداری عملیاتی): به صورت کامل در بک‌اند، دیتابیس و فرانت‌اند پیاده شده، تست‌های خودکار را پاس کرده و استانداردهای اعتبارسنجی و بومی‌سازی را داراست.
2. `IMPLEMENTED_AND_TESTED` (پیاده‌سازی‌شده و آزموده‌شده): کدها در فرانت‌اند و بک‌اند وجود داشته و با تست‌های خودکار یا بازبینی استاتیک تایید شده‌اند.
3. `IMPLEMENTED_UNVERIFIED` (پیاده‌سازی‌شده بدون آزمون کامل): کد در دو لایه نوشته شده اما تست کامل اند-تو-اند به دلیل ممانعت از دستکاری دیتابیس اجرا نشده است.
4. `PARTIALLY_IMPLEMENTED` (پیاده‌سازی ناقص): بخش عمده‌ای از کد وجود دارد اما برخی جریان‌های کاری (مانند خروجی، فیلتر یا ذخیره) کامل نیست.
5. `UI_ONLY` (صرفاً ظاهر گرافیکی): ظاهر بصری صفحه یا فرم وجود دارد اما داده‌ها ساختگی (Mock) است و به سرویس بک‌اند متصل نیست.
6. `NOT_IMPLEMENTED` (پیاده‌سازی‌نشده / غایب): هیچ صفحه یا ماژول بک‌اندی برای این قابلیت در پروژه ساخته نشده است.
7. `BLOCKED` (مسدودشده): پیاده‌سازی به دلیل موانع محیطی یا وابستگی‌های بیرونی معلق است.
8. `UNCLEAR` (مبهم یا نامشخص): نیازمندی در سند دچار ابهام است و نیاز به تصمیم کارفرما دارد.

---

## ۲. ماتریس ارزیابی و تطبیق ۹۹ نیازمندی

| شناسه | ماژول مربوطه | وضعیت پیاده‌سازی | مسیر فایل‌ها و کامپوننت‌های مرتبط | شواهد و شیوه‌نامه راستی‌آزمایی | کارهای باقیمانده | فاز پیشنهادی |
| :--- | :--- | :---: | :--- | :--- | :--- | :---: |
| `REQ-001` | هدر سامانه | `IMPLEMENTED_AND_TESTED` | `apps/web/src/components/layout/header.tsx` | منوی سوییچ سازمان با `useAuth()` متصل است | ندارد | وضعیت فعلی |
| `REQ-002` | هدر سامانه | `UI_ONLY` | `apps/web/src/components/layout/header.tsx` | کادر جستجو فقط ظاهر بصری دارد و API ندارد | ساخت اندپوینت `/api/search/global` | `PHASE-001` |
| `REQ-003` | هدر سامانه | `UI_ONLY` | `apps/web/src/components/layout/header.tsx` | آرایه ثابت ۳ اعلان فرضی در state کامپوننت هدر | اتصال به سرویس واقعی و کشوی اعلان‌ها | `PHASE-002` |
| `REQ-004` | هدر سامانه | `IMPLEMENTED_AND_TESTED` | `apps/web/src/components/layout/header.tsx` | نمایش نقش فعال و خروج از حساب کاربری فعال است | ندارد | وضعیت فعلی |
| `REQ-005` | منوی کناری | `IMPLEMENTED_AND_TESTED` | `apps/web/src/config/navigation.ts` | تعریف ۴ گروه ناوبری مطابق سند تایید شد | ندارد | وضعیت فعلی |
| `REQ-006` | منوی کناری | `IMPLEMENTED_AND_TESTED` | `apps/web/src/components/layout/sidebar.tsx` | فیلتر آیتم‌ها بر اساس نقش با `canAccessRoute` | ندارد | وضعیت فعلی |
| `REQ-007` | منوی کناری | `IMPLEMENTED_AND_TESTED` | `apps/web/src/components/layout/sidebar.tsx` | هایلایت آیتم فعال با کلاس‌های CSS تایید شد | ندارد | وضعیت فعلی |
| `REQ-008` | منوی کناری | `IMPLEMENTED_AND_TESTED` | `apps/web/src/components/layout/sidebar.tsx` | تولتیپ شناور در حالت جمع‌شده و کشوی موبایل فعال است | ندارد | وضعیت فعلی |
| `REQ-009` | ناوبری | `IMPLEMENTED_AND_TESTED` | `apps/web/src/components/layout/breadcrumb.tsx` | نمایش مسیر در صفحات جزئیات کمپین و لید تایید شد | ندارد | وضعیت فعلی |
| `REQ-010` | چیدمان | `IMPLEMENTED_AND_TESTED` | کامپوننت‌های صفحات در `(app)/*` | عنوان صفحه و دکمه عملیات اصلی تایید شد | ندارد | وضعیت فعلی |
| `REQ-011` | چیدمان | `IMPLEMENTED_AND_TESTED` | `apps/web/src/app/(app)/layout.tsx` | رعایت عرض‌های حداکثر ۱۴۴۰ و ۸۰۰ پیکسل | ندارد | وضعیت فعلی |
| `REQ-012` | پیام‌های لحظه‌ای | `IMPLEMENTED_AND_TESTED` | `apps/web/src/components/common/toast-provider.tsx` | بسته شدن خودکار ۵ ثانیه و باز ماندن خطا | ندارد | وضعیت فعلی |
| `REQ-013` | جدول داده | `IMPLEMENTED_AND_TESTED` | `apps/web/src/components/common/data-table.tsx` | منوی فعال/غیرفعال کردن نمایش ستون‌ها فعال است | ندارد | وضعیت فعلی |
| `REQ-014` | جدول داده | `IMPLEMENTED_AND_TESTED` | `apps/web/src/components/common/data-table.tsx` | مرتب‌سازی با موفقیت در `test-data-table.mjs` پاس شد | ندارد | وضعیت فعلی |
| `REQ-015` | جدول داده | `IMPLEMENTED_AND_TESTED` | `apps/web/src/components/common/data-table.tsx` | صفحه‌بندی ۲۰، ۵۰ و ۱۰۰ سطر تست و تایید شد | ندارد | وضعیت فعلی |
| `REQ-016` | جدول داده | `IMPLEMENTED_AND_TESTED` | `apps/web/src/components/common/data-table.tsx` | چک‌باکس سطور و نوار عملیات گروهی پیاده شده است | ندارد | وضعیت فعلی |
| `REQ-017` | جدول داده | `IMPLEMENTED_AND_TESTED` | `apps/web/src/components/common/data-table.tsx` | ردیف جمع مقادیر در جدول کمپین‌ها و هزینه‌ها فعال است | ندارد | وضعیت فعلی |
| `REQ-018` | جدول داده | `IMPLEMENTED_AND_TESTED` | `apps/web/src/stores/ui-store.ts` | سوییچ تراکم فشرده با ماندگاری در حافظه محلی | ندارد | وضعیت فعلی |
| `REQ-019` | جدول داده | `IMPLEMENTED_AND_TESTED` | `apps/web/src/components/common/data-table.tsx` | کلیک روی سطر به صفحه جزئیات لید/کمپین می‌رود | ندارد | وضعیت فعلی |
| `REQ-020` | جدول داده | `IMPLEMENTED_AND_TESTED` | `apps/web/src/components/common/data-table.tsx` | لودینگ اسکلتون و حالت خالی استاندارد با دکمه | ندارد | وضعیت فعلی |
| `REQ-021` | نوار فیلتر | `IMPLEMENTED_AND_TESTED` | `apps/web/src/components/common/filter-bar.tsx` | گزینه‌های سریع تاریخ در `test-filter-service.mjs` پاس شد | ندارد | وضعیت فعلی |
| `REQ-022` | نوار فیلتر | `IMPLEMENTED_AND_TESTED` | `apps/web/src/components/common/filter-bar.tsx` | ذخیره دوطرفه فیلترها در آدرس URL تایید شد | ندارد | وضعیت فعلی |
| `REQ-023` | کارت شاخص | `IMPLEMENTED_AND_TESTED` | `apps/web/src/components/common/kpi-card.tsx` | درصد تغییر، تولتیپ «؟» و نوار پیشرفت فعال است | ندارد | وضعیت فعلی |
| `REQ-024` | نمودارها | `IMPLEMENTED_AND_TESTED` | `apps/web/src/components/common/chart.tsx` | نمودارهای Recharts خطی و ستونی با جدول جایگزین | ندارد | وضعیت فعلی |
| `REQ-025` | نشان وضعیت | `IMPLEMENTED_AND_TESTED` | `apps/web/src/components/common/status-badge.tsx` | ترکیب متن + رنگ + آیکون در کلیه وضعیت‌ها | ندارد | وضعیت فعلی |
| `REQ-026` | تقویم شمسی | `IMPLEMENTED_AND_TESTED` | `apps/web/src/lib/persian-date.ts` | تست موفق ۱۱٬۳۲۳ روز در `test-persian-date.mjs` | ندارد | وضعیت فعلی |
| `REQ-027` | ورودی مبالغ | `IMPLEMENTED_AND_TESTED` | `apps/web/src/components/common/money-input.tsx` | جداکننده ۳ رقم و پشتیبانی از تومان و ریال | ندارد | وضعیت فعلی |
| `REQ-028` | کشو و مودال | `IMPLEMENTED_AND_TESTED` | `apps/web/src/components/common/drawer.tsx` | تشخیص فرم تغییر‌یافته و دیالوگ هشدار خروج | ندارد | وضعیت فعلی |
| `REQ-029` | فیلدهای فرم | `IMPLEMENTED_AND_TESTED` | `apps/web/src/components/common/form-field.tsx` | نمایش خطای فارسی Zod زیر فیلد در OnBlur و OnSubmit | ندارد | وضعیت فعلی |
| `REQ-030` | ویزارد | `IMPLEMENTED_AND_TESTED` | `apps/web/src/components/common/wizard.tsx` | ذخیره خودکار هر ۳۰ ثانیه و جابجایی بین مراحل | ندارد | وضعیت فعلی |
| `REQ-031` | کانبان برد | `IMPLEMENTED_AND_TESTED` | `apps/web/src/features/leads/board/page.tsx` | درگ‌اند-دراپ با dnd-kit و بازگشت خوش‌بینانه در خطا | ندارد | وضعیت فعلی |
| `REQ-032` | خط زمانی | `IMPLEMENTED_AND_TESTED` | `lead-journey-timeline.tsx` | نمایش وقایع با زمان شمسی و آیکون نوع رویداد | ندارد | وضعیت فعلی |
| `REQ-033` | انتخاب کاربر | `IMPLEMENTED_AND_TESTED` | `apps/web/src/components/common/user-select.tsx` | جستجوی پرسنل و نمایش آواتار حروف اول نام | ندارد | وضعیت فعلی |
| `REQ-034` | حالت خالی/خطا | `IMPLEMENTED_AND_TESTED` | `apps/web/src/components/common/empty-state.tsx` | دکمه تلاش مجدد در خطا و دکمه اقدام در حالت خالی | ندارد | وضعیت فعلی |
| `REQ-035` | دیالوگ تأیید | `IMPLEMENTED_AND_TESTED` | `apps/web/src/components/common/confirm-modal.tsx`| مودال اخطار عواقب عملیات حذف یا رد لید | ندارد | وضعیت فعلی |
| `REQ-036` | فرمت مبالغ | `IMPLEMENTED_AND_TESTED` | `apps/web/src/lib/format.ts` | ارقام فارسی و واحد پول و خلاصه میلیون در کارت | ندارد | وضعیت فعلی |
| `REQ-037` | فرمت درصد | `IMPLEMENTED_AND_TESTED` | `apps/web/src/lib/format.ts` | نمایش یک رقم اعشار با علائم «+» و «−» | ندارد | وضعیت فعلی |
| `REQ-038` | فرمت تاریخ | `IMPLEMENTED_AND_TESTED` | `apps/web/src/lib/persian-date.ts` | نمایش تاریخ شمسی و واژگان دیروز/امروز | ندارد | وضعیت فعلی |
| `REQ-039` | ماسک شماره | `IMPLEMENTED_AND_TESTED` | `lead-profile-card.tsx` | ماسک شماره `۰۹۱۲***۴۵۶۷` برای نقش‌های غیرمجاز | ندارد | وضعیت فعلی |
| `REQ-040` | خط تیره شاخص | `IMPLEMENTED_AND_TESTED` | `dashboard/components/*` | نمایش «—» با تولتیپ دلیل به جای صفر اشتباه | ندارد | وضعیت فعلی |
| `REQ-041` | کمتر بهتر است | `IMPLEMENTED_AND_TESTED` | `apps/web/src/components/common/kpi-card.tsx` | رنگ سبز برای کاهش CPL و CAC تایید شد | ندارد | وضعیت فعلی |
| `REQ-042` | وضعیت کمپین | `IMPLEMENTED_AND_TESTED` | `apps/api/src/modules/campaigns/campaign.entity.ts`| ۶ وضعیت مصوب در دیتابیس و فرانت‌اند تایید شد | ندارد | وضعیت فعلی |
| `REQ-043` | سلامت کمپین | `IMPLEMENTED_AND_TESTED` | `apps/api/src/modules/campaigns/campaign.entity.ts`| ۳ برچسب سالم، نیازمند توجه و ضعیف پیاده شد | ندارد | وضعیت فعلی |
| `REQ-044` | وضعیت‌های لید | `IMPLEMENTED_AND_TESTED` | `apps/api/src/modules/leads/`, `schema.prisma` | ۶ وضعیت پایپ‌لاین فروش در دیتابیس و برد کانبان | ندارد | وضعیت فعلی |
| `REQ-045` | تأخیر تسک‌ها | `IMPLEMENTED_AND_TESTED` | `task-card.tsx` | برچسب قرمز «X روز تأخیر» در تسک‌های گذشته تایید شد | ندارد | وضعیت فعلی |
| `REQ-046` | وضعیت تجهیزات | `PARTIALLY_IMPLEMENTED` | `apps/api/prisma/schema.prisma` | اینام در دیتابیس تعریف شده؛ رابط کاربری غایب است | ساخت ماژول و صفحه تجهیزات | `PHASE-003` |
| `REQ-047` | وضعیت ایده‌ها | `PARTIALLY_IMPLEMENTED` | `apps/api/prisma/schema.prisma` | اینام در دیتابیس تعریف شده؛ رابط کاربری غایب است | ساخت ماژول و صفحه ایده‌ها | `PHASE-007` |
| `REQ-048` | سه حالت صفحات | `IMPLEMENTED_AND_TESTED` | کلیه صفحات پیاده‌شده | اسکلتون، حالت خالی و خطا در همه صفحات رعایت شد | ندارد | وضعیت فعلی |
| `REQ-049` | صفحه ۱: ورود | `PRODUCTION_READY` | `(auth)/*`, `modules/auth/` | فرآیند ورود، انتخاب سازمان و رفرش‌توکن آماده است | ندارد | وضعیت فعلی |
| `REQ-050` | صفحه ۲: خانه | `IMPLEMENTED_AND_TESTED` | `(app)/page.tsx`, `features/home/*` | شبکه ۱۲ ستونی و استقلال لودینگ هر ویجت تایید شد | ندارد | وضعیت فعلی |
| `REQ-051` | صفحه ۲: نقش‌ها| `IMPLEMENTED_AND_TESTED` | `features/home/components/*` | ۵ نمای تفکیک‌شده برای نقش‌های مختلف فعال است | ندارد | وضعیت فعلی |
| `REQ-052` | صفحه ۳: اعلان‌ها| `NOT_IMPLEMENTED` | `apps/web/src/app/(app)/notifications` | هیچ صفحه یا کنترلی برای اعلان‌ها وجود ندارد | پیاده‌سازی کامل صفحه و بک‌اند | `PHASE-002` |
| `REQ-053` | صفحه ۴: فیلترها | `IMPLEMENTED_AND_TESTED` | `(app)/performance/dashboard/page.tsx` | فیلتر تاریخ، کمپین، پلتفرم و سوییچ مقایسه فعال است | ندارد | وضعیت فعلی |
| `REQ-054` | صفحه ۴: شاخص‌ها | `IMPLEMENTED_AND_TESTED` | `(app)/performance/dashboard/page.tsx` | ۶ کارت شاخص کلیدی با درصد تغییر و پیشرفت هدف | ندارد | وضعیت فعلی |
| `REQ-055` | صفحه ۴: نمودار | `IMPLEMENTED_AND_TESTED` | `(app)/performance/dashboard/page.tsx` | نمودارهای روند هزینه و لید با Recharts رندر می‌شوند | ندارد | وضعیت فعلی |
| `REQ-056` | صفحه ۴: قیف | `IMPLEMENTED_AND_TESTED` | `(app)/performance/dashboard/page.tsx` | قیف ۵ مرحله‌ای تبدیل با درصد ریزش و سهم پلتفرم‌ها | ندارد | وضعیت فعلی |
| `REQ-057` | صفحه ۴: جدول | `IMPLEMENTED_AND_TESTED` | `(app)/performance/dashboard/page.tsx` | جدول کمپین‌های داشبورد با وضعیت و نشانگر سلامت | ندارد | وضعیت فعلی |
| `REQ-058` | صفحه ۴: هشدارها| `IMPLEMENTED_AND_TESTED` | `(app)/performance/dashboard/page.tsx` | پنل هشدارهای فوری با دکمه میانبر «ساخت تسک» | ندارد | وضعیت فعلی |
| `REQ-059` | صفحه ۴: خروجی | `PARTIALLY_IMPLEMENTED` | `(app)/performance/dashboard/page.tsx` | خروجی اکسل کار می‌کند؛ تولید سروری PDF غایب است | خط لوله تولید فایل PDF در سرور | `PHASE-001` |
| `REQ-060` | صفحه ۵: کمپین‌ها | `IMPLEMENTED_AND_TESTED` | `(app)/campaigns/page.tsx`, `modules/campaigns` | جدول کامل، آواتارها و نوار مصرف بودجه پیاده شده | تعریف نام مستعار مسیر در Next | `PHASE-001` |
| `REQ-061` | صفحه ۵: سطرها | `IMPLEMENTED_AND_TESTED` | `(app)/campaigns/page.tsx` | کپی، توقف/ادامه، بایگانی و خروجی اکسل فعال است | ندارد | وضعیت فعلی |
| `REQ-062` | صفحه ۶: ویزارد | `IMPLEMENTED_AND_TESTED` | `(app)/campaigns/new/page.tsx` | ویزارد ۶ مرحله‌ای کامل با مخاطب و بودجه پلتفرم | ندارد | وضعیت فعلی |
| `REQ-063` | صفحه ۶: ذخیره | `IMPLEMENTED_AND_TESTED` | `(app)/campaigns/new/page.tsx` | ذخیره پیش‌نویس هر ۳۰ ثانیه و اخطار تضاد بودجه | ندارد | وضعیت فعلی |
| `REQ-064` | صفحه ۷: جزئیات | `IMPLEMENTED_AND_TESTED` | `(app)/campaigns/[id]/page.tsx` | هدر ثابت، عملیات، و ذخیره تب فعال در URL | ندارد | وضعیت فعلی |
| `REQ-065` | صفحه ۷: تب‌ها | `IMPLEMENTED_AND_TESTED` | `(app)/campaigns/[id]/page.tsx` | ۸ تب کامل جزئیات با لیدها، پلتفرم و تقویم | ندارد | وضعیت فعلی |
| `REQ-066` | صفحه ۸: پلتفرم | `IMPLEMENTED_AND_TESTED` | `(app)/performance/platforms/page.tsx` | جدول، قالب‌های آماده و کشوی فیلدهای ورودی/خروجی | ندارد | وضعیت فعلی |
| `REQ-067` | صفحه ۹: هزینه‌ها | `IMPLEMENTED_AND_TESTED` | `(app)/performance/costs/page.tsx` | نوار خلاصه، تفکیک پلتفرم و جدول هزینه‌ها متصل است | ندارد | وضعیت فعلی |
| `REQ-068` | صفحه ۹: کشوها | `IMPLEMENTED_AND_TESTED` | `(app)/performance/costs/page.tsx` | کشوی ثبت سریع و جدول دسته‌ای با امکان Paste اکسل | ندارد | وضعیت فعلی |
| `REQ-069` | صفحه ۱۰: تاریخچه| `IMPLEMENTED_AND_TESTED` | `(app)/performance/imports/page.tsx` | جدول تاریخچه ایمپورت با نشان وضعیت و سطرهای خطا | ندارد | وضعیت فعلی |
| `REQ-070` | صفحه ۱۰: ویزارد | `IMPLEMENTED_AND_TESTED` | `(app)/performance/imports/page.tsx` | ویزارد ۴ مرحله‌ای نگاشت ستون‌ها و پیش‌نمایش ۲۰ سطر | ندارد | وضعیت فعلی |
| `REQ-071` | صفحه ۱۰: قواعد | `IMPLEMENTED_AND_TESTED` | `(app)/performance/imports/page.tsx` | دانلود فایل نمونه، ذخیره نگاشت و دانلود فایل خطا | ندارد | وضعیت فعلی |
| `REQ-072` | صفحه ۱۱: شاخص‌ها| `IMPLEMENTED_AND_TESTED` | `(app)/performance/kpis/page.tsx` | فرمول‌ساز تعاملی و جمله‌ساز قواعد هشدار متصل است | ندارد | وضعیت فعلی |
| `REQ-073` | صفحه ۱۲: مخاطب | `IMPLEMENTED_AND_TESTED` | `(app)/performance/audiences/page.tsx` | لیست کارتی/جدول و مشخصات دموگرافیک با مصرف کمپین | ندارد | وضعیت فعلی |
| `REQ-074` | صفحه ۱۳: لندینگ | `IMPLEMENTED_AND_TESTED` | `(app)/performance/landing/page.tsx` | جدول لندینگ‌ها، سازنده لینک UTM و راهنمای GA4 | ندارد | وضعیت فعلی |
| `REQ-075` | صفحه ۱۴: صندوق | `IMPLEMENTED_AND_TESTED` | `(app)/leads/page.tsx`, `modules/leads` | جدول لیدها، شماره ماسک‌شده و فیلترهای CRM متصل است | ندارد | وضعیت فعلی |
| `REQ-076` | صفحه ۱۴: گروهی | `IMPLEMENTED_AND_TESTED` | `(app)/leads/page.tsx` | تخصیص گروهی، تغییر وضعیت و چک تکراری با موفقیت تست شد | ندارد | وضعیت فعلی |
| `REQ-077` | صفحه ۱۵: کانبان | `IMPLEMENTED_AND_TESTED` | `(app)/leads/board/page.tsx` | ۶ ستون، ارزش کل معاملات، مودال دلیل رد و فروش | ندارد | وضعیت فعلی |
| `REQ-078` | صفحه ۱۶: سفر لید| `IMPLEMENTED_AND_TESTED` | `(app)/leads/[id]/page.tsx` | نوار خلاصه سفر و چیدمان دو ستونی مشخصات و وقایع | ندارد | وضعیت فعلی |
| `REQ-079` | صفحه ۱۶: تماس | `IMPLEMENTED_AND_TESTED` | `(app)/leads/[id]/page.tsx` | فرم ثابت ثبت تماس بالای خط زمانی و فید فعالیت‌ها | ندارد | وضعیت فعلی |
| `REQ-080` | صفحه ۱۷: پیامک | `IMPLEMENTED_AND_TESTED` | `(app)/leads/sms/page.tsx`, `[id]/page.tsx` | لیست ارسال‌ها، جدول شماره‌ها و تبدیل پاسخ‌ها به لید | ندارد | وضعیت فعلی |
| `REQ-081` | صفحه ۱۸: وبینار | `IMPLEMENTED_AND_TESTED` | `(app)/leads/webinars/page.tsx` | چرخه وبینار، ۴ تب جزئیات و تبدیل حاضران به لید | ندارد | وضعیت فعلی |
| `REQ-082` | صفحه ۱۹: تسک‌ها | `IMPLEMENTED_AND_TESTED` | `(app)/work/tasks/page.tsx`, `modules/tasks` | سوییچ من/تیم، سوییچ لیست/برد و کشوی کامل جزئیات | ندارد | وضعیت فعلی |
| `REQ-083` | صفحه ۲۰: تقویم | `IMPLEMENTED_AND_TESTED` | `(app)/work/calendar/page.tsx` | تقویم شمسی ماه/هفته، کشیدن رویداد و نوار کمپین‌ها | ندارد | وضعیت فعلی |
| `REQ-084` | صفحه ۲۱: تجهیزات| `NOT_IMPLEMENTED` | `apps/web/src/app/(app)/work/equipment` | برچسب «به‌زودی» دارد؛ ماژول بک‌اند و صفحه ندارد | ساخت ماژول بک‌اند و صفحه وب | `PHASE-003` |
| `REQ-085` | صفحه ۲۲: جلسات | `NOT_IMPLEMENTED` | `apps/web/src/app/(app)/work/meetings` | برچسب «به‌زودی» دارد؛ ماژول بک‌اند و صفحه ندارد | ساخت ماژول بک‌اند و صفحه وب | `PHASE-004` |
| `REQ-086` | صفحه ۲۳: SOP | `NOT_IMPLEMENTED` | `apps/web/src/app/(app)/work/sops` | برچسب «به‌زودی» دارد؛ ماژول بک‌اند و صفحه ندارد | ساخت ماژول بک‌اند و صفحه وب | `PHASE-005` |
| `REQ-087` | صفحه ۲۴: آموزش | `NOT_IMPLEMENTED` | `apps/web/src/app/(app)/work/learning` | برچسب «به‌زودی» دارد؛ ماژول بک‌اند و صفحه ندارد | ساخت ماژول بک‌اند و صفحه وب | `PHASE-006` |
| `REQ-088` | صفحه ۲۵: ایده‌ها| `NOT_IMPLEMENTED` | `apps/web/src/app/(app)/work/ideas` | برچسب «به‌زودی» دارد؛ ماژول بک‌اند و صفحه ندارد | ساخت ماژول بک‌اند و صفحه وب | `PHASE-007` |
| `REQ-089` | صفحه ۲۶: گزارش | `NOT_IMPLEMENTED` | `apps/web/src/app/(app)/work/activity` | برچسب «به‌زودی» دارد؛ ماژول بک‌اند و صفحه ندارد | ساخت ماژول بک‌اند و صفحه وب | `PHASE-008` |
| `REQ-090` | صفحه ۲۷: کاربران| `IMPLEMENTED_AND_TESTED` | `(app)/settings/users/page.tsx` | جدول، کشوی دعوت و ماتریس دسترسی؛ ذخیره ماتریس نیاز دارد | اتصال اندپوینت ذخیره ماتریس | `PHASE-001` |
| `REQ-091` | صفحه ۲۸: تنظیمات| `IMPLEMENTED_AND_TESTED` | `(app)/settings/organization/page.tsx` | تب‌های مدیریت مقادیر پایه و تنظیمات واحد پول فعال است | ندارد | وضعیت فعلی |
| `REQ-092` | صفحه ۲۹: وردپرس | `NOT_IMPLEMENTED` | `apps/web/src/app/(app)/settings/wordpress` | برچسب «به‌زودی» دارد؛ وب‌هوک و پنل تنظیمات ندارد | ساخت ماژول وب‌هوک و صفحه وب | `PHASE-009` |
| `REQ-093` | معماری App Router| `IMPLEMENTED_AND_TESTED` | `apps/web/src/app/layout.tsx` | گروه‌های مسیر، میدلور و لی‌اوت RTL تایید شد | ندارد | وضعیت فعلی |
| `REQ-094` | کامپوننت‌های RTL | `IMPLEMENTED_AND_TESTED` | `apps/web/src/app/globals.css` | کلاس‌های منطقی و توکن‌های CSS تم روشن تایید شد | ندارد | وضعیت فعلی |
| `REQ-095` | مدیریت کوئری‌ها | `IMPLEMENTED_AND_TESTED` | `apps/web/src/lib/query-client.ts` | قواعد ابطال کش پس از جهش در TanStack Query فعال است | ندارد | وضعیت فعلی |
| `REQ-096` | کلاینت Axios | `IMPLEMENTED_AND_TESTED` | `apps/web/src/lib/api.ts` | رهگیری خطای ۴۰۱ و صف تمدید توکن در `api.ts` تایید شد | ندارد | وضعیت فعلی |
| `REQ-097` | اعتبارسنجی Zod | `IMPLEMENTED_AND_TESTED` | اسکیماهای فرم در `features/*/types.ts` | خطاهای فارسی و تبدیل ارقام فارسی به انگلیسی فعال است | ندارد | وضعیت فعلی |
| `REQ-098` | استورهای Zustand| `IMPLEMENTED_AND_TESTED` | `apps/web/src/stores/*` | استورهای مجزا برای کلاینت بدون داده‌های تکراری سرور | ندارد | وضعیت فعلی |
| `REQ-099` | آیکون‌ها و انیمیشن | `IMPLEMENTED_AND_TESTED` | کامپوننت‌ها در `apps/web/src/components/*` | آیکون‌های لوسید و ترنزیشن‌های نرم Framer Motion | ندارد | وضعیت فعلی |
