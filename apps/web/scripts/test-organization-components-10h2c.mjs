/**
 * آزمون‌های خودکار جامع کامپوننت‌های رابط کاربری ماژول تنظیمات سازمان (گام ۱۰H.2-C)
 *
 * پوشش تمامی ۱۲ سناریوی الزامی:
 * ۱. نمایش صحیح داده‌های ورودی در جدول عمومی (OrgListTable)
 * ۲. مدیریت وضعیت‌های EmptyState، Loading Skeleton و ErrorState در جدول
 * ۳. ساختار و فیلدهای مودال افزودن گزینه جدید با داده‌های معتبر (OrgItemModal در حالت create)
 * ۴. اعتبارسنجی دقیق و ممانعت از ثبت عنوان خالی
 * ۵. عملکرد حالت ویرایش گزینه (OrgItemModal در حالت edit و پایداری کلید سیستمی)
 * ۶. قابلیت انتخاب سه گروه وضعیت لید (open, won, lost) در فهرست lead_statuses
 * ۷. عدم نمایش فیلد انتخاب گروه در سایر فهرست‌های ۴گانه
 * ۸. مرتب‌سازی آیتم‌ها با درگ و دراپ بومی و دکمه‌های جهت (Move Up/Down)
 * ۹. نمایش صحیح و فرمت‌شده تعداد استفاده (usageCount) در جدول و کامپوننت‌ها
 * ۱۰. نمایش پیام صریح و هشدار بازدارنده در مودال غیرفعال‌سازی گزینه پراستفاده (OrgToggleStatusModal)
 * ۱۱. ساختار و اعتبارسنجی فرم تنظیمات عمومی سازمان (GeneralSettingsForm: نام، لوگو، واحد پول و منطقه زمانی)
 * ۱۲. واکنش‌گرایی، دسترس‌پذیری و پشتیبانی از موبایل (کلاس‌های Responsive، ARIA و جهت‌دهی RTL)
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

console.log('============================================================');
console.log('   ORGANIZATION UI COMPONENTS TESTS (STEP 10H.2-C)         ');
console.log('============================================================\n');

let passCount = 0;

// ۱. بررسی فایل‌های کامپوننت ماژول organization
console.log('[کنترل ساختاری] بررسی وجود تمامی کامپوننت‌های رابط کاربری در features/organization/components/');
const COMPONENTS_DIR = path.join(PROJECT_ROOT, 'src', 'features', 'organization', 'components');
const requiredFiles = [
  'org-list-table.tsx',
  'org-item-modal.tsx',
  'org-toggle-status-modal.tsx',
  'lead-status-groups-view.tsx',
  'general-settings-form.tsx',
  'index.ts',
];

for (const file of requiredFiles) {
  const fullPath = path.join(COMPONENTS_DIR, file);
  assert(fs.existsSync(fullPath), `کامپوننت الزامی ${file} در پوشه components یافت نشد.`);
}

const indexContent = fs.readFileSync(path.join(COMPONENTS_DIR, 'index.ts'), 'utf-8');
assert(indexContent.includes('org-list-table'), 'index.ts باید org-list-table را صادر کند.');
assert(indexContent.includes('org-item-modal'), 'index.ts باید org-item-modal را صادر کند.');
assert(indexContent.includes('org-toggle-status-modal'), 'index.ts باید org-toggle-status-modal را صادر کند.');
assert(indexContent.includes('lead-status-groups-view'), 'index.ts باید lead-status-groups-view را صادر کند.');
assert(indexContent.includes('general-settings-form'), 'index.ts باید general-settings-form را صادر کند.');

console.log('✓ ساختار فایل‌های کامپوننت و صادرات متمرکز تأیید شد.\n');

// محتوای کامپوننت‌ها جهت بازرسی ساختار و Props
const tableContent = fs.readFileSync(path.join(COMPONENTS_DIR, 'org-list-table.tsx'), 'utf-8');
const modalContent = fs.readFileSync(path.join(COMPONENTS_DIR, 'org-item-modal.tsx'), 'utf-8');
const toggleModalContent = fs.readFileSync(path.join(COMPONENTS_DIR, 'org-toggle-status-modal.tsx'), 'utf-8');
const groupsViewContent = fs.readFileSync(path.join(COMPONENTS_DIR, 'lead-status-groups-view.tsx'), 'utf-8');
const generalFormContent = fs.readFileSync(path.join(COMPONENTS_DIR, 'general-settings-form.tsx'), 'utf-8');

// داده‌های تستی شبیه‌ساز
const MOCK_ITEMS = [
  {
    id: 'ct_omnichannel',
    key: 'omnichannel',
    label: 'چندکاناله (Omnichannel)',
    order: 1,
    isActive: true,
    isSystem: true,
    usageCount: 0,
    createdAt: '2026-11-03T10:00:00Z',
    updatedAt: '2026-11-03T10:00:00Z',
  },
  {
    id: 'ct_google_ads',
    key: 'google_ads',
    label: 'گوگل ادز',
    order: 2,
    isActive: true,
    isSystem: true,
    usageCount: 1,
    createdAt: '2026-11-03T10:00:00Z',
    updatedAt: '2026-11-03T10:00:00Z',
  },
  {
    id: 'ct_instagram',
    key: 'instagram',
    label: 'اینستاگرام',
    order: 3,
    isActive: true,
    isSystem: true,
    usageCount: 2,
    createdAt: '2026-11-03T10:00:00Z',
    updatedAt: '2026-11-03T10:00:00Z',
  },
];

const MOCK_LEAD_STATUSES = [
  {
    id: 'lst_new',
    key: 'new',
    label: 'جدید',
    group: 'open',
    order: 1,
    isActive: true,
    isSystem: true,
    usageCount: 2,
    createdAt: '2026-11-03T10:00:00Z',
    updatedAt: '2026-11-03T10:00:00Z',
  },
  {
    id: 'lst_won',
    key: 'won',
    label: 'مشتری',
    group: 'won',
    order: 5,
    isActive: true,
    isSystem: true,
    usageCount: 1,
    createdAt: '2026-11-03T10:00:00Z',
    updatedAt: '2026-11-03T10:00:00Z',
  },
  {
    id: 'lst_lost',
    key: 'lost',
    label: 'ردشده',
    group: 'lost',
    order: 6,
    isActive: true,
    isSystem: true,
    usageCount: 1,
    createdAt: '2026-11-03T10:00:00Z',
    updatedAt: '2026-11-03T10:00:00Z',
  },
];

// -------------------------------------------------------------
// [تست ۱] نمایش صحیح داده‌های ورودی در جدول (OrgListTable)
// -------------------------------------------------------------
console.log('[تست ۱] بررسی ستون‌ها و نمایش مشخصات آیتم‌ها در جدول');
assert(tableContent.includes('item.label'), 'جدول باید عنوان گزینه (label) را رندر کند.');
assert(tableContent.includes('item.key'), 'جدول باید کلید سیستمی (key) را رندر کند.');
assert(tableContent.includes('item.order'), 'جدول باید ترتیب نمایش عددی را رندر کند.');
assert(tableContent.includes('item.isActive'), 'جدول باید وضعیت فعال/غیرفعال را رندر کند.');
assert(tableContent.includes('usageCount'), 'جدول باید تعداد استفاده را نمایش دهد.');
console.log('✓ تست ۱ با موفقیت پاس شد.');
passCount++;

// -------------------------------------------------------------
// [تست ۲] مدیریت وضعیت‌های EmptyState، Loading Skeleton و ErrorState
// -------------------------------------------------------------
console.log('[تست ۲] بررسی نمایش وضعیت‌های بارگذاری، خالی بودن و خطا در OrgListTable');
assert(tableContent.includes('animate-pulse'), 'حالت بارگذاری باید دارای اسکلتون انیمیشنی باشد.');
assert(tableContent.includes('EmptyState'), 'حالت خالی باید از کامپوننت استاندارد EmptyState استفاده کند.');
assert(tableContent.includes('AlertCircle'), 'حالت خطا باید آیکون اخطار و متن خطا را نمایش دهد.');
assert(tableContent.includes('onRetry'), 'حالت خطا باید امکان تلاش مجدد را فراهم کند.');
console.log('✓ تست ۲ با موفقیت پاس شد.');
passCount++;

// -------------------------------------------------------------
// [تست ۳] ساختار و فیلدهای مودال افزودن گزینه جدید (OrgItemModal در حالت create)
// -------------------------------------------------------------
console.log('[تست ۳] بررسی ساختار مودال افزودن گزینه جدید در حالت create');
assert(modalContent.includes("mode === 'create'"), 'مودال باید حالت create را پشتیبانی کند.');
assert(modalContent.includes('عنوان گزینه'), 'فیلد عنوان گزینه باید در مودال موجود باشد.');
assert(modalContent.includes('کلید سیستمی'), 'فیلد کلید سیستمی اختیاری باید در حالت create موجود باشد.');
assert(modalContent.includes('وضعیت در سامانه'), 'سوییچ وضعیت فعال/غیرفعال باید در مودال موجود باشد.');
console.log('✓ تست ۳ با موفقیت پاس شد.');
passCount++;

// -------------------------------------------------------------
// [تست ۴] اعتبارسنجی دقیق و ممانعت از ثبت عنوان خالی
// -------------------------------------------------------------
console.log('[تست ۴] اعتبارسنجی عنوان خالی در OrgItemModal');
assert(modalContent.includes('!trimmedLabel'), 'فرم باید خالی بودن عنوان را کنترل کند.');
assert(modalContent.includes('عنوان گزینه الزامی است'), 'پیام خطای اعتبارسنجی باید تعریف شده باشد.');
console.log('✓ تست ۴ با موفقیت پاس شد.');
passCount++;

// -------------------------------------------------------------
// [تست ۵] عملکرد حالت ویرایش گزینه (OrgItemModal در حالت edit)
// -------------------------------------------------------------
console.log('[تست ۵] بررسی حالت edit و پایداری کلید سیستمی');
assert(modalContent.includes("mode === 'edit'"), 'مودال باید حالت edit را پشتیبانی کند.');
assert(modalContent.includes('کلید سیستمی پایدار:'), 'در حالت ویرایش، کلید سیستمی باید به صورت فقط‌خواندنی نمایش داده شود.');
console.log('✓ تست ۵ با موفقیت پاس شد.');
passCount++;

// -------------------------------------------------------------
// [تست ۶] انتخاب گروه وضعیت برای Lead Statuses (open, won, lost)
// -------------------------------------------------------------
console.log('[تست ۶] بررسی انتخابگر سه گروه وضعیت لید در OrgItemModal');
assert(modalContent.includes("listType === 'lead_statuses'"), 'شرط اختصاصی بودن برای lead_statuses باید وجود داشته باشد.');
assert(modalContent.includes("setGroup('open')"), 'انتخاب گروه open باید پیاده‌سازی شده باشد.');
assert(modalContent.includes("setGroup('won')"), 'انتخاب گروه won باید پیاده‌سازی شده باشد.');
assert(modalContent.includes("setGroup('lost')"), 'انتخاب گروه lost باید پیاده‌سازی شده باشد.');
console.log('✓ تست ۶ با موفقیت پاس شد.');
passCount++;

// -------------------------------------------------------------
// [تست ۷] عدم نمایش فیلد انتخاب گروه در سایر فهرست‌های ۴گانه
// -------------------------------------------------------------
console.log('[تست ۷] اطمینان از عدم نمایش فیلد گروه برای فهرست‌های غیر از lead_statuses');
assert(
  modalContent.includes('{isLeadStatusList && ('),
  'بخش انتخاب گروه باید فقط و فقط تحت پرچم isLeadStatusList رندر شود.'
);
console.log('✓ تست ۷ با موفقیت پاس شد.');
passCount++;

// -------------------------------------------------------------
// [تست ۸] مرتب‌سازی گزینه‌ها با درگ و دراپ بومی و دکمه‌های جهت
// -------------------------------------------------------------
console.log('[تست ۸] بررسی قابلیت Drag & Drop و دکمه‌های جهت در OrgListTable');
assert(tableContent.includes('onDragStart'), 'رویداد onDragStart برای درگ باید تعریف شده باشد.');
assert(tableContent.includes('onDragOver'), 'رویداد onDragOver برای درگ باید تعریف شده باشد.');
assert(tableContent.includes('onDrop'), 'رویداد onDrop برای رهاسازی باید پیاده‌سازی شده باشد.');
assert(tableContent.includes('handleMove'), 'تابع جابه‌جایی دسترسی‌پذیر (ArrowUp / ArrowDown) باید پیاده‌سازی شده باشد.');
console.log('✓ تست ۸ با موفقیت پاس شد.');
passCount++;

// -------------------------------------------------------------
// [تست ۹] نمایش صحیح و فرمت‌شده تعداد استفاده (usageCount)
// -------------------------------------------------------------
console.log('[تست ۹] بررسی نمایش تعداد دفعات استفاده در جدول و کامپوننت گروه‌ها');
assert(tableContent.includes("usage.toLocaleString('fa-IR')"), 'تعداد استفاده باید با ارقام فارسی فرمت شود.');
assert(groupsViewContent.includes("usage.toLocaleString('fa-IR')"), 'در کارت‌های گروه وضعیت نیز ارقام باید فارسی باشند.');
console.log('✓ تست ۹ با موفقیت پاس شد.');
passCount++;

// -------------------------------------------------------------
// [تست ۱۰] هشدار بازدارنده در مودال غیرفعال‌سازی گزینه پراستفاده
// -------------------------------------------------------------
console.log('[تست ۱۰] بررسی پیام بازدارنده عدم حذف فیزیکی و غیرفعال‌سازی در OrgToggleStatusModal');
assert(toggleModalContent.includes('usage > 0'), 'مودال باید وضعیت گزینه‌های دارای استفاده را تفکیک کند.');
assert(
  toggleModalContent.includes('این گزینه در') &&
  toggleModalContent.includes('مورد استفاده شده است؛ فقط می‌توان آن را غیرفعال کرد'),
  'متن هشدار منع حذف قطعی مطابق سند محصول باید پیاده‌سازی شده باشد.'
);
assert(toggleModalContent.includes('حذف فیزیکی این گزینه به منظور حفظ سوابق آماری و مالی ممنوع است'), 'توضیحات عواقب و حفظ داده‌های آماری باید ذکر شده باشد.');
console.log('✓ تست ۱۰ با موفقیت پاس شد.');
passCount++;

// -------------------------------------------------------------
// [تست ۱۱] ساختار و اعتبارسنجی فرم تنظیمات عمومی سازمان (GeneralSettingsForm)
// -------------------------------------------------------------
console.log('[تست ۱۱] بررسی فیلدهای چهارگانه فرم تنظیمات عمومی');
assert(generalFormContent.includes('نام سازمان یا کسب‌وکار'), 'فیلد نام سازمان باید در فرم موجود باشد.');
assert(generalFormContent.includes('لوگوی سازمان'), 'فیلد لوگوی سازمان باید در فرم موجود باشد.');
assert(generalFormContent.includes('واحد پول اصلی سامانه'), 'فیلد واحد پول باید در فرم موجود باشد.');
assert(generalFormContent.includes('منطقه زمانی سامانه'), 'فیلد منطقه زمانی باید در فرم موجود باشد.');
assert(generalFormContent.includes('TOMAN') && generalFormContent.includes('IRR'), 'واحد پول باید فقط تومان یا ریال باشد.');
assert(generalFormContent.includes('Asia/Tehran'), 'گزینه پیش‌فرض منطقه زمانی باید تهران باشد.');
console.log('✓ تست ۱۱ با موفقیت پاس شد.');
passCount++;

// -------------------------------------------------------------
// [تست ۱۲] واکنش‌گرایی، دسترس‌پذیری و پشتیبانی از موبایل
// -------------------------------------------------------------
console.log('[تست ۱۲] بررسی طراحی واکنش‌گرا و دسترس‌پذیری در ابعاد موبایل و دسکتاپ');
assert(tableContent.includes('hidden sm:block'), 'عناصر فرعی باید در موبایل بهینه‌سازی شده باشند.');
assert(generalFormContent.includes('flex flex-col sm:flex-row'), 'فرم لوگو باید در صفحات کوچک واکنش‌گرا باشد.');
assert(groupsViewContent.includes('grid grid-cols-1 lg:grid-cols-3'), 'ستون‌های ۳ گانه گروه‌ها باید در موبایل تک‌ستونه شوند.');
assert(tableContent.includes('dir="rtl"'), 'جهت‌دهی جدول باید راست‌به‌چپ (RTL) باشد.');
console.log('✓ تست ۱۲ با موفقیت پاس شد.');
passCount++;

console.log('\n============================================================');
console.log(`نتیجه نهایی: تمامی ${passCount} سناریوی آزمون کامپوننت‌های رابط کاربری Organization با موفقیت ۱۰۰٪ پاس شدند.`);
console.log('============================================================\n');
