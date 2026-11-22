import type * as React from 'react';

/**
 * نوع عامل رویداد: کاربر یا سیستم
 */
export type TimelineActorType = 'user' | 'system';

/**
 * سبک نمایش کلی کامپوننت Timeline
 */
export type TimelineVariant = 'default' | 'compact';

/**
 * سبک یا رنگ‌بندی بصری نشانگر آیتم
 */
export type TimelineItemVariant =
  | 'default'
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger';

/**
 * مشخصات کاربر ایجادکننده رویداد
 */
export interface TimelineActor {
  name?: string;
  avatarUrl?: string;
  role?: string;
}

/**
 * ساختار داده‌ای استاندارد هر رویداد در خط زمانی (Timeline)
 */
export interface TimelineEvent {
  /**
   * شناسه یکتای رویداد
   */
  id: string;

  /**
   * عنوان رویداد (مثلاً «ثبت تماس با لید»، «تغییر وضعیت کمپین»)
   */
  title: string;

  /**
   * زمان وقوع رویداد به صورت رشته استاندارد ISO
   * مثال: "2026-11-02T10:30:00Z" یا "2026-11-02"
   */
  timestamp: string;

  /**
   * نوع ایجادکننده: کاربر یا سیستم
   * در صورت 'system'، فیلد actor اختیاری است و با رنگ خنثی نمایش داده می‌شود.
   */
  actorType: TimelineActorType;

  /**
   * اطلاعات کاربر عامل (در صورت وجود)
   */
  actor?: TimelineActor;

  /**
   * توضیحات تکمیلی یا متن پیام رویداد
   */
  description?: React.ReactNode;

  /**
   * آیکون رویداد (کامپوننت آیکون Lucide یا المان React)
   */
  icon?: React.ComponentType<{ className?: string }> | React.ReactNode;

  /**
   * سبک بصری رنگ‌بندی نشانگر
   */
  variant?: TimelineItemVariant;
}

/**
 * نحوه قالب‌بندی زمان در خط زمانی
 * - relative: نمایش «امروز»، «دیروز» برای تاریخ‌های نزدیک همراه ساعت، و تاریخ شمسی برای سایر روزها
 * - full: نمایش تاریخ کامل شمسی به همراه ساعت
 * - short: نمایش تاریخ کوتاه شمسی عددی (۱۴۰۵/۰۸/۰۷)
 */
export type TimelineDateMode = 'relative' | 'full' | 'short';

/**
 * پراپ‌های کامپوننت اصلی Timeline
 */
export interface TimelineProps {
  /**
   * لیست رویدادها (پشتیبانی از آرایه‌های readonly و بدون mutate شدن)
   */
  items: readonly TimelineEvent[];

  /**
   * نوع تراکم چیدمان: پیش‌فرض یا فشرده
   * @default 'default'
   */
  variant?: TimelineVariant;

  /**
   * وضعیت بارگذاری (نمایش اسکلتون متحرک)
   */
  loading?: boolean;

  /**
   * پیام خطا در صورت بروز خطا در دریافت رویدادها
   */
  error?: string | null;

  /**
   * عنوان حالت خالی در صورت نبود داده
   */
  emptyTitle?: string;

  /**
   * توضیحات حالت خالی
   */
  emptyDescription?: string;

  /**
   * آیکون سفارشی حالت خالی
   */
  emptyIcon?: React.ReactNode;

  /**
   * کنترل نمایش تاریخ و زمان رویدادها
   * @default true
   */
  showDate?: boolean;

  /**
   * کنترل نمایش نام و اطلاعات عامل رویداد
   * @default true
   */
  showActor?: boolean;

  /**
   * شیوه قالب‌بندی زمان
   * @default 'relative'
   */
  dateMode?: TimelineDateMode;

  /**
   * کلاس‌های CSS دلخواه برای تگ اصلی
   */
  className?: string;
}

/**
 * پراپ‌های کامپوننت فرزند TimelineItem
 */
export interface TimelineItemProps {
  /**
   * آبجکت رویداد برای نمایش
   */
  event: TimelineEvent;

  /**
   * آیا این آخرین آیتم لیست است؟ (برای قطع خط اتصال عمودی)
   */
  isLast: boolean;

  /**
   * نوع تراکم چیدمان
   * @default 'default'
   */
  variant?: TimelineVariant;

  /**
   * کنترل نمایش تاریخ و زمان
   * @default true
   */
  showDate?: boolean;

  /**
   * کنترل نمایش عامل
   * @default true
   */
  showActor?: boolean;

  /**
   * شیوه نمایش تاریخ
   * @default 'relative'
   */
  dateMode?: TimelineDateMode;

  /**
   * کلاس‌های CSS تکمیلی
   */
  className?: string;
}
