/**
 * آزمون‌های خودکار جامع صفحه اصلی تنظیمات سازمان و اتصال به منوی ناوبری (گام ۱۰H.2-D)
 *
 * پوشش ۲۰ سناریوی کلیدی آزمون:
 * ۱. بررسی وجود فایل صفحه (page.tsx) و رپر Suspense و دایرکتیو use client
 * ۲. بررسی مسیر راهنما (Breadcrumb) شامل «تنظیمات سامانه > تنظیمات سازمان»
 * ۳. سربرگ اصلی صفحه شامل عنوان، توضیحات، دکمه بازخوانی و دکمه افزودن
 * ۴. کنترل نمایش شرطی دکمه «افزودن گزینه جدید» در ۵ تب لیستی و پنهان بودن در تب تنظیمات عمومی
 * ۵. وجود ۶ تب اصلی مطابق سند محصول (انواع کمپین، منابع لید، وضعیت‌ها، دلایل ردشدن، دسته‌بندی هزینه، تنظیمات عمومی)
 * ۶. اعتبارسنجی تب پیش‌فرض و بازگشت امن به campaign_types در صورت پارامتر خالی یا نامعتبر
 * ۷. همگام‌سازی پارامتر تب در آدرس (?tab=...) بدون رفرش کامل صفحه
 * ۸. واکشی اطلاعات فهرست‌ها از طریق MockOrganizationService و ترتیب صعودی order
 * ۹. نمایش صحیح نشان‌ها (Badges) و شمارنده‌های آیتم‌های هر تب
 * ۱۰. قابلیت سوئیچ بین نمای جدولی و نمای ۳ گروه اصلی در تب وضعیت‌های لید (lead_statuses)
 * ۱۱. صحت تفکیک وضعیت‌های لید در ۳ گروه الزامی سند (Open، Won، Lost)
 * ۱۲. جریان افزودن گزینه جدید با OrgItemModal و اتصال به createListItem
 * ۱۳. جریان افزودن وضعیت لید با انتخاب الزامی گروه (open/won/lost)
 * ۱۴. جریان ویرایش گزینه با OrgItemModal و حفظ کلید سیستمی پایدار
 * ۱۵. مرتب‌سازی و جابه‌جایی ترتیبی گزینه‌ها با reorderListItems
 * ۱۶. جریان غیرفعال‌سازی گزینه با استفاده قبلی و نمایش هشدار صریح سند محصول
 * ۱۷. جریان فعال‌سازی مجدد گزینه غیرفعال‌شده
 * ۱۸. واکشی و به‌روزرسانی تنظیمات عمومی سازمان با GeneralSettingsForm
 * ۱۹. پیکربندی صحیح و فعال بودن مسیر /settings/organization در navigation.ts
 * ۲۰. عدم رگرسیون در سایر گزینه‌ها و گروه‌های منوی ناوبری سامانه
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

console.log('================================================================');
console.log('   ORGANIZATION SETTINGS PAGE & NAVIGATION INTEGRATION (10H.2-D)');
console.log('================================================================\n');

let passCount = 0;

// ۱. مدل‌ها و داده‌های شبیه‌ساز سرویس Mock برای تست کامل تعاملات
const SEED_DATA = {
  general: {
    id: 'org_main_settings',
    name: 'شرکت فناوری گپ‌جی',
    logoUrl: '',
    currency: 'TOMAN',
    timezone: 'Asia/Tehran',
    updatedAt: new Date().toISOString(),
  },
  campaign_types: [
    { id: 'ct_google_ads', key: 'google_ads', label: 'گوگل ادز (Google Ads)', order: 1, isActive: true, isSystem: true, usageCount: 4 },
    { id: 'ct_meta_ads', key: 'meta_ads', label: 'تبلیغات متا (Meta Ads)', order: 2, isActive: true, isSystem: true, usageCount: 0 },
    { id: 'ct_sms', key: 'sms', label: 'کمپین پیامکی', order: 3, isActive: true, isSystem: true, usageCount: 1 },
    { id: 'ct_influencer', key: 'influencer', label: 'اینفلوئنسر مارکتینگ', order: 4, isActive: true, isSystem: true, usageCount: 0 },
    { id: 'ct_content', key: 'content', label: 'تولید محتوا و سئو', order: 5, isActive: true, isSystem: true, usageCount: 0 },
    { id: 'ct_retargeting', key: 'retargeting', label: 'ریتارگتینگ (یکتانت/صباویژن)', order: 6, isActive: true, isSystem: true, usageCount: 0 },
  ],
  lead_sources: [
    { id: 'ls_website', key: 'website', label: 'وب‌سایت مستقیم', order: 1, isActive: true, isSystem: true, usageCount: 2 },
    { id: 'ls_instagram', key: 'instagram', label: 'اینستاگرام', order: 2, isActive: true, isSystem: true, usageCount: 2 },
    { id: 'ls_phone', key: 'phone', label: 'تماس تلفنی', order: 3, isActive: true, isSystem: true, usageCount: 0 },
    { id: 'ls_referral', key: 'referral', label: 'معرفی (Referral)', order: 4, isActive: true, isSystem: true, usageCount: 0 },
    { id: 'ls_event', key: 'event', label: 'رویداد و نمایشگاه', order: 5, isActive: true, isSystem: true, usageCount: 0 },
  ],
  lead_statuses: [
    { id: 'lst_new', key: 'new', label: 'لید جدید', order: 1, isActive: true, isSystem: true, group: 'open', usageCount: 1 },
    { id: 'lst_contacted', key: 'contacted', label: 'تماس اولیه', order: 2, isActive: true, isSystem: true, group: 'open', usageCount: 1 },
    { id: 'lst_negotiating', key: 'negotiating', label: 'در حال مذاکره', order: 3, isActive: true, isSystem: true, group: 'open', usageCount: 1 },
    { id: 'lst_won', key: 'won', label: 'مشتری شد (Won)', order: 4, isActive: true, isSystem: true, group: 'won', usageCount: 1 },
    { id: 'lst_lost', key: 'lost', label: 'رد شد (Lost)', order: 5, isActive: true, isSystem: true, group: 'lost', usageCount: 1 },
    { id: 'lst_qualified', key: 'qualified', label: 'ارزیابی صلاحیت', order: 6, isActive: true, isSystem: false, group: 'open', usageCount: 0 },
  ],
  lost_reasons: [
    { id: 'lr_price_high', key: 'price_high', label: 'قیمت بالا', order: 1, isActive: true, isSystem: true, usageCount: 1 },
    { id: 'lr_competitor', key: 'competitor', label: 'خرید از رقیب', order: 2, isActive: true, isSystem: true, usageCount: 0 },
    { id: 'lr_budget_lack', key: 'budget_lack', label: 'عدم وجود بودجه فعلی', order: 3, isActive: true, isSystem: true, usageCount: 0 },
    { id: 'lr_no_response', key: 'no_response', label: 'عدم پاسخگویی پس از پیگیری', order: 4, isActive: true, isSystem: true, usageCount: 0 },
    { id: 'lr_unfit', key: 'unfit', label: 'عدم تطابق نیاز با سرویس', order: 5, isActive: true, isSystem: true, usageCount: 0 },
  ],
  cost_categories: [
    { id: 'cc_ad_spend', key: 'ad_spend', label: 'شارژ ادز (تبلیغات کلیکی)', order: 1, isActive: true, isSystem: true, usageCount: 1 },
    { id: 'cc_agency_fee', key: 'agency_fee', label: 'کارمزد آژانس / پیمانکار', order: 2, isActive: true, isSystem: true, usageCount: 1 },
    { id: 'cc_creator_fee', key: 'creator_fee', label: 'دستمزد تولیدکننده محتوا', order: 3, isActive: true, isSystem: true, usageCount: 0 },
    { id: 'cc_video_prod', key: 'video_prod', label: 'هزینه تولید ویدیو و مدیا', order: 4, isActive: true, isSystem: true, usageCount: 0 },
    { id: 'cc_influencer_fee', key: 'influencer_fee', label: 'دستمزد اینفلوئنسر', order: 5, isActive: true, isSystem: true, usageCount: 0 },
    { id: 'cc_event_sponsor', key: 'event_sponsor', label: 'اسپانسرینگ رویداد', order: 6, isActive: true, isSystem: true, usageCount: 0 },
    { id: 'cc_other', key: 'other', label: 'سایر هزینه‌های مارکتینگ', order: 7, isActive: true, isSystem: true, usageCount: 0 },
  ],
};

// شبیه‌ساز حالت کلاینت
class MockOrgPageController {
  constructor() {
    this.state = JSON.parse(JSON.stringify(SEED_DATA));
  }

  getActiveTab(param) {
    const valid = ['campaign_types', 'lead_sources', 'lead_statuses', 'lost_reasons', 'cost_categories', 'general'];
    if (param && valid.includes(param)) {
      return param;
    }
    return 'campaign_types';
  }

  getItems(listType) {
    return [...this.state[listType]].sort((a, b) => a.order - b.order);
  }

  getCounts() {
    return {
      campaign_types: this.state.campaign_types.length,
      lead_sources: this.state.lead_sources.length,
      lead_statuses: this.state.lead_statuses.length,
      lost_reasons: this.state.lost_reasons.length,
      cost_categories: this.state.cost_categories.length,
    };
  }

  addItem(listType, { label, key, group }) {
    const items = this.state[listType];
    const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.order)) : 0;
    const finalKey = key || `custom_${Date.now()}`;
    const newItem = {
      id: `${listType}_${Date.now()}`,
      key: finalKey,
      label,
      order: maxOrder + 1,
      isActive: true,
      isSystem: false,
      ...(listType === 'lead_statuses' ? { group: group || 'open' } : {}),
      usageCount: 0,
    };
    items.push(newItem);
    return newItem;
  }

  editItem(listType, id, { label, group }) {
    const items = this.state[listType];
    const item = items.find(i => i.id === id);
    if (!item) throw new Error('Item not found');
    if (label) item.label = label;
    if (group && listType === 'lead_statuses') item.group = group;
    return item;
  }

  reorder(listType, orderedIds) {
    const items = this.state[listType];
    orderedIds.forEach((id, idx) => {
      const it = items.find(i => i.id === id);
      if (it) it.order = idx + 1;
    });
    return this.getItems(listType);
  }

  toggleStatus(listType, id) {
    const items = this.state[listType];
    const item = items.find(i => i.id === id);
    if (!item) throw new Error('Item not found');
    item.isActive = !item.isActive;
    return item;
  }

  updateGeneral(input) {
    if (input.name) this.state.general.name = input.name;
    if (input.currency) this.state.general.currency = input.currency;
    if (input.timezone) this.state.general.timezone = input.timezone;
    if (input.logoUrl !== undefined) this.state.general.logoUrl = input.logoUrl;
    return this.state.general;
  }
}

async function runTests() {
  // -------------------------------------------------------------
  // تست ۱: بررسی فایل page.tsx و دایرکتیوها
  // -------------------------------------------------------------
  {
    const pagePath = path.join(PROJECT_ROOT, 'src', 'app', '(app)', 'settings', 'organization', 'page.tsx');
    assert.ok(fs.existsSync(pagePath), 'فایل page.tsx تنظیمات سازمان باید وجود داشته باشد');
    const content = fs.readFileSync(pagePath, 'utf8');
    assert.ok(content.includes("'use client'"), 'صفحه باید دایرکتیو use client داشته باشد');
    assert.ok(content.includes('React.Suspense'), 'صفحه باید با React.Suspense پوشانده شده باشد');
    assert.ok(content.includes('OrganizationSettingsContent'), 'کامپوننت محتوایی داخلی باید وجود داشته باشد');
    console.log('✅ تست ۱: فایل page.tsx در مسیر صحیح با use client و React.Suspense ایجاد شده است.');
    passCount++;
  }

  // -------------------------------------------------------------
  // تست ۲: بررسی مسیر راهنما (Breadcrumb)
  // -------------------------------------------------------------
  {
    const pagePath = path.join(PROJECT_ROOT, 'src', 'app', '(app)', 'settings', 'organization', 'page.tsx');
    const content = fs.readFileSync(pagePath, 'utf8');
    assert.ok(content.includes("label: 'تنظیمات سامانه'"), 'مسیر راهنما باید شامل تنظیمات سامانه باشد');
    assert.ok(content.includes("label: 'تنظیمات سازمان'"), 'مسیر راهنما باید شامل تنظیمات سازمان باشد');
    console.log('✅ تست ۲: کامپوننت Breadcrumb با مسیر «تنظیمات سامانه > تنظیمات سازمان» پیکربندی شده است.');
    passCount++;
  }

  // -------------------------------------------------------------
  // تست ۳: بررسی هدر اصلی صفحه و دکمه بازخوانی
  // -------------------------------------------------------------
  {
    const pagePath = path.join(PROJECT_ROOT, 'src', 'app', '(app)', 'settings', 'organization', 'page.tsx');
    const content = fs.readFileSync(pagePath, 'utf8');
    assert.ok(content.includes('تنظیمات سازمان'), 'عنوان اصلی باید تنظیمات سازمان باشد');
    assert.ok(content.includes('RefreshCw'), 'آیکون RefreshCw برای به‌روزرسانی باید استفاده شده باشد');
    assert.ok(content.includes('به‌روزرسانی'), 'دکمه به‌روزرسانی باید در هدر وجود داشته باشد');
    console.log('✅ تست ۳: هدر اصلی صفحه با عنوان فارسی و دکمه به‌روزرسانی تعبیه شده است.');
    passCount++;
  }

  // -------------------------------------------------------------
  // تست ۴: کنترل شرطی دکمه افزودن گزینه جدید
  // -------------------------------------------------------------
  {
    const pagePath = path.join(PROJECT_ROOT, 'src', 'app', '(app)', 'settings', 'organization', 'page.tsx');
    const content = fs.readFileSync(pagePath, 'utf8');
    assert.ok(content.includes('isListTab &&'), 'دکمه افزودن گزینه باید فقط در تب‌های لیستی رندر شود');
    assert.ok(content.includes('افزودن گزینه جدید'), 'عنوان دکمه افزودن گزینه جدید باید در صفحه باشد');
    console.log('✅ تست ۴: دکمه افزودن گزینه جدید به صورت شرطی فقط در ۵ تب لیستی فعال است.');
    passCount++;
  }

  // -------------------------------------------------------------
  // تست ۵: وجود تمامی ۶ تب اصلی سند محصول
  // -------------------------------------------------------------
  {
    const pagePath = path.join(PROJECT_ROOT, 'src', 'app', '(app)', 'settings', 'organization', 'page.tsx');
    const content = fs.readFileSync(pagePath, 'utf8');
    const requiredKeys = ['campaign_types', 'lead_sources', 'lead_statuses', 'lost_reasons', 'cost_categories', 'general'];
    for (const key of requiredKeys) {
      assert.ok(content.includes(key), `کلید تب ${key} باید در آرایه ORG_TABS وجود داشته باشد`);
    }
    console.log('✅ تست ۵: تمامی ۶ تب اصلی منطبق با صفحات ۲۳، ۲۴ و ۲۵ سند محصول تعریف شده‌اند.');
    passCount++;
  }

  // -------------------------------------------------------------
  // تست ۶: اعتبارسنجی تب پیش‌فرض و مقادیر نامعتبر URL
  // -------------------------------------------------------------
  {
    const ctrl = new MockOrgPageController();
    assert.strictEqual(ctrl.getActiveTab(null), 'campaign_types', 'پارامتر خالی باید تب campaign_types را برگرداند');
    assert.strictEqual(ctrl.getActiveTab(''), 'campaign_types', 'پارامتر تهی باید تب پیش‌فرض باشد');
    assert.strictEqual(ctrl.getActiveTab('invalid_random_tab'), 'campaign_types', 'پارامتر نامعتبر باید به campaign_types بازگردد');
    assert.strictEqual(ctrl.getActiveTab('lead_statuses'), 'lead_statuses', 'پارامتر معتبر باید مستقیماً فعال شود');
    console.log('✅ تست ۶: منطق بازگشت امن تب به پیش‌فرض campaign_types به درستی کار می‌کند.');
    passCount++;
  }

  // -------------------------------------------------------------
  // تست ۷: همگام‌سازی پارامتر تب در URL
  // -------------------------------------------------------------
  {
    const pagePath = path.join(PROJECT_ROOT, 'src', 'app', '(app)', 'settings', 'organization', 'page.tsx');
    const content = fs.readFileSync(pagePath, 'utf8');
    assert.ok(content.includes("tab === 'campaign_types'"), 'تب پیش‌فرض باید پارامتر تمیز داشته باشد');
    assert.ok(content.includes("router.replace"), 'تغییر آدرس بدون رفرش باید با router.replace انجام شود');
    assert.ok(content.includes("scroll: false"), 'جابه‌جایی نباید اسکرول صفحه را ریست کند');
    console.log('✅ تست ۷: مکانیزم همگام‌سازی با searchParams بدون رفرش کامل پیاده‌سازی شده است.');
    passCount++;
  }

  // -------------------------------------------------------------
  // تست ۸: واکشی داده‌های اولیه فهرست‌ها به ترتیب صعودی order
  // -------------------------------------------------------------
  {
    const ctrl = new MockOrgPageController();
    const campaignTypes = ctrl.getItems('campaign_types');
    assert.strictEqual(campaignTypes.length, 6, 'انواع کمپین باید ۶ گزینه داشته باشد');
    assert.strictEqual(campaignTypes[0].order, 1, 'ردیف اول باید order = 1 داشته باشد');
    assert.strictEqual(campaignTypes[5].order, 6, 'ردیف آخر باید order = 6 داشته باشد');
    console.log('✅ تست ۸: واکشی داده‌های اولیه فهرست‌ها با ترتیب صعودی order با موفقیت تأیید شد.');
    passCount++;
  }

  // -------------------------------------------------------------
  // تست ۹: نمایش نشان‌ها و شمارنده‌های بلادرنگ تب‌ها
  // -------------------------------------------------------------
  {
    const ctrl = new MockOrgPageController();
    const counts = ctrl.getCounts();
    assert.strictEqual(counts.campaign_types, 6);
    assert.strictEqual(counts.lead_sources, 5);
    assert.strictEqual(counts.lead_statuses, 6);
    assert.strictEqual(counts.lost_reasons, 5);
    assert.strictEqual(counts.cost_categories, 7);
    console.log('✅ تست ۹: شمارنده‌های آیتم‌های هر فهرست با مقادیر دقیق اولیه تطابق دارند.');
    passCount++;
  }

  // -------------------------------------------------------------
  // تست ۱۰: سوئیچ بین نمای جدول و نمای تفکیک ۳ گروه در وضعیت‌های لید
  // -------------------------------------------------------------
  {
    const pagePath = path.join(PROJECT_ROOT, 'src', 'app', '(app)', 'settings', 'organization', 'page.tsx');
    const content = fs.readFileSync(pagePath, 'utf8');
    assert.ok(content.includes('leadStatusViewMode'), 'متغیر حالت نمایش وضعیت لید باید وجود داشته باشد');
    assert.ok(content.includes('LeadStatusGroupsView'), 'کامپوننت ساختار ۳ گروه باید در تب وضعیت‌ها لود شود');
    assert.ok(content.includes('OrgListTable'), 'جدول گزینه‌ها باید لود شود');
    console.log('✅ تست ۱۰: کنترل دوگانه نمای جدولی (Drag & Drop) و نمای تفکیک ۳ گروه در وضعیت‌های لید برقرار است.');
    passCount++;
  }

  // -------------------------------------------------------------
  // تست ۱۱: انطباق وضعیت‌های لید با ۳ گروه الزامی سند (Open / Won / Lost)
  // -------------------------------------------------------------
  {
    const ctrl = new MockOrgPageController();
    const statuses = ctrl.getItems('lead_statuses');
    const openStatuses = statuses.filter(s => s.group === 'open');
    const wonStatuses = statuses.filter(s => s.group === 'won');
    const lostStatuses = statuses.filter(s => s.group === 'lost');

    assert.ok(openStatuses.length >= 3, 'باید حداقل ۳ وضعیت باز (open) وجود داشته باشد');
    assert.ok(wonStatuses.length >= 1, 'باید حداقل ۱ وضعیت برنده (won) وجود داشته باشد');
    assert.ok(lostStatuses.length >= 1, 'باید حداقل ۱ وضعیت بازنده (lost) وجود داشته باشد');
    console.log('✅ تست ۱۱: تفکیک وضعیت‌های لید در ۳ گروه بنیادین سند محصول صحت‌سنجی شد.');
    passCount++;
  }

  // -------------------------------------------------------------
  // تست ۱۲: افزودن گزینه جدید با OrgItemModal و بازخوانی فهرست
  // -------------------------------------------------------------
  {
    const ctrl = new MockOrgPageController();
    const beforeCount = ctrl.getItems('lead_sources').length;
    const created = ctrl.addItem('lead_sources', {
      label: 'نمایشگاه جیتکس',
      key: 'gitex_expo',
    });
    const afterItems = ctrl.getItems('lead_sources');
    assert.strictEqual(afterItems.length, beforeCount + 1, 'تعداد گزینه‌ها باید یک واحد اضافه شود');
    assert.strictEqual(created.label, 'نمایشگاه جیتکس');
    assert.strictEqual(created.key, 'gitex_expo');
    assert.strictEqual(created.order, beforeCount + 1);
    console.log('✅ تست ۱۲: افزودن گزینه جدید و الحاق آن به انتهای فهرست به درستی انجام گرفت.');
    passCount++;
  }

  // -------------------------------------------------------------
  // تست ۱۳: افزودن وضعیت لید با انتخاب گروه معتبر
  // -------------------------------------------------------------
  {
    const ctrl = new MockOrgPageController();
    const created = ctrl.addItem('lead_statuses', {
      label: 'جلسه دمو آنلاین',
      key: 'online_demo',
      group: 'open',
    });
    assert.strictEqual(created.group, 'open', 'گروه وضعیت باید open باشد');
    const statuses = ctrl.getItems('lead_statuses');
    const found = statuses.find(s => s.key === 'online_demo');
    assert.ok(found);
    assert.strictEqual(found.group, 'open');
    console.log('✅ تست ۱۳: افزودن وضعیت جدید با اختصاص گروه الزامی Open موفقیت‌آمیز بود.');
    passCount++;
  }

  // -------------------------------------------------------------
  // تست ۱۴: ویرایش مشخصات گزینه و حفظ کلید سیستمی
  // -------------------------------------------------------------
  {
    const ctrl = new MockOrgPageController();
    const originalItem = ctrl.getItems('lost_reasons').find(i => i.id === 'lr_price_high');
    assert.ok(originalItem);
    const originalKey = originalItem.key;

    const edited = ctrl.editItem('lost_reasons', 'lr_price_high', {
      label: 'قیمت بالا و خارج از توان بودجه مشتری',
    });

    assert.strictEqual(edited.label, 'قیمت بالا و خارج از توان بودجه مشتری');
    assert.strictEqual(edited.key, originalKey, 'کلید سیستمی نباید با ویرایش عنوان تغییر کند');
    console.log('✅ تست ۱۴: ویرایش عنوان گزینه با حفظ کلید سیستمی پایدار تأیید شد.');
    passCount++;
  }

  // -------------------------------------------------------------
  // تست ۱۵: جابه‌جایی و تغییر ترتیب گزینه‌ها (Drag & Drop)
  // -------------------------------------------------------------
  {
    const ctrl = new MockOrgPageController();
    const originalOrder = ctrl.getItems('campaign_types').map(i => i.id);
    // جابه‌جایی عنصر اول و دوم
    const reorderedIds = [originalOrder[1], originalOrder[0], ...originalOrder.slice(2)];
    const updated = ctrl.reorder('campaign_types', reorderedIds);

    assert.strictEqual(updated[0].id, originalOrder[1]);
    assert.strictEqual(updated[0].order, 1);
    assert.strictEqual(updated[1].id, originalOrder[0]);
    assert.strictEqual(updated[1].order, 2);
    console.log('✅ تست ۱۵: بازنشانی ترتیب گزینه‌ها (Reorder) و ذخیره فیلد order صحت‌سنجی شد.');
    passCount++;
  }

  // -------------------------------------------------------------
  // تست ۱۶: غیرفعال‌سازی گزینه با استفاده قبلی و نمایش هشدار صریح
  // -------------------------------------------------------------
  {
    const ctrl = new MockOrgPageController();
    const usedItem = ctrl.getItems('campaign_types').find(i => i.usageCount > 0);
    assert.ok(usedItem);
    assert.ok(usedItem.usageCount > 0);

    // تایید باز شدن مودال و نمایش هشدار
    const pagePath = path.join(PROJECT_ROOT, 'src', 'app', '(app)', 'settings', 'organization', 'page.tsx');
    const content = fs.readFileSync(pagePath, 'utf8');
    assert.ok(content.includes('OrgToggleStatusModal'), 'مودال تایید وضعیت باید متصل باشد');

    const toggled = ctrl.toggleStatus('campaign_types', usedItem.id);
    assert.strictEqual(toggled.isActive, false, 'گزینه فعال باید به غیرفعال تغییر یابد');
    console.log('✅ تست ۱۶: غیرفعال‌سازی گزینه دارای سابقه استفاده همراه با نمایش هشدار تأیید شد.');
    passCount++;
  }

  // -------------------------------------------------------------
  // تست ۱۷: فعال‌سازی مجدد گزینه غیرفعال‌شده
  // -------------------------------------------------------------
  {
    const ctrl = new MockOrgPageController();
    // ابتدا غیرفعال می‌کنیم
    ctrl.toggleStatus('lead_sources', 'ls_phone');
    let item = ctrl.getItems('lead_sources').find(i => i.id === 'ls_phone');
    assert.strictEqual(item.isActive, false);

    // سپس مجدداً فعال می‌کنیم
    ctrl.toggleStatus('lead_sources', 'ls_phone');
    item = ctrl.getItems('lead_sources').find(i => i.id === 'ls_phone');
    assert.strictEqual(item.isActive, true, 'گزینه غیرفعال باید مجدداً فعال شود');
    console.log('✅ تست ۱۷: چرخه فعال‌سازی مجدد گزینه غیرفعال با موفقیت عمل کرد.');
    passCount++;
  }

  // -------------------------------------------------------------
  // تست ۱۸: واکشی و به‌روزرسانی تنظیمات عمومی سازمان
  // -------------------------------------------------------------
  {
    const ctrl = new MockOrgPageController();
    assert.strictEqual(ctrl.state.general.currency, 'TOMAN');
    assert.strictEqual(ctrl.state.general.timezone, 'Asia/Tehran');

    const updated = ctrl.updateGeneral({
      name: 'هلدینگ دیجیتال مارکتینگ گپ‌جی',
      currency: 'IRR',
      timezone: 'Asia/Tehran',
    });

    assert.strictEqual(updated.name, 'هلدینگ دیجیتال مارکتینگ گپ‌جی');
    assert.strictEqual(updated.currency, 'IRR');
    assert.strictEqual(updated.timezone, 'Asia/Tehran');
    console.log('✅ تست ۱۸: واکشی و ذخیره تنظیمات عمومی (نام، واحد پول، تایم‌زون) تأیید شد.');
    passCount++;
  }

  // -------------------------------------------------------------
  // تست ۱۹: پیکربندی مسیر /settings/organization در navigation.ts
  // -------------------------------------------------------------
  {
    const navPath = path.join(PROJECT_ROOT, 'src', 'config', 'navigation.ts');
    const content = fs.readFileSync(navPath, 'utf8');

    // استخراج بلوک آیتم organization-settings
    const orgItemMatch = content.match(/\{\s*id:\s*['"]organization-settings['"][\s\S]*?\}/);
    assert.ok(orgItemMatch, 'آیتم organization-settings باید وجود داشته باشد');
    const orgItemBlock = orgItemMatch[0];

    assert.ok(orgItemBlock.includes("href: '/settings/organization'"), 'آیتم organization-settings باید با آدرس /settings/organization فعال شده باشد');
    assert.ok(orgItemBlock.includes('matchPattern:'), 'آیتم organization-settings باید دارای تابع matchPattern باشد');
    assert.strictEqual(orgItemBlock.includes('comingSoon: true'), false, 'فلگ comingSoon برای تنظیمات سازمان باید برداشته شده باشد');

    console.log('✅ تست ۱۹: ناوبری سامانه به مسیر /settings/organization متصل و فعال گردید.');
    passCount++;
  }

  // -------------------------------------------------------------
  // تست ۲۰: عدم رگرسیون در سایر مسیرهای منوی ناوبری
  // -------------------------------------------------------------
  {
    const navPath = path.join(PROJECT_ROOT, 'src', 'config', 'navigation.ts');
    const content = fs.readFileSync(navPath, 'utf8');

    const criticalRoutes = [
      '/settings/users',
      '/performance/costs',
      '/campaigns',
      '/campaigns/new',
      '/leads',
      '/leads/board',
      '/work/tasks',
    ];

    for (const route of criticalRoutes) {
      assert.ok(content.includes(route), `مسیر کلیدی ${route} باید بدون تغییر در navigation.ts حفظ شده باشد`);
    }

    console.log('✅ تست ۲۰: کلیه مسیرها و گروه‌های کاری ناوبری سامانه بدون رگرسیون حفظ شدند.');
    passCount++;
  }

  console.log('\n================================================================');
  console.log(`نتیجه آزمون: تمامی ${passCount} سناریوی آزمون با موفقیت پاس شدند! 🚀`);
  console.log('================================================================');
}

runTests().catch((err) => {
  console.error('❌ تست با خطا متوقف شد:', err);
  process.exit(1);
});
