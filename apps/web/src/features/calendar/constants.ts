import { CalendarEventType, PersianHoliday, EquipmentReadinessStatus } from './types';

/**
 * رنگ‌ها و برچسب‌های استاندارد انواع رویدادها بر پایه سیستم طراحی Midnight Executive
 * ص ۱۹ §۲۰ سند نیازمندی‌ها
 */
export const EVENT_TYPE_CONFIG: Record<
  CalendarEventType,
  {
    label: string;
    description: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    barBg: string;
    barBorder: string;
    dotColor: string;
    defaultColor: string;
  }
> = {
  campaign: {
    label: 'اجرای کمپین',
    description: 'نوار زمانی چندروزه اجرای کمپین‌های تبلیغاتی',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
    badgeText: '#34D399',
    badgeBorder: 'rgba(16, 185, 129, 0.35)',
    barBg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.35) 100%)',
    barBorder: '#10B981',
    dotColor: '#10B981',
    defaultColor: '#10B981',
  },
  webinar: {
    label: 'وبینار',
    description: 'رویدادها و وبینارهای آنلاین بازاریابی',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    badgeText: '#38BDF8',
    badgeBorder: 'rgba(56, 189, 248, 0.35)',
    barBg: 'linear-gradient(135deg, rgba(56, 189, 248, 0.25) 0%, rgba(2, 132, 199, 0.35) 100%)',
    barBorder: '#38BDF8',
    dotColor: '#38BDF8',
    defaultColor: '#38BDF8',
  },
  meeting: {
    label: 'جلسه',
    description: 'جلسات هماهنگی، استراتژی و بازبینی تیم',
    badgeBg: 'rgba(245, 158, 11, 0.15)',
    badgeText: '#FBBF24',
    badgeBorder: 'rgba(245, 158, 11, 0.35)',
    barBg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.35) 100%)',
    barBorder: '#F59E0B',
    dotColor: '#F59E0B',
    defaultColor: '#F59E0B',
  },
  task: {
    label: 'مهلت تسک',
    description: 'ددلاین و موعد تحویل وظایف و اقدامات کلیدی',
    badgeBg: 'rgba(244, 63, 94, 0.15)',
    badgeText: '#FB7185',
    badgeBorder: 'rgba(244, 63, 94, 0.35)',
    barBg: 'linear-gradient(135deg, rgba(244, 63, 94, 0.25) 0%, rgba(225, 29, 72, 0.35) 100%)',
    barBorder: '#F43F5E',
    dotColor: '#F43F5E',
    defaultColor: '#F43F5E',
  },
};

/**
 * وضعیت‌های آمادگی تجهیزات در کشوی رویداد (ص ۱۹ §۲۰ و ص ۲۰ §۲۱)
 */
export const EQUIPMENT_STATUS_CONFIG: Record<
  EquipmentReadinessStatus,
  { label: string; badgeBg: string; badgeText: string; badgeBorder: string }
> = {
  ready: {
    label: 'آماده و تست‌شده',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
    badgeText: '#34D399',
    badgeBorder: 'rgba(16, 185, 129, 0.3)',
  },
  incomplete: {
    label: 'ناقص / نیازمند بررسی',
    badgeBg: 'rgba(245, 158, 11, 0.15)',
    badgeText: '#FBBF24',
    badgeBorder: 'rgba(245, 158, 11, 0.3)',
  },
  not_procured: {
    label: 'تهیه‌نشده',
    badgeBg: 'rgba(244, 63, 94, 0.15)',
    badgeText: '#FB7185',
    badgeBorder: 'rgba(244, 63, 94, 0.3)',
  },
};

/**
 * فهرست تعطیلات و مناسبت‌های رسمی تقویم شمسی
 * (منطبق با دستور سند: شروع هفته شنبه، جمعه با رنگ متفاوت، تعطیلات رسمی)
 */
export const PERSIAN_HOLIDAYS_TABLE: PersianHoliday[] = [
  // فروردین
  { month: 1, day: 1, title: 'جشن نوروز / آغاز سال نو', isOfficialHoliday: true },
  { month: 1, day: 2, title: 'عید نوروز', isOfficialHoliday: true },
  { month: 1, day: 3, title: 'عید نوروز', isOfficialHoliday: true },
  { month: 1, day: 4, title: 'عید نوروز', isOfficialHoliday: true },
  { month: 1, day: 12, title: 'روز جمهوری اسلامی', isOfficialHoliday: true },
  { month: 1, day: 13, title: 'روز طبیعت (سیزده‌بدر)', isOfficialHoliday: true },
  // خرداد
  { month: 3, day: 14, title: 'رحلت امام خمینی', isOfficialHoliday: true },
  { month: 3, day: 15, title: 'قیام ۱۵ خرداد', isOfficialHoliday: true },
  // بهمن
  { month: 11, day: 22, title: 'پیروزی انقلاب اسلامی', isOfficialHoliday: true },
  // اسفند
  { month: 12, day: 29, title: 'ملی شدن صنعت نفت', isOfficialHoliday: true },
];

/**
 * دریافت اطلاعات مناسبت یا تعطیلی رسمی روز شمسی
 */
export function getPersianHoliday(month: number, day: number): PersianHoliday | undefined {
  return PERSIAN_HOLIDAYS_TABLE.find((h) => h.month === month && h.day === day);
}
