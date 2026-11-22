import {
  isBrowser,
  getStoredItem,
  setStoredItem,
} from '@/lib/mock-utils';
import { CampaignFormData } from '../types';

/**
 * کلید مجزا و ایزوله برای ذخیره پیش‌نویس موقت ویزارد در localStorage
 * کاملاً مستقل از کلید ذخیره‌سازی کمپین‌های منتشرشده (STORAGE_KEY)
 */
export const WIZARD_DRAFT_STORAGE_KEY = 'gapji_campaign_wizard_draft_v1';

/**
 * ایجاد مقادیر پیش‌فرض اولیه برای ویزارد ۶ مرحله‌ای کمپین
 */
export function getDefaultCampaignFormData(): CampaignFormData {
  const today = new Date();
  const nextMonth = new Date(today);
  nextMonth.setDate(nextMonth.getDate() + 30);

  return {
    currentStep: 1,
    name: '',
    objective: 'lead_generation',
    channel: 'گوگل ادز',
    status: 'draft',
    budget: 50_000_000,
    startDate: today.toISOString().split('T')[0],
    endDate: nextMonth.toISOString().split('T')[0],
    description: '',
    ownerName: 'کاربر مارکتینگ',
    targetAudience: {
      ageRanges: ['25-34', '35-44'],
      gender: 'all',
      locations: ['تهران', 'اصفهان', 'مشهد', 'شیراز'],
      interests: ['دیجیتال مارکتینگ', 'کسب‌وکار و استارتاپ', 'خرید آنلاین'],
      estimatedReach: 450_000,
    },
    platforms: [
      {
        platformId: 'google_ads',
        name: 'گوگل ادز (Google Ads)',
        allocatedBudget: 30_000_000,
        percentage: 60,
        enabled: true,
      },
      {
        platformId: 'instagram',
        name: 'اینستاگرام (Instagram)',
        allocatedBudget: 20_000_000,
        percentage: 40,
        enabled: true,
      },
      {
        platformId: 'yektanet',
        name: 'یکتانت (تبلیغات همسان)',
        allocatedBudget: 0,
        percentage: 0,
        enabled: false,
      },
      {
        platformId: 'telegram',
        name: 'کانال‌های تلگرام',
        allocatedBudget: 0,
        percentage: 0,
        enabled: false,
      },
    ],
    targetKpis: {
      targetCpa: 45_000,
      targetClicks: 12_500,
      targetConversions: 450,
      targetCtr: 3.8,
      selectedKpiItems: [
        {
          id: 'kpi_cpa',
          name: 'هزینه هر تبدیل یا لید (CPA)',
          unit: 'تومان',
          targetValue: 45_000,
          description: 'حداکثر بهای تمام‌شده برای هر سرنخ یا ثبت‌نام جدید',
        },
        {
          id: 'kpi_clicks',
          name: 'تعداد کلیک هدف',
          unit: 'کلیک',
          targetValue: 12_500,
          description: 'مجموع ترافیک ورودی جذب‌شده از کلیه کانال‌ها',
        },
        {
          id: 'kpi_conversions',
          name: 'تعداد کل تبدیل‌ها',
          unit: 'تبدیل',
          targetValue: 450,
          description: 'تعداد تکمیل فرم ثبت‌نام یا خرید موفق',
        },
        {
          id: 'kpi_ctr',
          name: 'نرخ کلیک به نمایش (CTR)',
          unit: 'درصد',
          targetValue: 3.8,
          description: 'نسبت کلیک‌ها به کل دفعات نمایش تبلیغ',
        },
      ],
    },
    trackingUtm: {
      selectedLandingId: 'land_autumn_sale',
      landingUrl: 'https://gapji.ir/landing/autumn-sale',
      utmSource: 'google',
      utmMedium: 'cpc',
      utmCampaign: 'autumn_leads',
      utmTerm: 'marketing_software',
      utmContent: 'responsive_banner_v1',
      generatedUrl:
        'https://gapji.ir/landing/autumn-sale?utm_source=google&utm_medium=cpc&utm_campaign=autumn_leads&utm_term=marketing_software&utm_content=responsive_banner_v1',
      platformUtms: [
        {
          platformId: 'google_ads',
          platformName: 'گوگل ادز (Google Ads)',
          source: 'google',
          medium: 'cpc',
          campaign: 'autumn_leads',
          term: 'marketing_software',
          content: 'search_ad_group_a',
          finalUrl:
            'https://gapji.ir/landing/autumn-sale?utm_source=google&utm_medium=cpc&utm_campaign=autumn_leads&utm_term=marketing_software&utm_content=search_ad_group_a',
        },
        {
          platformId: 'instagram',
          platformName: 'اینستاگرام (Instagram)',
          source: 'instagram',
          medium: 'social_paid',
          campaign: 'autumn_leads',
          term: '',
          content: 'story_swipe_up',
          finalUrl:
            'https://gapji.ir/landing/autumn-sale?utm_source=instagram&utm_medium=social_paid&utm_campaign=autumn_leads&utm_content=story_swipe_up',
        },
      ],
    },
  };
}

/**
 * ذخیره داده‌های پیش‌نویس ویزارد در حافظه مرورگر
 */
export function saveWizardDraft(
  data: Partial<CampaignFormData> & { _campaignId?: string },
): boolean {
  if (!isBrowser()) return false;
  return setStoredItem(WIZARD_DRAFT_STORAGE_KEY, {
    ...data,
    _savedAt: new Date().toISOString(),
  });
}

/**
 * بازیابی داده‌های پیش‌نویس ویزارد با اعتبارسنجی ساختار
 */
export function getWizardDraft():
  | (Partial<CampaignFormData> & { _savedAt?: string; _campaignId?: string })
  | null {
  if (!isBrowser()) return null;
  const draft = getStoredItem<
    | (Partial<CampaignFormData> & { _savedAt?: string; _campaignId?: string })
    | null
  >(WIZARD_DRAFT_STORAGE_KEY, null);

  if (
    draft &&
    typeof draft === 'object' &&
    ('name' in draft || 'currentStep' in draft)
  ) {
    return draft;
  }
  return null;
}

/**
 * بررسی وجود پیش‌نویس معتبر ذخیره‌شده
 */
export function hasWizardDraft(): boolean {
  return getWizardDraft() !== null;
}

/**
 * پاکسازی پیش‌نویس موقت ویزارد پس از ثبت موفق یا انصراف صریح کاربر
 */
export function clearWizardDraft(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(WIZARD_DRAFT_STORAGE_KEY);
  } catch (err) {
    console.error('[wizard-storage] Failed to clear wizard draft from localStorage:', err);
  }
}
