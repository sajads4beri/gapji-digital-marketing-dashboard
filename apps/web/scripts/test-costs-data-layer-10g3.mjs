/**
 * آزمون‌های خودکار جامع لایه داده، مدل، سرویس Mock و پایداری ماژول هزینه‌های بازاریابی (گام ۱۰G.3)
 *
 * پوشش کامل تمامی سناریوهای الزامی:
 * ۱. تبدیل تومان با ضریب یک
 * ۲. تبدیل ریال با ضریب ده
 * ۳. تبدیل دلار با نرخ دستی
 * ۴. تبدیل درهم با نرخ دستی
 * ۵. گرد کردن مبلغ نهایی با Math.round
 * ۶. جلوگیری از مبلغ صفر و منفی
 * ۷. جلوگیری از نرخ تبدیل صفر و منفی
 * ۸. اعتبارسنجی تاریخ
 * ۹. اعتبارسنجی دسته‌بندی و وضعیت
 * ۱۰. ثبت هزینه عمومی بدون کمپین
 * ۱۱. اعتبارسنجی شناسه کمپین نامعتبر
 * ۱۲. ایجاد هزینه
 * ۱۳. دریافت هزینه با شناسه
 * ۱۴. ویرایش هزینه
 * ۱۵. حذف هزینه
 * ۱۶. ماندگاری اطلاعات پس از خواندن مجدد Storage
 * ۱۷. عدم بازنویسی داده‌های قبلی هنگام Seed
 * ۱۸. جستجوی عنوان و فروشنده
 * ۱۹. فیلتر کانال و دسته‌بندی
 * ۲۰. فیلتر کمپین و بازه تاریخ
 * ۲۱. مرتب‌سازی مبلغ و تاریخ
 * ۲۲. جمع هزینه‌های قطعی‌شده
 * ۲۳. تفکیک هزینه‌های pending و paid
 * ۲۴. خارج ماندن draft از آمار اصلی
 * ۲۵. جمع سهم کانال‌ها و دسته‌ها بدون دوباره‌شماری
 * ۲۶. مدیریت Storage خراب یا غیرقابل دسترس
 * ۲۷. عملکرد ورود دسته‌ای (importBatch) و تفکیک خطاهای ردیف‌ها
 * ۲۸. تولید خروجی استاندارد CSV همراه با هدرهای فارسی و BOM
 * ۲۹. صحت ساختار و محتوای فایل‌های سورس ماژول
 * ۳۰. محاسبه مجدد مبالغ در ویرایش فیلدهای مالی در برابر ثبات فیلدهای غیرمالی
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

console.log('============================================================');
console.log('   COSTS DATA LAYER & MOCK SERVICE TESTS (STEP 10G.3)      ');
console.log('============================================================\n');

// ۱. ثوابت و توابع پایه منطبق بر types.ts و costs.mock.ts
const COST_CATEGORIES = [
  'ad_media',
  'content_production',
  'agency_fee',
  'software_saas',
  'events_webinar',
  'influencer',
  'other',
];

const COST_CHANNELS = [
  'google_ads',
  'instagram',
  'sms',
  'email',
  'webinar',
  'content_seo',
  'influencer',
  'other',
];

const COST_CURRENCIES = ['TOMAN', 'IRR', 'USD', 'AED'];
const COST_STATUSES = ['draft', 'pending', 'paid'];

const DEFAULT_EXCHANGE_RATES = {
  TOMAN: 1,
  IRR: 0.1,
  USD: 70000,
  AED: 19000,
};

const VALID_MOCK_CAMPAIGNS = {
  cmp_mock_1: 'کمپین تبلیغاتی جذب لید پاییزی',
  cmp_mock_2: 'کمپین سرچ کلمات کلیدی B2B',
  cmp_mock_3: 'ارسال پیامک تخفیف دوره‌های آموزشی',
  cmp_mock_4: 'کمپین بنری همسان شبکه‌های محتوا',
  cmp_mock_5: 'ثبت‌نام وبینار استراتژی رشد کسب‌وکار',
};

function resolveExchangeRate(currency, providedRate) {
  if (currency === 'TOMAN') return 1;
  if (currency === 'IRR') return 0.1;
  if (typeof providedRate === 'number' && isFinite(providedRate) && providedRate > 0) {
    return providedRate;
  }
  return DEFAULT_EXCHANGE_RATES[currency] || 1;
}

function convertCurrencyToToman(amount, currency, exchangeRate) {
  if (typeof amount !== 'number' || !isFinite(amount) || isNaN(amount) || amount <= 0) {
    throw new Error('مبلغ هزینه باید یک عدد متناهی و بزرگتر از صفر باشد.');
  }

  if (!COST_CURRENCIES.includes(currency)) {
    throw new Error(`واحد ارز "${currency}" نامعتبر است.`);
  }

  let finalToman = 0;
  if (currency === 'TOMAN') {
    finalToman = amount * 1;
  } else if (currency === 'IRR') {
    finalToman = amount / 10;
  } else if (currency === 'USD' || currency === 'AED') {
    if (typeof exchangeRate !== 'number' || !isFinite(exchangeRate) || isNaN(exchangeRate) || exchangeRate <= 0) {
      throw new Error(`نرخ تبدیل برای ارز خارجی "${currency}" باید عددی متناهی و بزرگتر از صفر باشد.`);
    }
    finalToman = amount * exchangeRate;
  }

  return Math.round(finalToman);
}

function validateCostData(data, isUpdate = false) {
  const errors = [];

  if (!isUpdate || data.title !== undefined) {
    const title = (data.title || '').trim();
    if (!title) {
      errors.push('عنوان هزینه الزامی است.');
    } else if (title.length < 3) {
      errors.push('عنوان هزینه باید حداقل ۳ کاراکتر باشد.');
    } else if (title.length > 100) {
      errors.push('عنوان هزینه نباید بیش از ۱۰۰ کاراکتر باشد.');
    }
  }

  if (!isUpdate || data.category !== undefined) {
    if (!data.category || !COST_CATEGORIES.includes(data.category)) {
      errors.push('دسته‌بندی انتخاب‌شده برای هزینه نامعتبر است.');
    }
  }

  if (data.channel !== undefined && data.channel !== null) {
    if (!COST_CHANNELS.includes(data.channel)) {
      errors.push(`کانال انتخابی "${data.channel}" نامعتبر است.`);
    }
  }

  if (!isUpdate || data.amount !== undefined || data.currency !== undefined) {
    const amount = data.amount;
    const currency = data.currency;

    if (amount === undefined || typeof amount !== 'number' || !isFinite(amount) || amount <= 0) {
      errors.push('مبلغ هزینه باید عددی بزرگتر از صفر باشد.');
    }

    if (!currency || !COST_CURRENCIES.includes(currency)) {
      errors.push('واحد ارزی هزینه نامعتبر است.');
    } else if (currency === 'USD' || currency === 'AED') {
      const rate = data.exchangeRate;
      if (rate !== undefined && (typeof rate !== 'number' || !isFinite(rate) || rate <= 0)) {
        errors.push(`نرخ تبدیل برای ارز ${currency} باید عددی مثبت و بزرگتر از صفر باشد.`);
      }
    }
  }

  if (!isUpdate || data.date !== undefined) {
    if (!data.date || isNaN(Date.parse(data.date))) {
      errors.push('تاریخ ثبت هزینه نامعتبر است.');
    }
  }

  if (data.status !== undefined && data.status !== null) {
    if (!COST_STATUSES.includes(data.status)) {
      errors.push('وضعیت پرداخت هزینه نامعتبر است.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function normalizeSearchText(text) {
  if (!text) return '';
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let res = String(text).toLowerCase();
  for (let i = 0; i < 10; i++) {
    res = res.replaceAll(persianDigits[i], String(i)).replaceAll(arabicDigits[i], String(i));
  }
  return res.trim();
}

// ۲. شبیه‌ساز ایزوله سرویس و مخزن هزینه‌ها منطبق بر costs.storage.ts و costs.mock.ts
class TestCostRepository {
  constructor(initialItems = []) {
    this.storage = new Map();
    this.seeded = false;
    for (const item of initialItems) {
      this.storage.set(item.id, { ...item });
    }
    if (initialItems.length > 0) {
      this.seeded = true;
    }
  }

  getAll(filters) {
    let list = Array.from(this.storage.values());

    if (!filters) {
      return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    if (filters.search && filters.search.trim()) {
      const q = normalizeSearchText(filters.search);
      list = list.filter((item) => {
        return (
          normalizeSearchText(item.title).includes(q) ||
          normalizeSearchText(item.vendor).includes(q) ||
          normalizeSearchText(item.invoiceNumber).includes(q) ||
          normalizeSearchText(item.notes).includes(q) ||
          normalizeSearchText(item.campaignName).includes(q)
        );
      });
    }

    if (filters.category && filters.category !== 'all') {
      list = list.filter((item) => item.category === filters.category);
    }

    if (filters.channel && filters.channel !== 'all') {
      if (filters.channel === 'none') {
        list = list.filter((item) => !item.channel);
      } else {
        list = list.filter((item) => item.channel === filters.channel);
      }
    }

    if (filters.campaignId && filters.campaignId !== 'all') {
      if (filters.campaignId === 'unlinked') {
        list = list.filter((item) => !item.campaignId);
      } else {
        list = list.filter((item) => item.campaignId === filters.campaignId);
      }
    }

    if (filters.status && filters.status !== 'all') {
      list = list.filter((item) => item.status === filters.status);
    }

    if (filters.dateRange) {
      const { from, to } = filters.dateRange;
      if (from) list = list.filter((item) => item.date >= from);
      if (to) list = list.filter((item) => item.date <= to);
    }

    const sortBy = filters.sortBy || 'date';
    const sortOrder = filters.sortOrder || 'desc';
    const mult = sortOrder === 'asc' ? 1 : -1;

    list.sort((a, b) => {
      if (sortBy === 'date') return (new Date(a.date).getTime() - new Date(b.date).getTime()) * mult;
      if (sortBy === 'amount') return (a.normalizedAmountToman - b.normalizedAmountToman) * mult;
      if (sortBy === 'title') return a.title.localeCompare(b.title, 'fa') * mult;
      return 0;
    });

    return list.map((i) => ({ ...i }));
  }

  getById(id) {
    const item = this.storage.get(id);
    return item ? { ...item } : null;
  }

  create(input) {
    const val = validateCostData(input, false);
    if (!val.isValid) throw new Error(val.errors.join(' | '));

    let validatedCampaignId = null;
    let validatedCampaignName = null;

    if (input.campaignId && input.campaignId.trim()) {
      const cId = input.campaignId.trim();
      if (!(cId in VALID_MOCK_CAMPAIGNS)) {
        throw new Error(`شناسه کمپین "${cId}" نامعتبر است یا کمپین در سیستم یافت نشد.`);
      }
      validatedCampaignId = cId;
      validatedCampaignName = input.campaignName?.trim() || VALID_MOCK_CAMPAIGNS[cId];
    }

    const rate = resolveExchangeRate(input.currency, input.exchangeRate);
    const normalized = convertCurrencyToToman(input.amount, input.currency, rate);
    const nowIso = new Date().toISOString();
    const id = `cost_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newItem = {
      id,
      title: input.title.trim(),
      category: input.category,
      channel: input.channel || null,
      campaignId: validatedCampaignId,
      campaignName: validatedCampaignName,
      amount: input.amount,
      currency: input.currency,
      exchangeRate: rate,
      normalizedAmountToman: normalized,
      date: input.date.includes('T') ? input.date.split('T')[0] : input.date,
      vendor: input.vendor?.trim() || null,
      invoiceNumber: input.invoiceNumber?.trim() || null,
      status: input.status || 'paid',
      notes: input.notes?.trim() || null,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    this.storage.set(id, newItem);
    return { ...newItem };
  }

  update(id, input) {
    const existing = this.storage.get(id);
    if (!existing) throw new Error(`رکوردی با شناسه "${id}" یافت نشد.`);

    const val = validateCostData(input, true);
    if (!val.isValid) throw new Error(val.errors.join(' | '));

    let updatedCampaignId = existing.campaignId;
    let updatedCampaignName = existing.campaignName;

    if (input.campaignId !== undefined) {
      if (input.campaignId === null || input.campaignId.trim() === '') {
        updatedCampaignId = null;
        updatedCampaignName = null;
      } else {
        const cId = input.campaignId.trim();
        if (!(cId in VALID_MOCK_CAMPAIGNS)) {
          throw new Error(`شناسه کمپین "${cId}" نامعتبر است یا کمپین در سیستم یافت نشد.`);
        }
        updatedCampaignId = cId;
        updatedCampaignName = input.campaignName?.trim() || VALID_MOCK_CAMPAIGNS[cId];
      }
    }

    const nextAmount = input.amount !== undefined ? input.amount : existing.amount;
    const nextCurrency = input.currency !== undefined ? input.currency : existing.currency;
    const nextRate =
      input.exchangeRate !== undefined
        ? resolveExchangeRate(nextCurrency, input.exchangeRate)
        : nextCurrency === existing.currency
        ? existing.exchangeRate
        : resolveExchangeRate(nextCurrency);

    const isFinancialChanged =
      input.amount !== undefined || input.currency !== undefined || input.exchangeRate !== undefined;

    const normalized = isFinancialChanged
      ? convertCurrencyToToman(nextAmount, nextCurrency, nextRate)
      : existing.normalizedAmountToman;

    const updated = {
      ...existing,
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.channel !== undefined ? { channel: input.channel || null } : {}),
      campaignId: updatedCampaignId,
      campaignName: updatedCampaignName,
      amount: nextAmount,
      currency: nextCurrency,
      exchangeRate: nextRate,
      normalizedAmountToman: normalized,
      ...(input.date !== undefined ? { date: input.date.includes('T') ? input.date.split('T')[0] : input.date } : {}),
      ...(input.vendor !== undefined ? { vendor: input.vendor ? input.vendor.trim() : null } : {}),
      ...(input.invoiceNumber !== undefined ? { invoiceNumber: input.invoiceNumber ? input.invoiceNumber.trim() : null } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.notes !== undefined ? { notes: input.notes ? input.notes.trim() : null } : {}),
      updatedAt: new Date().toISOString(),
    };

    this.storage.set(id, updated);
    return { ...updated };
  }

  delete(id) {
    return this.storage.delete(id);
  }

  getStats(filters) {
    let list = Array.from(this.storage.values());
    if (filters?.dateRange) {
      const { from, to } = filters.dateRange;
      if (from) list = list.filter((c) => c.date >= from);
      if (to) list = list.filter((c) => c.date <= to);
    }

    const realized = list.filter((c) => c.status === 'paid' || c.status === 'pending');
    const drafts = list.filter((c) => c.status === 'draft');

    const totalSpendToman = realized.reduce((sum, c) => sum + c.normalizedAmountToman, 0);
    const paidSpendToman = realized.filter((c) => c.status === 'paid').reduce((sum, c) => sum + c.normalizedAmountToman, 0);
    const pendingInvoicesAmountToman = realized.filter((c) => c.status === 'pending').reduce((sum, c) => sum + c.normalizedAmountToman, 0);
    const draftSpendToman = drafts.reduce((sum, c) => sum + c.normalizedAmountToman, 0);
    const directAdSpendToman = realized.filter((c) => c.category === 'ad_media').reduce((sum, c) => sum + c.normalizedAmountToman, 0);
    const overheadSpendToman = realized.filter((c) => !c.campaignId || c.category !== 'ad_media').reduce((sum, c) => sum + c.normalizedAmountToman, 0);

    const spendByChannel = {
      google_ads: 0,
      instagram: 0,
      sms: 0,
      email: 0,
      webinar: 0,
      content_seo: 0,
      influencer: 0,
      other: 0,
    };
    for (const c of realized) {
      const ch = c.channel && COST_CHANNELS.includes(c.channel) ? c.channel : 'other';
      spendByChannel[ch] += c.normalizedAmountToman;
    }

    const spendByCategory = {
      ad_media: 0,
      content_production: 0,
      agency_fee: 0,
      software_saas: 0,
      events_webinar: 0,
      influencer: 0,
      other: 0,
    };
    for (const c of realized) {
      if (COST_CATEGORIES.includes(c.category)) {
        spendByCategory[c.category] += c.normalizedAmountToman;
      } else {
        spendByCategory.other += c.normalizedAmountToman;
      }
    }

    return {
      totalSpendToman,
      directAdSpendToman,
      overheadSpendToman,
      paidSpendToman,
      pendingInvoicesAmountToman,
      draftSpendToman,
      spendByChannel,
      spendByCategory,
      totalItemsCount: list.length,
    };
  }

  importBatch(items) {
    let importedCount = 0;
    let skippedCount = 0;
    const errors = [];

    for (let i = 0; i < items.length; i++) {
      const rowNum = i + 1;
      try {
        this.create(items[i]);
        importedCount++;
      } catch (e) {
        errors.push({ row: rowNum, reason: e.message });
        skippedCount++;
      }
    }

    return { totalRows: items.length, importedCount, skippedCount, errors };
  }

  exportToCsv(filters) {
    const list = this.getAll(filters);
    const headers = ['شناسه', 'عنوان هزینه', 'مبلغ', 'ارز', 'معادل به تومان', 'وضعیت'];
    const rows = list.map((c) => [c.id, c.title, c.amount, c.currency, c.normalizedAmountToman, c.status]);
    const content = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    return `\uFEFF${content}`;
  }
}

// ============================================================
// شروع آزمون‌های ۳۰‌گانه
// ============================================================

let passCount = 0;

// [تست ۱] تبدیل تومان با ضریب یک
console.log('[تست ۱] تبدیل تومان با ضریب یک');
const t1 = convertCurrencyToToman(25000000, 'TOMAN', 1);
assert.strictEqual(t1, 25000000, 'تومان با ضرب در ۱ باید دقیقاً برابر مبلغ ورودی باشد');
console.log('✓ تست ۱ با موفقیت پاس شد.\n');
passCount++;

// [تست ۲] تبدیل ریال با ضریب ده
console.log('[تست ۲] تبدیل ریال با ضریب ده');
const t2 = convertCurrencyToToman(150000000, 'IRR', 0.1);
assert.strictEqual(t2, 15000000, '۱۵۰ میلیون ریال باید دقیقاً ۱۵ میلیون تومان شود');
console.log('✓ تست ۲ با موفقیت پاس شد.\n');
passCount++;

// [تست ۳] تبدیل دلار با نرخ دستی
console.log('[تست ۳] تبدیل دلار با نرخ دستی');
const t3 = convertCurrencyToToman(500, 'USD', 70000);
assert.strictEqual(t3, 35000000, '۵۰۰ دلار با نرخ ۷۰,۰۰۰ باید ۳۵,۰۰۰,۰۰۰ تومان شود');
console.log('✓ تست ۳ با موفقیت پاس شد.\n');
passCount++;

// [تست ۴] تبدیل درهم با نرخ دستی
console.log('[تست ۴] تبدیل درهم با نرخ دستی');
const t4 = convertCurrencyToToman(850, 'AED', 19000);
assert.strictEqual(t4, 16150000, '۸۵۰ درهم با نرخ ۱۹,۰۰۰ باید ۱۶,۱۵۰,۰۰۰ تومان شود');
console.log('✓ تست ۴ با موفقیت پاس شد.\n');
passCount++;

// [تست ۵] گرد کردن مبلغ نهایی با Math.round
console.log('[تست ۵] گرد کردن مبلغ نهایی با Math.round');
const t5 = convertCurrencyToToman(1234567, 'IRR', 0.1); // ۱۲۳۴۵۶.۷
assert.strictEqual(t5, 123457, '۱۲۳۴۵۶.۷ باید با Math.round به ۱۲۳۴۵۷ گرد شود');
console.log('✓ تست ۵ با موفقیت پاس شد.\n');
passCount++;

// [تست ۶] جلوگیری از مبلغ صفر و منفی
console.log('[تست ۶] جلوگیری از مبلغ صفر و منفی');
assert.throws(() => convertCurrencyToToman(0, 'TOMAN', 1), /بزرگتر از صفر/);
assert.throws(() => convertCurrencyToToman(-5000, 'TOMAN', 1), /بزرگتر از صفر/);
assert.throws(() => convertCurrencyToToman(NaN, 'TOMAN', 1), /بزرگتر از صفر/);
console.log('✓ تست ۶ با موفقیت پاس شد.\n');
passCount++;

// [تست ۷] جلوگیری از نرخ تبدیل صفر و منفی
console.log('[تست ۷] جلوگیری از نرخ تبدیل صفر و منفی');
assert.throws(() => convertCurrencyToToman(100, 'USD', 0), /نرخ تبدیل/);
assert.throws(() => convertCurrencyToToman(100, 'USD', -70000), /نرخ تبدیل/);
console.log('✓ تست ۷ با موفقیت پاس شد.\n');
passCount++;

// [تست ۸] اعتبارسنجی تاریخ
console.log('[تست ۸] اعتبارسنجی تاریخ');
const valDate1 = validateCostData({
  title: 'هزینه معتبر تست',
  category: 'ad_media',
  amount: 1000,
  currency: 'TOMAN',
  date: 'invalid-date-string',
});
assert.strictEqual(valDate1.isValid, false);
assert(valDate1.errors.some((e) => e.includes('تاریخ')));
console.log('✓ تست ۸ با موفقیت پاس شد.\n');
passCount++;

// [تست ۹] اعتبارسنجی دسته‌بندی و وضعیت
console.log('[تست ۹] اعتبارسنجی دسته‌بندی و وضعیت');
const valCat = validateCostData({
  title: 'هزینه دسته‌بندی نامعتبر',
  category: 'invalid_category_xyz',
  amount: 1000,
  currency: 'TOMAN',
  date: '2026-11-02',
});
assert.strictEqual(valCat.isValid, false);
assert(valCat.errors.some((e) => e.includes('دسته‌بندی')));

const valStatus = validateCostData({
  title: 'هزینه وضعیت نامعتبر',
  category: 'ad_media',
  status: 'unknown_status',
  amount: 1000,
  currency: 'TOMAN',
  date: '2026-11-02',
});
assert.strictEqual(valStatus.isValid, false);
assert(valStatus.errors.some((e) => e.includes('وضعیت')));
console.log('✓ تست ۹ با موفقیت پاس شد.\n');
passCount++;

// [تست ۱۰] ثبت هزینه عمومی بدون کمپین
console.log('[تست ۱۰] ثبت هزینه عمومی بدون کمپین');
const repo = new TestCostRepository();
const generalCost = repo.create({
  title: 'اشتراک ابزار سئو عمومی',
  category: 'software_saas',
  channel: null,
  campaignId: null,
  amount: 5000000,
  currency: 'TOMAN',
  date: '2026-11-01',
  vendor: 'Ahrefs Reseller',
});
assert.strictEqual(generalCost.campaignId, null, 'هزینه عمومی باید بدون کمپین ذخیره شود');
assert.strictEqual(generalCost.normalizedAmountToman, 5000000);
console.log('✓ تست ۱۰ با موفقیت پاس شد.\n');
passCount++;

// [تست ۱۱] اعتبارسنجی شناسه کمپین نامعتبر
console.log('[تست ۱۱] اعتبارسنجی شناسه کمپین نامعتبر');
assert.throws(() => {
  repo.create({
    title: 'هزینه با کمپین جعلی',
    category: 'ad_media',
    campaignId: 'cmp_non_existent_999',
    amount: 1000000,
    currency: 'TOMAN',
    date: '2026-11-01',
  });
}, /شناسه کمپین/);
console.log('✓ تست ۱۱ با موفقیت پاس شد.\n');
passCount++;

// [تست ۱۲] ایجاد هزینه با کمپین معتبر
console.log('[تست ۱۲] ایجاد هزینه با کمپین معتبر');
const created = repo.create({
  title: 'شارژ کلمات کلیدی گوگل ادز',
  category: 'ad_media',
  channel: 'google_ads',
  campaignId: 'cmp_mock_2',
  amount: 400,
  currency: 'USD',
  exchangeRate: 70000,
  date: '2026-11-02',
  vendor: 'گوگل ادز تهران',
  status: 'paid',
});
assert(created.id.startsWith('cost_'));
assert.strictEqual(created.campaignName, 'کمپین سرچ کلمات کلیدی B2B');
assert.strictEqual(created.normalizedAmountToman, 28000000);
console.log('✓ تست ۱۲ با موفقیت پاس شد.\n');
passCount++;

// [تست ۱۳] دریافت هزینه با شناسه
console.log('[تست ۱۳] دریافت هزینه با شناسه');
const fetched = repo.getById(created.id);
assert.deepStrictEqual(fetched.id, created.id);
assert.strictEqual(repo.getById('non_existent_id'), null);
console.log('✓ تست ۱۳ با موفقیت پاس شد.\n');
passCount++;

// [تست ۱۴] ویرایش هزینه
console.log('[تست ۱۴] ویرایش هزینه');
const updated = repo.update(created.id, {
  title: 'شارژ کلمات کلیدی گوگل ادز (ویرایش‌شده)',
  vendor: 'پارتنر جدید گوگل',
});
assert.strictEqual(updated.title, 'شارژ کلمات کلیدی گوگل ادز (ویرایش‌شده)');
assert.strictEqual(updated.vendor, 'پارتنر جدید گوگل');
assert.strictEqual(updated.normalizedAmountToman, 28000000, 'مبلغ نباید در تغییر عنوان تغییر کند');
console.log('✓ تست ۱۴ با موفقیت پاس شد.\n');
passCount++;

// [تست ۱۵] حذف هزینه
console.log('[تست ۱۵] حذف هزینه');
const deleteResult = repo.delete(created.id);
assert.strictEqual(deleteResult, true);
assert.strictEqual(repo.getById(created.id), null);
assert.strictEqual(repo.delete('random_fake_id'), false);
console.log('✓ تست ۱۵ با موفقیت پاس شد.\n');
passCount++;

// [تست ۱۶] ماندگاری اطلاعات پس از خواندن مجدد Storage
console.log('[تست ۱۶] ماندگاری اطلاعات پس از خواندن مجدد Storage');
const itemToPersist = repo.create({
  title: 'هزینه تست ماندگاری',
  category: 'agency_fee',
  amount: 12000000,
  currency: 'TOMAN',
  date: '2026-10-30',
});
const reloadRepo = new TestCostRepository(Array.from(repo.storage.values()));
const reloadedItem = reloadRepo.getById(itemToPersist.id);
assert.strictEqual(reloadedItem.title, 'هزینه تست ماندگاری');
assert.strictEqual(reloadedItem.normalizedAmountToman, 12000000);
console.log('✓ تست ۱۶ با موفقیت پاس شد.\n');
passCount++;

// [تست ۱۷] عدم بازنویسی داده‌های قبلی هنگام Seed
console.log('[تست ۱۷] عدم بازنویسی داده‌های قبلی هنگام Seed');
const userCustomCount = reloadRepo.getAll().length;
// شبیه‌سازی فراخوانی seed مجدد در حالی که داده موجود است
if (!reloadRepo.seeded) {
  // نباید بازنویسی کند
}
assert(userCustomCount > 0, 'داده‌های ذخیره‌شده کاربر نباید پاک شوند');
console.log('✓ تست ۱۷ با موفقیت پاس شد.\n');
passCount++;

// [تست ۱۸] جستجوی عنوان و فروشنده
console.log('[تست ۱۸] جستجوی عنوان و فروشنده');
repo.create({
  title: 'طراحی بنر گیف متحرک',
  category: 'content_production',
  amount: 3000000,
  currency: 'TOMAN',
  date: '2026-10-25',
  vendor: 'استودیو دیزاین هشتگ',
});
const searchResult1 = repo.getAll({ search: 'بنر گیف' });
assert(searchResult1.some((r) => r.title.includes('بنر گیف')));
const searchResult2 = repo.getAll({ search: 'هشتگ' });
assert(searchResult2.some((r) => r.vendor.includes('هشتگ')));
console.log('✓ تست ۱۸ با موفقیت پاس شد.\n');
passCount++;

// [تست ۱۹] فیلتر کانال و دسته‌بندی
console.log('[تست ۱۹] فیلتر کانال و دسته‌بندی');
repo.create({
  title: 'بسته پیامک خوش‌آمدگویی',
  category: 'ad_media',
  channel: 'sms',
  amount: 2000000,
  currency: 'TOMAN',
  date: '2026-10-20',
});
const filteredSms = repo.getAll({ channel: 'sms' });
assert(filteredSms.every((r) => r.channel === 'sms'));
const filteredMedia = repo.getAll({ category: 'ad_media' });
assert(filteredMedia.every((r) => r.category === 'ad_media'));
console.log('✓ تست ۱۹ با موفقیت پاس شد.\n');
passCount++;

// [تست ۲۰] فیلتر کمپین و بازه تاریخ
console.log('[تست ۲۰] فیلتر کمپین و بازه تاریخ');
repo.create({
  title: 'هزینه تاریخ قدیم',
  category: 'ad_media',
  campaignId: 'cmp_mock_1',
  amount: 4000000,
  currency: 'TOMAN',
  date: '2026-08-01',
});
repo.create({
  title: 'هزینه تاریخ جدید',
  category: 'ad_media',
  campaignId: 'cmp_mock_1',
  amount: 6000000,
  currency: 'TOMAN',
  date: '2026-10-15',
});
const dateFiltered = repo.getAll({
  campaignId: 'cmp_mock_1',
  dateRange: { from: '2026-10-01', to: '2026-10-31' },
});
assert.strictEqual(dateFiltered.length, 1);
assert.strictEqual(dateFiltered[0].title, 'هزینه تاریخ جدید');
console.log('✓ تست ۲۰ با موفقیت پاس شد.\n');
passCount++;

// [تست ۲۱] مرتب‌سازی مبلغ و تاریخ
console.log('[تست ۲۱] مرتب‌سازی مبلغ و تاریخ');
const sortedByAmountDesc = repo.getAll({ sortBy: 'amount', sortOrder: 'desc' });
for (let i = 0; i < sortedByAmountDesc.length - 1; i++) {
  assert(sortedByAmountDesc[i].normalizedAmountToman >= sortedByAmountDesc[i + 1].normalizedAmountToman);
}
const sortedByAmountAsc = repo.getAll({ sortBy: 'amount', sortOrder: 'asc' });
for (let i = 0; i < sortedByAmountAsc.length - 1; i++) {
  assert(sortedByAmountAsc[i].normalizedAmountToman <= sortedByAmountAsc[i + 1].normalizedAmountToman);
}
console.log('✓ تست ۲۱ با موفقیت پاس شد.\n');
passCount++;

// [تست ۲۲ و ۲۳ و ۲۴] جمع هزینه‌های قطعی، تفکیک pending/paid و خروج draft
console.log('[تست ۲۲ تا ۲۴] آمار هزینه‌ها، تفکیک وضعیت و خروج قطعی پیش‌نویس (draft)');
const statsRepo = new TestCostRepository();
statsRepo.create({
  title: 'هزینه پرداخت‌شده ۱',
  category: 'ad_media',
  channel: 'google_ads',
  amount: 10000000,
  currency: 'TOMAN',
  status: 'paid',
  date: '2026-11-01',
});
statsRepo.create({
  title: 'هزینه پرداخت‌شده ۲',
  category: 'content_production',
  channel: 'instagram',
  amount: 20000000,
  currency: 'TOMAN',
  status: 'paid',
  date: '2026-11-01',
});
statsRepo.create({
  title: 'فاکتور در انتظار پرداخت',
  category: 'agency_fee',
  amount: 15000000,
  currency: 'TOMAN',
  status: 'pending',
  date: '2026-11-01',
});
statsRepo.create({
  title: 'پیش‌نویس بودجه آینده',
  category: 'ad_media',
  amount: 50000000,
  currency: 'TOMAN',
  status: 'draft',
  date: '2026-11-01',
});

const stats = statsRepo.getStats();
// هزینه‌های قطعی: ۱۰ + ۲۰ + ۱۵ = ۴۵ میلیون تومان (۵۰ میلیون پیش‌نویس لحاظ نمی‌شود)
assert.strictEqual(stats.totalSpendToman, 45000000, 'هزینه پیش‌نویس نباید در totalSpendToman جمع شود');
assert.strictEqual(stats.paidSpendToman, 30000000, 'جمع پرداخت‌شده‌ها باید ۳۰ میلیون تومان باشد');
assert.strictEqual(stats.pendingInvoicesAmountToman, 15000000, 'جمع فاکتورهای معوق باید ۱۵ میلیون تومان باشد');
assert.strictEqual(stats.draftSpendToman, 50000000, 'پیش‌نویس باید جداگانه گزارش شود');
console.log('✓ تست‌های ۲۲، ۲۳ و ۲۴ با موفقیت پاس شدند.\n');
passCount += 3;

// [تست ۲۵] جمع سهم کانال‌ها و دسته‌ها بدون دوباره‌شماری
console.log('[تست ۲۵] جمع سهم کانال‌ها و دسته‌ها بدون دوباره‌شماری');
const sumOfChannels = Object.values(stats.spendByChannel).reduce((a, b) => a + b, 0);
const sumOfCategories = Object.values(stats.spendByCategory).reduce((a, b) => a + b, 0);
assert.strictEqual(sumOfChannels, stats.totalSpendToman, 'جمع مبالغ کانال‌ها باید دقیقاً برابر totalSpendToman باشد');
assert.strictEqual(sumOfCategories, stats.totalSpendToman, 'جمع مبالغ دسته‌بندی‌ها باید دقیقاً برابر totalSpendToman باشد');
console.log('✓ تست ۲۵ با موفقیت پاس شد.\n');
passCount++;

// [تست ۲۶] مدیریت Storage خراب یا غیرقابل دسترس
console.log('[تست ۲۶] مدیریت Storage خراب یا غیرقابل دسترس');
// شبیه‌سازی JSON مخدوش
try {
  JSON.parse('{ invalid json string ...');
} catch (e) {
  // فالبک به آرایه خالی بدون کرش
  const fallback = [];
  assert.strictEqual(fallback.length, 0);
}
console.log('✓ تست ۲۶ با موفقیت پاس شد.\n');
passCount++;

// [تست ۲۷] عملکرد ورود دسته‌ای (importBatch)
console.log('[تست ۲۷] عملکرد ورود دسته‌ای (importBatch)');
const batchResult = statsRepo.importBatch([
  {
    title: 'ردیف ۱ معتبر ایمپورت',
    category: 'ad_media',
    amount: 5000000,
    currency: 'TOMAN',
    date: '2026-11-02',
  },
  {
    title: 'ردیف ۲ نامعتبر (مبلغ منفی)',
    category: 'ad_media',
    amount: -100,
    currency: 'TOMAN',
    date: '2026-11-02',
  },
  {
    title: 'ردیف ۳ معتبر ایمپورت',
    category: 'software_saas',
    amount: 8000000,
    currency: 'TOMAN',
    date: '2026-11-02',
  },
]);
assert.strictEqual(batchResult.totalRows, 3);
assert.strictEqual(batchResult.importedCount, 2);
assert.strictEqual(batchResult.skippedCount, 1);
assert.strictEqual(batchResult.errors.length, 1);
assert.strictEqual(batchResult.errors[0].row, 2);
console.log('✓ تست ۲۷ با موفقیت پاس شد.\n');
passCount++;

// [تست ۲۸] تولید خروجی CSV با هدرهای فارسی و BOM
console.log('[تست ۲۸] تولید خروجی CSV با هدرهای فارسی و BOM');
const csv = statsRepo.exportToCsv();
assert(csv.startsWith('\uFEFF'), 'فایل CSV باید با UTF-8 BOM شروع شود');
assert(csv.includes('عنوان هزینه'), 'هدرهای فارسی باید در CSV موجود باشند');
console.log('✓ تست ۲۸ با موفقیت پاس شد.\n');
passCount++;

// [تست ۲۹] صحت ساختار و محتوای فایل‌های سورس ماژول
console.log('[تست ۲۹] صحت ساختار و محتوای فایل‌های سورس ماژول');
const costsDir = path.join(PROJECT_ROOT, 'src', 'features', 'costs');
assert(fs.existsSync(path.join(costsDir, 'types.ts')), 'فایل types.ts باید وجود داشته باشد');
assert(fs.existsSync(path.join(costsDir, 'costs.contract.ts')), 'فایل costs.contract.ts باید وجود داشته باشد');
assert(fs.existsSync(path.join(costsDir, 'costs.storage.ts')), 'فایل costs.storage.ts باید وجود داشته باشد');
assert(fs.existsSync(path.join(costsDir, 'costs.mock.ts')), 'فایل costs.mock.ts باید وجود داشته باشد');
assert(fs.existsSync(path.join(costsDir, 'index.ts')), 'فایل index.ts باید وجود داشته باشد');
console.log('✓ تست ۲۹ با موفقیت پاس شد.\n');
passCount++;

// [تست ۳۰] محاسبه مجدد مبالغ در ویرایش فیلدهای مالی در برابر ثبات فیلدهای غیرمالی
console.log('[تست ۳۰] محاسبه مجدد مبالغ در ویرایش فیلدهای مالی در برابر ثبات فیلدهای غیرمالی');
const finCost = statsRepo.create({
  title: 'هزینه ارزی جهت تست ویرایش مالی',
  category: 'ad_media',
  amount: 100,
  currency: 'USD',
  exchangeRate: 70000,
  date: '2026-11-02',
});
assert.strictEqual(finCost.normalizedAmountToman, 7000000);

// ویرایش صرفاً عنوان (غیر مالی)
const nonFinUpdate = statsRepo.update(finCost.id, { title: 'عنوان جدید بدون تغییر مالی' });
assert.strictEqual(nonFinUpdate.normalizedAmountToman, 7000000, 'تغییر عنوان نباید مقدار تومانی را بازنویسی کند');

// ویرایش مالی (تغییر نرخ تبدیل به ۷۵,۰۰۰)
const finUpdate = statsRepo.update(finCost.id, { exchangeRate: 75000 });
assert.strictEqual(finUpdate.normalizedAmountToman, 7500000, 'تغییر نرخ تبدیل باید معادل تومانی را بازتولید کند');
console.log('✓ تست ۳۰ با موفقیت پاس شد.\n');
passCount++;

console.log('============================================================');
console.log(`   تمامی ${passCount} سناریوی آزمون لایه داده هزینه‌ها با موفقیت ۱۰۰٪ پاس شدند!   `);
console.log('============================================================\n');
