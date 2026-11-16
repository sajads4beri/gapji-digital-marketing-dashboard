import * as React from 'react';
import { AlertCircle } from 'lucide-react';
import type { TimelineProps } from './types';
import { TimelineItem } from './timeline-item';
import { TimelineEmpty } from './timeline-empty';

/**
 * کامپوننت اسکلتون برای حالت بارگذاری
 */
function TimelineSkeleton({
 variant = 'default',
}: {
 variant?: 'default' | 'compact';
}) {
 const isCompact = variant === 'compact';
 return (
 <div
 role="status"
 aria-busy="true"
 aria-label="در حال بارگذاری رویدادها..."
 className="space-y-1 py-1"
 dir="rtl"
 >
 <span className="sr-only">در حال بارگذاری رویدادها...</span>
 {[1, 2, 3].map((idx, i) => (
 <div key={idx} className="relative flex items-start select-none">
 {i !== 2 && (
 <span
 className={`absolute ${
 isCompact ? 'right-[15px] top-8' : 'right-[19px] top-10'
 } bottom-0 w-[2px] bg-slate-200 `}
 aria-hidden="true"
 />
 )}
 <div
 className={`absolute right-0 top-0 rounded-full bg-slate-200 animate-pulse ${
 isCompact ? 'h-8 w-8' : 'h-10 w-10'
 }`}
 aria-hidden="true"
 />
 <div className={`w-full ${isCompact ? 'ps-11 pb-4' : 'ps-14 pb-6'}`}>
 <div className="flex items-center justify-between gap-4">
 <div className="h-4 w-32 rounded bg-slate-200 animate-pulse" />
 <div className="h-3 w-16 rounded bg-slate-200 animate-pulse" />
 </div>
 <div className="mt-2.5 h-3 w-48 rounded bg-slate-100 animate-pulse" />
 </div>
 </div>
 ))}
 </div>
 );
}

export function Timeline({
 items,
 variant = 'default',
 loading = false,
 error = null,
 emptyTitle,
 emptyDescription,
 emptyIcon,
 showDate = true,
 showActor = true,
 dateMode = 'relative',
 className = '',
}: TimelineProps) {
 // مرتب‌سازی پایدار (Deterministic) بدون تغییر دادن آرایه ورودی (Immutability)
 const sortedItems = React.useMemo(() => {
 if (!items || items.length === 0) return [];

 return items
 .map((item, originalIndex) => ({ item, originalIndex }))
 .sort((a, b) => {
 const timeA = new Date(a.item.timestamp).getTime();
 const timeB = new Date(b.item.timestamp).getTime();

 const validA = !isNaN(timeA);
 const validB = !isNaN(timeB);

 if (validA && validB) {
 // مرتب‌سازی از جدید به قدیم (نزولی)
 if (timeB !== timeA) {
 return timeB - timeA;
 }
 } else if (validA && !validB) {
 return -1;
 } else if (!validA && validB) {
 return 1;
 } else {
 // در صورت غیرقابل پارس بودن تاریخ، مقایسه رشته‌ای نزولی
 const strCmp = (b.item.timestamp || '').localeCompare(a.item.timestamp || '');
 if (strCmp !== 0) return strCmp;
 }

 // حفظ پایداری برای timestampهای یکسان بر اساس اندیس ورودی
 return a.originalIndex - b.originalIndex;
 })
 .map(({ item }) => item);
 }, [items]);

 // ۱. حالت بارگذاری
 if (loading) {
 return <TimelineSkeleton variant={variant} />;
 }

 // ۲. حالت خطا بدون داده
 const hasItems = sortedItems.length > 0;

 return (
 <div className={`w-full ${className}`} dir="rtl">
 {/* بنر خطا (در صورت وجود خطا، نمایش داده می‌شود بدون اینکه در صورت وجود آیتم‌ها مانع رندر شود) */}
 {error && (
 <div
 role="alert"
 className="mb-4 flex items-center gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs sm:text-sm text-rose-800 "
 >
 <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 " aria-hidden="true" />
 <span>{error}</span>
 </div>
 )}

 {/* ۳. حالت خالی */}
 {!hasItems && !error && (
 <TimelineEmpty
 title={emptyTitle}
 description={emptyDescription}
 icon={emptyIcon}
 />
 )}

 {/* ۴. رندر لیست رویدادها */}
 {hasItems && (
 <ol className="relative m-0 p-0 list-none" role="list">
 {sortedItems.map((event, index) => (
 <TimelineItem
 key={event.id}
 event={event}
 isLast={index === sortedItems.length - 1}
 variant={variant}
 showDate={showDate}
 showActor={showActor}
 dateMode={dateMode}
 />
 ))}
 </ol>
 )}
 </div>
 );
}
