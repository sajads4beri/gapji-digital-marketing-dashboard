# 04 — PRODUCT REQUIREMENTS INVENTORY (شناسنامه جامع نیازمندی‌های محصول)
## فهرست جامع و ساختاریافته ۳۵۰ نیازمندی استخراج‌شده از سند ۲۹ صفحه‌ای پی‌دی‌اف

---

## 1. REQUIREMENT TAXONOMY & CODES (دسته‌بندی و کدگذاری نیازمندی‌ها)

تمامی الزامات مندرج در سند اختصاصی تیم فرانت‌اند با شناسه‌های یکتای `REQ-001` تا `REQ-350` کدگذاری شده‌اند. دسته‌بندی هر نیازمندی به شرح زیر است:
- **FR** (Functional Requirement / کارکردی)
- **UI** (User Interface & Layout / رابط کاربری)
- **BR** (Business Rule / قواعد محاسباتی و کسب‌وکار)
- **DR** (Data Requirement / مدل داده و رابطه)
- **SEC** (Security Requirement / امنیت و سطوح دسترسی)
- **INT** (Integration Requirement / اتصال به سامانه‌های خارجی)
- **REP** (Reporting Requirement / گزارش‌گیری و شاخص‌ها)
- **NFR** (Non-Functional Requirement / کارایی و دسترس‌پذیری)

---

## 2. SECTION 1 & 2: SHELL, COMMON COMPONENTS & DISPLAY RULES (پوسته و قواعد نمایش)

| Req ID | PDF Page | Category | Module | Summary & Technical Specification (شرح نیازمندی) |
| :--- | :---: | :---: | :--- | :--- |
| `REQ-001` | P. 3 | UI/FR | Shell | **Global Header**: نمایش لوگو و نام سازمان فعال با منوی سوئیچ سازمان، جستجوی سراسری لیدها و کمپین‌ها، آیکون زنگوله با شمارنده اعلان، منوی کاربری (نام، نقش، پروفایل، خروج). |
| `REQ-002` | P. 3 | UI/SEC | Shell | **Sidebar Navigation**: ۳ فضای کاری (عملکرد، فروش و لید، اجرا و دانش) + بخش تنظیمات در پایین؛ فیلتر بر اساس نقش کاربری؛ حالت جمع‌شونده (Icon-only) و کشوی موبایل. |
| `REQ-003` | P. 3 | UI | Shell | **Breadcrumb Navigation**: مسیر ۳ سطحی در صفحات جزئیات (`فضای کاری ← لیست ← نام آیتم`). |
| `REQ-004` | P. 3 | UI/UX | Shell | **Page Title Bar**: عنوان صفحه، توضیح کوتاه اختیاری و حداکثر ۱ دکمه عملیات اصلی (Primary). |
| `REQ-005` | P. 3 | UI/UX | Shell | **Content Constraints**: عرض حداکثر ۱۴۴۰ پیکسل برای داشبوردها و جداول؛ عرض ۸۰۰ پیکسل برای صفحات مطالعه‌ای (SOP، صورتجلسه، آموزش). |
| `REQ-006` | P. 3 | UI/UX | Shell | **Toast Notifications**: فیدبک عملیات (موفق، هشدار، خطا). بسته شدن خودکار بعد از ۵ ثانیه؛ خطاهای سیستمی تا بستن توسط کاربر باز می‌مانند. |
| `REQ-007` | P. 3 | UI/FR | Common | **DataTable Component**: پنهان‌سازی ستون‌ها، مرتب‌سازی، صفحه‌بندی سرور (۲۰، ۵۰، ۱۰۰)، انتخاب چندتایی با نوار عملیات گروهی، ردیف جمع، بارگذاری اسکلتی، و حالت خالی. |
| `REQ-008` | P. 3 | UI/FR | Common | **FilterBar Component**: بازه تاریخ شمسی با گزینه‌های سریع (امروز، ۷ روز، ۳۰ روز، این ماه، ماه قبل)، چندگزینه‌ای، فیلد جستجو، پاک کردن فیلترها و ذخیره در آدرس URL. |
| `REQ-009` | P. 3 | UI/REP| Common | **KpiCard Component**: عنوان شاخص، عدد اصلی، واحد، درصد تغییر نسبت به دوره قبل با فلش و رنگ، نوار پیشرفت هدف، و راهنمای فرمول با کلیک روی آیکون «؟». |
| `REQ-010` | P. 3 | UI/REP| Common | **Charts Component**: نمودارهای خطی، ستونی، قیفی با برچسب شناور (Tooltip)، راهنمای کلیک‌پذیر، محور تاریخ شمسی و جدول داده متنی جایگزین برای دسترس‌پذیری. |
| `REQ-011` | P. 4 | UI/UX | Common | **StatusBadge Component**: ترکیب متن فارسی + رنگ استاندارد + آیکون اختیاری (هرگز نباید تنها از رنگ برای وضعیت استفاده شود). |
| `REQ-012` | P. 4 | UI/FR | Common | **PersianDatePicker Component**: انتخاب تاریخ تک و بازه، شروع هفته از روز شنبه، تبدیل خودکار به فرمت ISO میلادی هنگام ارسال به سرور. |
| `REQ-013` | P. 4 | UI/BR | Common | **MoneyInput / MoneyText**: جداکننده سه‌رقمی ارقام، پذیرش اعداد فارسی و انگلیسی، درج پسوند واحد (تومان/ریال، یک واحد در کل سیستم). |
| `REQ-014` | P. 4 | UI/UX | Common | **Drawer & Modal**: کشوی راست برای ویرایش و مشاهده سریع بدون ترک صفحه؛ مودال برای فرم‌های کوتاه و تاییدها؛ هشدار هنگام خروج از فرم تغییریافته. |
| `REQ-015` | P. 4 | UI/BR | Common | **FormField Component**: برچسب، ورودی، متن راهنما، پیام خطا زیر فیلد، ستاره فیلد اجباری؛ اعتبارسنجی همزمان با خروج از فیلد و هنگام ارسال. |
| `REQ-016` | P. 4 | UI/FR | Common | **Wizard Component**: نوار مراحل، ذخیره خودکار پیش‌نویس، بازگشت به مراحل قبل، و صفحه مرور نهایی. |
| `REQ-017` | P. 4 | UI/FR | Common | **Kanban Board**: ستون‌ها با شمارنده، کارت‌های قابل جابجایی با درگ‌اند‌دراپ، به‌روزرسانی آنی خوش‌بینانه و بازگشت کارت در صورت خطای شبکه. |
| `REQ-018` | P. 4 | UI/DR | Common | **Timeline Component**: رویدادها با آیکون نوع، عنوان، زمان شمسی و کاربر، مرتب‌شده از جدید به قدیم. |
| `REQ-019` | P. 4 | UI/UX | Common | **UserSelect / Avatar**: انتخاب کاربر با جستجو و نمایش آواتار با حروف اول نام. |
| `REQ-020` | P. 4 | UI/UX | Common | **EmptyState & ErrorState**: آیکون، توضیح تک‌جمله‌ای، دکمه عملیات؛ و دکمه «تلاش دوباره» در خطای شبکه. |
| `REQ-021` | P. 4 | UI/SEC| Common | **ConfirmDialog Component**: برای عملیات پرریسک و غیرقابل بازگشت (حذف، رد لید، ارسال صورتجلسه) با ذکر صریح اثر عملیات. |
| `REQ-022` | P. 4 | BR/UI | Display | **Currency Formatting**: جداکننده هزارگان، ارقام فارسی، واحد تومان؛ خلاصه شدن اعداد بزرگ در کارت‌ها (مانند ۱۲٫۵ میلیون) و عدد کامل در Tooltip. |
| `REQ-023` | P. 4 | BR/UI | Display | **Percentage Formatting**: یک رقم اعشار (٪۲۳٫۵) با علامت «+» و «−». |
| `REQ-024` | P. 4 | BR/UI | Display | **Jalali Date Formatting**: به صورت `۱۴۰۵/۰۸/۰۷` و عبارت‌های «امروز/دیروز» برای رویدادهای نزدیک. |
| `REQ-025` | P. 5 | SEC/UI | Privacy | **Mobile Number Masking**: فرمت `۰۹۱۲ ۱۲۳ ۴۵۶۷`؛ و برای نقش‌های غیرمجاز به صورت `۰۹۱۲***۴۵۶۷` با دکمه کپی و تماس مستقیم. |
| `REQ-026` | P. 5 | BR/UI | Display | **Undefined Metrics**: در صورت تقسیم بر صفر نمایش خط تیره «—» با پیام راهنما (هرگز صفر نشان داده نشود). |
| `REQ-027` | P. 5 | BR/UI | Display | **Lower is Better Rule**: برای CPL و CAC کاهش با رنگ سبز (بهبود) و افزایش با رنگ قرمز نمایش می‌یابد. |
| `REQ-028` | P. 5 | BR/UI | Taxonomy | **Standard Status Colors**: پیش‌نویس (خاکستری)، برنامه‌ریزی‌شده (آبی)، فعال (سبز)، متوقف (نارنجی)، پایان‌یافته (خنثی)، بایگانی (خاکستری روشن)؛ سلامت کمپین: سالم، نیازمند توجه، ضعیف. |
| `REQ-029` | P. 5 | NFR/UI | Architecture| **3 Universal States**: طراحی الزامی حالت در حال بارگذاری (Skeleton)، حالت خالی، و حالت خطا با دکمه تلاش مجدد در تمامی صفحات؛ حفظ فیلترها در URL. |

---

## 3. SECTION 3: 29 PRODUCT PAGES INVENTORY (صفحات ۲۹ گانه محصول)

- **صفحه ۱ (`REQ-030` تا `REQ-038`)**: Login & Select Organization (`/login`, `/forgot-password`, `/select-org`).
- **صفحه ۲ (`REQ-039` تا `REQ-047`)**: Role-based Home Page (`/`).
- **صفحه ۳ (`REQ-048` تا `REQ-056`)**: Notifications Center & Channels Switch (`/notifications`).
- **صفحه ۴ (`REQ-057` تا `REQ-067`)**: Executive Performance Dashboard (`/performance/dashboard`).
- **صفحه ۵ (`REQ-068` تا `REQ-077`)**: Campaigns Management List (`/campaigns`).
- **صفحه ۶ (`REQ-078` تا `REQ-090`)**: 6-Step Campaign Creation Wizard (`/campaigns/new`, `/:id/edit`).
- **صفحه ۷ (`REQ-091` تا `REQ-104`)**: 8-Tab Comprehensive Campaign Details (`/campaigns/:id`).
- **صفحه ۸ (`REQ-105` تا `REQ-113`)**: Ad Platforms & Custom Fields Catalog (`/performance/platforms`).
- **صفحه ۹ (`REQ-114` تا `REQ-123`)**: Marketing Costs Management (Single & Batch Entry) (`/performance/costs`).
- **صفحه ۱۰ (`REQ-124` تا `REQ-134`)**: Universal Data Import Engine (Costs, Leads, SMS, Webinars) (`/performance/imports`).
- **صفحه ۱۱ (`REQ-135` تا `REQ-145`)**: KPI Metrics, Custom Formulas & Sentence Alert Rules (`/performance/kpis`).
- **صفحه ۱۲ (`REQ-146` تا `REQ-154`)**: Target Audiences & Personas (`/performance/audiences`).
- **صفحه ۱۳ (`REQ-155` تا `REQ-165`)**: Landing Pages & Live UTM Builder (`/performance/landing`).
- **صفحه ۱۴ (`REQ-166` تا `REQ-177`)**: Omnichannel Leads Inbox with Masking (`/leads`).
- **صفحه ۱۵ (`REQ-178` تا `REQ-188`)**: 6-Stage Lead Kanban Pipeline Board (`/leads/board`).
- **صفحه ۱۶ (`REQ-189` تا `REQ-201`)**: Lead Details, Sticky Quick Call & Journey Timeline (`/leads/:id`).
- **صفحه ۱۷ (`REQ-202` تا `REQ-211`)**: SMS Dispatches & Recipient Delivery Logs (`/leads/sms`).
- **صفحه ۱۸ (`REQ-212` تا `REQ-222`)**: Webinars & Attendee Conversion Funnel (`/leads/webinars`).
- **صفحه ۱۹ (`REQ-223` تا `REQ-234`)**: Task Management (List/Kanban, Grouping, Quick Add, Subtasks) (`/work/tasks`).
- **صفحه ۲۰ (`REQ-235` تا `REQ-244`)**: Marketing Calendar with Multi-day Campaign Bars (`/work/calendar`).
- **صفحه ۲۱ (`REQ-245` تا `REQ-253`)**: Studio Equipment Logistics & Shortages View (`/work/equipment`).
- **صفحه ۲۲ (`REQ-254` تا `REQ-263`)**: Meeting Minutes, Task Conversion & Email Dispatch (`/work/meetings`).
- **صفحه ۲۳ (`REQ-264` تا `REQ-274`)**: Standard Operating Procedures (SOP) & Print Style (`/work/sops`).
- **صفحه ۲۴ (`REQ-275` تا `REQ-284`)**: Team Learning Library & Video Player (`/work/learning`).
- **صفحه ۲۵ (`REQ-285` تا `REQ-294`)**: Growth Ideas Board with One-Click Upvoting (`/work/ideas`).
- **صفحه ۲۶ (`REQ-295` تا `REQ-303`)**: Activity Report & Real-time Audit Trail (`/work/activity`).
- **صفحه ۲۷ (`REQ-304` تا `REQ-314`)**: Users Management & 29-Page Access Matrix (`/settings/users`).
- **صفحه ۲۸ (`REQ-315` تا `REQ-324`)**: Organization Taxonomies with Disable-only Protection (`/settings/organization`).
- **صفحه ۲۹ (`REQ-325` تا `REQ-335`)**: WordPress & Gravity Forms Webhook Integration (`/settings/wordpress`).

---

## 4. SECTION 4 & 5: TECH STACK SPECIFICATIONS (`REQ-336` تا `REQ-350`)
الزامات معماری پشته فناوری شامل Next.js App Router، Server/Client Components، Middleware، Tailwind RTL، Design Tokens، TanStack Query، Optimistic UI، Axios Client، Zod Schemas، Normalization، TanStack Form، Zustand، Lucide Icons، Framer Motion و @dnd-kit.
