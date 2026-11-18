/**
 * تعاریف مدل‌های داده و انواع ماژول تنظیمات سازمان (Organization Settings)
 * مرجع: سند محصول Marketing Platform – Phase 1: Frontend Pages (صفحات ۲۳، ۲۴، ۲۵ و ۴)
 */

export type OrgListType =
  | 'campaign_types'
  | 'lead_sources'
  | 'lead_statuses'
  | 'lost_reasons'
  | 'cost_categories';

export const ORG_LIST_TYPES: OrgListType[] = [
  'campaign_types',
  'lead_sources',
  'lead_statuses',
  'lost_reasons',
  'cost_categories',
];

export const ORG_LIST_TITLES: Record<OrgListType, string> = {
  campaign_types: 'انواع کمپین',
  lead_sources: 'منابع لید',
  lead_statuses: 'وضعیت‌های لید',
  lost_reasons: 'دلایل ردشدن لید',
  cost_categories: 'دسته‌بندی هزینه',
};

/**
 * گروه‌های الزامی وضعیت لید بر اساس صفحه ۲۳ سند محصول: (باز / برنده / بازنده)
 */
export type LeadStatusGroup = 'open' | 'won' | 'lost';

export const LEAD_STATUS_GROUP_LABELS: Record<LeadStatusGroup, string> = {
  open: 'باز',
  won: 'برنده (مشتری)',
  lost: 'بازنده (ردشده)',
};

/**
 * مدل داده عمومی آیتم‌های هر فهرست سازمانی
 */
export interface OrgListItem {
  id: string;               // شناسه یکتا و پایدار (مانند 'ct_google_ads' یا 'lst_new')
  key: string;              // کلید سیستمی پایدار
  label: string;            // عنوان نمایشی به زبان فارسی
  order: number;            // ترتیب نمایش در جدول و فرم‌ها (جهت پشتیبانی از Drag & Drop)
  isActive: boolean;        // وضعیت فعال یا غیرفعال
  isSystem: boolean;        // آیا گزینه جزو موارد سیستمی پیش‌فرض هسته است؟
  group?: LeadStatusGroup;  // ستون اختصاصی وضعیت لید (باز / برنده / بازنده)
  color?: string;           // رنگ اختیاری جهت نمایش هماهنگ در برد کانبان یا بج‌ها
  usageCount?: number;      // تعداد دفعات استفاده‌شده در رکوردهای سیستم (محاسبه داینامیک)
  previousLabels?: string[];// عناوین قبلی جهت حفظ سوابق و جلوگیری از شمارش صفر کاذب
  createdAt: string;        // زمان ایجاد ISO
  updatedAt: string;        // زمان آخرین ویرایش ISO
}

/**
 * تایپ اختصاصی وضعیت‌های لید با تضمین وجود فیلد group
 */
export interface OrgLeadStatusItem extends OrgListItem {
  group: LeadStatusGroup;
}

/**
 * مدل داده تنظیمات عمومی سازمان (صفحه ۲۴ سند محصول)
 */
export interface OrganizationGeneralSettings {
  id: string;
  name: string;             // نام رسمی سازمان
  logoUrl?: string;         // آدرس یا نماد تصویری لوگو
  currency: 'TOMAN' | 'IRR';// واحد پولی کل سامانه (تومان یا ریال)
  timezone: string;         // منطقه زمانی رسمی (پیش‌فرض Asia/Tehran)
  updatedAt: string;        // زمان آخرین تغییر
}

/**
 * مدل کل وضعیت ذخیره‌شده تنظیمات سازمان در Storage
 */
export interface OrganizationSettingsState {
  general: OrganizationGeneralSettings;
  campaign_types: OrgListItem[];
  lead_sources: OrgListItem[];
  lead_statuses: OrgLeadStatusItem[];
  lost_reasons: OrgListItem[];
  cost_categories: OrgListItem[];
}

/**
 * ساختار ورودی ایجاد آیتم جدید در هر فهرست
 */
export interface CreateOrgListItemInput {
  label: string;
  key?: string;
  group?: LeadStatusGroup;  // الزامی برای lead_statuses
  color?: string;
  isActive?: boolean;
}

/**
 * ساختار ورودی ویرایش مشخصات یک گزینه
 */
export interface UpdateOrgListItemInput {
  label?: string;
  group?: LeadStatusGroup;
  color?: string;
  isActive?: boolean;
  order?: number;
}

/**
 * ساختار ورودی ویرایش تنظیمات عمومی
 */
export interface UpdateGeneralSettingsInput {
  name?: string;
  logoUrl?: string;
  currency?: 'TOMAN' | 'IRR';
  timezone?: string;
}
