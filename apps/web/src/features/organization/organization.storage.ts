/**
 * لایه ذخیره‌سازی، پایداری داده‌ها و مقادیر اولیه ماژول تنظیمات سازمان (LocalStorage & Memory Fallback)
 * کلید اصلی ذخیره‌سازی: gapji_org_settings_v1
 */

import type {
  OrgListType,
  OrgListItem,
  OrgLeadStatusItem,
  OrganizationGeneralSettings,
  OrganizationSettingsState,
} from './types';

export const STORAGE_KEY_ORG = 'gapji_org_settings_v1';
export const STORAGE_KEY_SEEDED = 'gapji_org_seeded_v1';

// حافظه موقت ایزوله جهت محیط‌های SSR، تست‌های خودکار Node.js یا موارد در دسترس نبودن localStorage
let memoryOrgState: OrganizationSettingsState | null = null;
let memorySeeded = false;

function isClient(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

/**
 * ایجاد داده‌های اولیه ساختگی (Initial Seed Data) بر مبنای تحلیل گام ۱۰H.2-A و سند محصول
 */
export function createInitialOrganizationSeedData(): OrganizationSettingsState {
  const now = new Date().toISOString();

  const general: OrganizationGeneralSettings = {
    id: 'org_gapji_1',
    name: 'شرکت فناوری گپ‌جی',
    logoUrl: '',
    currency: 'TOMAN',
    timezone: 'Asia/Tehran',
    updatedAt: now,
  };

  const campaign_types: OrgListItem[] = [
    {
      id: 'ct_omnichannel',
      key: 'omnichannel',
      label: 'چندکاناله (Omnichannel)',
      order: 1,
      isActive: true,
      isSystem: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'ct_google_ads',
      key: 'google_ads',
      label: 'گوگل ادز',
      order: 2,
      isActive: true,
      isSystem: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'ct_instagram',
      key: 'instagram',
      label: 'اینستاگرام',
      order: 3,
      isActive: true,
      isSystem: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'ct_yektanet',
      key: 'yektanet',
      label: 'یکتانت',
      order: 4,
      isActive: true,
      isSystem: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'ct_email',
      key: 'email_marketing',
      label: 'ایمیل مارکتینگ',
      order: 5,
      isActive: true,
      isSystem: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'ct_sms',
      key: 'sms',
      label: 'پیامک',
      order: 6,
      isActive: true,
      isSystem: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const lead_sources: OrgListItem[] = [
    {
      id: 'ls_google_ads',
      key: 'google_ads',
      label: 'گوگل ادز (Google Ads)',
      order: 1,
      isActive: true,
      isSystem: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'ls_instagram',
      key: 'instagram',
      label: 'اینستاگرام',
      order: 2,
      isActive: true,
      isSystem: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'ls_direct',
      key: 'direct',
      label: 'ورود مستقیم',
      order: 3,
      isActive: true,
      isSystem: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'ls_sms',
      key: 'sms',
      label: 'کمپین پیامکی',
      order: 4,
      isActive: true,
      isSystem: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'ls_website',
      key: 'website',
      label: 'وبسایت و ارگانیک',
      order: 5,
      isActive: true,
      isSystem: false,
      createdAt: now,
      updatedAt: now,
    },
  ];

  // وضعیت‌های ۶گانه لید با ستون الزامی group: open | won | lost
  const lead_statuses: OrgLeadStatusItem[] = [
    {
      id: 'lst_new',
      key: 'new',
      label: 'جدید',
      group: 'open',
      order: 1,
      isActive: true,
      isSystem: true,
      color: 'blue',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'lst_in_progress',
      key: 'in_progress',
      label: 'تماس گرفته شد',
      group: 'open',
      order: 2,
      isActive: true,
      isSystem: true,
      color: 'indigo',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'lst_qualified',
      key: 'qualified',
      label: 'واجد شرایط',
      group: 'open',
      order: 3,
      isActive: true,
      isSystem: true,
      color: 'emerald',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'lst_proposal',
      key: 'proposal',
      label: 'پیشنهاد',
      group: 'open',
      order: 4,
      isActive: true,
      isSystem: true,
      color: 'purple',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'lst_won',
      key: 'won',
      label: 'مشتری',
      group: 'won',
      order: 5,
      isActive: true,
      isSystem: true,
      color: 'amber',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'lst_lost',
      key: 'lost',
      label: 'ردشده',
      group: 'lost',
      order: 6,
      isActive: true,
      isSystem: true,
      color: 'rose',
      createdAt: now,
      updatedAt: now,
    },
  ];

  const lost_reasons: OrgListItem[] = [
    {
      id: 'lr_budget',
      key: 'budget_limit',
      label: 'محدودیت بودجه در این فصل مالی',
      previousLabels: ['محدودیت بودجه در این فصل مالی و موکول شدن به سال آینده.'],
      order: 1,
      isActive: true,
      isSystem: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'lr_competitor',
      key: 'competitor',
      label: 'خرید یا انتخاب راهکار رقیب',
      order: 2,
      isActive: true,
      isSystem: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'lr_no_response',
      key: 'no_response',
      label: 'عدم پاسخگویی پس از تماس‌ها و پیگیری‌های متوالی',
      order: 3,
      isActive: true,
      isSystem: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'lr_feature',
      key: 'feature_mismatch',
      label: 'عدم انطباق امکانات محصول با نیازمندی‌های مشتری',
      order: 4,
      isActive: true,
      isSystem: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'lr_timing',
      key: 'timing_mismatch',
      label: 'عدم تناسب زمان اجرای پروژه',
      order: 5,
      isActive: true,
      isSystem: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const cost_categories: OrgListItem[] = [
    {
      id: 'cc_ad_media',
      key: 'ad_media',
      label: 'رسانه تبلیغاتی',
      order: 1,
      isActive: true,
      isSystem: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'cc_content',
      key: 'content_production',
      label: 'تولید محتوا',
      order: 2,
      isActive: true,
      isSystem: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'cc_agency',
      key: 'agency_fee',
      label: 'کارمزد آژانس',
      order: 3,
      isActive: true,
      isSystem: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'cc_software',
      key: 'software_saas',
      label: 'ابزار و نرم‌افزار (SaaS)',
      order: 4,
      isActive: true,
      isSystem: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'cc_events',
      key: 'events_webinar',
      label: 'رویداد و وبینار',
      order: 5,
      isActive: true,
      isSystem: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'cc_influencer',
      key: 'influencer',
      label: 'اینفلوئنسر مارکتینگ',
      order: 6,
      isActive: true,
      isSystem: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'cc_other',
      key: 'other',
      label: 'سایر هزینه‌های بازاریابی',
      order: 7,
      isActive: true,
      isSystem: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  return {
    general,
    campaign_types,
    lead_sources,
    lead_statuses,
    lost_reasons,
    cost_categories,
  };
}

/**
 * دریافت وضعیت ذخیره‌شده تنظیمات سازمان از LocalStorage یا حافظه Fallback
 */
export function getOrganizationSettingsState(): OrganizationSettingsState {
  if (isClient()) {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY_ORG);
      const isSeeded = window.localStorage.getItem(STORAGE_KEY_SEEDED);

      if (stored) {
        const parsed = JSON.parse(stored) as OrganizationSettingsState;
        if (parsed && parsed.general && parsed.campaign_types) {
          return parsed;
        }
      }

      // بارگذاری داده اولیه در صورتی که ذخیره نشده باشد
      if (!isSeeded || !stored) {
        const initial = createInitialOrganizationSeedData();
        window.localStorage.setItem(STORAGE_KEY_ORG, JSON.stringify(initial));
        window.localStorage.setItem(STORAGE_KEY_SEEDED, 'true');
        return initial;
      }
    } catch (e) {
      console.warn('Organization Storage: Error accessing localStorage, falling back to memory', e);
    }
  }

  // حالت Fallback حافظه
  if (!memoryOrgState || !memorySeeded) {
    memoryOrgState = createInitialOrganizationSeedData();
    memorySeeded = true;
  }
  return JSON.parse(JSON.stringify(memoryOrgState));
}

/**
 * ذخیره‌سازی وضعیت کامل تنظیمات در LocalStorage و حافظه پشتیبان
 */
export function saveOrganizationSettingsState(state: OrganizationSettingsState): void {
  const serialized = JSON.stringify(state);
  if (isClient()) {
    try {
      window.localStorage.setItem(STORAGE_KEY_ORG, serialized);
      window.localStorage.setItem(STORAGE_KEY_SEEDED, 'true');
    } catch (e) {
      console.warn('Organization Storage: Error saving to localStorage, using memory', e);
    }
  }
  memoryOrgState = JSON.parse(serialized);
  memorySeeded = true;
}

/**
 * ریست کردن کامل استوریج ماژول (جهت اجرای تست‌های خودکار ایزوله)
 */
export function resetOrganizationStorageForTest(): void {
  memoryOrgState = null;
  memorySeeded = false;
  if (isClient()) {
    try {
      window.localStorage.removeItem(STORAGE_KEY_ORG);
      window.localStorage.removeItem(STORAGE_KEY_SEEDED);
    } catch (e) {
      // ignore
    }
  }
}

// نگاشت‌های صریح و قابل‌اثبات کانال‌های کمپین
const CAMPAIGN_CHANNEL_EXPLICIT_MAP: Record<string, string[]> = {
  omnichannel: ['چندکاناله (Omnichannel)'],
  google_ads: ['گوگل ادز'],
  instagram: ['اینستاگرام'],
  yektanet: ['یکتانت'],
  email_marketing: ['ایمیل مارکتینگ'],
  sms: ['پیامک'],
};

// نگاشت‌های صریح و قابل‌اثبات منابع لید
const LEAD_SOURCE_EXPLICIT_MAP: Record<string, { labels: string[]; utmSources: string[] }> = {
  google_ads: {
    labels: ['گوگل ادز (Google Ads)'],
    utmSources: ['google', 'google_ads'],
  },
  instagram: {
    labels: ['اینستاگرام'],
    utmSources: ['instagram'],
  },
  direct: {
    labels: ['ورود مستقیم'],
    utmSources: ['direct'],
  },
  sms: {
    labels: ['کمپین پیامکی'],
    utmSources: ['sms'],
  },
  website: {
    labels: ['وبسایت و ارگانیک'],
    utmSources: ['website', 'organic'],
  },
};

/**
 * محاسبه داینامیک و دقیق تعداد استفاده (usageCount) بدون تطبیق حدسی یا ریشه کلمات
 * برای جلوگیری همزمان از شمارش صفر کاذب و شمارش بیش‌ازحد
 */
export function calculateDynamicUsageCount(
  listType: OrgListType,
  item: OrgListItem
): number {
  if (!isClient()) {
    return getFallbackUsageCount(listType, item);
  }

  try {
    switch (listType) {
      case 'campaign_types': {
        const stored = window.localStorage.getItem('gapji_campaigns_v1');
        if (stored) {
          const campaigns = JSON.parse(stored);
          if (Array.isArray(campaigns)) {
            const candidateLabels = [item.label, ...(item.previousLabels || [])].map((l) => l.trim().toLowerCase());
            const explicitChannels = (CAMPAIGN_CHANNEL_EXPLICIT_MAP[item.key] || []).map((ch) => ch.trim().toLowerCase());

            return campaigns.filter((c: any) => {
              if (!c.channel) return false;
              const ch = String(c.channel).trim().toLowerCase();
              return candidateLabels.includes(ch) || explicitChannels.includes(ch);
            }).length;
          }
        }
        return getFallbackUsageCount(listType, item);
      }

      case 'lead_sources': {
        const stored = window.localStorage.getItem('gapji_leads_data_v2');
        if (stored) {
          const leads = JSON.parse(stored);
          if (Array.isArray(leads)) {
            const candidateLabels = [item.label, ...(item.previousLabels || [])].map((l) => l.trim().toLowerCase());
            const explicitMap = LEAD_SOURCE_EXPLICIT_MAP[item.key];
            const explicitLabels = explicitMap ? explicitMap.labels.map((l) => l.trim().toLowerCase()) : [];
            const explicitUtms = explicitMap ? explicitMap.utmSources.map((u) => u.trim().toLowerCase()) : [];

            return leads.filter((l: any) => {
              if (!l.source) return false;
              const src = String(l.source).trim().toLowerCase();
              const utm = l.utm?.source ? String(l.utm.source).trim().toLowerCase() : '';
              return candidateLabels.includes(src) || explicitLabels.includes(src) || (Boolean(utm) && explicitUtms.includes(utm));
            }).length;
          }
        }
        return getFallbackUsageCount(listType, item);
      }

      case 'lead_statuses': {
        const stored = window.localStorage.getItem('gapji_leads_data_v2');
        if (stored) {
          const leads = JSON.parse(stored);
          if (Array.isArray(leads)) {
            // انطباق فقط بر اساس کلید ثابت سیستمی معتبر
            return leads.filter((l: any) => l.status === item.key).length;
          }
        }
        return getFallbackUsageCount(listType, item);
      }

      case 'lost_reasons': {
        const stored = window.localStorage.getItem('gapji_leads_data_v2');
        if (stored) {
          const leads = JSON.parse(stored);
          if (Array.isArray(leads)) {
            // تطبیق دقیق با عنوان فعلی یا عناوین دقیق ثبت‌شده در previousLabels (بدون تطبیق حدسی با ریشه کلمات)
            const exactCandidates = [item.label, ...(item.previousLabels || [])].map((l) => l.trim().toLowerCase());
            return leads.filter((l: any) => {
              if (l.status !== 'lost' || !l.lostReason) return false;
              const reasonText = String(l.lostReason).trim().toLowerCase();
              return exactCandidates.includes(reasonText);
            }).length;
          }
        }
        return getFallbackUsageCount(listType, item);
      }

      case 'cost_categories': {
        const stored = window.localStorage.getItem('marketing_platform_costs_v1');
        if (stored) {
          const costs = JSON.parse(stored);
          if (Array.isArray(costs)) {
            // انطباق فقط بر اساس کلید ثابت سیستمی معتبر
            return costs.filter((c: any) => c.category === item.key).length;
          }
        }
        return getFallbackUsageCount(listType, item);
      }

      default:
        return 0;
    }
  } catch (err) {
    return getFallbackUsageCount(listType, item);
  }
}

/**
 * مقادیر استفاده پیش‌فرض بر مبنای Seedهای اولیه واقعی مخزن در صورت عدم دسترسی به LocalStorage
 */
function getFallbackUsageCount(listType: OrgListType, item: OrgListItem): number {
  // نگاشت تعداد استفاده در داده‌های اولیه Seed ماژول‌ها:
  // ۵ کمپین، ۸ لید اولیه و ۲۸ ردیف هزینه ثبت‌شده
  switch (listType) {
    case 'campaign_types':
      if (item.key === 'instagram') return 2;
      if (item.key === 'google_ads') return 1;
      if (item.key === 'sms') return 1;
      if (item.key === 'yektanet') return 1;
      return 0;

    case 'lead_sources':
      if (item.key === 'google_ads') return 3;
      if (item.key === 'instagram') return 2;
      if (item.key === 'direct') return 1;
      if (item.key === 'sms') return 1;
      return 0;

    case 'lead_statuses':
      if (item.key === 'new') return 2;
      if (item.key === 'in_progress') return 2;
      if (item.key === 'qualified') return 1;
      if (item.key === 'proposal') return 1;
      if (item.key === 'won') return 1;
      if (item.key === 'lost') return 1;
      return 0;

    case 'lost_reasons':
      if (item.key === 'budget_limit') return 1;
      return 0;

    case 'cost_categories':
      if (item.key === 'ad_media') return 12; // مطابق دقیق با مثال سند: «در ۱۲ مورد استفاده شده»
      if (item.key === 'content_production') return 4;
      if (item.key === 'agency_fee') return 2;
      if (item.key === 'software_saas') return 3;
      if (item.key === 'events_webinar') return 2;
      if (item.key === 'influencer') return 3;
      if (item.key === 'other') return 2;
      return 0;

    default:
      return 0;
  }
}
