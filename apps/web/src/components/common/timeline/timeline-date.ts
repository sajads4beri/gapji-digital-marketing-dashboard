import { isoToJalali, getTodayIsoDate } from '@/lib/persian-date';
import type { TimelineDateMode } from './types';

/**
 * تبدیل ارقام انگلیسی به ارقام فارسی
 */
export function toPersianDigits(input: string | number): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(input).replace(/\d/g, (d) => persianDigits[parseInt(d, 10)] ?? d);
}

/**
 * دریافت تاریخ دیروز به وقت محلی با فرمت YYYY-MM-DD
 */
export function getYesterdayIsoDate(): string {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const year = yesterday.getFullYear();
  const month = String(yesterday.getMonth() + 1).padStart(2, '0');
  const day = String(yesterday.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * قالب‌بندی زمان و تاریخ برای آیتم‌های Timeline
 * با پشتیبانی از:
 * - relative: نمایش «امروز» و «دیروز» برای تاریخ‌های نزدیک همراه با ساعت
 * - full: نمایش تاریخ کامل شمسی به همراه ساعت (مطابق سند: در جزئیات)
 * - short: نمایش تاریخ کوتاه عددی شمسی (مطابق سند: در لیست‌ها)
 */
export function formatTimelineTimestamp(
  timestamp?: string | null,
  mode: TimelineDateMode = 'relative'
): string {
  if (!timestamp || typeof timestamp !== 'string') {
    return '—';
  }

  const trimmed = timestamp.trim();
  if (!trimmed) {
    return '—';
  }

  let dateIso = '';
  let timeStr: string | null = null;

  // اگر رشته شامل زمان (T) باشد، به وقت محلی کاربر تفسیر می‌شود
  if (trimmed.includes('T')) {
    const d = new Date(trimmed);
    if (isNaN(d.getTime())) {
      return '—';
    }

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    dateIso = `${year}-${month}-${day}`;

    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    timeStr = `${toPersianDigits(hours)}:${toPersianDigits(minutes)}`;
  } else {
    // تاریخ صرفاً روز (بدون ساعت) نباید به علت اختلاف تایم‌زون به روز قبل یا بعد منتقل شود
    dateIso = trimmed;
  }

  // تبدیل تاریخ به تقویم شمسی
  const jalali = isoToJalali(dateIso);
  if (!jalali.isValid) {
    return '—';
  }

  if (mode === 'short') {
    // تاریخ کوتاه عددی: ۱۴۰۵/۰۸/۰۷
    const jYear = toPersianDigits(jalali.year);
    const jMonth = toPersianDigits(String(jalali.month).padStart(2, '0'));
    const jDay = toPersianDigits(String(jalali.day).padStart(2, '0'));
    return `${jYear}/${jMonth}/${jDay}`;
  }

  if (mode === 'full') {
    // تاریخ کامل با ساعت: ۷ آبان ۱۴۰۵ ساعت ۱۰:۳۰
    return `${jalali.formatted}${timeStr ? ` ساعت ${timeStr}` : ''}`;
  }

  // حالت relative (پیش‌فرض)
  const todayIso = getTodayIsoDate();
  const yesterdayIso = getYesterdayIsoDate();

  if (dateIso === todayIso) {
    return timeStr ? `امروز، ${timeStr}` : 'امروز';
  }

  if (dateIso === yesterdayIso) {
    return timeStr ? `دیروز، ${timeStr}` : 'دیروز';
  }

  return timeStr ? `${jalali.formatted}، ${timeStr}` : jalali.formatted;
}
