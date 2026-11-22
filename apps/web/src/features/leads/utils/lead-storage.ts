import type { LeadDetail, LeadEvent } from '../types';

const STORAGE_KEY_LEADS = 'gapji_leads_data_v2';
const STORAGE_KEY_EVENTS = 'gapji_lead_events_v2';
const STORAGE_KEY_SEEDED = 'gapji_leads_seeded_v2';

// حافظه موقت در صورت اجرای کد در محیط سرور (SSR) یا Node
let memoryLeads: LeadDetail[] = [];
let memoryEvents: LeadEvent[] = [];
let memorySeeded = false;

function isClient(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

/**
 * تولید داده‌های Seed اولیه بر اساس تاریخ جاری به صورت داینامیک
 */
function createInitialSeedData(): { leads: LeadDetail[]; events: LeadEvent[] } {
  const now = new Date();
  const msInHour = 3600000;
  const msInDay = 86400000;

  const tNow = now.toISOString();
  const t2HoursAgo = new Date(now.getTime() - 2 * msInHour).toISOString();
  const tYesterday = new Date(now.getTime() - 24 * msInHour).toISOString();
  const tTomorrow = new Date(now.getTime() + 24 * msInHour).toISOString();
  const t3DaysAgo = new Date(now.getTime() - 3 * msInDay).toISOString();
  const t5DaysAgo = new Date(now.getTime() - 5 * msInDay).toISOString();
  const t6DaysAgo = new Date(now.getTime() - 6 * msInDay).toISOString();
  const t7DaysAgo = new Date(now.getTime() - 7 * msInDay).toISOString();

  const leads: LeadDetail[] = [
    {
      id: 'lead-101',
      fullName: 'پرهام رادمنش',
      phoneNumber: '۰۹۱۲۳۴۵۶۷۸۹',
      email: 'parham.radmanesh@example.com',
      company: 'شرکت فناوری نوآوران',
      status: 'won',
      campaignId: 'camp-1',
      campaignName: 'کمپین تخفیف پاییزه - گوگل ادز',
      source: 'گوگل ادز (Google Ads)',
      adName: 'تبلیغ جستجو - پلن شرکتی',
      utm: {
        source: 'google',
        medium: 'cpc',
        campaign: 'autumn-sale',
        content: 'search-ad-1',
      },
      assignedTo: {
        id: 'user-1',
        name: 'سارا احمدی',
        role: 'کارشناس ارشد فروش',
        avatarUrl:
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60',
      },
      estimatedValue: 45000000,
      nextFollowUpDate: undefined,
      createdAt: t7DaysAgo,
      updatedAt: tNow,
    },
    {
      id: 'lead-102',
      fullName: 'رضا کمالی',
      phoneNumber: '۰۹۱۸۷۶۵۴۳۲۱',
      email: 'kamali@example.com',
      company: 'فروشگاه پارسیان',
      status: 'lost',
      campaignId: 'camp-2',
      campaignName: 'کمپین لید اینستاگرام',
      source: 'اینستاگرام',
      adName: 'استوری جشنواره پاییز',
      utm: {
        source: 'instagram',
        medium: 'story',
        campaign: 'lead-gen',
      },
      assignedTo: {
        id: 'user-2',
        name: 'علی محمدی',
        role: 'کارشناس فروش',
      },
      estimatedValue: 18000000,
      lostReason: 'محدودیت بودجه در این فصل مالی و موکول شدن به سال آینده.',
      nextFollowUpDate: undefined,
      createdAt: t7DaysAgo,
      updatedAt: tYesterday,
    },
    {
      id: 'lead-103',
      fullName: 'مریم حسینی',
      phoneNumber: '۰۹۳۵۱۱۱۴۴۵۵',
      email: 'm.hosseini@tehranit.ir',
      company: 'فناوران تهران',
      status: 'new',
      campaignId: 'camp-1',
      campaignName: 'کمپین تخفیف پاییزه - گوگل ادز',
      source: 'گوگل ادز (Google Ads)',
      adName: 'تبلیغ ریتارگتینگ',
      utm: {
        source: 'google',
        medium: 'cpc',
        campaign: 'autumn-sale',
        content: 'banner-a',
      },
      assignedTo: undefined,
      estimatedValue: 12000000,
      nextFollowUpDate: undefined,
      createdAt: t3DaysAgo,
      updatedAt: t3DaysAgo,
    },
    {
      id: 'lead-104',
      fullName: 'امیرحسین صادقی',
      phoneNumber: '۰۹۱۲۲۲۲۳۳۴۴',
      email: 'amir.sadeghi@kaveh.com',
      company: 'گروه صنعتی کاوه',
      status: 'in_progress',
      campaignId: 'camp-3',
      campaignName: 'لندینگ وبینار بازاریابی دیجیتال',
      source: 'سایت مستقیم',
      adName: 'فرم وبینار',
      utm: {
        source: 'direct',
        medium: 'organic',
        campaign: 'webinar-2026',
      },
      assignedTo: {
        id: 'user-1',
        name: 'سارا احمدی',
        role: 'کارشناس ارشد فروش',
      },
      estimatedValue: 32000000,
      nextFollowUpDate: tTomorrow,
      createdAt: t5DaysAgo,
      updatedAt: tYesterday,
    },
    {
      id: 'lead-105',
      fullName: 'فرشته یوسفی',
      phoneNumber: '۰۹۱۹۳۳۳۵۵۶۶',
      email: 'yousefi@sepidar.co',
      company: 'سپیدار سیستم',
      status: 'qualified',
      campaignId: 'camp-2',
      campaignName: 'کمپین لید اینستاگرام',
      source: 'اینستاگرام',
      adName: 'پست ریلز معرفی محصول',
      utm: {
        source: 'instagram',
        medium: 'reels',
        campaign: 'lead-gen',
      },
      assignedTo: {
        id: 'user-2',
        name: 'علی محمدی',
        role: 'کارشناس فروش',
      },
      estimatedValue: 60000000,
      nextFollowUpDate: tTomorrow,
      createdAt: t6DaysAgo,
      updatedAt: t2HoursAgo,
    },
    {
      id: 'lead-106',
      fullName: 'نیما رستمی',
      phoneNumber: '۰۹۳۰۴۴۴۶۶۷۷',
      email: 'nima.rostami@roshd.net',
      company: 'آکادمی رشد نو',
      status: 'proposal',
      campaignId: 'camp-1',
      campaignName: 'کمپین تخفیف پاییزه - گوگل ادز',
      source: 'گوگل ادز (Google Ads)',
      adName: 'تبلیغ جستجو - پلن شرکتی',
      utm: {
        source: 'google',
        medium: 'cpc',
        campaign: 'autumn-sale',
      },
      assignedTo: {
        id: 'user-3',
        name: 'مریم کاظمی',
        role: 'مدیر توسعه فروش',
      },
      estimatedValue: 85000000,
      nextFollowUpDate: tYesterday,
      createdAt: t7DaysAgo,
      updatedAt: tYesterday,
    },
    {
      id: 'lead-107',
      fullName: 'سهراب مرادی',
      phoneNumber: '۰۹۱۲۵۵۵۷۷۸۸',
      company: 'تدارکات کالا پلاس',
      status: 'new',
      campaignId: 'camp-4',
      campaignName: 'کمپین پیامکی جشنواره مهر',
      source: 'پیامک کوتاه',
      adName: 'پیامک انبوه تخفیف ۵۰ درصدی',
      utm: {
        source: 'sms',
        medium: 'bulk',
        campaign: 'mehr-sale',
      },
      assignedTo: undefined,
      estimatedValue: 15000000,
      nextFollowUpDate: undefined,
      createdAt: tYesterday,
      updatedAt: tYesterday,
    },
    {
      id: 'lead-108',
      fullName: 'آیدا ابراهیمی',
      phoneNumber: '۰۹۳۷۶۶۶۸۸۹۹',
      email: 'ebrahimi@shafagh.ir',
      company: 'صنایع غذایی شفق',
      status: 'qualified',
      campaignId: 'camp-2',
      campaignName: 'کمپین لید اینستاگرام',
      source: 'اینستاگرام',
      adName: 'تبلیغ استوری اینفلوئنسر',
      utm: {
        source: 'instagram',
        medium: 'influencer',
        campaign: 'lead-gen',
      },
      assignedTo: {
        id: 'user-1',
        name: 'سارا احمدی',
        role: 'کارشناس ارشد فروش',
      },
      estimatedValue: 28000000,
      nextFollowUpDate: tTomorrow,
      createdAt: t5DaysAgo,
      updatedAt: tYesterday,
    },
  ];

  const events: LeadEvent[] = [
    // رویدادهای لید ۱۰۱ (سناریوی کامل خرید موفق)
    {
      id: 'evt-101-1',
      leadId: 'lead-101',
      type: 'ad_click',
      title: 'کلیک روی تبلیغ جستجوی گوگل ادز',
      timestamp: t7DaysAgo,
      actorType: 'system',
      metadata: {
        utmSource: 'google',
        utmMedium: 'cpc',
        utmCampaign: 'autumn-sale',
      },
    },
    {
      id: 'evt-101-2',
      leadId: 'lead-101',
      type: 'landing_visit',
      title: 'ورود به لندینگ جشنواره پاییزه',
      timestamp: t7DaysAgo,
      actorType: 'system',
      metadata: {
        utmSource: 'google',
      },
    },
    {
      id: 'evt-101-3',
      leadId: 'lead-101',
      type: 'form_submit',
      title: 'ثبت فرم درخواست مشاوره و دمو',
      timestamp: t7DaysAgo,
      actorType: 'system',
      note: 'متقاضی پلن سازمانی همراه با آموزش تیم بازاریابی.',
    },
    {
      id: 'evt-101-4',
      leadId: 'lead-101',
      type: 'assigned',
      title: 'تخصیص هوشمند به کارشناس فروش',
      timestamp: t7DaysAgo,
      actorType: 'system',
      actor: {
        id: 'user-1',
        name: 'سارا احمدی',
        role: 'کارشناس ارشد فروش',
      },
    },
    {
      id: 'evt-101-5',
      leadId: 'lead-101',
      type: 'status_change',
      title: 'تغییر وضعیت به تماس گرفته شد',
      timestamp: t6DaysAgo,
      actorType: 'user',
      actor: {
        id: 'user-1',
        name: 'سارا احمدی',
        role: 'کارشناس ارشد فروش',
      },
      metadata: {
        fromStatus: 'new',
        toStatus: 'in_progress',
      },
    },
    {
      id: 'evt-101-6',
      leadId: 'lead-101',
      type: 'call',
      title: 'تماس تلفنی اول',
      timestamp: t6DaysAgo,
      actorType: 'user',
      actor: {
        id: 'user-1',
        name: 'سارا احمدی',
        role: 'کارشناس ارشد فروش',
      },
      metadata: {
        callResult: 'busy',
        callDurationSeconds: 0,
      },
      note: 'خط مشغول بود. پیگیری برای نوبت بعد تنظیم شد.',
    },
    {
      id: 'evt-101-7',
      leadId: 'lead-101',
      type: 'call',
      title: 'تماس تلفنی دوم',
      timestamp: t5DaysAgo,
      actorType: 'user',
      actor: {
        id: 'user-1',
        name: 'سارا احمدی',
        role: 'کارشناس ارشد فروش',
      },
      metadata: {
        callResult: 'answered',
        callDurationSeconds: 220,
      },
      note: 'نیازسنجی انجام شد. متقاضی پلن ۵۰ کاربره هستند و درخواست ارسال پیش‌فاکتور رسمی با اعمال تخفیف جشنواره را دارند.',
    },
    {
      id: 'evt-101-8',
      leadId: 'lead-101',
      type: 'note',
      title: 'یادداشت داخلی پیگیری',
      timestamp: t3DaysAgo,
      actorType: 'user',
      actor: {
        id: 'user-1',
        name: 'سارا احمدی',
        role: 'کارشناس ارشد فروش',
      },
      note: 'هماهنگی با واحد مالی جهت صدور پیش‌فاکتور با شناسه یکتا انجام پذیرفت.',
    },
    {
      id: 'evt-101-9',
      leadId: 'lead-101',
      type: 'proposal_sent',
      title: 'ارسال پیش‌فاکتور رسمی شماره ۱۰۴۵',
      timestamp: tYesterday,
      actorType: 'user',
      actor: {
        id: 'user-1',
        name: 'سارا احمدی',
        role: 'کارشناس ارشد فروش',
      },
      metadata: {
        proposalTitle: 'پیش‌فاکتور رسمی شماره ۱۰۴۵',
        proposalAmount: 45000000,
      },
      note: 'پیش‌فاکتور از طریق ایمیل و پیام‌رسان ارسال گردید.',
    },
    {
      id: 'evt-101-10',
      leadId: 'lead-101',
      type: 'deal_won',
      title: 'خرید موفق پلن سازمانی',
      timestamp: t2HoursAgo,
      actorType: 'user',
      actor: {
        id: 'user-1',
        name: 'سارا احمدی',
        role: 'کارشناس ارشد فروش',
      },
      metadata: {
        dealValue: 45000000,
      },
      note: 'قرارداد سالانه به امضا رسید و پرداخت نهایی انجام شد.',
    },

    // رویدادهای لید ۱۰۲ (شامل deal_lost)
    {
      id: 'evt-102-1',
      leadId: 'lead-102',
      type: 'form_submit',
      title: 'ثبت فرم از پیج اینستاگرام',
      timestamp: t7DaysAgo,
      actorType: 'system',
    },
    {
      id: 'evt-102-2',
      leadId: 'lead-102',
      type: 'deal_lost',
      title: 'رد پیشنهاد و انصراف مشتری',
      timestamp: tYesterday,
      actorType: 'user',
      actor: {
        id: 'user-2',
        name: 'علی محمدی',
        role: 'کارشناس فروش',
      },
      metadata: {
        lostReason: 'محدودیت بودجه در این فصل مالی و موکول شدن به سال آینده.',
      },
    },

    // رویدادهای نمونه برای لید ۱۰۳
    {
      id: 'evt-103-1',
      leadId: 'lead-103',
      type: 'form_submit',
      title: 'ثبت فرم مشاوره آنلاین',
      timestamp: t3DaysAgo,
      actorType: 'system',
    },

    // رویدادهای نمونه برای لید ۱۰۴
    {
      id: 'evt-104-1',
      leadId: 'lead-104',
      type: 'form_submit',
      title: 'ثبت‌نام در وبینار',
      timestamp: t5DaysAgo,
      actorType: 'system',
    },
    {
      id: 'evt-104-2',
      leadId: 'lead-104',
      type: 'call',
      title: 'تماس اولیه پس از وبینار',
      timestamp: tYesterday,
      actorType: 'user',
      actor: {
        id: 'user-1',
        name: 'سارا احمدی',
        role: 'کارشناس ارشد فروش',
      },
      metadata: {
        callResult: 'answered',
        callDurationSeconds: 150,
      },
    },
  ];

  return { leads, events };
}

/**
 * مقداردهی اولیه داده‌ها در صورت اولین بار اجرا (Seed)
 */
function ensureInitialized(): void {
  if (isClient()) {
    const isSeeded = window.localStorage.getItem(STORAGE_KEY_SEEDED);
    if (!isSeeded) {
      const { leads, events } = createInitialSeedData();
      window.localStorage.setItem(STORAGE_KEY_LEADS, JSON.stringify(leads));
      window.localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(events));
      window.localStorage.setItem(STORAGE_KEY_SEEDED, 'true');
    }
  } else {
    if (!memorySeeded) {
      const { leads, events } = createInitialSeedData();
      memoryLeads = [...leads];
      memoryEvents = [...events];
      memorySeeded = true;
    }
  }
}

/**
 * بازنشانی کامل داده‌ها به وضعیت اولیه (مفید برای سناریوهای تست و ریست)
 */
export function resetStoredData(): void {
  const { leads, events } = createInitialSeedData();
  if (isClient()) {
    window.localStorage.setItem(STORAGE_KEY_LEADS, JSON.stringify(leads));
    window.localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(events));
    window.localStorage.setItem(STORAGE_KEY_SEEDED, 'true');
  } else {
    memoryLeads = [...leads];
    memoryEvents = [...events];
    memorySeeded = true;
  }
}

export interface ResolvedLeadOwner {
  id: string;
  name: string;
  role?: string;
  avatarUrl?: string;
  hasConflict?: boolean;
}

export const KNOWN_REPRESENTATIVES: Record<
  string,
  { id: string; name: string; role?: string; avatarUrl?: string }
> = {
  'user-1': {
    id: 'user-1',
    name: 'سارا احمدی',
    role: 'کارشناس ارشد فروش',
    avatarUrl:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60',
  },
  'user-2': {
    id: 'user-2',
    name: 'علی محمدی',
    role: 'کارشناس فروش',
  },
  'user-3': {
    id: 'user-3',
    name: 'مریم کاظمی',
    role: 'مدیر توسعه فروش',
  },
  'usr_mock_1': {
    id: 'usr_mock_1',
    name: 'علی محمدی',
    role: 'مدیر سیستم',
  },
  'usr_mock_2': {
    id: 'usr_mock_2',
    name: 'سارا احمدی',
    role: 'مدیر سیستم',
  },
  'usr_mock_3': {
    id: 'usr_mock_3',
    name: 'پرهام رادمنش',
    role: 'مدیر کمپین',
  },
  'usr_mock_4': {
    id: 'usr_mock_4',
    name: 'مریم کریمی',
    role: 'کارشناس فروش',
  },
};

/**
 * نرمال‌سازی قطعی مالکیت لید بر اساس فیلد مرجع canonical assignedToId
 * ۱. در صورت وجود assignedToId، این مقدار مالک قطعی (Canonical) است و اولویت دارد (حتی در صورت تعارض با assignedTo.id).
 * ۲. در صورت غیاب assignedToId، مقدار معتبر میراثی assignedTo.id به assignedToId نرمال‌سازی می‌شود.
 * ۳. در صورت فقدان هر دو مقدار معتبر، لید تخصیص‌نیافته (unassigned) محسوب می‌شود.
 * ۴. مقدار میراثی assignedTo.id در صورت تعارض، بازنویسی خاموش نمی‌شود و داده‌های اصلی دست‌نخورده حفظ می‌گردند.
 */
export function normalizeLeadOwnership(lead: LeadDetail): LeadDetail {
  const hasCanonical = Boolean(
    lead.assignedToId &&
      typeof lead.assignedToId === 'string' &&
      lead.assignedToId.trim() !== ''
  );
  const hasLegacy = Boolean(
    lead.assignedTo?.id &&
      typeof lead.assignedTo.id === 'string' &&
      lead.assignedTo.id.trim() !== ''
  );

  let canonicalId: string | undefined = undefined;

  if (hasCanonical) {
    canonicalId = lead.assignedToId!.trim();
  } else if (hasLegacy) {
    canonicalId = lead.assignedTo!.id!.trim();
  } else {
    canonicalId = undefined;
  }

  return {
    ...lead,
    assignedToId: canonicalId,
  };
}

/**
 * استخراج و حل نام مالک نمایشی لید بر اساس فیلد مرجع canonical assignedToId
 * - در صورت عدم وجود assignedToId: بازگشت null (تخصیص‌نیافته)
 * - در صورت تطابق assignedToId و assignedTo.id: استفاده از اطلاعات شیء assignedTo
 * - در صورت تعارض assignedToId و assignedTo.id: عدم نمایش کارشناس میراثی، حل نام بر اساس شناسه قطعی
 * - در صورت عدم امکان حل نام شناسه قطعی: بازگشت حالت ایمن تخصیص‌نیافته
 */
export function resolveLeadOwner(lead: LeadDetail): ResolvedLeadOwner | null {
  const canonicalId = lead.assignedToId?.trim();
  if (!canonicalId) {
    return null;
  }

  const legacyActor = lead.assignedTo;
  const legacyId = legacyActor?.id?.trim();
  const hasConflict = Boolean(legacyId && legacyId !== canonicalId);

  // در صورت عدم تعارض و وجود نام معتبر در شیء میراثی
  if (!hasConflict && legacyActor && legacyId === canonicalId && legacyActor.name) {
    return {
      id: canonicalId,
      name: legacyActor.name,
      role: legacyActor.role,
      avatarUrl: legacyActor.avatarUrl,
      hasConflict: false,
    };
  }

  // در صورت تعارض یا عدم وجود شیء میراثی، نام بر اساس شناسه قطعی (Canonical ID) حل می‌شود
  // به این ترتیب کارشناس میراثی اشتباهاً به عنوان مالک قطعی نمایش داده نمی‌شود
  const rep = KNOWN_REPRESENTATIVES[canonicalId];
  if (rep) {
    return {
      id: canonicalId,
      name: rep.name,
      role: rep.role,
      avatarUrl: rep.avatarUrl,
      hasConflict,
    };
  }

  // در صورت عدم شناسایی کاربر برای شناسه قطعی، وضعیت ایمن تخصیص‌نیافته بازگردانده می‌شود
  return null;
}

/**
 * خواندن لیست لیدها از منبع ذخیره‌سازی با پالایش موارد ناقص
 */
export function getStoredLeads(): LeadDetail[] {
  ensureInitialized();
  if (isClient()) {
    try {
      const data = window.localStorage.getItem(STORAGE_KEY_LEADS);
      if (!data) return [];
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter(
          (lead): lead is LeadDetail =>
            Boolean(lead && typeof lead === 'object' && lead.id && lead.fullName)
        )
        .map(normalizeLeadOwnership);
    } catch {
      return [];
    }
  }
  return memoryLeads.map(normalizeLeadOwnership);
}

/**
 * یافتن یک لید با شناسه یکتا
 */
export function getStoredLeadById(id: string): LeadDetail | null {
  const leads = getStoredLeads();
  const found = leads.find((l) => l.id === id);
  return found ? { ...found } : null;
}

/**
 * به‌روزرسانی مشخصات یک لید
 */
export function updateStoredLead(
  id: string,
  updates: Partial<LeadDetail>
): LeadDetail | null {
  ensureInitialized();
  const leads = getStoredLeads();
  const index = leads.findIndex((l) => l.id === id);
  if (index === -1) return null;

  const rawAssignedToId =
    updates.assignedToId !== undefined
      ? updates.assignedToId
      : updates.assignedTo?.id !== undefined
      ? updates.assignedTo.id
      : leads[index].assignedToId;

  const updatedLead: LeadDetail = normalizeLeadOwnership({
    ...leads[index],
    ...updates,
    id: leads[index].id, // شناسه نباید تغییر کند
    assignedToId: rawAssignedToId,
    updatedAt: updates.updatedAt || new Date().toISOString(),
  });

  leads[index] = updatedLead;

  if (isClient()) {
    try {
      window.localStorage.setItem(STORAGE_KEY_LEADS, JSON.stringify(leads));
    } catch (err) {
      console.error('Failed to update lead in localStorage:', err);
    }
  } else {
    memoryLeads = [...leads];
  }

  return { ...updatedLead };
}

/**
 * به‌روزرسانی دسته‌جمعی لیدها (Bulk Update)
 */
export function updateStoredLeadsBulk(
  ids: string[],
  updates: Partial<LeadDetail>
): { succeeded: string[]; failed: { id: string; error: string }[] } {
  ensureInitialized();
  const leads = getStoredLeads();
  const succeeded: string[] = [];
  const failed: { id: string; error: string }[] = [];
  const now = new Date().toISOString();

  const leadsMap = new Map<string, LeadDetail>();
  for (const lead of leads) {
    leadsMap.set(lead.id, lead);
  }

  for (const id of ids) {
    const existing = leadsMap.get(id);
    if (!existing) {
      failed.push({ id, error: `لید با شناسه ${id} یافت نشد.` });
      continue;
    }

    const updated: LeadDetail = {
      ...existing,
      ...updates,
      id: existing.id,
      updatedAt: updates.updatedAt || now,
    };

    leadsMap.set(id, updated);
    succeeded.push(id);
  }

  const updatedList = Array.from(leadsMap.values());

  if (isClient()) {
    try {
      window.localStorage.setItem(STORAGE_KEY_LEADS, JSON.stringify(updatedList));
    } catch (err) {
      console.error('Failed to bulk update leads in localStorage:', err);
    }
  } else {
    memoryLeads = [...updatedList];
  }

  return { succeeded, failed };
}

/**
 * افزودن یا جایگزینی کامل یک لید
 */
export function saveStoredLead(lead: LeadDetail): void {
  ensureInitialized();
  const leads = getStoredLeads();
  const index = leads.findIndex((l) => l.id === lead.id);

  if (index >= 0) {
    leads[index] = { ...lead, updatedAt: new Date().toISOString() };
  } else {
    leads.push({ ...lead });
  }

  if (isClient()) {
    try {
      window.localStorage.setItem(STORAGE_KEY_LEADS, JSON.stringify(leads));
    } catch (err) {
      console.error('Failed to save lead in localStorage:', err);
    }
  } else {
    memoryLeads = [...leads];
  }
}

/**
 * خواندن رویدادهای یک لید خاص با تفکیک قطعی و ایمنی در برابر داده‌های خراب
 */
export function getStoredEvents(leadId: string): LeadEvent[] {
  ensureInitialized();
  let allEvents: LeadEvent[] = [];
  if (isClient()) {
    try {
      const data = window.localStorage.getItem(STORAGE_KEY_EVENTS);
      if (!data) return [];
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        allEvents = parsed.filter(
          (evt): evt is LeadEvent =>
            Boolean(evt && typeof evt === 'object' && evt.id && evt.leadId)
        );
      } else {
        allEvents = [];
      }
    } catch {
      allEvents = [];
    }
  } else {
    allEvents = [...memoryEvents];
  }

  // تفکیک دقیق رویدادهای لید درخواستی جهت ممانعت از نشت داده بین لیدها
  return allEvents.filter((evt) => evt.leadId === leadId);
}

/**
 * ذخیره رویداد جدید برای یک لید
 */
export function saveStoredEvent(event: LeadEvent): void {
  ensureInitialized();
  if (isClient()) {
    try {
      const data = window.localStorage.getItem(STORAGE_KEY_EVENTS);
      let allEvents: LeadEvent[] = [];
      if (data) {
        try {
          const parsed = JSON.parse(data);
          allEvents = Array.isArray(parsed) ? parsed : [];
        } catch {
          allEvents = [];
        }
      }
      allEvents.push(event);
      window.localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(allEvents));
    } catch (err) {
      console.error('Failed to save event to localStorage:', err);
    }
  } else {
    memoryEvents.push(event);
  }
}

/**
 * ذخیره دسته‌جمعی رویدادها
 */
export function saveStoredEventsBulk(events: LeadEvent[]): void {
  ensureInitialized();
  if (!events || events.length === 0) return;

  if (isClient()) {
    try {
      const data = window.localStorage.getItem(STORAGE_KEY_EVENTS);
      let allEvents: LeadEvent[] = [];
      if (data) {
        try {
          const parsed = JSON.parse(data);
          allEvents = Array.isArray(parsed) ? parsed : [];
        } catch {
          allEvents = [];
        }
      }
      allEvents.push(...events);
      window.localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(allEvents));
    } catch (err) {
      console.error('Failed to save bulk events to localStorage:', err);
    }
  } else {
    memoryEvents.push(...events);
  }
}

/**
 * پاک‌سازی رویدادهای یک لید (جهت تست و پشتیبانی از آرایه خالی معتبر بدون Seed مجدد)
 */
export function clearStoredEvents(leadId?: string): void {
  ensureInitialized();
  if (isClient()) {
    if (!leadId) {
      window.localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify([]));
    } else {
      const data = window.localStorage.getItem(STORAGE_KEY_EVENTS);
      let allEvents: LeadEvent[] = [];
      if (data) {
        try {
          const parsed = JSON.parse(data);
          allEvents = Array.isArray(parsed) ? parsed : [];
        } catch {
          allEvents = [];
        }
      }
      const filtered = allEvents.filter((e) => e.leadId !== leadId);
      window.localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(filtered));
    }
  } else {
    if (!leadId) {
      memoryEvents = [];
    } else {
      memoryEvents = memoryEvents.filter((e) => e.leadId !== leadId);
    }
  }
}
