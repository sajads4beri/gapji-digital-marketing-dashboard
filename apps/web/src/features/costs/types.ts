/**
 * تعاریف مدل داده، تایپ‌ها، توابع محاسباتی و اعتبارسنجی ماژول هزینه‌های بازاریابی (Marketing Costs)
 * مرجع: Marketing Platform – Phase 1: Frontend Pages (Pages 9, 11-12, 25)
 */

// ۱. دسته‌بندی هزینه‌ها
export type CostCategory =
  | 'ad_media'
  | 'content_production'
  | 'agency_fee'
  | 'software_saas'
  | 'events_webinar'
  | 'influencer'
  | 'other';

export const COST_CATEGORIES: CostCategory[] = [
  'ad_media',
  'content_production',
  'agency_fee',
  'software_saas',
  'events_webinar',
  'influencer',
  'other',
];

export const COST_CATEGORY_LABELS: Record<CostCategory, string> = {
  ad_media: 'رسانه تبلیغاتی',
  content_production: 'تولید محتوا',
  agency_fee: 'کارمزد آژانس',
  software_saas: 'ابزار و نرم‌افزار (SaaS)',
  events_webinar: 'رویداد و وبینار',
  influencer: 'اینفلوئنسر مارکتینگ',
  other: 'سایر هزینه‌های بازاریابی',
};

// ۲. کانال‌ها و پلتفرم‌های انتشار هزینه
export type CostChannel =
  | 'google_ads'
  | 'instagram'
  | 'sms'
  | 'email'
  | 'webinar'
  | 'content_seo'
  | 'influencer'
  | 'other';

export const COST_CHANNELS: CostChannel[] = [
  'google_ads',
  'instagram',
  'sms',
  'email',
  'webinar',
  'content_seo',
  'influencer',
  'other',
];

export const COST_CHANNEL_LABELS: Record<CostChannel, string> = {
  google_ads: 'گوگل ادز',
  instagram: 'اینستاگرام',
  sms: 'پیامک انبوه',
  email: 'ایمیل مارکتینگ',
  webinar: 'وبینار',
  content_seo: 'محتوا و سئو',
  influencer: 'اینفلوئنسر',
  other: 'سایر کانال‌ها',
};

// ۳. ارزهای قابل پشتیبانی
export type CostCurrency = 'TOMAN' | 'IRR' | 'USD' | 'AED';

export const COST_CURRENCIES: CostCurrency[] = ['TOMAN', 'IRR', 'USD', 'AED'];

export const COST_CURRENCY_LABELS: Record<CostCurrency, string> = {
  TOMAN: 'تومان',
  IRR: 'ریال',
  USD: 'دلار آمریکا ($)',
  AED: 'درهم امارات (AED)',
};

// نرخ‌های پیش‌فرض ارز جهت تسهیل ورود داده اولیه (در رکورد ذخیره شده و نرخ اختصاصی جایگزین می‌شود)
export const DEFAULT_EXCHANGE_RATES: Record<CostCurrency, number> = {
  TOMAN: 1,
  IRR: 0.1,
  USD: 70000,
  AED: 19000,
};

// ۴. وضعیت‌های پرداخت هزینه
export type CostStatus = 'draft' | 'pending' | 'paid';

export const COST_STATUSES: CostStatus[] = ['draft', 'pending', 'paid'];

export const COST_STATUS_LABELS: Record<CostStatus, string> = {
  draft: 'پیش‌نویس',
  pending: 'در انتظار پرداخت',
  paid: 'پرداخت‌شده',
};

// ۵. موجودیت اصلی هزینه (CostItem)
export interface CostItem {
  id: string;
  title: string;                         // شرح/عنوان هزینه (۳ تا ۱۰۰ کاراکتر)
  category: CostCategory;
  channel?: CostChannel | null;          // کانال انتشار (برای هزینه عمومی می‌تواند خالی باشد)
  campaignId?: string | null;            // شناسه کمپین مرتبط (در صورت خالی بودن = هزینه بالاسری عمومی)
  campaignName?: string | null;          // عنوان کمپین مرتبط برای نمایش سریع و جستجو
  amount: number;                        // مبلغ پرداختی به ارز ثبت‌شده (> 0)
  currency: CostCurrency;                // واحد پولی
  exchangeRate: number;                  // ضریب تبدیل به تومان (برای تومان=۱، ریال=۰.۱، ارز خارجی>۰)
  normalizedAmountToman: number;         // مبلغ نهایی معادل به تومان (عدد صحیح گردشده با Math.round)
  date: string;                          // تاریخ وقوع به فرمت استاندارد ISO (YYYY-MM-DD یا ISO String)
  vendor?: string | null;                // نام آژانس / مجری / فروشنده
  invoiceNumber?: string | null;         // شماره فاکتور یا کد پیگیری مالی
  status: CostStatus;                    // وضعیت پرداخت (draft / pending / paid)
  notes?: string | null;                 // توضیحات تکمیلی یا یادداشت
  createdAt: string;                     // زمان ایجاد (ISO)
  updatedAt: string;                     // زمان آخرین ویرایش (ISO)
}

// ۶. ورودی‌های ایجاد و ویرایش هزینه
export interface CreateCostInput {
  title: string;
  category: CostCategory;
  channel?: CostChannel | null;
  campaignId?: string | null;
  campaignName?: string | null;
  amount: number;
  currency: CostCurrency;
  exchangeRate?: number;
  date: string;
  vendor?: string | null;
  invoiceNumber?: string | null;
  status?: CostStatus;
  notes?: string | null;
}

export interface UpdateCostInput extends Partial<CreateCostInput> {}

// ۷. فیلترها و مرتب‌سازی
export interface CostFilter {
  search?: string;
  category?: CostCategory | 'all';
  channel?: CostChannel | 'all' | 'none';
  campaignId?: string | 'all' | 'unlinked';
  status?: CostStatus | 'all';
  dateRange?: {
    from?: string;                       // شروع بازه تاریخ (ISO YYYY-MM-DD)
    to?: string;                         // پایان بازه تاریخ (ISO YYYY-MM-DD)
  };
  sortBy?: 'date' | 'amount' | 'category' | 'channel' | 'title';
  sortOrder?: 'asc' | 'desc';
}

// ۸. خلاصه آماری هزینه‌ها
export interface CostStatsSummary {
  totalSpendToman: number;               // جمع کل هزینه‌های قطعیشده (pending + paid؛ draft لحاظ نمی‌شود)
  directAdSpendToman: number;            // هزینه‌های رسانه تبلیغاتی مستقیم (category === 'ad_media' و قطعیشده)
  overheadSpendToman: number;            // هزینه‌های بالاسری غیرمستقیم (هزینه‌های غیر مرتبط با کمپین یا غیر رسانه‌ای)
  paidSpendToman: number;                // جمع هزینه‌های پرداخت‌شده (status === 'paid')
  pendingInvoicesAmountToman: number;    // جمع فاکتورهای معوق/در انتظار پرداخت (status === 'pending')
  draftSpendToman: number;               // جمع هزینه‌های پیش‌نویس (صرفاً آماری؛ در totalSpendToman شمرده نمی‌شود)
  spendByChannel: Record<CostChannel, number>; // سهم تفکیکی هر پلتفرم بدون تکرار (صرفاً قطعی‌ها)
  spendByCategory: Record<CostCategory, number>; // سهم تفکیکی هر دسته‌بندی بدون تکرار (صرفاً قطعی‌ها)
  spendByCampaign: Array<{
    campaignId: string;
    campaignName: string;
    amountToman: number;
    count: number;
  }>;
  thisMonthSpendToman: number;           // مجموع هزینه‌های قطعی ماه جاری
  lastMonthSpendToman: number;           // مجموع هزینه‌های قطعی ماه گذشته
  monthOverMonthChangePercent: number;   // درصد تغییر ماه به ماه
  totalItemsCount: number;               // تعداد کل رکوردهای هزینه
}

// ۹. نتیجه ایمپورت دسته‌ای اکسل/CSV
export interface BatchImportResult {
  totalRows: number;
  importedCount: number;
  skippedCount: number;
  errors: Array<{ row: number; reason: string }>;
}

// ۱۰. توابع مستقل تبدیل ارز و اعتبارسنجی

/**
 * تعیین نرخ تبدیل معتبر برای ارز با توجه به ورودی کاربر یا مقادیر پیش‌فرض
 */
export function resolveExchangeRate(currency: CostCurrency, providedRate?: number): number {
  if (currency === 'TOMAN') {
    return 1;
  }
  if (currency === 'IRR') {
    return 0.1;
  }
  if (typeof providedRate === 'number' && isFinite(providedRate) && providedRate > 0) {
    return providedRate;
  }
  return DEFAULT_EXCHANGE_RATES[currency] || 1;
}

/**
 * تبدیل دقیق مبلغ با ارز ورودی به معادل تومانی گردشده (عدد صحیح)
 * قواعد:
 * - TOMAN: مبلغ × ۱
 * - IRR: مبلغ ÷ ۱۰ (یا ضرب در ۰.۱)
 * - USD: مبلغ × نرخ تبدیل ثبت‌شده
 * - AED: مبلغ × نرخ تبدیل ثبت‌شده
 */
export function convertCurrencyToToman(
  amount: number,
  currency: CostCurrency,
  exchangeRate?: number
): number {
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

/**
 * اعتبارسنجی کامل ورودی‌های ثبت/ویرایش هزینه
 */
export function validateCostData(
  data: Partial<CreateCostInput>,
  isUpdate = false
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // بررسی عنوان (در ایجاد الزامی است، در ویرایش در صورت ارسال بررسی می‌شود)
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

  // بررسی دسته‌بندی
  if (!isUpdate || data.category !== undefined) {
    if (!data.category || !COST_CATEGORIES.includes(data.category)) {
      errors.push('دسته‌بندی انتخاب‌شده برای هزینه نامعتبر است.');
    }
  }

  // بررسی کانال (اختیاری است، اما در صورت ارسال باید معتبر باشد)
  if (data.channel !== undefined && data.channel !== null) {
    if (!COST_CHANNELS.includes(data.channel)) {
      errors.push(`کانال انتخابی "${data.channel}" نامعتبر است.`);
    }
  }

  // بررسی ارز و مبلغ
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

  // بررسی تاریخ
  if (!isUpdate || data.date !== undefined) {
    if (!data.date || isNaN(Date.parse(data.date))) {
      errors.push('تاریخ ثبت هزینه نامعتبر است.');
    }
  }

  // بررسی وضعیت
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
