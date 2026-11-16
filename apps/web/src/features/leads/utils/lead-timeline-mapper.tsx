import * as React from 'react';
import {
 MousePointer,
 Globe,
 FileText,
 UserCheck,
 Phone,
 StickyNote,
 RefreshCw,
 Send,
 Trophy,
 XCircle,
} from 'lucide-react';
import type { LeadEvent } from '../types';
import { LEAD_STATUS_LABELS, CALL_RESULT_LABELS } from '../types';
import type { TimelineEvent, TimelineItemVariant } from '@/components/common/timeline';
import { toPersianDigits } from '@/components/common/timeline';

/**
 * قالب‌بندی مدت زمان مکالمه به فارسی
 */
function formatCallDuration(seconds?: number): string {
 if (!seconds || seconds <= 0) return '۰ ثانیه';
 const mins = Math.floor(seconds / 60);
 const secs = seconds % 60;
 if (mins > 0 && secs > 0) {
 return `${toPersianDigits(mins)} دقیقه و ${toPersianDigits(secs)} ثانیه`;
 }
 if (mins > 0) {
 return `${toPersianDigits(mins)} دقیقه`;
 }
 return `${toPersianDigits(secs)} ثانیه`;
}

/**
 * قالب‌بندی مبلغ به تومان با ارقام فارسی
 */
function formatAmount(amount?: number): string {
 if (amount === undefined || amount === null) return '';
 return `${toPersianDigits(amount.toLocaleString('fa-IR'))} تومان`;
}

/**
 * تبدیل رویداد خام LeadEvent به مدل نمایشی TimelineEvent
 */
export function mapLeadEventToTimelineEvent(event: LeadEvent): TimelineEvent {
 let icon: React.ComponentType<{ className?: string }> = FileText;
 let variant: TimelineItemVariant = 'default';

 switch (event.type) {
 case 'ad_click':
 icon = MousePointer;
 variant = 'neutral';
 break;

 case 'landing_visit':
 icon = Globe;
 variant = 'neutral';
 break;

 case 'form_submit':
 icon = FileText;
 variant = 'neutral';
 break;

 case 'assigned':
 icon = UserCheck;
 variant = 'info';
 break;

 case 'call':
 icon = Phone;
 variant =
 event.metadata?.callResult === 'answered' ? 'success' : 'warning';
 break;

 case 'note':
 icon = StickyNote;
 variant = 'info';
 break;

 case 'status_change':
 icon = RefreshCw;
 variant = 'info';
 break;

 case 'proposal_sent':
 icon = Send;
 variant = 'info';
 break;

 case 'deal_won':
 icon = Trophy;
 variant = 'success';
 break;

 case 'deal_lost':
 icon = XCircle;
 variant = 'danger';
 break;

 default:
 icon = FileText;
 variant = event.actorType === 'system' ? 'neutral' : 'info';
 break;
 }

 // ساخت بدنه توضیحات متناسب با متادیتا و یادداشت رویداد
 const descriptionElements: React.ReactNode[] = [];

 // ۱. اطلاعات تماس تلفنی
 if (event.type === 'call' && event.metadata) {
 const resultLabel = event.metadata.callResult
 ? CALL_RESULT_LABELS[event.metadata.callResult] || event.metadata.callResult
 : null;
 const durationText = formatCallDuration(event.metadata.callDurationSeconds);

 descriptionElements.push(
 <div key="call-info" className="flex flex-wrap items-center gap-x-3 gap-y-1 font-medium text-xs">
 {resultLabel && (
 <span className="text-slate-700 ">
 نتیجه: <strong className="font-semibold text-slate-900 ">{resultLabel}</strong>
 </span>
 )}
 <span className="text-slate-500 ">
 مدت مکالمه: {durationText}
 </span>
 </div>
 );
 }

 // ۲. اطلاعات تغییر وضعیت
 if (event.type === 'status_change' && event.metadata) {
  const fromStatus = event.metadata.fromStatus;
  const toStatus = event.metadata.toStatus;
  const fromLabel: string | null = (typeof event.metadata.fromStatusLabel === 'string' && event.metadata.fromStatusLabel)
   ? event.metadata.fromStatusLabel
   : fromStatus
   ? ((LEAD_STATUS_LABELS as Record<string, string>)[String(fromStatus)] || String(fromStatus))
   : null;
  const toLabel: string | null = (typeof event.metadata.toStatusLabel === 'string' && event.metadata.toStatusLabel)
   ? event.metadata.toStatusLabel
   : toStatus
   ? ((LEAD_STATUS_LABELS as Record<string, string>)[String(toStatus)] || String(toStatus))
   : null;

  if (fromLabel && toLabel) {
  descriptionElements.push(
  <div key="status-change" className="text-xs text-slate-600 ">
  تغییر از «{fromLabel}» به «{toLabel}»
  </div>
  );
  }
 }

 // ۳. اطلاعات پیش‌فاکتور / پیشنهاد
 if (event.type === 'proposal_sent' && event.metadata) {
 const { proposalTitle, proposalAmount } = event.metadata;
 descriptionElements.push(
 <div key="proposal-info" className="flex flex-wrap items-center gap-x-2 text-xs">
 {proposalTitle && <span>{proposalTitle}</span>}
 {proposalAmount !== undefined && (
 <span className="font-semibold text-emerald-600 ">
 مبلغ: {formatAmount(proposalAmount)}
 </span>
 )}
 </div>
 );
 }

 // ۴. خرید موفق
 if (
 (event.type === 'deal_won' ||
 (event.type === 'status_change' && event.metadata?.toStatus === 'won')) &&
 event.metadata?.dealValue
 ) {
 descriptionElements.push(
 <div key="deal-won" className="text-xs font-semibold text-emerald-600 ">
 ارزش معامله: {formatAmount(event.metadata.dealValue)}
 </div>
 );
 }

 // ۵. انصراف / رد پیشنهاد
 if (
 (event.type === 'deal_lost' ||
 (event.type === 'status_change' && event.metadata?.toStatus === 'lost')) &&
 event.metadata?.lostReason
 ) {
 descriptionElements.push(
 <div key="deal-lost" className="text-xs text-rose-600 ">
 دلیل انصراف: {event.metadata.lostReason}
 </div>
 );
 }

 // ۶. پارامترهای UTM در کلیک یا ورود
 if ((event.type === 'ad_click' || event.type === 'landing_visit') && event.metadata) {
 const { utmSource, utmMedium, utmCampaign } = event.metadata;
 const utmParts: string[] = [];
 if (utmSource) utmParts.push(`منبع: ${utmSource}`);
 if (utmMedium) utmParts.push(`رسانه: ${utmMedium}`);
 if (utmCampaign) utmParts.push(`کمپین: ${utmCampaign}`);

 if (utmParts.length > 0) {
 descriptionElements.push(
 <div key="utm" className="text-[11px] text-slate-500 font-mono" dir="ltr">
 {utmParts.join(' | ')}
 </div>
 );
 }
 }

 // ۷. متن یادداشت همراه رویداد
 if (event.note) {
 descriptionElements.push(
 <div key="note" className="mt-1 text-slate-600 ">
 {event.note}
 </div>
 );
 }

 const finalDescription =
 descriptionElements.length > 0 ? (
 <div className="space-y-1">{descriptionElements}</div>
 ) : undefined;

 return {
 id: event.id,
 title: event.title,
 timestamp: event.timestamp,
 actorType: event.actorType,
 actor: event.actor
 ? {
 name: event.actor.name,
 role: event.actor.role,
 avatarUrl: event.actor.avatarUrl,
 }
 : undefined,
 description: finalDescription,
 icon,
 variant,
 };
}

/**
 * تبدیل دسته‌ای لیست رویدادهای خام لید به TimelineEvent
 */
export function mapLeadEventsToTimeline(events: LeadEvent[]): TimelineEvent[] {
 if (!events || !Array.isArray(events)) return [];
 return events.map(mapLeadEventToTimelineEvent);
}
