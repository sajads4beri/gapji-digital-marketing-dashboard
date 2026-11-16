import { Campaign, CampaignStats, CampaignStatus } from '@gapji/shared';

/**
 * انواع وضعیت‌های مجاز و معتبر کمپین در فرانت‌اند
 */
export type CampaignStatusType =
  | 'draft'
  | 'active'
  | 'paused'
  | 'completed'
  | 'archived';

/**
 * اهداف اصلی کمپین (مرحله ۱ ویزارد)
 */
export type CampaignObjective =
  | 'lead_generation'
  | 'brand_awareness'
  | 'direct_sales'
  | 'website_traffic'
  | 'app_install';

/**
 * ساختار سگمنت یا دسته مخاطب (مرحله ۲ ویزارد)
 */
export interface AudienceSegment {
  id: string;
  name: string;
  description: string;
  ageRange: string;
  gender: 'all' | 'male' | 'female';
  locations: string[];
  interests: string[];
  estimatedSize: number;
  isCustom?: boolean;
  channel?: string | null;
}

/**
 * تنظیمات مخاطبان هدف (مرحله ۲ ویزارد)
 */
export interface TargetAudience {
  ageRanges: string[];
  gender: 'all' | 'male' | 'female';
  locations: string[];
  interests: string[];
  estimatedReach?: number;
  selectedAudienceIds?: string[];
  customSegments?: AudienceSegment[];
}

/**
 * تخصیص پلتفرم و بودجه اختصاصی هرکدام (مرحله ۳ ویزارد)
 */
export interface PlatformAllocation {
  platformId: string;
  name: string;
  allocatedBudget: number;
  percentage: number;
  enabled: boolean;
  count?: number; // تعداد (مانند تعداد کلیک یا نمایش یا پست)
  description?: string; // توضیحات سطر پلتفرم
}

/**
 * هر آیتم شاخص کلیدی عملکرد انتخاب‌شده با مقدار هدف (مرحله ۴ ویزارد)
 */
export interface KpiTargetItem {
  id: string;
  name: string;
  unit: string;
  targetValue: number;
  description?: string;
}

/**
 * شاخص‌های کلیدی عملکرد و اهداف عددی کمپین (مرحله ۴ ویزارد)
 */
export interface CampaignKpis {
  targetCpa?: number;
  targetClicks?: number;
  targetConversions?: number;
  targetCtr?: number;
  selectedKpiItems?: KpiTargetItem[];
}

/**
 * پیکربندی پارامترهای UTM اختصاصی هر پلتفرم (مرحله ۵ ویزارد)
 */
export interface PlatformUtmConfig {
  platformId: string;
  platformName: string;
  source: string;
  medium: string;
  campaign: string;
  term?: string;
  content?: string;
  finalUrl: string;
}

/**
 * مدل لندینگ‌های متصل تستی (Mock Landing Page)
 */
export interface MockLandingPage {
  id: string;
  title: string;
  url: string;
  category: string;
}

/**
 * تنظیمات لینک فرود و پارامترهای UTM (مرحله ۵ ویزارد)
 */
export interface TrackingUtm {
  landingUrl: string;
  selectedLandingId?: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm?: string;
  utmContent?: string;
  generatedUrl?: string;
  platformUtms?: PlatformUtmConfig[];
}

/**
 * ساختار کامل وضعیت فرم ویزارد شش‌مرحله‌ای (Wizard Form State)
 */
export interface CampaignFormData {
  currentStep: number;
  // مرحله ۱: اطلاعات پایه
  name: string;
  objective: CampaignObjective | string;
  channel: string;
  status: CampaignStatusType;
  budget: number;
  startDate: string;
  endDate: string;
  description?: string | null;
  ownerName?: string;
  // مرحله ۲: مخاطبان هدف
  targetAudience: TargetAudience;
  // مرحله ۳: پلتفرم‌ها و بودجه‌ها
  platforms: PlatformAllocation[];
  // مرحله ۴: KPI و هدف‌ها
  targetKpis: CampaignKpis;
  // مرحله ۵: لندینگ و UTM
  trackingUtm: TrackingUtm;
}

/**
 * مدل توسعه‌یافته کمپین برای پاسخ به نیازمندی‌های بصری رابط کاربری
 * با حفظ سازگاری تایپ‌سیف و بازتعریف فیلد status با استفاده از Omit
 */
export interface ExtendedCampaign extends Omit<Campaign, 'status'> {
  status: CampaignStatusType;
  startDate: string;
  endDate: string;
  owner: {
    id: string;
    name: string;
    avatar?: string;
  };
  cpl: number;
  health: 'healthy' | 'warning' | 'critical';
  leadsCount: number;
  budgetSpendPercentage: number;
  // فیلدهای تکمیلی ۶ مرحله ویزارد (اختیاری جهت حفظ سازگاری کامل با داده‌های اولیه)
  objective?: CampaignObjective | string;
  targetAudience?: TargetAudience;
  platforms?: PlatformAllocation[];
  targetKpis?: CampaignKpis;
  trackingUtm?: TrackingUtm;
}

/**
 * داده‌های ورودی برای ایجاد یک کمپین جدید
 */
export interface CreateCampaignInput {
  name: string;
  description?: string | null;
  channel: string;
  status?: CampaignStatusType;
  budget: number;
  startDate: string;
  endDate: string;
  ownerName?: string;
  // فیلدهای تکمیلی اختیاری ویزارد
  objective?: CampaignObjective | string;
  targetAudience?: TargetAudience;
  platforms?: PlatformAllocation[];
  targetKpis?: CampaignKpis;
  trackingUtm?: TrackingUtm;
}

/**
 * داده‌های ورودی برای ویرایش کمپین موجود
 */
export interface UpdateCampaignInput extends Partial<CreateCampaignInput> {}

/**
 * فیلترهای جستجو، وضعیت و بازه زمانی کمپین‌ها
 */
export interface CampaignFilters {
  search?: string;
  status?: CampaignStatusType | string | string[];
  channel?: string;
  startDate?: string;
  endDate?: string;
  from?: string;
  to?: string;
}

export type { Campaign, CampaignStats, CampaignStatus };
