import * as React from 'react';
import Link from 'next/link';
import {
 Phone,
 Copy,
 Calendar,
 Clock,
 Target,
 DollarSign,
 GripVertical,
} from 'lucide-react';
import type { LeadDetail, LeadStatus } from '../types';
import { LEAD_STATUS_LABELS } from '../types';
import { isNewLeadOverdue } from './lead-inbox-mobile-card';
import { formatPersianDate } from '@/lib/persian-date';
import { toPersianDigits } from '@/components/common/timeline';
import { resolveLeadOwner } from '../utils/lead-storage';

export interface KanbanCardProps {
 lead: LeadDetail;
 isDragging?: boolean;
 onDragStart?: (e: React.DragEvent, leadId: string) => void;
 onDragEnd?: () => void;
 onCopyPhone: (e: React.MouseEvent, phone: string) => void;
 onMobileStatusChange?: (leadId: string, newStatus: LeadStatus) => void;
}

const ALL_STATUSES: LeadStatus[] = [
 'new',
 'in_progress',
 'qualified',
 'proposal',
 'won',
 'lost',
];

export function KanbanCard({
 lead,
 isDragging = false,
 onDragStart,
 onDragEnd,
 onCopyPhone,
 onMobileStatusChange,
}: KanbanCardProps) {
 const isOverdueNew = isNewLeadOverdue(lead);

 // بررسی سررسید پیگیری بعدی
 const isFollowUpOverdue =
 lead.nextFollowUpDate &&
 new Date(lead.nextFollowUpDate).getTime() < Date.now();

 return (
 <div
 draggable
 onDragStart={(e) => onDragStart?.(e, lead.id)}
 onDragEnd={onDragEnd}
 dir="rtl"
 className={`group relative rounded-2xl border bg-white p-3.5 shadow-2xs transition-all duration-150 select-none ${
 isDragging
 ? 'opacity-40 scale-95 border-blue-400 rotate-1 shadow-md '
 : 'border-gray-200/90 hover:border-blue-300 hover:shadow-xs cursor-grab active:cursor-grabbing'
 }`}
 >
 {/* ردیف بالا: نام لید و آیکون درگ */}
 <div className="flex items-start justify-between gap-2">
 <Link
 href={`/leads/${lead.id}`}
 onClick={(e) => e.stopPropagation()}
 className="text-xs sm:text-sm font-bold text-gray-900 hover:text-blue-600 truncate flex-1 block"
 >
 {lead.fullName}
 </Link>

 <GripVertical
 size={14}
 className="text-gray-300 group-hover:text-gray-500 shrink-0 transition-colors hidden sm:block"
 aria-hidden="true"
 />
 </div>

 {/* نام کمپین در صورت وجود */}
 {lead.campaignName && (
 <div
 className="mt-1 flex items-center gap-1 text-[11px] text-gray-500 truncate"
 title={lead.campaignName}
 >
 <Target size={11} className="shrink-0 text-gray-400" />
 <span className="truncate">{lead.campaignName}</span>
 </div>
 )}

 {/* هشدار لید جدید بیش از ۲۴ ساعت */}
 {isOverdueNew && (
 <div className="mt-2 flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-bold ">
 <Clock size={11} className="text-amber-600 animate-pulse shrink-0" />
 <span>بیش از ۲۴ ساعت بدون بررسی</span>
 </div>
 )}

 {/* ردیف شماره تماس و عملیات سریع */}
 <div className="mt-2.5 flex items-center justify-between border-t border-gray-100 pt-2 text-[11px] ">
 <span className="font-semibold text-gray-700 " dir="ltr">
 {toPersianDigits(lead.phoneNumber)}
 </span>

 <div className="flex items-center gap-1">
 <button
 type="button"
 onClick={(e) => onCopyPhone(e, lead.phoneNumber)}
 aria-label="کپی شماره تماس"
 title="کپی شماره تماس"
 className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100 transition-colors "
 >
 <Copy size={12} />
 </button>

 <a
 href={`tel:${lead.phoneNumber}`}
 onClick={(e) => e.stopPropagation()}
 aria-label="تماس تلفنی"
 title="تماس مستقیم"
 className="p-1 text-emerald-600 hover:text-emerald-700 rounded hover:bg-emerald-50 transition-colors "
 >
 <Phone size={12} />
 </a>
 </div>
 </div>

 {/* اطلاعات پایین کارت: ارزش معامله و کارشناس / تاریخ پیگیری */}
 <div className="mt-2 space-y-1 text-[11px] text-gray-500 ">
 {/* ارزش تخمینی معامله */}
 {lead.estimatedValue !== undefined && lead.estimatedValue !== null && lead.estimatedValue > 0 && (
 <div className="flex items-center justify-between font-semibold text-emerald-700 ">
 <span className="flex items-center gap-1">
 <DollarSign size={11} className="shrink-0" />
 <span>ارزش:</span>
 </span>
 <span>{toPersianDigits(lead.estimatedValue.toLocaleString('fa-IR'))} تومان</span>
 </div>
 )}

 {/* تاریخ پیگیری بعدی */}
 {lead.nextFollowUpDate && (
 <div
 className={`flex items-center justify-between ${
 isFollowUpOverdue ? 'text-rose-600 font-bold ' : ''
 }`}
 >
 <span className="flex items-center gap-1">
 <Calendar size={11} className="shrink-0" />
 <span>پیگیری:</span>
 </span>
 <span>{formatPersianDate(lead.nextFollowUpDate)}</span>
 </div>
 )}

 {/* کارشناس مسئول بر اساس فیلد مرجع canonical assignedToId */}
 {(() => {
 const owner = resolveLeadOwner(lead);
 if (!owner || !owner.name) return null;
 return (
 <div className="flex items-center justify-between pt-1 border-t border-gray-50 ">
 <span className="text-[10px] text-gray-400">مسئول:</span>
 <div
 className="flex items-center gap-1"
 title={owner.hasConflict ? 'شناسه تخصیص‌یافته با شیء میراثی در تعارض است' : undefined}
 >
 <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[9px] ">
 {owner.name.slice(0, 1)}
 </div>
 <span className="text-[11px] font-medium text-gray-700 truncate max-w-[120px]">
 {owner.name}
 </span>
 </div>
 </div>
 );
 })()}
 </div>

 {/* منوی انتخاب وضعیت در موبایل جهت جابه‌جایی بدون نیاز به Drag & Drop */}
 <div className="mt-2.5 pt-2 border-t border-gray-100 sm:hidden">
 <label className="block text-[10px] text-gray-400 mb-1">
 انتقال به مرحله:
 </label>
 <select
 value={lead.status}
 onChange={(e) => {
 const nextStatus = e.target.value as LeadStatus;
 if (nextStatus !== lead.status) {
 onMobileStatusChange?.(lead.id, nextStatus);
 }
 }}
 onClick={(e) => e.stopPropagation()}
 className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 "
 >
 {ALL_STATUSES.map((s) => (
 <option key={s} value={s}>
 {LEAD_STATUS_LABELS[s]}
 </option>
 ))}
 </select>
 </div>
 </div>
 );
}
