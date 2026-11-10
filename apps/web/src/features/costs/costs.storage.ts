/**
 * لایه ذخیره‌سازی و پایداری داده‌های ماژول هزینه‌های بازاریابی (LocalStorage & Memory Fallback)
 * کلید اصلی ذخیره‌سازی: marketing_platform_costs_v1
 */

import {
  CostItem,
  convertCurrencyToToman,
  resolveExchangeRate,
} from './types';

export const STORAGE_KEY_COSTS = 'marketing_platform_costs_v1';
export const STORAGE_KEY_SEEDED = 'marketing_platform_costs_seeded_v1';

// حافظه موقت ایزوله جهت سناریوهای SSR، تست‌های خودکار محیط Node.js یا موارد قفل بودن localStorage
let memoryCosts: CostItem[] = [];
let memorySeeded = false;

function isClient(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

/**
 * ایجاد داده‌های اولیه غنی (Realistic Seed Data) شامل ۲۸ رکورد واقعی
 * متصل به شناسه‌های کمپین‌های موجود در پروژه (cmp_mock_1 تا cmp_mock_5) و هزینه‌های عمومی
 */
export function createInitialCostSeedData(referenceDateInput?: Date | string): CostItem[] {
  const ref = referenceDateInput
    ? typeof referenceDateInput === 'string'
      ? new Date(referenceDateInput)
      : referenceDateInput
    : new Date();

  const baseTime = isNaN(ref.getTime()) ? Date.now() : ref.getTime();
  const msInDay = 86400000;

  const getIsoDate = (offsetDaysAgo: number) => {
    return new Date(baseTime - offsetDaysAgo * msInDay).toISOString().split('T')[0];
  };

  const getIsoTimestamp = (offsetDaysAgo: number, hourOffset = 10) => {
    const d = new Date(baseTime - offsetDaysAgo * msInDay);
    d.setHours(hourOffset, 0, 0, 0);
    return d.toISOString();
  };

  const seeds: Array<{
    id: string;
    title: string;
    category: CostItem['category'];
    channel?: CostItem['channel'];
    campaignId?: string | null;
    campaignName?: string | null;
    amount: number;
    currency: CostItem['currency'];
    exchangeRate?: number;
    daysAgo: number;
    vendor?: string;
    invoiceNumber?: string;
    status: CostItem['status'];
    notes?: string;
  }> = [
    {
      id: 'cost_seed_1',
      title: 'شارژ اکانت گوگل ادز - کمپین سرچ کلمات B2B',
      category: 'ad_media',
      channel: 'google_ads',
      campaignId: 'cmp_mock_2',
      campaignName: 'کمپین سرچ کلمات کلیدی B2B',
      amount: 500,
      currency: 'USD',
      exchangeRate: 70000,
      daysAgo: 2,
      vendor: 'پارتنر رسمی گوگل ادز تهران',
      invoiceNumber: 'INV-GGL-8821',
      status: 'paid',
      notes: 'شارژ اولیه ماهانه روی کلمات کلیدی قصد خرید بالا',
    },
    {
      id: 'cost_seed_2',
      title: 'همکاری استوری و ریلز اینستاگرام با اینفلوئنسر مارکتینگ',
      category: 'influencer',
      channel: 'instagram',
      campaignId: 'cmp_mock_1',
      campaignName: 'کمپین تبلیغاتی جذب لید پاییزی',
      amount: 25000000,
      currency: 'TOMAN',
      daysAgo: 4,
      vendor: 'آژانس رسانه‌ای موج نو',
      invoiceNumber: 'INV-INF-1044',
      status: 'paid',
      notes: 'پکیج انتشار ۲ استوری و ۱ ریلز اختصاصی جذب سرنخ',
    },
    {
      id: 'cost_seed_3',
      title: 'بسته پیامک انبوه اطلاع‌رسانی جشنواره پاییزه',
      category: 'ad_media',
      channel: 'sms',
      campaignId: 'cmp_mock_3',
      campaignName: 'ارسال پیامک تخفیف دوره‌های آموزشی',
      amount: 150000000,
      currency: 'IRR',
      exchangeRate: 0.1,
      daysAgo: 5,
      vendor: 'سامانه پیامکی کاوه‌نگار',
      invoiceNumber: 'KN-99432',
      status: 'paid',
      notes: 'ارسال ۳۵۰,۰۰۰ پیامک بلک‌لیست رد شده هدفمند',
    },
    {
      id: 'cost_seed_4',
      title: 'اشتراک سالانه ابزار ایمیل مارکتینگ Brevo (Sendinblue)',
      category: 'software_saas',
      channel: 'email',
      campaignId: null,
      campaignName: null,
      amount: 65,
      currency: 'USD',
      exchangeRate: 70000,
      daysAgo: 7,
      vendor: 'Brevo SaaS Platform',
      invoiceNumber: 'INV-BRV-2024-99',
      status: 'paid',
      notes: 'اشتراک اکانت بیزینس تا ۶۰,۰۰۰ ایمیل در ماه',
    },
    {
      id: 'cost_seed_5',
      title: 'طراحی موشن‌گرافیک و تیزر ویدیویی ۳۰ ثانیه‌ای لیدجنریشن',
      category: 'content_production',
      channel: 'instagram',
      campaignId: 'cmp_mock_1',
      campaignName: 'کمپین تبلیغاتی جذب لید پاییزی',
      amount: 18000000,
      currency: 'TOMAN',
      daysAgo: 9,
      vendor: 'استودیو انیمیشن و جلوه‌های بصری پویا',
      invoiceNumber: 'STU-4410',
      status: 'pending',
      notes: 'فاکتور مرحله دوم پس از تایید ادیت نهایی صوت و تصویر',
    },
    {
      id: 'cost_seed_6',
      title: 'اجاره زیرساخت و پهنای باند اختصاصی وبینار استراتژی',
      category: 'events_webinar',
      channel: 'webinar',
      campaignId: 'cmp_mock_5',
      campaignName: 'ثبت‌نام وبینار استراتژی رشد کسب‌وکار',
      amount: 12000000,
      currency: 'TOMAN',
      daysAgo: 11,
      vendor: 'پلتفرم رویدادهای آنلاین ایسمینار',
      invoiceNumber: 'ESM-7832',
      status: 'paid',
      notes: 'ظرفیت ۱۰۰۰ شرکت‌کننده همزمان با لایو استریم',
    },
    {
      id: 'cost_seed_7',
      title: 'شارژ کمپین کلیکی همسان و بنری یکتانت',
      category: 'ad_media',
      channel: 'other',
      campaignId: 'cmp_mock_4',
      campaignName: 'کمپین بنری همسان شبکه‌های محتوا',
      amount: 120000000,
      currency: 'IRR',
      exchangeRate: 0.1,
      daysAgo: 13,
      vendor: 'یکتانت (شبکه هوشمند تبلیغات)',
      invoiceNumber: 'YKT-6541',
      status: 'paid',
      notes: 'تبلیغات همسان وبسایت‌های خبری و اقتصادی',
    },
    {
      id: 'cost_seed_8',
      title: 'تولید ۱۰ مقاله تخصصی سئو و استراتژی محتوایی لندینگ‌ها',
      category: 'content_production',
      channel: 'content_seo',
      campaignId: null,
      campaignName: null,
      amount: 8500000,
      currency: 'TOMAN',
      daysAgo: 15,
      vendor: 'آژانس تولید محتوای وب‌نویس',
      invoiceNumber: 'WN-1204',
      status: 'paid',
      notes: 'نگارش محتوای آسمان‌خراش با رعایت استانداردهای کیفی گوگل',
    },
    {
      id: 'cost_seed_9',
      title: 'شارژ دلاری تبلیغات دیسپلی گوگل ادز',
      category: 'ad_media',
      channel: 'google_ads',
      campaignId: 'cmp_mock_2',
      campaignName: 'کمپین سرچ کلمات کلیدی B2B',
      amount: 400,
      currency: 'USD',
      exchangeRate: 69500,
      daysAgo: 17,
      vendor: 'پارتنر رسمی گوگل ادز تهران',
      invoiceNumber: 'INV-GGL-8790',
      status: 'paid',
      notes: 'تبلیغات ریمارکتینگ تصویری برای کاربران بازدیدکننده قیمت‌گذاری',
    },
    {
      id: 'cost_seed_10',
      title: 'پکیج تبلیغات اسپانسری استوری پیج‌های تخصصی مارکتینگ',
      category: 'ad_media',
      channel: 'instagram',
      campaignId: 'cmp_mock_1',
      campaignName: 'کمپین تبلیغاتی جذب لید پاییزی',
      amount: 14000000,
      currency: 'TOMAN',
      daysAgo: 19,
      vendor: 'کانون تبلیغات دیده‌بان',
      invoiceNumber: 'DID-5512',
      status: 'paid',
      notes: 'پوشش پیج‌های مارکتینگی و بیزینس دایرکت',
    },
    {
      id: 'cost_seed_11',
      title: 'خرید لایسنس تیمی ابزار سئو SEMrush از طریق درهم امارات',
      category: 'software_saas',
      channel: 'content_seo',
      campaignId: null,
      campaignName: null,
      amount: 850,
      currency: 'AED',
      exchangeRate: 19000,
      daysAgo: 21,
      vendor: 'Online Dubai SaaS Reseller',
      invoiceNumber: 'DXB-SMR-309',
      status: 'pending',
      notes: 'تمدید دسترسی ۶ ماهه پلن Guru برای ۳ کارشناس',
    },
    {
      id: 'cost_seed_12',
      title: 'حق‌الزحمه مشاوره ماهانه و استراتژی پرفورمنس مارکتینگ آژانس',
      category: 'agency_fee',
      channel: null,
      campaignId: null,
      campaignName: null,
      amount: 35000000,
      currency: 'TOMAN',
      daysAgo: 24,
      vendor: 'آژانس دیجیتال مارکتینگ نوین‌گروث',
      invoiceNumber: 'NG-1403-08',
      status: 'paid',
      notes: 'حق‌الوکاله و بهینه‌سازی ساختار قیف فروش و نرخ تبدیل',
    },
    {
      id: 'cost_seed_13',
      title: 'پذیرایی و فیلمبرداری همایش معرفی خدمات سازمانی',
      category: 'events_webinar',
      channel: 'webinar',
      campaignId: 'cmp_mock_5',
      campaignName: 'ثبت‌نام وبینار استراتژی رشد کسب‌وکار',
      amount: 9000000,
      currency: 'TOMAN',
      daysAgo: 27,
      vendor: 'تشریفات و رویدادهای صدرا',
      invoiceNumber: 'SDR-902',
      status: 'paid',
      notes: 'هزینه تجهیزات صوتی، نورپردازی و رکورد حرفه‌ای',
    },
    {
      id: 'cost_seed_14',
      title: 'شارژ دلاری تبلیغات اپلیکیشن گوگل یونیورسال (UAC)',
      category: 'ad_media',
      channel: 'google_ads',
      campaignId: null,
      campaignName: null,
      amount: 800,
      currency: 'USD',
      exchangeRate: 69000,
      daysAgo: 30,
      vendor: 'پارتنر رسمی گوگل ادز تهران',
      invoiceNumber: 'INV-GGL-8650',
      status: 'paid',
      notes: 'هزینه عمومی جذب نصب فعال برای اپلیکیشن مارکتینگ',
    },
    {
      id: 'cost_seed_15',
      title: 'شارژ پنل پیامکی وب‌سرویس پترن‌های احراز هویت و پیگیری',
      category: 'ad_media',
      channel: 'sms',
      campaignId: 'cmp_mock_3',
      campaignName: 'ارسال پیامک تخفیف دوره‌های آموزشی',
      amount: 80000000,
      currency: 'IRR',
      exchangeRate: 0.1,
      daysAgo: 33,
      vendor: 'سامانه پیامک کاوه‌نگار',
      invoiceNumber: 'KN-98114',
      status: 'paid',
      notes: 'ارسال پیامک‌های پیگیری سرنخ‌های متوقف‌شده در مرحله ارزیابی',
    },
    {
      id: 'cost_seed_16',
      title: 'اسپانسری اپیزود ویژه پادکست کسب‌وکار و بازاریابی دیجیتال',
      category: 'influencer',
      channel: 'influencer',
      campaignId: null,
      campaignName: null,
      amount: 22000000,
      currency: 'TOMAN',
      daysAgo: 37,
      vendor: 'تولیدکنندگان پادکست رادیو مارکتینگ',
      invoiceNumber: 'RDM-041',
      status: 'paid',
      notes: 'اسپانسری انحصاری دو اپیزود در کست‌باکس و شنوتو',
    },
    {
      id: 'cost_seed_17',
      title: 'تولید پکیج بنرهای گیف متحرک تبلیغات کلیکی و ریتارگتینگ',
      category: 'content_production',
      channel: 'other',
      campaignId: 'cmp_mock_4',
      campaignName: 'کمپین بنری همسان شبکه‌های محتوا',
      amount: 16500000,
      currency: 'TOMAN',
      daysAgo: 41,
      vendor: 'استودیو دیزاین هشتگ',
      invoiceNumber: 'HTG-312',
      status: 'paid',
      notes: '۱۶ سایز استاندارد شبکه نمایش تبلیغات یکتانت و صباویژن',
    },
    {
      id: 'cost_seed_18',
      title: 'اشتراک سالانه پلتفرم مدیریت رویداد و وبینار ایسمینار',
      category: 'software_saas',
      channel: 'webinar',
      campaignId: 'cmp_mock_5',
      campaignName: 'ثبت‌نام وبینار استراتژی رشد کسب‌وکار',
      amount: 6200000,
      currency: 'TOMAN',
      daysAgo: 45,
      vendor: 'پلتفرم ایسمینار',
      invoiceNumber: 'ESM-7501',
      status: 'paid',
      notes: 'تمدید پنل سازمانی با اتصال درگاه پرداخت اختصاصی',
    },
    {
      id: 'cost_seed_19',
      title: 'شارژ کمپین ریمارکتینگ و سرچ برند گوگل ادز',
      category: 'ad_media',
      channel: 'google_ads',
      campaignId: 'cmp_mock_2',
      campaignName: 'کمپین سرچ کلمات کلیدی B2B',
      amount: 350,
      currency: 'USD',
      exchangeRate: 68500,
      daysAgo: 49,
      vendor: 'پارتنر رسمی گوگل ادز تهران',
      invoiceNumber: 'INV-GGL-8520',
      status: 'paid',
      notes: 'حفاظت از کلمات کلیدی برند در نتایج گوگل',
    },
    {
      id: 'cost_seed_20',
      title: 'همکاری تبلیغاتی اختصاصی با بلاگر حوزه تک و دیجیتال',
      category: 'influencer',
      channel: 'instagram',
      campaignId: 'cmp_mock_1',
      campaignName: 'کمپین تبلیغاتی جذب لید پاییزی',
      amount: 30000000,
      currency: 'TOMAN',
      daysAgo: 54,
      vendor: 'مدیا اینفلوئنسر پارس',
      invoiceNumber: 'MIP-771',
      status: 'paid',
      notes: 'معرفی جامع فیچرهای داشبورد و ترغیب به ثبت‌نام دمو',
    },
    {
      id: 'cost_seed_21',
      title: 'خرید اکانت سالانه ابزار ره‌گیری رقبا و کلمات کلیدی Ahrefs',
      category: 'software_saas',
      channel: 'content_seo',
      campaignId: null,
      campaignName: null,
      amount: 120,
      currency: 'USD',
      exchangeRate: 68000,
      daysAgo: 59,
      vendor: 'Ahrefs Pte Ltd',
      invoiceNumber: 'INV-AHR-5519',
      status: 'paid',
      notes: 'اکانت استاندارد سئو برای بخش تحقیق بازار',
    },
    {
      id: 'cost_seed_22',
      title: 'ضبط صدا و گویندگی نریشن تبلیغات رادیویی و ویدیویی',
      category: 'content_production',
      channel: null,
      campaignId: null,
      campaignName: null,
      amount: 5000000,
      currency: 'TOMAN',
      daysAgo: 64,
      vendor: 'استودیو صدای ماندگار',
      invoiceNumber: 'VO-203',
      status: 'paid',
      notes: 'ضبط با گوینده برتر صدا و سیما برای تیزرهای معرفی',
    },
    {
      id: 'cost_seed_23',
      title: 'جایگاه ثابت بنر ماهانه در پایگاه‌های تحلیلی تجارت الکترونیک',
      category: 'ad_media',
      channel: 'other',
      campaignId: 'cmp_mock_4',
      campaignName: 'کمپین بنری همسان شبکه‌های محتوا',
      amount: 11000000,
      currency: 'TOMAN',
      daysAgo: 69,
      vendor: 'شبکه تبلیغات خبری ای‌نت',
      invoiceNumber: 'EN-8012',
      status: 'paid',
      notes: 'بنر هدر ثابت در وبسایت‌های B2B اقتصادی',
    },
    {
      id: 'cost_seed_24',
      title: 'شارژ دلاری تبلیغات دیسکاوری گوگل ادز',
      category: 'ad_media',
      channel: 'google_ads',
      campaignId: null,
      campaignName: null,
      amount: 600,
      currency: 'USD',
      exchangeRate: 67500,
      daysAgo: 74,
      vendor: 'پارتنر رسمی گوگل ادز تهران',
      invoiceNumber: 'INV-GGL-8410',
      status: 'paid',
      notes: 'تست اولیه تبلیغات فید جیمیل و یوتیوب',
    },
    {
      id: 'cost_seed_25',
      title: 'طراحی هویت بصری و قالب‌های ایمیل اختصاصی خبرنامه',
      category: 'content_production',
      channel: 'email',
      campaignId: null,
      campaignName: null,
      amount: 4500000,
      currency: 'TOMAN',
      daysAgo: 79,
      vendor: 'فریلنسر ارشد گرافیک',
      invoiceNumber: 'FL-612',
      status: 'paid',
      notes: 'قالب‌های ریسپانسیو سازگار با نرم‌افزارهای مختلف ایمیل',
    },
    {
      id: 'cost_seed_26',
      title: 'بودجه پیش‌بینی‌شده تبلیغات وبینار ماه آینده (رزرو پلتفرم)',
      category: 'events_webinar',
      channel: 'webinar',
      campaignId: 'cmp_mock_5',
      campaignName: 'ثبت‌نام وبینار استراتژی رشد کسب‌وکار',
      amount: 15000000,
      currency: 'TOMAN',
      daysAgo: 1,
      vendor: 'پلتفرم وبینار سازمانی',
      invoiceNumber: 'DFT-ESM-01',
      status: 'draft',
      notes: 'پیش‌نویس هزینه هنوز به تایید نهایی مدیر مارکتینگ نرسیده است',
    },
    {
      id: 'cost_seed_27',
      title: 'رزرو بودجه ارزی برای کمپین کلمات بلک فرایدی گوگل ادز',
      category: 'ad_media',
      channel: 'google_ads',
      campaignId: 'cmp_mock_2',
      campaignName: 'کمپین سرچ کلمات کلیدی B2B',
      amount: 1200,
      currency: 'USD',
      exchangeRate: 70000,
      daysAgo: 3,
      vendor: 'پارتنر رسمی گوگل ادز تهران',
      invoiceNumber: 'DFT-GGL-99',
      status: 'draft',
      notes: 'پیش‌نویس ارزی جهت بررسی سقف بودجه فصل زمستان',
    },
    {
      id: 'cost_seed_28',
      title: 'فاکتور تسویه‌نشده حق‌الزحمه بازبینی گزارش سه‌ماهه آژانس',
      category: 'agency_fee',
      channel: null,
      campaignId: null,
      campaignName: null,
      amount: 28000000,
      currency: 'TOMAN',
      daysAgo: 6,
      vendor: 'آژانس دیجیتال مارکتینگ نوین‌گروث',
      invoiceNumber: 'NG-1403-09-REV',
      status: 'pending',
      notes: 'در انتظار پرداخت توسط دپارتمان مالی در سررسید انتهای ماه',
    },
  ];

  return seeds.map((s) => {
    const rate = resolveExchangeRate(s.currency, s.exchangeRate);
    const normalized = convertCurrencyToToman(s.amount, s.currency, rate);
    const createdAt = getIsoTimestamp(s.daysAgo, 10);
    const updatedAt = getIsoTimestamp(Math.max(0, s.daysAgo - 1), 16);
    const date = getIsoDate(s.daysAgo);

    return {
      id: s.id,
      title: s.title,
      category: s.category,
      channel: s.channel || null,
      campaignId: s.campaignId || null,
      campaignName: s.campaignName || null,
      amount: s.amount,
      currency: s.currency,
      exchangeRate: rate,
      normalizedAmountToman: normalized,
      date,
      vendor: s.vendor || null,
      invoiceNumber: s.invoiceNumber || null,
      status: s.status,
      notes: s.notes || null,
      createdAt,
      updatedAt,
    };
  });
}

/**
 * دریافت لیست هزینه‌ها از LocalStorage با فالبک امن به حافظه
 * در صورتی که برای اولین بار فراخوانی شود، داده‌های Seed ذخیره می‌شوند بدون بازنویسی داده‌های قبلی
 */
export function getStoredCosts(referenceDate?: Date | string): CostItem[] {
  if (isClient()) {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY_COSTS);
      const isSeeded = window.localStorage.getItem(STORAGE_KEY_SEEDED) === 'true';

      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }

      // اگر قبلاً Seed نشده یا استوریج خالی است، داده‌های اولیه ایجاد شود
      if (!isSeeded) {
        const seeds = createInitialCostSeedData(referenceDate);
        window.localStorage.setItem(STORAGE_KEY_COSTS, JSON.stringify(seeds));
        window.localStorage.setItem(STORAGE_KEY_SEEDED, 'true');
        return seeds;
      }

      return [];
    } catch (e) {
      console.warn('[CostsStorage] Error accessing localStorage, falling back to memory:', e);
    }
  }

  // محیط غیر کلاینت یا فالبک حافظه
  if (!memorySeeded && memoryCosts.length === 0) {
    memoryCosts = createInitialCostSeedData(referenceDate);
    memorySeeded = true;
  }
  return [...memoryCosts];
}

/**
 * ذخیره ایمن کلیه هزینه‌ها
 */
export function saveStoredCosts(costs: CostItem[]): boolean {
  memoryCosts = [...costs];
  memorySeeded = true;

  if (isClient()) {
    try {
      window.localStorage.setItem(STORAGE_KEY_COSTS, JSON.stringify(costs));
      window.localStorage.setItem(STORAGE_KEY_SEEDED, 'true');
      return true;
    } catch (e) {
      console.warn('[CostsStorage] Failed to save to localStorage:', e);
      return false;
    }
  }
  return true;
}

/**
 * دریافت هزینه با شناسه
 */
export function getStoredCostById(id: string): CostItem | null {
  const all = getStoredCosts();
  const found = all.find((item) => item.id === id);
  return found ? { ...found } : null;
}

/**
 * افزودن یک هزینه جدید به ابتدای لیست
 */
export function addStoredCost(cost: CostItem): CostItem {
  const all = getStoredCosts();
  const updated = [cost, ...all];
  saveStoredCosts(updated);
  return { ...cost };
}

/**
 * به‌روزرسانی فیلدهای یک هزینه موجود
 */
export function updateStoredCost(
  id: string,
  updatedFields: Partial<CostItem>
): CostItem | null {
  const all = getStoredCosts();
  const index = all.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const current = all[index];
  const updated: CostItem = {
    ...current,
    ...updatedFields,
    id: current.id, // شناسه تغییرناپذیر است
    createdAt: current.createdAt,
    updatedAt: new Date().toISOString(),
  };

  all[index] = updated;
  saveStoredCosts(all);
  return { ...updated };
}

/**
 * حذف یک هزینه با شناسه
 */
export function deleteStoredCost(id: string): boolean {
  const all = getStoredCosts();
  const initialLength = all.length;
  const filtered = all.filter((item) => item.id !== id);

  if (filtered.length === initialLength) {
    return false; // موردی برای حذف پیدا نشد
  }

  saveStoredCosts(filtered);
  return true;
}

/**
 * پاکسازی و ریست کامل داده‌های ماژول هزینه‌ها (جهت ایزولاسیون تست‌ها)
 */
export function resetCostsStorage(referenceDate?: Date | string): void {
  const initial = createInitialCostSeedData(referenceDate);
  memoryCosts = [...initial];
  memorySeeded = true;

  if (isClient()) {
    try {
      window.localStorage.removeItem(STORAGE_KEY_COSTS);
      window.localStorage.removeItem(STORAGE_KEY_SEEDED);
      window.localStorage.setItem(STORAGE_KEY_COSTS, JSON.stringify(initial));
      window.localStorage.setItem(STORAGE_KEY_SEEDED, 'true');
    } catch (e) {
      console.warn('[CostsStorage] Error resetting localStorage:', e);
    }
  }
}
