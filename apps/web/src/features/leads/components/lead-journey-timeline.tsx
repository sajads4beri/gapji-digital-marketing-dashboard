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
      className={`rounded-2xl border border-[#1F2E45] bg-[#111D2E]/80 backdrop-blur-md p-5 shadow-xl text-slate-200 ${className}`}
      dir="rtl"
    >
      {/* هدر بخش تاریخچه */}
      <div className="mb-5 flex items-center justify-between border-b border-[#1F2E45] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#18263A] text-[#719BDF] border border-[#1F2E45]">
            <History className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 font-display">
              خط زمانی و مسیر تعاملات (Lead Journey)
            </h3>
            <p className="text-xs text-slate-400">
              رخدادها، تماس‌ها و تغییر وضعیت‌ها از جدید به قدیم
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => loadEvents()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#1F2E45] bg-[#18263A] px-2.5 py-1 text-xs text-slate-300 transition-colors hover:text-white hover:bg-[#1F2E45] disabled:opacity-50"
          title="بارگذاری مجدد خط زمانی"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          <span>به‌روزرسانی</span>
        </button>
      </div>

      {/* نمایش خطای قابل تلاش مجدد */}
      {error && !loading && timelineItems.length === 0 && (
        <div className="py-6 text-center">
          <p className="text-xs sm:text-sm text-[#D66B73] mb-3">
            {error}
          </p>
          <button
            type="button"
            onClick={() => loadEvents()}
            className="rounded-lg bg-[#18263A] border border-[#1F2E45] px-3.5 py-1.5 text-xs text-slate-200 hover:text-white"
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
