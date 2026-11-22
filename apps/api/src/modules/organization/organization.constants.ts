import { LeadStatusGroup } from '@prisma/client';

export const DEFAULT_ORGANIZATION_ID = '00000000-0000-0000-0000-000000000001';

export type OrgListType =
  | 'campaign_types'
  | 'lead_sources'
  | 'lead_statuses'
  | 'lost_reasons'
  | 'cost_categories';

export const TAXONOMY_TYPE_MAP: Record<string, string> = {
  campaign_types: 'campaign_type',
  lead_sources: 'lead_source',
  lost_reasons: 'lost_reason',
};

export const INITIAL_DEFAULT_SEED = {
  campaign_types: [
    { key: 'omnichannel', label: 'چندکاناله (Omnichannel)', order: 1, isSystem: true },
    { key: 'google_ads', label: 'گوگل ادز', order: 2, isSystem: true },
    { key: 'instagram', label: 'اینستاگرام', order: 3, isSystem: true },
    { key: 'yektanet', label: 'یکتانت', order: 4, isSystem: true },
    { key: 'email_marketing', label: 'ایمیل مارکتینگ', order: 5, isSystem: true },
    { key: 'sms', label: 'پیامک', order: 6, isSystem: true },
  ],
  lead_sources: [
    { key: 'google_ads', label: 'گوگل ادز (Google Ads)', order: 1, isSystem: true },
    { key: 'instagram', label: 'اینستاگرام', order: 2, isSystem: true },
    { key: 'direct', label: 'ورود مستقیم', order: 3, isSystem: true },
    { key: 'sms', label: 'کمپین پیامکی', order: 4, isSystem: true },
    { key: 'website', label: 'وبسایت و ارگانیک', order: 5, isSystem: false },
    { key: 'manual', label: 'دستی (ثبت تلفنی)', order: 6, isSystem: true },
  ],
  lead_statuses: [
    { key: 'new', label: 'جدید', group: LeadStatusGroup.open, color: 'blue', order: 1, isSystem: true },
    { key: 'in_progress', label: 'تماس گرفته شد', group: LeadStatusGroup.open, color: 'indigo', order: 2, isSystem: true },
    { key: 'qualified', label: 'واجد شرایط', group: LeadStatusGroup.open, color: 'emerald', order: 3, isSystem: true },
    { key: 'proposal', label: 'پیشنهاد', group: LeadStatusGroup.open, color: 'purple', order: 4, isSystem: true },
    { key: 'won', label: 'مشتری', group: LeadStatusGroup.won, color: 'amber', order: 5, isSystem: true },
    { key: 'lost', label: 'ردشده', group: LeadStatusGroup.lost, color: 'rose', order: 6, isSystem: true },
  ],
  lost_reasons: [
    { key: 'budget_limit', label: 'محدودیت بودجه در این فصل مالی', order: 1, isSystem: true },
    { key: 'competitor', label: 'خرید یا انتخاب راهکار رقیب', order: 2, isSystem: true },
    { key: 'no_response', label: 'عدم پاسخگویی پس از تماس‌ها و پیگیری‌های متوالی', order: 3, isSystem: true },
    { key: 'feature_mismatch', label: 'عدم انطباق امکانات محصول با نیازمندی‌های مشتری', order: 4, isSystem: true },
    { key: 'timing_mismatch', label: 'عدم تناسب زمان اجرای پروژه', order: 5, isSystem: true },
  ],
  cost_categories: [
    { code: 'ad_media', name: 'رسانه تبلیغاتی', description: 'هزینه‌های مستقیم خرید کلیک و نمایش تبلیغات', isActive: true },
    { code: 'content_production', name: 'تولید محتوا', description: 'طراحی بنر، ویدیو، موشن و کپی‌رایتینگ', isActive: true },
    { code: 'agency_fee', name: 'کارمزد آژانس', description: 'مدیریت و بهینه‌سازی فنی کمپین‌ها', isActive: true },
    { code: 'software_saas', name: 'ابزار و تکنولوژی (SaaS)', description: 'اشتراک ابزارهای تحلیلی و زیرساخت مارکتینگ', isActive: true },
    { code: 'events_webinar', name: 'رویداد و وبینار', description: 'هزینه‌های برگزاری وبینار و ایونت‌های تجاری', isActive: true },
  ],
};
