'use client';

import * as React from 'react';
import { History, RefreshCw } from 'lucide-react';
import { Timeline, type TimelineEvent } from '@/components/common/timeline';
import { leadService, leadApi } from '../api';
import { mapLeadEventsToTimeline } from '../utils/lead-timeline-mapper';

export interface LeadJourneyTimelineProps {
 leadId: string;
 refreshTrigger?: number;
 className?: string;
}

export function LeadJourneyTimeline({
 leadId,
 refreshTrigger = 0,
 className = '',
}: LeadJourneyTimelineProps) {
 const [timelineItems, setTimelineItems] = React.useState<TimelineEvent[]>([]);
 const [loading, setLoading] = React.useState<boolean>(true);
 const [error, setError] = React.useState<string | null>(null);

 const loadEvents = React.useCallback(async () => {
 try {
 setLoading(true);
 setError(null);
 let rawEvents: any[] = [];
 try {
  rawEvents = await leadApi.getEvents(leadId);
 } catch {
  rawEvents = await leadService.getEvents(leadId);
 }
 const mapped = mapLeadEventsToTimeline(rawEvents);
 setTimelineItems(mapped);
 } catch (err: unknown) {
 const msg = err instanceof Error ? err.message : 'خطا در دریافت تاریخچه لید';
 setError(msg);
 } finally {
 setLoading(false);
 }
 }, [leadId]);

 React.useEffect(() => {
 loadEvents();
 }, [loadEvents, refreshTrigger]);

 return (
 <div
 className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}
 dir="rtl"
 >
 {/* هدر بخش تاریخچه */}
 <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-3 ">
 <div className="flex items-center gap-2.5">
 <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 ">
 <History className="h-4 w-4" aria-hidden="true" />
 </div>
 <div>
 <h3 className="text-sm font-bold text-slate-900 ">
 خط زمانی و مسیر تعاملات (Lead Journey)
 </h3>
 <p className="text-xs text-slate-500 ">
 رخدادها، تماس‌ها و تغییر وضعیت‌ها از جدید به قدیم
 </p>
 </div>
 </div>

 <button
 type="button"
 onClick={() => loadEvents()}
 disabled={loading}
 className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 "
 title="بارگذاری مجدد خط زمانی"
 >
 <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
 <span>به‌روزرسانی</span>
 </button>
 </div>

 {/* نمایش خطای قابل تلاش مجدد */}
 {error && !loading && timelineItems.length === 0 && (
 <div className="py-6 text-center">
 <p className="text-xs sm:text-sm text-rose-600 mb-3">
 {error}
 </p>
 <button
 type="button"
 onClick={() => loadEvents()}
 className="rounded-lg bg-slate-800 px-3.5 py-1.5 text-xs text-white hover:bg-slate-900 "
 >
 تلاش مجدد
 </button>
 </div>
 )}

 {/* کامپوننت مشترک Timeline */}
 {(!error || timelineItems.length > 0 || loading) && (
 <Timeline
 items={timelineItems}
 loading={loading}
 error={error}
 emptyTitle="رویدادی برای این لید ثبت نشده است"
 emptyDescription="هنوز هیچ تعامل، تماس یا فعالیتی برای این لید در سیستم وجود ندارد."
 variant="default"
 dateMode="relative"
 showDate={true}
 showActor={true}
 />
 )}
 </div>
 );
}
