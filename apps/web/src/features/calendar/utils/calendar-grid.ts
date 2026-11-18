import {
  getPersianMonthDays,
  getPersianMonthStartWeekday,
  jalaliToIso,
  isoToJalali,
  getTodayIsoDate,
  isValidIsoDate,
} from '@/lib/persian-date';
import { CalendarDayCell, CalendarEvent, CalendarEventType } from '../types';
import { getPersianHoliday } from '../constants';

/**
 * بررسی اینکه آیا تاریخ مشخصی در بازه زمانی رویداد قرار دارد یا خیر
 */
export function isEventOnDate(event: CalendarEvent, dateIso: string): boolean {
  const eventStart = (event.startDate || '').slice(0, 10);
  const eventEnd = (event.endDate || event.startDate || '').slice(0, 10);
  const target = dateIso.slice(0, 10);

  return target >= eventStart && target <= eventEnd;
}

/**
 * ساخت شبکه کامل تقویم ماه شمسی (از شنبه تا جمعه)
 * شامل روزهای ماه قبل و ماه بعد جهت تکمیل شبکه‌های ۳۵ یا ۴۲ خانه‌ای
 */
export function buildJalaliMonthGrid(
  jYear: number,
  jMonth: number,
  events: CalendarEvent[] = []
): CalendarDayCell[] {
  const daysInCurrentMonth = getPersianMonthDays(jYear, jMonth);
  const startWeekday = getPersianMonthStartWeekday(jYear, jMonth); // 0 = شنبه, ..., 6 = جمعه
  const todayIso = getTodayIsoDate();

  const cells: CalendarDayCell[] = [];

  // ۱. محاسبه روزهای تکمیلی ماه قبل (Leading Days)
  if (startWeekday > 0) {
    const prevMonth = jMonth === 1 ? 12 : jMonth - 1;
    const prevYear = jMonth === 1 ? jYear - 1 : jYear;
    const daysInPrevMonth = getPersianMonthDays(prevYear, prevMonth);

    for (let i = startWeekday - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const dateIso = jalaliToIso(prevYear, prevMonth, dayNum);
      const dayOfWeek = (startWeekday - 1 - i) % 7;
      const isFriday = dayOfWeek === 6;
      const holiday = getPersianHoliday(prevMonth, dayNum);

      cells.push({
        dateIso,
        jalaliYear: prevYear,
        jalaliMonth: prevMonth,
        jalaliDay: dayNum,
        dayOfWeek,
        isCurrentMonth: false,
        isToday: dateIso === todayIso,
        isFriday,
        holiday,
        events: events.filter((e) => isEventOnDate(e, dateIso)),
      });
    }
  }

  // ۲. افزودن تمام روزهای ماه جاری (Current Month Days)
  for (let dayNum = 1; dayNum <= daysInCurrentMonth; dayNum++) {
    const dateIso = jalaliToIso(jYear, jMonth, dayNum);
    const dayOfWeek = (startWeekday + dayNum - 1) % 7;
    const isFriday = dayOfWeek === 6;
    const holiday = getPersianHoliday(jMonth, dayNum);

    cells.push({
      dateIso,
      jalaliYear: jYear,
      jalaliMonth: jMonth,
      jalaliDay: dayNum,
      dayOfWeek,
      isCurrentMonth: true,
      isToday: dateIso === todayIso,
      isFriday,
      holiday,
      events: events.filter((e) => isEventOnDate(e, dateIso)),
    });
  }

  // ۳. محاسبه روزهای تکمیلی ماه بعد (Trailing Days) تا شبکه مضربی از ۷ شود (۳۵ یا ۴۲ خانه)
  const remainder = cells.length % 7;
  if (remainder > 0) {
    const daysToAdd = 7 - remainder;
    const nextMonth = jMonth === 12 ? 1 : jMonth + 1;
    const nextYear = jMonth === 12 ? jYear + 1 : jYear;

    for (let dayNum = 1; dayNum <= daysToAdd; dayNum++) {
      const dateIso = jalaliToIso(nextYear, nextMonth, dayNum);
      const dayOfWeek = (cells.length) % 7;
      const isFriday = dayOfWeek === 6;
      const holiday = getPersianHoliday(nextMonth, dayNum);

      cells.push({
        dateIso,
        jalaliYear: nextYear,
        jalaliMonth: nextMonth,
        jalaliDay: dayNum,
        dayOfWeek,
        isCurrentMonth: false,
        isToday: dateIso === todayIso,
        isFriday,
        holiday,
        events: events.filter((e) => isEventOnDate(e, dateIso)),
      });
    }
  }

  return cells;
}

/**
 * ساخت شبکه ۷ روزه هفته شمسی بر اساس یک تاریخ مشخص
 * همیشه از شنبه تا جمعه شروع می‌شود
 */
export function buildJalaliWeekGrid(
  anchorIsoDate: string,
  events: CalendarEvent[] = []
): CalendarDayCell[] {
  const safeDate = isValidIsoDate(anchorIsoDate) ? anchorIsoDate : getTodayIsoDate();
  const jalali = isoToJalali(safeDate);
  const todayIso = getTodayIsoDate();

  // پیدا کردن روز هفته تاریخ مرجع (۰ = شنبه تا ۶ = جمعه)
  const anchorDateObj = new Date(`${safeDate}T12:00:00Z`);
  const anchorWeekday = (anchorDateObj.getUTCDay() + 1) % 7;

  // محاسبه تاریخ شنبه این هفته
  const saturdayTimestamp = anchorDateObj.getTime() - anchorWeekday * 86400000;
  const cells: CalendarDayCell[] = [];

  for (let offset = 0; offset < 7; offset++) {
    const dayDate = new Date(saturdayTimestamp + offset * 86400000);
    const dateIso = dayDate.toISOString().split('T')[0];
    const jParts = isoToJalali(dateIso);
    const dayOfWeek = offset;
    const isFriday = dayOfWeek === 6;
    const holiday = getPersianHoliday(jParts.month, jParts.day);

    cells.push({
      dateIso,
      jalaliYear: jParts.year,
      jalaliMonth: jParts.month,
      jalaliDay: jParts.day,
      dayOfWeek,
      isCurrentMonth: jParts.month === jalali.month,
      isToday: dateIso === todayIso,
      isFriday,
      holiday,
      events: events.filter((e) => isEventOnDate(e, dateIso)),
    });
  }

  return cells;
}

/**
 * فیلتر کردن رویدادها بر اساس انواع انتخاب‌شده
 */
export function filterEventsByType(
  events: CalendarEvent[],
  selectedTypes?: CalendarEventType[]
): CalendarEvent[] {
  if (!selectedTypes || selectedTypes.length === 0) return events;
  return events.filter((e) => selectedTypes.includes(e.eventType));
}
