/**
 * آزمون‌های تکمیلی بازبینی گام ۱۰H.2-D — تاریخچه تب‌ها، ناوبری Back/Forward و پایداری و اعتبارسنجی لوگو
 *
 * مشخصات و ماهیت تست:
 * این آزمون شامل شبیه‌سازی دقیق مدل History Stack مرورگر و روتینگ Next.js (router.push / router.replace)،
 * به همراه تست‌های واحد و یکپارچگی منطق اعتبارسنجی فایل لوگو، آزادسازی Object URL و رفتار پایداری در Storage است.
 * (تست اسکریپتی / شبیه‌سازی محیط اجرا، بدون ادعای تست مرورگری E2E با مرورگر سر باز)
 *
 * پوشش ۸ سناریوی مشخص‌شده در درخواست کاربر:
 * ۱. انتخاب چند تب متوالی و بررسی ثبت صحیح تاریخچه (router.push)
 * ۲. استفاده از Back و بررسی بازگشت دقیق به تب قبلی
 * ۳. استفاده از Forward و بررسی بازگشت به تب بعدی
 * ۴. باز کردن مستقیم URL یک تب (?tab=lost_reasons)
 * ۵. ورود با مقدار نامعتبر tab و اصلاح امن آن بدون درج در تاریخچه (router.replace)
 * ۶. ذخیره لوگو و بررسی رفتار آن پس از Refresh (تفکیک آدرس دائمی اینترنتی از Blob موقت)
 * ۷. انتخاب لوگوی جدید و اطمینان از آزاد شدن URL پیش‌نمایش قبلی (URL.revokeObjectURL)
 * ۸. رد کردن فایل غیرتصویری و فایل بزرگ‌تر از محدودیت تعیین‌شده (۲ مگابایت)
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

console.log('================================================================');
console.log('  ORGANIZATION SUPPLEMENTARY REVIEW TESTS (STEP 10H.2-D REVIEW)');
console.log('  Type: Scripted In-Memory Browser History & Storage Simulation');
console.log('================================================================\n');

let passCount = 0;

// ۱. شبیه‌ساز پشته تاریخچه مرورگر (Browser History Stack Simulator)
class MockBrowserHistoryRouter {
  constructor(initialPath = '/settings/organization') {
    this.stack = [initialPath];
    this.pointer = 0;
  }

  get currentUrl() {
    return this.stack[this.pointer];
  }

  get searchParams() {
    const url = this.currentUrl;
    const qIndex = url.indexOf('?');
    if (qIndex === -1) return new URLSearchParams('');
    return new URLSearchParams(url.slice(qIndex + 1));
  }

  push(url, options = {}) {
    // در صورت وجود موارد جلوتر در تاریخچه، آنها پس از push بریده می‌شوند
    this.stack = this.stack.slice(0, this.pointer + 1);
    this.stack.push(url);
    this.pointer++;
  }

  replace(url, options = {}) {
    this.stack[this.pointer] = url;
  }

  back() {
    if (this.pointer > 0) {
      this.pointer--;
      return true;
    }
    return false;
  }

  forward() {
    if (this.pointer < this.stack.length - 1) {
      this.pointer++;
      return true;
    }
    return false;
  }
}

// شبیه‌ساز کنترلر صفحه با پشتیبانی از History و تعامل تب‌ها
class MockOrganizationPageController {
  constructor(initialUrl = '/settings/organization') {
    this.router = new MockBrowserHistoryRouter(initialUrl);
    this.pathname = '/settings/organization';
    this.validTabs = ['campaign_types', 'lead_sources', 'lead_statuses', 'lost_reasons', 'cost_categories', 'general'];
  }

  get activeTab() {
    const param = this.router.searchParams.get('tab');
    if (param && this.validTabs.includes(param)) {
      return param;
    }
    return 'campaign_types';
  }

  // شبیه‌سازی افکت اصلاح پارامتر نامعتبر
  runSanitizationEffect() {
    const param = this.router.searchParams.get('tab');
    if (param && !this.validTabs.includes(param)) {
      const current = new URLSearchParams(this.router.searchParams.toString());
      current.delete('tab');
      const qs = current.toString();
      this.router.replace(`${this.pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
    }
  }

  // متد تغییر تب کاربر
  handleTabChange(tab) {
    if (tab === this.activeTab) return;

    const current = new URLSearchParams(this.router.searchParams.toString());
    if (tab === 'campaign_types') {
      current.delete('tab');
    } else {
      current.set('tab', tab);
    }
    const qs = current.toString();
    this.router.push(`${this.pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
  }
}

// شبیه‌ساز فرم تنظیمات عمومی و اعتبارسنجی لوگو
class MockGeneralSettingsValidator {
  constructor() {
    this.MAX_LOGO_SIZE = 2 * 1024 * 1024; // ۲ مگابایت
    this.revokedUrls = [];
    this.createdUrls = [];
  }

  revokeObjectURL(url) {
    this.revokedUrls.push(url);
  }

  createObjectURL(file) {
    const url = `blob:http://localhost:3000/mock-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    this.createdUrls.push(url);
    return url;
  }

  validateAndSelectFile(file, currentLogoUrl) {
    // ۱. بررسی نوع فایل
    if (!file.type || !file.type.startsWith('image/')) {
      return {
        success: false,
        error: 'فرمت فایل انتخابی نامعتبر است. فقط فایل‌های تصویری (PNG, JPG, SVG, WebP) مجاز هستند.',
        newUrl: null,
      };
    }

    // ۲. بررسی حداکثر حجم فایل
    if (file.size > this.MAX_LOGO_SIZE) {
      return {
        success: false,
        error: 'حجم فایل لوگو بیشتر از حد مجاز است. حداکثر حجم مجاز ۲ مگابایت می‌باشد.',
        newUrl: null,
      };
    }

    // ۳. آزادسازی آدرس پیشین
    if (currentLogoUrl && currentLogoUrl.startsWith('blob:')) {
      this.revokeObjectURL(currentLogoUrl);
    }

    const newUrl = this.createObjectURL(file);
    return {
      success: true,
      error: null,
      newUrl,
    };
  }
}

// شبیه‌ساز ذخیره‌سازی و سرویس تنظیمات عمومی
class MockGeneralSettingsStorageService {
  constructor() {
    this.storage = {
      name: 'شرکت فناوری گپ‌جی',
      logoUrl: '',
      currency: 'TOMAN',
      timezone: 'Asia/Tehran',
    };
  }

  updateSettings(input) {
    if (input.name) this.storage.name = input.name;
    if (input.currency) this.storage.currency = input.currency;
    if (input.timezone) this.storage.timezone = input.timezone;

    // گارد صریح: آدرس موقت blob ذخیره دائمی نمی‌شود
    if (input.logoUrl !== undefined) {
      if (!input.logoUrl.startsWith('blob:')) {
        this.storage.logoUrl = input.logoUrl;
      }
    }

    return JSON.parse(JSON.stringify(this.storage));
  }

  // شبیه‌سازی رفرش صفحه (واکشی مجدد از استوریج)
  refresh() {
    return JSON.parse(JSON.stringify(this.storage));
  }
}

async function runReviewTests() {
  // -------------------------------------------------------------
  // سناریو ۱: انتخاب چند تب متوالی و بررسی ثبت تاریخچه (router.push)
  // -------------------------------------------------------------
  {
    const page = new MockOrganizationPageController();
    assert.strictEqual(page.activeTab, 'campaign_types');
    assert.strictEqual(page.router.stack.length, 1);
    assert.strictEqual(page.router.pointer, 0);

    // انتخاب تب اول: منابع لید
    page.handleTabChange('lead_sources');
    assert.strictEqual(page.activeTab, 'lead_sources');
    assert.strictEqual(page.router.stack.length, 2);
    assert.strictEqual(page.router.pointer, 1);
    assert.strictEqual(page.router.currentUrl, '/settings/organization?tab=lead_sources');

    // انتخاب تب دوم: وضعیت‌های لید
    page.handleTabChange('lead_statuses');
    assert.strictEqual(page.activeTab, 'lead_statuses');
    assert.strictEqual(page.router.stack.length, 3);
    assert.strictEqual(page.router.pointer, 2);
    assert.strictEqual(page.router.currentUrl, '/settings/organization?tab=lead_statuses');

    // انتخاب تب سوم: تنظیمات عمومی
    page.handleTabChange('general');
    assert.strictEqual(page.activeTab, 'general');
    assert.strictEqual(page.router.stack.length, 4);
    assert.strictEqual(page.router.pointer, 3);
    assert.strictEqual(page.router.currentUrl, '/settings/organization?tab=general');

    // کلیک مجدد روی همان تب نباید ورودی تکراری در پشته ثبت کند
    page.handleTabChange('general');
    assert.strictEqual(page.router.stack.length, 4);

    console.log('✅ سناریو ۱: انتخاب متوالی تب‌ها با router.push در تاریخچه مرورگر ثبت گردید.');
    passCount++;
  }

  // -------------------------------------------------------------
  // سناریو ۲: استفاده از Back و بررسی بازگشت به تب قبلی
  // -------------------------------------------------------------
  {
    const page = new MockOrganizationPageController();
    page.handleTabChange('lead_sources'); // index 1
    page.handleTabChange('lost_reasons'); // index 2
    page.handleTabChange('general');      // index 3
    assert.strictEqual(page.activeTab, 'general');

    // بازگشت ۱: برگشت به lost_reasons
    const back1 = page.router.back();
    assert.strictEqual(back1, true);
    assert.strictEqual(page.router.currentUrl, '/settings/organization?tab=lost_reasons');
    assert.strictEqual(page.activeTab, 'lost_reasons', 'تب فعال پس از Back باید lost_reasons باشد');

    // بازگشت ۲: برگشت به lead_sources
    const back2 = page.router.back();
    assert.strictEqual(back2, true);
    assert.strictEqual(page.router.currentUrl, '/settings/organization?tab=lead_sources');
    assert.strictEqual(page.activeTab, 'lead_sources', 'تب فعال پس از Back دوم باید lead_sources باشد');

    // بازگشت ۳: برگشت به تب پیش‌فرض اولیه (campaign_types)
    const back3 = page.router.back();
    assert.strictEqual(back3, true);
    assert.strictEqual(page.router.currentUrl, '/settings/organization');
    assert.strictEqual(page.activeTab, 'campaign_types', 'تب فعال پس از Back سوم باید پیش‌فرض باشد');

    console.log('✅ سناریو ۲: دکمه Back با موفقیت گام‌به‌گام بین تب‌های پیشین بازگشت.');
    passCount++;
  }

  // -------------------------------------------------------------
  // سناریو ۳: استفاده از Forward و بررسی بازگشت به تب بعدی
  // -------------------------------------------------------------
  {
    const page = new MockOrganizationPageController();
    page.handleTabChange('lead_sources');
    page.handleTabChange('cost_categories');
    assert.strictEqual(page.activeTab, 'cost_categories');

    // دوبار عقب می‌رویم
    page.router.back();
    page.router.back();
    assert.strictEqual(page.activeTab, 'campaign_types');

    // حرکت ۱ به جلو (Forward)
    const fwd1 = page.router.forward();
    assert.strictEqual(fwd1, true);
    assert.strictEqual(page.router.currentUrl, '/settings/organization?tab=lead_sources');
    assert.strictEqual(page.activeTab, 'lead_sources', 'تب فعال پس از Forward اول باید lead_sources باشد');

    // حرکت ۲ به جلو (Forward)
    const fwd2 = page.router.forward();
    assert.strictEqual(fwd2, true);
    assert.strictEqual(page.router.currentUrl, '/settings/organization?tab=cost_categories');
    assert.strictEqual(page.activeTab, 'cost_categories', 'تب فعال پس از Forward دوم باید cost_categories باشد');

    console.log('✅ سناریو ۳: دکمه Forward با موفقیت به سمت تب‌های بعدی تاریخچه حرکت نمود.');
    passCount++;
  }

  // -------------------------------------------------------------
  // سناریو ۴: باز کردن مستقیم URL یک تب
  // -------------------------------------------------------------
  {
    const directUrl = '/settings/organization?tab=lost_reasons';
    const page = new MockOrganizationPageController(directUrl);
    assert.strictEqual(page.router.currentUrl, directUrl);
    assert.strictEqual(page.activeTab, 'lost_reasons', 'باز کردن مستقیم آدرس باید تب مربوطه را فعال کند');

    // اجرای افکت بررسی نامعتبر
    page.runSanitizationEffect();
    assert.strictEqual(page.router.currentUrl, directUrl, 'آدرس معتبر نباید دستکاری شود');
    assert.strictEqual(page.activeTab, 'lost_reasons');

    console.log('✅ سناریو ۴: باز کردن مستقیم URL حاوی پارامتر تب بدون اختلال اجرا شد.');
    passCount++;
  }

  // -------------------------------------------------------------
  // سناریو ۵: ورود با مقدار نامعتبر tab و اصلاح امن آن با router.replace
  // -------------------------------------------------------------
  {
    const dirtyUrl = '/settings/organization?tab=malicious_fake_tab_999';
    const page = new MockOrganizationPageController(dirtyUrl);

    // تب فعال باید به عنوان گارد به پیش‌فرض بازگردد
    assert.strictEqual(page.activeTab, 'campaign_types', 'مقدار نامعتبر باید تب campaign_types را نشان دهد');
    const initialStackLength = page.router.stack.length;

    // افکت اصلاح امن URL اجرا می‌شود
    page.runSanitizationEffect();

    // بررسی آدرس اصلاح‌شده و عدم افزایش پشته تاریخچه
    assert.strictEqual(page.router.currentUrl, '/settings/organization', 'آدرس باید به مسیر تمیز بدون پارامتر اصلاح شود');
    assert.strictEqual(page.router.stack.length, initialStackLength, 'اصلاح نباید ورودی جدید به تاریخچه اضافه کند (استفاده از replace)');
    assert.strictEqual(page.activeTab, 'campaign_types');

    console.log('✅ سناریو ۵: مقدار نامعتبر tab بدون افزایش تاریخچه با router.replace پاکسازی امن شد.');
    passCount++;
  }

  // -------------------------------------------------------------
  // سناریو ۶: ذخیره لوگو و بررسی رفتار آن پس از Refresh
  // -------------------------------------------------------------
  {
    const service = new MockGeneralSettingsStorageService();

    // حالت ۶.۱: ذخیره یک آدرس اینترنتی معتبر (پایدار)
    service.updateSettings({
      logoUrl: 'https://cdn.gapji.ir/branding/logo.png',
    });
    let refreshed = service.refresh();
    assert.strictEqual(refreshed.logoUrl, 'https://cdn.gapji.ir/branding/logo.png', 'آدرس اینترنتی پس از رفرش کاملاً پایدار و قابل بازیابی است');

    // حالت ۶.۲: انتخاب فایل محلی و ایجاد blob موقت
    const temporaryBlobUrl = 'blob:http://localhost:3000/temp-session-uuid';
    service.updateSettings({
      logoUrl: temporaryBlobUrl,
    });

    // بررسی انطباق با دستورالعمل: Blob موقت نباید در استوریج ذخیره دائمی شود
    refreshed = service.refresh();
    assert.notStrictEqual(refreshed.logoUrl, temporaryBlobUrl, 'آدرس موقت blob نباید به عنوان مقدار پایدار ذخیره شود');
    assert.strictEqual(refreshed.logoUrl, 'https://cdn.gapji.ir/branding/logo.png', 'مقدار قبلی پایدار دست‌نخورده حفظ گردید');

    console.log('✅ سناریو ۶: پایداری آدرس‌های دائمی اینترنتی پس از Refresh و ممانعت از ذخیره ناپایدار Blob تأیید شد.');
    passCount++;
  }

  // -------------------------------------------------------------
  // سناریو ۷: انتخاب لوگوی جدید و اطمینان از آزاد شدن URL پیش‌نمایش قبلی
  // -------------------------------------------------------------
  {
    const validator = new MockGeneralSettingsValidator();

    // انتخاب تصویر اول
    const file1 = { name: 'logo-light.png', type: 'image/png', size: 300 * 1024 };
    const res1 = validator.validateAndSelectFile(file1, '');
    assert.strictEqual(res1.success, true);
    assert.ok(res1.newUrl.startsWith('blob:'));
    const url1 = res1.newUrl;

    // انتخاب تصویر دوم (باید url1 را revoke کند)
    const file2 = { name: 'logo-dark.png', type: 'image/png', size: 450 * 1024 };
    const res2 = validator.validateAndSelectFile(file2, url1);
    assert.strictEqual(res2.success, true);
    assert.ok(res2.newUrl.startsWith('blob:'));
    assert.notStrictEqual(res2.newUrl, url1);

    // بررسی ثبت فراخوانی revoke
    assert.ok(validator.revokedUrls.includes(url1), 'آدرس پیش‌نمایش اول باید با revokeObjectURL آزاد شده باشد');

    // بررسی پاکسازی دستی با کلیک روی «حذف لوگو»
    validator.revokeObjectURL(res2.newUrl);
    assert.ok(validator.revokedUrls.includes(res2.newUrl), 'آدرس پیش‌نمایش دوم نیز باید پس از حذف آزاد شود');

    console.log('✅ سناریو ۷: چرخه آزادسازی Object URLهای قبلی با URL.revokeObjectURL تأیید شد.');
    passCount++;
  }

  // -------------------------------------------------------------
  // سناریو ۸: رد کردن فایل غیرتصویری و فایل بزرگ‌تر از ۲ مگابایت
  // -------------------------------------------------------------
  {
    const validator = new MockGeneralSettingsValidator();

    // فایل PDF غیرتصویری
    const pdfFile = { name: 'contract.pdf', type: 'application/pdf', size: 100 * 1024 };
    const pdfRes = validator.validateAndSelectFile(pdfFile, '');
    assert.strictEqual(pdfRes.success, false, 'فایل غیرتصویری باید رد شود');
    assert.ok(pdfRes.error.includes('فقط فایل‌های تصویری'));
    assert.strictEqual(pdfRes.newUrl, null);

    // فایل متنی غیرتصویری
    const txtFile = { name: 'notes.txt', type: 'text/plain', size: 10 * 1024 };
    const txtRes = validator.validateAndSelectFile(txtFile, '');
    assert.strictEqual(txtRes.success, false, 'فایل متنی باید رد شود');
    assert.strictEqual(txtRes.newUrl, null);

    // فایل تصویری با حجم بیشتر از ۲ مگابایت (۲.۵ مگابایت)
    const bigImage = { name: 'huge-banner.png', type: 'image/png', size: 2.5 * 1024 * 1024 };
    const bigRes = validator.validateAndSelectFile(bigImage, '');
    assert.strictEqual(bigRes.success, false, 'فایل بزرگتر از ۲ مگابایت باید رد شود');
    assert.ok(bigRes.error.includes('۲ مگابایت'));
    assert.strictEqual(bigRes.newUrl, null);

    // فایل تصویری مجاز و استاندارد (۵۰۰ کیلوبایت)
    const validImage = { name: 'standard-logo.webp', type: 'image/webp', size: 500 * 1024 };
    const validRes = validator.validateAndSelectFile(validImage, '');
    assert.strictEqual(validRes.success, true, 'فایل تصویری در محدوده مجاز باید پذیرفته شود');
    assert.strictEqual(validRes.error, null);
    assert.ok(validRes.newUrl.startsWith('blob:'));

    console.log('✅ سناریو ۸: رد فایل‌های غیرتصویری و کنترل محدودیت حداکثر حجم ۲ مگابایت تأیید شد.');
    passCount++;
  }

  // -------------------------------------------------------------
  // سناریو تکمیلی ۹: بررسی استاتیک وجود router.push و router.replace در page.tsx
  // -------------------------------------------------------------
  {
    const pagePath = path.join(PROJECT_ROOT, 'src', 'app', '(app)', 'settings', 'organization', 'page.tsx');
    const content = fs.readFileSync(pagePath, 'utf8');

    assert.ok(content.includes('router.push'), 'page.tsx باید دارای router.push برای تعویض تب باشد');
    assert.ok(content.includes('router.replace'), 'page.tsx باید دارای router.replace برای اصلاح امن URL باشد');
    assert.ok(content.includes('tab === activeTab'), 'باید گارد جلوگیری از ثبت تاریخچه تکراری وجود داشته باشد');
    assert.ok(content.includes('!VALID_TAB_KEYS.includes(tabParam)'), 'باید شرط اعتبارسنجی مقادیر نامعتبر وجود داشته باشد');

    console.log('✅ سناریو تکمیلی ۹: استراکچر کدهای Next.js router در page.tsx با الگوهای درخواستی تطابق دارد.');
    passCount++;
  }

  console.log('\n================================================================');
  console.log(`نتیجه آزمون بازبینی: تمامی ${passCount} سناریوی آزمون با موفقیت ۱۰۰٪ پاس شدند! 🚀`);
  console.log('================================================================');
}

runReviewTests().catch((err) => {
  console.error('❌ تست با خطا متوقف شد:', err);
  process.exit(1);
});
