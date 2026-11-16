import * as React from 'react';
import { User, Cpu } from 'lucide-react';
import type { TimelineItemProps, TimelineItemVariant } from './types';
import { formatTimelineTimestamp } from './timeline-date';

/**
 * تعیین کلاس‌های رنگی نشانگر رویداد بر اساس نوع و سبک
 */
function getMarkerClasses(
 variant: TimelineItemVariant = 'default',
 actorType: 'user' | 'system'
): string {
 if (variant === 'neutral' || (variant === 'default' && actorType === 'system')) {
 return 'bg-slate-100 text-slate-600 border-slate-200 ';
 }
 if (variant === 'info' || (variant === 'default' && actorType === 'user')) {
 return 'bg-blue-50 text-blue-600 border-blue-200 ';
 }
 if (variant === 'success') {
 return 'bg-emerald-50 text-emerald-600 border-emerald-200 ';
 }
 if (variant === 'warning') {
 return 'bg-amber-50 text-amber-600 border-amber-200 ';
 }
 if (variant === 'danger') {
 return 'bg-rose-50 text-rose-600 border-rose-200 ';
 }
 return 'bg-slate-100 text-slate-600 border-slate-200 ';
}

/**
 * استخراج حروف اول نام کاربر برای آواتار متنی با مدیریت نام‌های خالی یا فاصله‌دار
 */
function getInitials(name?: string): string {
 if (!name) return '';
 const trimmed = name.trim();
 if (!trimmed) return '';
 const parts = trimmed.split(/\s+/);
 if (parts.length === 1 && parts[0]) {
 return parts[0].slice(0, 2);
 }
 if (parts.length >= 2 && parts[0] && parts[1]) {
 return `${parts[0][0]}${parts[1][0]}`;
 }
 return trimmed.slice(0, 2);
}

export function TimelineItem({
 event,
 isLast,
 variant = 'default',
 showDate = true,
 showActor = true,
 dateMode = 'relative',
 className = '',
}: TimelineItemProps) {
 const [imageError, setImageError] = React.useState(false);
 const isCompact = variant === 'compact';

 // بازنشانی وضعیت خطای تصویر در صورت تغییر آدرس آواتار
 React.useEffect(() => {
 setImageError(false);
 }, [event.actor?.avatarUrl]);

 const markerColorClasses = getMarkerClasses(event.variant, event.actorType);
 const formattedTime = formatTimelineTimestamp(event.timestamp, dateMode);
 const trimmedActorName = event.actor?.name?.trim();

 // رندر آیکون یا نشانگر متناسب با نوع عامل
 const renderMarkerContent = () => {
 // ۱. اگر رویداد کاربر دارای تصویر آواتار باشد و خطا نداده باشد
 if (event.actorType === 'user' && event.actor?.avatarUrl && !imageError) {
 return (
 <img
 src={event.actor.avatarUrl}
 alt={trimmedActorName || 'آواتار کاربر'}
 onError={() => setImageError(true)}
 className="h-full w-full rounded-full object-cover"
 />
 );
 }

 // ۲. اگر آیکون اختصاصی پاس داده شده باشد
 if (event.icon) {
 if (React.isValidElement(event.icon)) {
 return event.icon;
 }
 if (typeof event.icon === 'function') {
 const IconComponent = event.icon as React.ComponentType<{
 className?: string;
 'aria-hidden'?: boolean | 'true' | 'false';
 }>;
 return (
 <IconComponent
 className={isCompact ? 'h-3.5 w-3.5' : 'h-4 w-4'}
 aria-hidden="true"
 />
 );
 }
 }

 // ۳. اگر کاربر باشد و نام معتبر داشته باشد، حروف اول نام نمایش داده شود
 if (event.actorType === 'user' && trimmedActorName) {
 const initials = getInitials(trimmedActorName);
 if (initials) {
 return (
 <span className="text-[11px] font-bold text-current select-none" aria-hidden="true">
 {initials}
 </span>
 );
 }
 return <User className={isCompact ? 'h-3.5 w-3.5' : 'h-4 w-4'} aria-hidden="true" />;
 }

 // ۴. اگر رویداد سیستم باشد
 if (event.actorType === 'system') {
 return <Cpu className={isCompact ? 'h-3.5 w-3.5' : 'h-4 w-4'} aria-hidden="true" />;
 }

 // پیش‌فرض برای رویدادهای کاربر بدون نام
 return <User className={isCompact ? 'h-3.5 w-3.5' : 'h-4 w-4'} aria-hidden="true" />;
 };

 return (
 <li
 className={`relative select-text ${isCompact ? 'pb-4' : 'pb-6'} ${
 isLast ? '!pb-0' : ''
 } ${className}`}
 role="listitem"
 >
 {/* خط عمودی اتصال (در صورت عدم بودن آخرین آیتم) */}
 {!isLast && (
 <span
 className={`absolute ${
 isCompact ? 'right-[15px] top-8' : 'right-[19px] top-10'
 } bottom-0 w-[2px] bg-slate-200 transition-colors`}
 aria-hidden="true"
 />
 )}

 {/* دایره نشانگر / آیکون / آواتار */}
 <div
 className={`absolute right-0 top-0 flex items-center justify-center rounded-full border shadow-sm ${markerColorClasses} ${
 isCompact ? 'h-8 w-8' : 'h-10 w-10'
 }`}
 >
 {renderMarkerContent()}
 </div>

 {/* بدنه محتوای رویداد */}
 <div className={`min-w-0 ${isCompact ? 'ps-11' : 'ps-14'}`}>
 {/* عنوان و زمان رویداد */}
 <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
 <h4
 className={`font-semibold text-slate-900 break-words ${
 isCompact ? 'text-xs' : 'text-sm'
 }`}
 >
 <span className="sr-only">
 {event.actorType === 'system' ? 'رویداد سیستم: ' : 'رویداد کاربر: '}
 </span>
 {event.title}
 </h4>

 {showDate && (
 <time
 dateTime={event.timestamp}
 className="text-xs text-slate-500 font-normal shrink-0"
 title={event.timestamp}
 >
 {formattedTime}
 </time>
 )}
 </div>

 {/* مشخصات عامل رویداد (کاربر) */}
 {showActor && event.actorType === 'user' && trimmedActorName && (
 <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 break-words">
 <span className="font-medium text-slate-700 ">
 {trimmedActorName}
 </span>
 {event.actor?.role && (
 <span className="text-slate-400 ">
 ({event.actor.role})
 </span>
 )}
 </div>
 )}

 {/* توضیحات رویداد */}
 {event.description && (
 <div
 className={`mt-1.5 leading-relaxed text-slate-600 break-words whitespace-pre-line ${
 isCompact ? 'text-xs' : 'text-xs sm:text-sm'
 }`}
 >
 {event.description}
 </div>
 )}
 </div>
 </li>
 );
}
