import type { Task, TaskGroup, TaskGroupKey, TaskStatus } from '../types';

/**
 * تبدیل اعداد انگلیسی به فارسی برای متن‌های نمایشی
 */
export function toPersianDigits(num: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(num).replace(/[0-9]/g, (w) => persianDigits[parseInt(w, 10)]);
}

/**
 * تبدیل رشته یا آبجکت تاریخ به ابتدای روز تقویمی محلی (۰۰:۰۰:۰۰.۰۰۰)
 * جهت مقایسه‌های دقیق روزانه فارغ از تفاوت ساعت‌ها و Timezone
 */
export function toStartOfDay(dateInput: Date | string): Date {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : new Date(dateInput.getTime());
  if (isNaN(d.getTime())) {
    return new Date(NaN);
  }
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

/**
 * تبدیل رشته یا آبجکت تاریخ به انتهای روز تقویمی محلی (۲۳:۵۹:۵۹.۹۹۹)
 */
export function toEndOfDay(dateInput: Date | string): Date {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : new Date(dateInput.getTime());
  if (isNaN(d.getTime())) {
    return new Date(NaN);
  }
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

/**
 * محاسبه محدوده هفته جاری مطابق تقویم رسمی ایران (شنبه تا جمعه)
 */
export function getIranianWeekRange(refDateInput: Date | string = new Date()): {
  startOfWeek: Date;
  endOfWeek: Date;
} {
  const ref = typeof refDateInput === 'string' ? new Date(refDateInput) : refDateInput;
  const d = isNaN(ref.getTime()) ? new Date() : ref;

  // در جاوااسکریپت: 0=یکشنبه, 1=دوشنبه, ..., 5=جمعه, 6=شنبه
  // فاصله روزها تا شنبه قبلی:
  // شنبه (6) -> 0
  // یکشنبه (0) -> 1
  // دوشنبه (1) -> 2
  // ...
  // جمعه (5) -> 6
  const daysSinceSaturday = (d.getDay() + 1) % 7;

  const startOfWeek = new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate() - daysSinceSaturday,
    0,
    0,
    0,
    0
  );
  const endOfWeek = new Date(
    startOfWeek.getFullYear(),
    startOfWeek.getMonth(),
    startOfWeek.getDate() + 6,
    23,
    59,
    59,
    999
  );

  return { startOfWeek, endOfWeek };
}

/**
 * آیا تسک مشخص‌شده عقب‌افتاده است؟
 * تسک زمانی عقب‌افتاده محسوب می‌شود که:
 * ۱. وضعیت آن 'done' نباشد.
 * ۲. تاریخ سررسید آن قبل از ابتدای روز تاریخ مرجع باشد.
 */
export function isTaskOverdue(task: Task, referenceDateInput: Date | string = new Date()): boolean {
  if (task.status === 'done') return false;
  if (!task.dueDate) return false;

  const dueDay = toStartOfDay(task.dueDate);
  const refDay = toStartOfDay(referenceDateInput);

  if (isNaN(dueDay.getTime()) || isNaN(refDay.getTime())) {
    return false;
  }

  return dueDay.getTime() < refDay.getTime();
}

/**
 * محاسبه تعداد روزهای تأخیر تسک
 * در صورت عدم تأخیر، عدد ۰ برمی‌گرداند.
 */
export function getOverdueDays(task: Task, referenceDateInput: Date | string = new Date()): number {
  if (!isTaskOverdue(task, referenceDateInput)) return 0;

  const dueDay = toStartOfDay(task.dueDate);
  const refDay = toStartOfDay(referenceDateInput);

  const diffMs = refDay.getTime() - dueDay.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
}

/**
 * تولید متن برچسب تأخیر مطابق سند (مانند: «۲ روز تأخیر»)
 */
export function formatOverdueBadgeText(days: number): string {
  if (days <= 0) return '';
  return `${toPersianDigits(days)} روز تأخیر`;
}

/**
 * محاسبه وضعیت نمایشی تسک
 * در صورت عقب‌افتادگی وضعیت 'overdue' و در غیر این صورت وضعیت اصلی بازگردانده می‌شود.
 */
export function computeTaskDisplayStatus(
  task: Task,
  referenceDateInput: Date | string = new Date()
): TaskStatus {
  if (task.status === 'done') return 'done';
  if (isTaskOverdue(task, referenceDateInput)) return 'overdue';
  return task.status;
}

/**
 * گروه‌بندی تسک‌ها در ۵ دسته زمانی تعریف‌شده در سند:
 * ۱. عقب‌افتاده (overdue)
 * ۲. امروز (today)
 * ۳. این هفته (this_week)
 * ۴. بعداً (later)
 * ۵. انجام‌شده (completed)
 *
 * گروه‌های خالی دارای isEmpty: true خواهند بود تا UI بتواند آنها را پنهان کند.
 */
export function groupTasks(
  tasks: Task[],
  referenceDateInput: Date | string = new Date()
): TaskGroup[] {
  const ref = typeof referenceDateInput === 'string' ? new Date(referenceDateInput) : referenceDateInput;
  const startOfToday = toStartOfDay(ref);
  const endOfToday = toEndOfDay(ref);
  const { endOfWeek } = getIranianWeekRange(ref);

  const groupsMap: Record<TaskGroupKey, Task[]> = {
    overdue: [],
    today: [],
    this_week: [],
    later: [],
    completed: [],
  };

  for (const task of tasks) {
    // تسک‌های تکمیل‌شده همیشه در گروه انجام‌شده قرار می‌گیرند
    if (task.status === 'done') {
      groupsMap.completed.push(task);
      continue;
    }

    const dueDay = toStartOfDay(task.dueDate);

    if (isNaN(dueDay.getTime())) {
      // در صورت نبود یا نامعتبر بودن تاریخ، به گروه بعداً می‌رود
      groupsMap.later.push(task);
      continue;
    }

    if (dueDay.getTime() < startOfToday.getTime()) {
      // سررسید گذشته است
      groupsMap.overdue.push(task);
    } else if (dueDay.getTime() === startOfToday.getTime()) {
      // سررسید امروز است
      groupsMap.today.push(task);
    } else if (dueDay.getTime() <= endOfWeek.getTime()) {
      // سررسید پس از امروز و تا پایان هفته جاری (جمعه) است
      groupsMap.this_week.push(task);
    } else {
      // سررسید بعد از هفته جاری است
      groupsMap.later.push(task);
    }
  }

  const groupConfigs: Array<{ key: TaskGroupKey; label: string }> = [
    { key: 'overdue', label: 'عقب‌افتاده' },
    { key: 'today', label: 'امروز' },
    { key: 'this_week', label: 'این هفته' },
    { key: 'later', label: 'بعداً' },
    { key: 'completed', label: 'انجام‌شده' },
  ];

  return groupConfigs.map(({ key, label }) => {
    const list = groupsMap[key];
    return {
      key,
      label,
      tasks: list,
      count: list.length,
      isEmpty: list.length === 0,
    };
  });
}
