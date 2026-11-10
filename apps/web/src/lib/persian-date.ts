/**
 * موتور محاسبات و تبدیل تقویم شمسی بر پایه Intl و الگوریتم‌های استاندارد نجومی
 * بدون وابستگی به هیچ‌گونه پکیج خارجی
 */

export const PERSIAN_MONTH_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
] as const;

export const PERSIAN_WEEKDAY_NAMES = [
  'شنبه',
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنج‌شنبه',
  'جمعه',
] as const;

export const PERSIAN_WEEKDAY_SHORT = [
  'ش',
  'ی',
  'د',
  'س',
  'چ',
  'پ',
  'ج',
] as const;

export interface JalaliDateParts {
  year: number;
  month: number;
  day: number;
  formatted: string;
  isValid: boolean;
}

/**
 * بررسی صحت فرمت رشته ISO تاریخ (YYYY-MM-DD)
 */
export function isValidIsoDate(isoStr?: string | null): boolean {
  if (!isoStr || typeof isoStr !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoStr)) return false;
  const d = new Date(`${isoStr}T12:00:00Z`);
  return !isNaN(d.getTime());
}

/**
 * دریافت تاریخ امروز به وقت محلی کاربر با فرمت YYYY-MM-DD
 */
export function getTodayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * بررسی سال کبیسه شمسی با دقت ۱۰۰٪ بر پایه موتور بومی Intl
 */
export function isPersianLeapYear(jYear: number): boolean {
  // در تقویم هجری شمسی، روز ۳۰ اسفند دقیقاً در حوالی ۱۹ تا ۲۱ مارس میلادی سال (jYear + 622) قرار دارد.
  for (let offset = 19; offset <= 21; offset++) {
    const d = new Date(Date.UTC(jYear + 622, 2, offset, 12, 0, 0));
    const parts = new Intl.DateTimeFormat('en-US-u-ca-persian', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      timeZone: 'UTC',
    }).formatToParts(d);

    const py = parseInt(parts.find((p) => p.type === 'year')?.value || '0', 10);
    const pm = parseInt(parts.find((p) => p.type === 'month')?.value || '0', 10);
    const pd = parseInt(parts.find((p) => p.type === 'day')?.value || '0', 10);

    if (py === jYear && pm === 12 && pd === 30) {
      return true;
    }
  }
  return false;
}

/**
 * تعداد روزهای ماه شمسی با محاسبه سال کبیسه برای اسفند (۳۰ روزه)
 */
export function getPersianMonthDays(jYear: number, jMonth: number): number {
  if (jMonth < 1 || jMonth > 12) return 30;
  if (jMonth <= 6) return 31;
  if (jMonth <= 11) return 30;
  return isPersianLeapYear(jYear) ? 30 : 29;
}

/**
 * تبدیل رشته تاریخ میلادی (YYYY-MM-DD) به اجزای تاریخ شمسی
 */
export function isoToJalali(isoDateStr?: string | null): JalaliDateParts {
  if (!isValidIsoDate(isoDateStr)) {
    return {
      year: 1403,
      month: 1,
      day: 1,
      formatted: '',
      isValid: false,
    };
  }

  try {
    const date = new Date(`${isoDateStr}T12:00:00Z`);
    const parts = new Intl.DateTimeFormat('en-US-u-ca-persian', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      timeZone: 'UTC',
    }).formatToParts(date);

    const year = parseInt(parts.find((p) => p.type === 'year')?.value || '1403', 10);
    const month = parseInt(parts.find((p) => p.type === 'month')?.value || '1', 10);
    const day = parseInt(parts.find((p) => p.type === 'day')?.value || '1', 10);

    const monthName = PERSIAN_MONTH_NAMES[month - 1] || '';
    const formatted = `${day.toLocaleString('fa-IR')} ${monthName} ${year.toLocaleString('fa-IR')}`;

    return { year, month, day, formatted, isValid: true };
  } catch {
    return {
      year: 1403,
      month: 1,
      day: 1,
      formatted: '',
      isValid: false,
    };
  }
}

/**
 * تبدیل دقیق اجزای تقویم شمسی به رشته استاندارد میلادی (YYYY-MM-DD)
 * تصحیح شده برای تمامی روزها و سال‌های کبیسه بدون خطا
 */
export function jalaliToIso(jYear: number, jMonth: number, jDay: number): string {
  // محدودسازی روز به حداکثر روزهای ماه
  const maxDay = getPersianMonthDays(jYear, jMonth);
  const safeDay = Math.max(1, Math.min(jDay, maxDay));

  // تاریخ اولیه در ابتدای سال شمسی در ماه مارس میلادی
  let d = new Date(Date.UTC(jYear + 621, 2, 20, 12, 0, 0));

  // محاسبه فاصله تقریبی روزها از ابتدای سال شمسی
  let targetDays = 0;
  for (let m = 1; m < jMonth; m++) {
    targetDays += m <= 6 ? 31 : 30;
  }
  targetDays += safeDay;

  d = new Date(d.getTime() + (targetDays - 1) * 86400000);

  // حلقه همگرایی دقیق با Intl (حداکثر ۵ تکرار)
  for (let i = 0; i < 5; i++) {
    const parts = new Intl.DateTimeFormat('en-US-u-ca-persian', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      timeZone: 'UTC',
    }).formatToParts(d);

    const py = parseInt(parts.find((p) => p.type === 'year')?.value || '0', 10);
    const pm = parseInt(parts.find((p) => p.type === 'month')?.value || '0', 10);
    const pd = parseInt(parts.find((p) => p.type === 'day')?.value || '0', 10);

    if (py === jYear && pm === jMonth && pd === safeDay) {
      return d.toISOString().split('T')[0];
    }

    let currentDays = 0;
    for (let m = 1; m < pm; m++) {
      currentDays += m <= 6 ? 31 : 30;
    }
    currentDays += pd;

    const diff = (jYear - py) * 365 + (targetDays - currentDays);
    if (diff === 0) {
      d = new Date(d.getTime() + 86400000);
    } else {
      d = new Date(d.getTime() + diff * 86400000);
    }
  }

  return d.toISOString().split('T')[0];
}

/**
 * محاسبه روز هفته برای روز اول یک ماه شمسی
 * مقدار بازگشتی: ۰ برای شنبه تا ۶ برای جمعه
 */
export function getPersianMonthStartWeekday(jYear: number, jMonth: number): number {
  const firstDayIso = jalaliToIso(jYear, jMonth, 1);
  const d = new Date(`${firstDayIso}T12:00:00Z`);
  // در جاوااسکریپت: یکشنبه = ۰، دوشنبه = ۱، ...، شنبه = ۶
  // تبدیل به: شنبه = ۰، یکشنبه = ۱، ...، جمعه = ۶
  return (d.getUTCDay() + 1) % 7;
}

/**
 * مقایسه دو تاریخ ISO (YYYY-MM-DD)
 * خروجی: منفی اگر dateA قبل از dateB باشد، صفر اگر برابر باشند، مثبت اگر dateA بعد از dateB باشد
 */
export function compareIsoDates(dateA: string, dateB: string): number {
  if (dateA === dateB) return 0;
  return dateA < dateB ? -1 : 1;
}

/**
 * نمایش تاریخ شمسی با ارقام فارسی و نام ماه
 */
export function formatPersianDate(isoDateStr?: string | null): string {
  if (!isValidIsoDate(isoDateStr)) return '—';
  const j = isoToJalali(isoDateStr);
  return j.isValid ? j.formatted : '—';
}
