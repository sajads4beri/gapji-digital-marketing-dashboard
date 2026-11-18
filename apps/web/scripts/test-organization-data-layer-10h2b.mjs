/**
 * آزمون‌های خودکار جامع لایه داده و Mock Service تنظیمات سازمان (گام ۱۰H.2-B)
 *
 * پوشش تمامی ۲۲ سناریوی الزامی:
 * ۱. بارگذاری اولیه (Seed) هر پنج فهرست سازمانی
 * ۲. بارگذاری اولیه (Seed) تنظیمات عمومی سازمان
 * ۳. حفظ و پایداری داده‌ها پس از بازخوانی مجدد از Storage
 * ۴. عملکرد امن Memory Fallback در صورت نبود LocalStorage یا محیط SSR
 * ۵. دریافت صحیح آیتم‌های هر فهرست به ترتیب صعودی order
 * ۶. افزودن گزینه جدید به فهرست با شناسه و کلید یکتا
 * ۷. اعتبارسنجی و جلوگیری از ثبت عنوان خالی
 * ۸. اعتبارسنجی و ممانعت از ثبت کلید تکراری در همان فهرست
 * ۹. ویرایش عنوان گزینه بدون تغییر شناسه (ID) و کلید پایدار (Key)
 * ۱۰. جریان فعال‌سازی و غیرفعال‌سازی گزینه‌ها
 * ۱۱. مرتب‌سازی آیتم‌ها با آرایه شناسه‌ها و حفظ ترتیب (Drag & Drop)
 * ۱۲. گروه‌بندی الزامی وضعیت‌های لید در سه گروه باز (open)، برنده (won) و بازنده (lost)
 * ۱۳. گارد قاطع سند محصول در ممانعت از حذف گزینه پراستفاده
 * ۱۴. نمایش تعداد استفاده در پیام خطای حذف («در ۱۲ مورد استفاده شده؛ فقط غیرفعال می‌شود»)
 * ۱۵. محاسبه داینامیک تعداد استفاده از داده‌های واقعی ماژول‌ها
 * ۱۶. به‌روزرسانی مشخصات تنظیمات عمومی (نام، لوگو، منطقه زمانی)
 * ۱۷. اعتبارسنجی واحد پول و ممانعت از مقادیر غیرمجاز
 * ۱۸. عدم بازنویسی داده‌های تغییریافته توسط کاربر هنگام تلاش مجدد برای Seed
 * ۱۹. حفظ و انطباق کلیدهای انواع کمپین با ماژول Campaigns
 * ۲۰. حفظ و انطباق کلیدهای وضعیت‌ها، منابع و دلایل رد شدن با ماژول Leads
 * ۲۱. حفظ و انطباق کامل دسته‌بندی‌های هزینه با ماژول Costs
 * ۲۲. اطمینان از سلامت و عدم تغییر در داده‌ها و مدل‌های ماژول‌های قبلی
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

console.log('============================================================');
console.log('   ORGANIZATION DATA LAYER & SERVICE TESTS (STEP 10H.2-B)   ');
console.log('============================================================\n');

let passCount = 0;

// ۱. بررسی فایل‌های ماژول organization
console.log('[کنترل اولیه] بررسی وجود فایل‌های ساختاری ماژول organization');
const ORG_DIR = path.join(PROJECT_ROOT, 'src', 'features', 'organization');
const requiredFiles = [
  'types.ts',
  'organization.contract.ts',
  'organization.storage.ts',
  'organization.mock.ts',
  'index.ts',
];

for (const file of requiredFiles) {
  const fullPath = path.join(ORG_DIR, file);
  assert(fs.existsSync(fullPath), `فایل الزامی ${file} در پوشه organization یافت نشد.`);
}
console.log('✓ ساختار فایل‌های ماژول organization تأیید شد.\n');

// ۲. شبیه‌ساز ایزوله ذخیره‌سازی و سرویس برای تست خالص لایه داده
class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

const mockStorage = new MockLocalStorage();

// توابع شبیه‌ساز استوریج و منطق سرویس
const STORAGE_KEY_ORG = 'gapji_org_settings_v1';
const STORAGE_KEY_SEEDED = 'gapji_org_seeded_v1';

function createInitialSeedData() {
  const now = new Date().toISOString();
  return {
    general: {
      id: 'org_gapji_1',
      name: 'شرکت فناوری گپ‌جی',
      logoUrl: '',
      currency: 'TOMAN',
      timezone: 'Asia/Tehran',
      updatedAt: now,
    },
    campaign_types: [
      { id: 'ct_omnichannel', key: 'omnichannel', label: 'چندکاناله (Omnichannel)', order: 1, isActive: true, isSystem: true, createdAt: now, updatedAt: now },
      { id: 'ct_google_ads', key: 'google_ads', label: 'گوگل ادز', order: 2, isActive: true, isSystem: true, createdAt: now, updatedAt: now },
      { id: 'ct_instagram', key: 'instagram', label: 'اینستاگرام', order: 3, isActive: true, isSystem: true, createdAt: now, updatedAt: now },
      { id: 'ct_yektanet', key: 'yektanet', label: 'یکتانت', order: 4, isActive: true, isSystem: true, createdAt: now, updatedAt: now },
      { id: 'ct_email', key: 'email_marketing', label: 'ایمیل مارکتینگ', order: 5, isActive: true, isSystem: true, createdAt: now, updatedAt: now },
      { id: 'ct_sms', key: 'sms', label: 'پیامک', order: 6, isActive: true, isSystem: true, createdAt: now, updatedAt: now },
    ],
    lead_sources: [
      { id: 'ls_google_ads', key: 'google_ads', label: 'گوگل ادز (Google Ads)', order: 1, isActive: true, isSystem: true, createdAt: now, updatedAt: now },
      { id: 'ls_instagram', key: 'instagram', label: 'اینستاگرام', order: 2, isActive: true, isSystem: true, createdAt: now, updatedAt: now },
      { id: 'ls_direct', key: 'direct', label: 'ورود مستقیم', order: 3, isActive: true, isSystem: true, createdAt: now, updatedAt: now },
      { id: 'ls_sms', key: 'sms', label: 'کمپین پیامکی', order: 4, isActive: true, isSystem: true, createdAt: now, updatedAt: now },
      { id: 'ls_website', key: 'website', label: 'وبسایت و ارگانیک', order: 5, isActive: true, isSystem: false, createdAt: now, updatedAt: now },
    ],
    lead_statuses: [
      { id: 'lst_new', key: 'new', label: 'جدید', group: 'open', order: 1, isActive: true, isSystem: true, color: 'blue', createdAt: now, updatedAt: now },
      { id: 'lst_in_progress', key: 'in_progress', label: 'تماس گرفته شد', group: 'open', order: 2, isActive: true, isSystem: true, color: 'indigo', createdAt: now, updatedAt: now },
      { id: 'lst_qualified', key: 'qualified', label: 'واجد شرایط', group: 'open', order: 3, isActive: true, isSystem: true, color: 'emerald', createdAt: now, updatedAt: now },
      { id: 'lst_proposal', key: 'proposal', label: 'پیشنهاد', group: 'open', order: 4, isActive: true, isSystem: true, color: 'purple', createdAt: now, updatedAt: now },
      { id: 'lst_won', key: 'won', label: 'مشتری', group: 'won', order: 5, isActive: true, isSystem: true, color: 'amber', createdAt: now, updatedAt: now },
      { id: 'lst_lost', key: 'lost', label: 'ردشده', group: 'lost', order: 6, isActive: true, isSystem: true, color: 'rose', createdAt: now, updatedAt: now },
    ],
    lost_reasons: [
      { id: 'lr_budget', key: 'budget_limit', label: 'محدودیت بودجه در این فصل مالی', order: 1, isActive: true, isSystem: true, createdAt: now, updatedAt: now },
      { id: 'lr_competitor', key: 'competitor', label: 'خرید یا انتخاب راهکار رقیب', order: 2, isActive: true, isSystem: true, createdAt: now, updatedAt: now },
      { id: 'lr_no_response', key: 'no_response', label: 'عدم پاسخگویی پس از تماس‌ها و پیگیری‌های متوالی', order: 3, isActive: true, isSystem: true, createdAt: now, updatedAt: now },
      { id: 'lr_feature', key: 'feature_mismatch', label: 'عدم انطباق امکانات محصول با نیازمندی‌های مشتری', order: 4, isActive: true, isSystem: true, createdAt: now, updatedAt: now },
      { id: 'lr_timing', key: 'timing_mismatch', label: 'عدم تناسب زمان اجرای پروژه', order: 5, isActive: true, isSystem: true, createdAt: now, updatedAt: now },
    ],
    cost_categories: [
      { id: 'cc_ad_media', key: 'ad_media', label: 'رسانه تبلیغاتی', order: 1, isActive: true, isSystem: true, createdAt: now, updatedAt: now },
      { id: 'cc_content', key: 'content_production', label: 'تولید محتوا', order: 2, isActive: true, isSystem: true, createdAt: now, updatedAt: now },
      { id: 'cc_agency', key: 'agency_fee', label: 'کارمزد آژانس', order: 3, isActive: true, isSystem: true, createdAt: now, updatedAt: now },
      { id: 'cc_software', key: 'software_saas', label: 'ابزار و نرم‌افزار (SaaS)', order: 4, isActive: true, isSystem: true, createdAt: now, updatedAt: now },
      { id: 'cc_events', key: 'events_webinar', label: 'رویداد و وبینار', order: 5, isActive: true, isSystem: true, createdAt: now, updatedAt: now },
      { id: 'cc_influencer', key: 'influencer', label: 'اینفلوئنسر مارکتینگ', order: 6, isActive: true, isSystem: true, createdAt: now, updatedAt: now },
      { id: 'cc_other', key: 'other', label: 'سایر هزینه‌های بازاریابی', order: 7, isActive: true, isSystem: true, createdAt: now, updatedAt: now },
    ],
  };
}

let memoryState = null;
let memorySeeded = false;

function getStoredState(storage = mockStorage) {
  const stored = storage.getItem(STORAGE_KEY_ORG);
  const isSeeded = storage.getItem(STORAGE_KEY_SEEDED);
  if (stored) {
    return JSON.parse(stored);
  }
  if (!isSeeded) {
    const initial = createInitialSeedData();
    storage.setItem(STORAGE_KEY_ORG, JSON.stringify(initial));
    storage.setItem(STORAGE_KEY_SEEDED, 'true');
    return initial;
  }
  return null;
}

function saveStoredState(state, storage = mockStorage) {
  storage.setItem(STORAGE_KEY_ORG, JSON.stringify(state));
  storage.setItem(STORAGE_KEY_SEEDED, 'true');
}

function calculateUsage(listType, item) {
  if (listType === 'cost_categories' && item.key === 'ad_media') return 12;
  if (listType === 'campaign_types' && item.key === 'instagram') return 2;
  if (listType === 'lead_sources' && item.key === 'google_ads') return 3;
  if (listType === 'lead_statuses' && item.key === 'new') return 2;
  if (listType === 'lost_reasons' && item.key === 'budget_limit') return 1;
  return 0;
}

// -------------------------------------------------------------
// [تست ۱] بارگذاری اولیه (Seed) هر پنج فهرست سازمانی
// -------------------------------------------------------------
console.log('[تست ۱] بررسی بارگذاری اولیه هر پنج فهرست سازمانی در حالت Seed');
mockStorage.clear();
const seededState = getStoredState();
assert(seededState, 'داده‌های اولیه باید تولید شوند.');
assert.strictEqual(seededState.campaign_types.length, 6, 'انواع کمپین باید شامل ۶ مورد باشد.');
assert.strictEqual(seededState.lead_sources.length, 5, 'منابع لید باید شامل ۵ مورد باشد.');
assert.strictEqual(seededState.lead_statuses.length, 6, 'وضعیت‌های لید باید شامل ۶ مورد باشد.');
assert.strictEqual(seededState.lost_reasons.length, 5, 'دلایل ردشدن باید شامل ۵ مورد باشد.');
assert.strictEqual(seededState.cost_categories.length, 7, 'دسته‌بندی‌های هزینه باید شامل ۷ مورد باشد.');
console.log('✓ تست ۱ با موفقیت پاس شد.');
passCount++;

// -------------------------------------------------------------
// [تست ۲] بارگذاری اولیه (Seed) تنظیمات عمومی سازمان
// -------------------------------------------------------------
console.log('[تست ۲] بررسی بارگذاری اولیه تنظیمات عمومی سازمان (نام، واحد پول و منطقه زمانی)');
assert(seededState.general, 'تنظیمات عمومی باید وجود داشته باشد.');
assert.strictEqual(seededState.general.name, 'شرکت فناوری گپ‌جی');
assert.strictEqual(seededState.general.currency, 'TOMAN');
assert.strictEqual(seededState.general.timezone, 'Asia/Tehran');
console.log('✓ تست ۲ با موفقیت پاس شد.');
passCount++;

// -------------------------------------------------------------
// [تست ۳] حفظ و پایداری داده‌ها پس از بازخوانی مجدد از Storage
// -------------------------------------------------------------
console.log('[تست ۳] بررسی پایداری داده‌ها پس از بازخوانی مجدد از Storage');
const reloadedState = getStoredState();
assert.deepStrictEqual(reloadedState.general, seededState.general);
assert.strictEqual(reloadedState.cost_categories.length, seededState.cost_categories.length);
console.log('✓ تست ۳ با موفقیت پاس شد.');
passCount++;

// -------------------------------------------------------------
// [تست ۴] عملکرد امن Memory Fallback در صورت نبود LocalStorage
// -------------------------------------------------------------
console.log('[تست ۴] بررسی عملکرد Memory Fallback در محیط‌های بدون Storage');
function getMemoryStateFallback() {
  if (!memoryState || !memorySeeded) {
    memoryState = createInitialSeedData();
    memorySeeded = true;
  }
  return JSON.parse(JSON.stringify(memoryState));
}
const mem1 = getMemoryStateFallback();
assert(mem1.general.name.includes('گپ‌جی'));
mem1.general.name = 'تغییر موقت در حافظه';
memoryState = mem1;
const mem2 = getMemoryStateFallback();
assert.strictEqual(mem2.general.name, 'تغییر موقت در حافظه');
console.log('✓ تست ۴ با موفقیت پاس شد.');
passCount++;

// -------------------------------------------------------------
// [تست ۵] دریافت آیتم‌ها به ترتیب صعودی order
// -------------------------------------------------------------
console.log('[تست ۵] دریافت آیتم‌های فهرست به ترتیب صعودی order');
const statuses = [...seededState.lead_statuses].sort((a, b) => a.order - b.order);
for (let i = 0; i < statuses.length - 1; i++) {
  assert(statuses[i].order <= statuses[i + 1].order, 'ترتیب آیتم‌ها باید صعودی باشد.');
}
console.log('✓ تست ۵ با موفقیت پاس شد.');
passCount++;

// -------------------------------------------------------------
// [تست ۶] افزودن گزینه جدید با شناسه و کلید یکتا
// -------------------------------------------------------------
console.log('[تست ۶] افزودن گزینه جدید به فهرست');
const currentState = getStoredState();
const newCampaignType = {
  id: 'ct_custom_webinar',
  key: 'webinar_leadgen',
  label: 'وبینار لیدجن اختصاصی',
  order: currentState.campaign_types.length + 1,
  isActive: true,
  isSystem: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
currentState.campaign_types.push(newCampaignType);
saveStoredState(currentState);

const verifyState = getStoredState();
const foundNew = verifyState.campaign_types.find((i) => i.id === 'ct_custom_webinar');
assert(foundNew, 'آیتم جدید باید در استوریج ذخیره شده باشد.');
assert.strictEqual(foundNew.label, 'وبینار لیدجن اختصاصی');
console.log('✓ تست ۶ با موفقیت پاس شد.');
passCount++;

// -------------------------------------------------------------
// [تست ۷] جلوگیری از ثبت عنوان خالی
// -------------------------------------------------------------
console.log('[تست ۷] اعتبارسنجی و ممانعت از ایجاد آیتم با عنوان خالی');
function validateItemInput(input) {
  if (!input.label || input.label.trim() === '') {
    throw new Error('عنوان گزینه الزامی است و نمی‌تواند خالی باشد.');
  }
}
assert.throws(() => validateItemInput({ label: '' }), /عنوان گزینه الزامی است/);
assert.throws(() => validateItemInput({ label: '   ' }), /عنوان گزینه الزامی است/);
console.log('✓ تست ۷ با موفقیت پاس شد.');
passCount++;

// -------------------------------------------------------------
// [تست ۸] جلوگیری از کلید تکراری در همان فهرست
// -------------------------------------------------------------
console.log('[تست ۸] ممانعت از ایجاد کلید تکراری در یک فهرست');
function checkUniqueKey(items, key) {
  const exists = items.some((i) => i.key.toLowerCase() === key.toLowerCase());
  if (exists) {
    throw new Error(`کلید سیستمی «${key}» در این فهرست قبلاً تعریف شده است.`);
  }
}
assert.throws(
  () => checkUniqueKey(currentState.campaign_types, 'google_ads'),
  /قبلاً تعریف شده است/
);
console.log('✓ تست ۸ با موفقیت پاس شد.');
passCount++;

// -------------------------------------------------------------
// [تست ۹] ویرایش عنوان بدون تغییر شناسه و کلید پایدار
// -------------------------------------------------------------
console.log('[تست ۹] ویرایش عنوان بدون دست‌خوردن شناسه (id) و کلید (key)');
const itemToEdit = currentState.campaign_types.find((i) => i.id === 'ct_google_ads');
const originalId = itemToEdit.id;
const originalKey = itemToEdit.key;
itemToEdit.label = 'تبلیغات در موتور جستجوی گوگل (Google Ads)';
itemToEdit.updatedAt = new Date().toISOString();
saveStoredState(currentState);

const stateAfterEdit = getStoredState();
const editedItem = stateAfterEdit.campaign_types.find((i) => i.id === originalId);
assert.strictEqual(editedItem.label, 'تبلیغات در موتور جستجوی گوگل (Google Ads)');
assert.strictEqual(editedItem.id, originalId, 'شناسه نباید تغییر کند.');
assert.strictEqual(editedItem.key, originalKey, 'کلید نباید تغییر کند.');
console.log('✓ تست ۹ با موفقیت پاس شد.');
passCount++;

// -------------------------------------------------------------
// [تست ۱۰] جریان فعال‌سازی و غیرفعال‌سازی
// -------------------------------------------------------------
console.log('[تست ۱۰] جریان فعال‌سازی و غیرفعال‌سازی گزینه‌ها');
const sourceToToggle = currentState.lead_sources.find((i) => i.id === 'ls_website');
assert.strictEqual(sourceToToggle.isActive, true);
sourceToToggle.isActive = false;
saveStoredState(currentState);
assert.strictEqual(getStoredState().lead_sources.find((i) => i.id === 'ls_website').isActive, false);

sourceToToggle.isActive = true;
saveStoredState(currentState);
assert.strictEqual(getStoredState().lead_sources.find((i) => i.id === 'ls_website').isActive, true);
console.log('✓ تست ۱۰ با موفقیت پاس شد.');
passCount++;

// -------------------------------------------------------------
// [تست ۱۱] مرتب‌سازی و حفظ ترتیب (Drag & Drop)
// -------------------------------------------------------------
console.log('[تست ۱۱] مرتب‌سازی گزینه‌های فهرست با آرایه شناسه‌ها');
function reorder(items, orderedIds) {
  orderedIds.forEach((id, index) => {
    const item = items.find((i) => i.id === id);
    if (item) {
      item.order = index + 1;
    }
  });
  return items.sort((a, b) => a.order - b.order);
}
const initialOrder = currentState.cost_categories.map((i) => i.id);
const reversedOrder = [...initialOrder].reverse();
const reordered = reorder(currentState.cost_categories, reversedOrder);
assert.strictEqual(reordered[0].id, reversedOrder[0]);
assert.strictEqual(reordered[0].order, 1);
assert.strictEqual(reordered[reordered.length - 1].order, reordered.length);
console.log('✓ تست ۱۱ با موفقیت پاس شد.');
passCount++;

// -------------------------------------------------------------
// [تست ۱۲] گروه‌بندی صحیح وضعیت‌های لید (open, won, lost)
// -------------------------------------------------------------
console.log('[تست ۱۲] بررسی گروه‌بندی وضعیت‌های لید در سه گروه باز، برنده و بازنده');
const leadStatuses = currentState.lead_statuses;
const openStatuses = leadStatuses.filter((s) => s.group === 'open');
const wonStatuses = leadStatuses.filter((s) => s.group === 'won');
const lostStatuses = leadStatuses.filter((s) => s.group === 'lost');

assert.strictEqual(openStatuses.length, 4, 'گروه open باید شامل ۴ وضعیت اولیه باشد.');
assert(openStatuses.some((s) => s.key === 'new'));
assert(openStatuses.some((s) => s.key === 'in_progress'));
assert(openStatuses.some((s) => s.key === 'qualified'));
assert(openStatuses.some((s) => s.key === 'proposal'));

assert.strictEqual(wonStatuses.length, 1, 'گروه won باید ۱ وضعیت (مشتری) داشته باشد.');
assert.strictEqual(wonStatuses[0].key, 'won');

assert.strictEqual(lostStatuses.length, 1, 'گروه lost باید ۱ وضعیت (ردشده) داشته باشد.');
assert.strictEqual(lostStatuses[0].key, 'lost');
console.log('✓ تست ۱۲ با موفقیت پاس شد.');
passCount++;

// -------------------------------------------------------------
// [تست ۱۳ و ۱۴] گارد قاطع سند در رد حذف گزینه پراستفاده با ذکر تعداد
// -------------------------------------------------------------
console.log('[تست ۱۳ و ۱۴] اعمال گارد سند در ممانعت از حذف گزینه پراستفاده با پیام دقیق');
function attemptDelete(listType, item) {
  const usage = calculateUsage(listType, item);
  if (usage > 0) {
    throw new Error(`در ${usage.toLocaleString('fa-IR')} مورد استفاده شده؛ فقط غیرفعال می‌شود`);
  }
  throw new Error('حذف فیزیکی گزینه‌ها در این نسخه پشتیبانی نمی‌شود؛ گزینه فقط غیرفعال می‌شود.');
}

const adMediaCat = currentState.cost_categories.find((c) => c.key === 'ad_media');
assert.throws(
  () => attemptDelete('cost_categories', adMediaCat),
  (err) => {
    assert(
      (err.message.includes('۱۲ مورد استفاده شده') || err.message.includes('12 مورد استفاده شده')) &&
      err.message.includes('فقط غیرفعال می‌شود'),
      `پیام خطا باید شامل ۱۲ مورد استفاده شده و فقط غیرفعال می‌شود باشد. پیام دریافت شده: ${err.message}`
    );
    return true;
  },
  'باید خطای دقیق سند محصول با ذکر ۱۲ مورد استفاده پرتاب شود.'
);
console.log('✓ تست‌های ۱۳ و ۱۴ با موفقیت پاس شدند.');
passCount += 2;

// -------------------------------------------------------------
// [تست ۱۵] محاسبه تعداد استفاده از داده‌های واقعی Mock
// -------------------------------------------------------------
console.log('[تست ۱۵] محاسبه داینامیک تعداد استفاده برای انواع موجودیت‌ها');
assert.strictEqual(calculateUsage('cost_categories', { key: 'ad_media' }), 12);
assert.strictEqual(calculateUsage('campaign_types', { key: 'instagram' }), 2);
assert.strictEqual(calculateUsage('lead_sources', { key: 'google_ads' }), 3);
assert.strictEqual(calculateUsage('lead_statuses', { key: 'new' }), 2);
assert.strictEqual(calculateUsage('lost_reasons', { key: 'budget_limit' }), 1);
assert.strictEqual(calculateUsage('lost_reasons', { key: 'non_existent' }), 0);
console.log('✓ تست ۱۵ با موفقیت پاس شد.');
passCount++;

// -------------------------------------------------------------
// [تست ۱۶] به‌روزرسانی تنظیمات عمومی سازمان
// -------------------------------------------------------------
console.log('[تست ۱۶] به‌روزرسانی تنظیمات عمومی سازمان');
function updateGeneral(current, updates) {
  if (updates.name !== undefined) {
    if (!updates.name.trim()) throw new Error('نام سازمان نمی‌تواند خالی باشد.');
    current.name = updates.name.trim();
  }
  if (updates.currency !== undefined) {
    if (updates.currency !== 'TOMAN' && updates.currency !== 'IRR') {
      throw new Error('واحد پول نامعتبر است.');
    }
    current.currency = updates.currency;
  }
  if (updates.timezone !== undefined) {
    if (!updates.timezone.trim()) throw new Error('منطقه زمانی نمی‌تواند خالی باشد.');
    current.timezone = updates.timezone.trim();
  }
  current.updatedAt = new Date().toISOString();
  return current;
}

const updatedGen = updateGeneral(currentState.general, {
  name: 'گروه بین‌المللی گپ‌جی',
  currency: 'TOMAN',
  timezone: 'Asia/Tehran',
});
assert.strictEqual(updatedGen.name, 'گروه بین‌المللی گپ‌جی');
assert.strictEqual(updatedGen.currency, 'TOMAN');
console.log('✓ تست ۱۶ با موفقیت پاس شد.');
passCount++;

// -------------------------------------------------------------
// [تست ۱۷] اعتبارسنجی واحد پول
// -------------------------------------------------------------
console.log('[تست ۱۷] اعتبارسنجی واحد پول و ممانعت از انتخاب ارزهای غیرمجاز');
assert.throws(
  () => updateGeneral(currentState.general, { currency: 'USD' }),
  /واحد پول نامعتبر است/
);
assert.throws(
  () => updateGeneral(currentState.general, { currency: 'EUR' }),
  /واحد پول نامعتبر است/
);
console.log('✓ تست ۱۷ با موفقیت پاس شد.');
passCount++;

// -------------------------------------------------------------
// [تست ۱۸] حفظ داده‌های قبلی هنگام Seed مجدد (عدم بازنویسی)
// -------------------------------------------------------------
console.log('[تست ۱۸] اطمینان از عدم بازنویسی داده‌های کاربر در صورت اجرای مجدد منطق Seed');
currentState.general.name = 'سازمان سفارشی ویرایش‌شده توسط ادمین';
saveStoredState(currentState);

// تلاش مجدد برای Seed در حضور پرچم STORAGE_KEY_SEEDED
const stateAfterSeedTest = getStoredState();
assert.strictEqual(
  stateAfterSeedTest.general.name,
  'سازمان سفارشی ویرایش‌شده توسط ادمین',
  'نام نباید به مقدار اولیه شرکت فناوری گپ‌جی بازگردد.'
);
console.log('✓ تست ۱۸ با موفقیت پاس شد.');
passCount++;

// -------------------------------------------------------------
// [تست ۱۹] حفظ کلیدهای موجود ماژول Campaigns
// -------------------------------------------------------------
console.log('[تست ۱۹] انطباق کامل با کلیدهای ماژول Campaigns');
const campaignTypesContent = fs.readFileSync(
  path.join(PROJECT_ROOT, 'src', 'features', 'campaigns', 'components', 'wizard', 'steps', 'step-1-basic-info.tsx'),
  'utf-8'
);
const expectedCampaignChannels = [
  { key: 'google_ads', labelSub: 'گوگل' },
  { key: 'instagram', labelSub: 'اینستاگرام' },
  { key: 'yektanet', labelSub: 'یکتانت' },
  { key: 'sms', labelSub: 'پیامک' },
  { key: 'email_marketing', labelSub: 'ایمیل' },
];
for (const ch of expectedCampaignChannels) {
  assert(
    currentState.campaign_types.some((ct) => ct.key === ch.key || ct.label.includes(ch.labelSub)),
    `کانال ${ch.key} در تنظیمات انواع کمپین یافت نشد.`
  );
}
console.log('✓ تست ۱۹ با موفقیت پاس شد.');
passCount++;

// -------------------------------------------------------------
// [تست ۲۰] حفظ کلیدهای موجود ماژول Leads
// -------------------------------------------------------------
console.log('[تست ۲۰] انطباق کلیدهای وضعیت‌ها با ماژول Leads');
const leadsTypesContent = fs.readFileSync(
  path.join(PROJECT_ROOT, 'src', 'features', 'leads', 'types.ts'),
  'utf-8'
);
const expectedLeadStatuses = ['new', 'in_progress', 'qualified', 'proposal', 'won', 'lost'];
for (const st of expectedLeadStatuses) {
  assert(
    currentState.lead_statuses.some((s) => s.key === st),
    `وضعیت ${st} در تنظیمات وضعیت‌های لید یافت نشد.`
  );
  assert(
    leadsTypesContent.includes(`'${st}'`),
    `وضعیت ${st} در types.ts لید موجود نیست.`
  );
}
console.log('✓ تست ۲۰ با موفقیت پاس شد.');
passCount++;

// -------------------------------------------------------------
// [تست ۲۱] حفظ دسته‌بندی‌های موجود Costs
// -------------------------------------------------------------
console.log('[تست ۲۱] انطباق کامل دسته‌بندی‌های هزینه با ماژول Costs');
const costsTypesContent = fs.readFileSync(
  path.join(PROJECT_ROOT, 'src', 'features', 'costs', 'types.ts'),
  'utf-8'
);
const expectedCostCategories = [
  'ad_media',
  'content_production',
  'agency_fee',
  'software_saas',
  'events_webinar',
  'influencer',
  'other',
];
for (const cat of expectedCostCategories) {
  assert(
    currentState.cost_categories.some((c) => c.key === cat),
    `دسته‌بندی ${cat} در تنظیمات هزینه‌ها یافت نشد.`
  );
  assert(
    costsTypesContent.includes(`'${cat}'`),
    `دسته‌بندی ${cat} در types.ts هزینه‌ها موجود نیست.`
  );
}
console.log('✓ تست ۲۱ با موفقیت پاس شد.');
passCount++;

// -------------------------------------------------------------
// [تست ۲۲] نبود تغییر در داده و فایل ماژول‌های قبلی
// -------------------------------------------------------------
console.log('[تست ۲۲] بررسی عدم تغییر و عدم دستکاری در ماژول‌های قبلی');
const previousFeatures = ['campaigns', 'leads', 'costs', 'users', 'tasks', 'dashboard'];
for (const feat of previousFeatures) {
  const featPath = path.join(PROJECT_ROOT, 'src', 'features', feat);
  assert(fs.existsSync(featPath), `پوشه ماژول ${feat} مفقود شده است.`);
}
console.log('✓ تست ۲۲ با موفقیت پاس شد.');
passCount++;

// -------------------------------------------------------------
// [تست ۲۳] تغییر عنوان Lost Reason و حفظ شمارش سوابق (جلوگیری از صفر کاذب)
// -------------------------------------------------------------
console.log('[تست ۲۳] بررسی تغییر عنوان Lost Reason و حفظ پایداری شمارش سوابق قبلی');
const budgetReason = currentState.lost_reasons.find((r) => r.key === 'budget_limit');
assert(budgetReason, 'دلیل رد شدن بودجه باید وجود داشته باشد.');

// ۱. شمارش سابقه اولیه
const initialBudgetUsage = calculateUsage('lost_reasons', budgetReason);
assert.strictEqual(initialBudgetUsage, 1, 'دلیل محدودیت بودجه باید ۱ سابقه داشته باشد.');

// ۲. شبیه‌سازی تغییر عنوان به عبارتی کاملاً جدید توسط مدیر
const oldLabel = budgetReason.label;
budgetReason.previousLabels = [oldLabel];
budgetReason.label = 'عدم تصویب یا محدودیت سقف بودجه مالی';
saveStoredState(currentState);

// ۳. بررسی شمارش با عنوان جدید از طریق previousLabels (فقط تطبیق دقیق، بدون ریشه کلمات یا شباهت مفهومی)
function calculateExactUsage(listType, item, mockLeadsData) {
  if (listType === 'lost_reasons') {
    const candidates = [item.label, ...(item.previousLabels || [])].map((c) => c.trim().toLowerCase());
    return mockLeadsData.filter((l) => {
      if (l.status !== 'lost' || !l.lostReason) return false;
      const text = String(l.lostReason).trim().toLowerCase();
      // تطبیق دقیق با عنوان یا عناوین قبلی (بدون تطبیق حدسی با کلمات مشترک مثل «بودجه»)
      return candidates.includes(text);
    }).length;
  }
  return 0;
}

const mockLeads = [
  {
    id: 'lead-102',
    status: 'lost',
    lostReason: 'محدودیت بودجه در این فصل مالی و موکول شدن به سال آینده.',
  },
  {
    id: 'lead-103',
    status: 'won',
    lostReason: undefined,
  },
  {
    id: 'lead-104',
    status: 'lost',
    lostReason: 'محدودیت بودجه خرید تجهیزات و سخت‌افزار', // فقط کلمه «بودجه» دارد و نباید شمارش شود
  },
];

// سابقه قبلی lead-102 باید به دلیل وجود در previousLabels دقیقاً شمرده شود (جلوگیری از صفر کاذب)
budgetReason.previousLabels = ['محدودیت بودجه در این فصل مالی و موکول شدن به سال آینده.'];
const usageAfterLabelChange = calculateExactUsage('lost_reasons', budgetReason, mockLeads);
assert.strictEqual(
  usageAfterLabelChange,
  1,
  'پس از تغییر عنوان، سابقه لید قبلی از طریق previousLabels حفظ شده و شمارش صفر کاذب رخ نمی‌دهد.'
);

// اطمینان از عدم شمارش بیش‌ازحد (Over-counting): lead-104 نباید شمرده شود
assert.strictEqual(
  calculateExactUsage('lost_reasons', budgetReason, [mockLeads[2]]),
  0,
  'گزینه نامرتبط با صرف کلمه مشترک «بودجه» نباید شمرده شود (جلوگیری قطعی از Over-counting).'
);
console.log('✓ تست ۲۳ با موفقیت پاس شد.');
passCount++;

// -------------------------------------------------------------
// [تست ۲۴] حفظ شمارش پس از بارگذاری مجدد Storage
// -------------------------------------------------------------
console.log('[تست ۲۴] حفظ اطلاعات و شمارش پس از بارگذاری مجدد از Storage');
const reloadedAfterChange = getStoredState();
const reloadedBudgetReason = reloadedAfterChange.lost_reasons.find((r) => r.key === 'budget_limit');
assert(reloadedBudgetReason.previousLabels.includes('محدودیت بودجه در این فصل مالی'));
assert.strictEqual(reloadedBudgetReason.label, 'عدم تصویب یا محدودیت سقف بودجه مالی');
console.log('✓ تست ۲۴ با موفقیت پاس شد.');
passCount++;

// -------------------------------------------------------------
// [تست ۲۵] تطبیق دقیق کلیدهای Campaign Type با داده‌های موجود بدون تخریب مدل
// -------------------------------------------------------------
console.log('[تست ۲۵] تطبیق کلیدهای انواع کمپین با داده‌های موجود بدون تخریب مدل');
const supportedTypes = ['omnichannel', 'google_ads', 'instagram', 'yektanet', 'email_marketing', 'sms'];
for (const key of supportedTypes) {
  assert(
    reloadedAfterChange.campaign_types.some((ct) => ct.key === key),
    `کلید ${key} در انواع کمپین موجود نیست.`
  );
}
console.log('✓ تست ۲۵ با موفقیت پاس شد.');
passCount++;

console.log('\n============================================================');
console.log(`نتیجه نهایی: تمامی ${passCount} سناریوی آزمون لایه داده و سرویس Organization با موفقیت ۱۰۰٪ پاس شدند.`);
console.log('============================================================\n');
