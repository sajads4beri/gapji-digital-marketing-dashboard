import * as React from 'react';
import type { LeadDetail, LeadStatus } from '../types';
import { LEAD_STATUS_LABELS } from '../types';
import { KanbanCard } from './kanban-card';
import { toPersianDigits } from '@/components/common/timeline';

export interface KanbanColumnProps {
 status: LeadStatus;
 leads: LeadDetail[];
 isDragOver?: boolean;
 draggingLeadId?: string | null;
 onDragStart?: (e: React.DragEvent, leadId: string) => void;
 onDragEnd?: () => void;
 onDragOver?: (status: LeadStatus) => void;
 onDragLeave?: () => void;
 onDrop?: (leadId: string, targetStatus: LeadStatus) => void;
 onCopyPhone: (e: React.MouseEvent, phone: string) => void;
 onMobileStatusChange?: (leadId: string, newStatus: LeadStatus) => void;
}

// نگاشت استایل رنگی نشان وضعیت ستون‌ها
const statusHeaderColors: Record<LeadStatus, { dot: string; border: string; bg: string }> = {
 new: { dot: 'bg-blue-500', border: 'border-t-blue-500', bg: 'bg-blue-50/50 ' },
 in_progress: { dot: 'bg-indigo-500', border: 'border-t-indigo-500', bg: 'bg-indigo-50/50 ' },
 qualified: { dot: 'bg-purple-500', border: 'border-t-purple-500', bg: 'bg-purple-50/50 ' },
 proposal: { dot: 'bg-amber-500', border: 'border-t-amber-500', bg: 'bg-amber-50/50 ' },
 won: { dot: 'bg-emerald-500', border: 'border-t-emerald-500', bg: 'bg-emerald-50/50 ' },
 lost: { dot: 'bg-rose-500', border: 'border-t-rose-500', bg: 'bg-rose-50/50 ' },
};

export function KanbanColumn({
 status,
 leads,
 isDragOver = false,
 draggingLeadId = null,
 onDragStart,
 onDragEnd,
 onDragOver,
 onDragLeave,
 onDrop,
 onCopyPhone,
 onMobileStatusChange,
}: KanbanColumnProps) {
 const color = statusHeaderColors[status];
 const title = LEAD_STATUS_LABELS[status] || status;

 // محاسبه مجموع ارزش معاملات ستون
 const totalValue = React.useMemo(() => {
 return leads.reduce((acc, lead) => {
 if (
 lead.estimatedValue !== undefined &&
 lead.estimatedValue !== null &&
 typeof lead.estimatedValue === 'number' &&
 !Number.isNaN(lead.estimatedValue) &&
 lead.estimatedValue > 0
 ) {
 return acc + lead.estimatedValue;
 }
 return acc;
 }, 0);
 }, [leads]);

 return (
 <div
 onDragOver={(e) => {
 e.preventDefault();
 e.dataTransfer.dropEffect = 'move';
 onDragOver?.(status);
 }}
 onDragLeave={onDragLeave}
 onDrop={(e) => {
 e.preventDefault();
 const leadId = e.dataTransfer.getData('text/plain');
 if (leadId) {
 onDrop?.(leadId, status);
 }
 }}
 className={`flex flex-col flex-1 min-w-[280px] max-w-sm rounded-2xl border border-gray-200/90 bg-gray-50/70 p-3 shadow-2xs transition-all duration-150 border-t-4 ${
 color.border
 } ${
 isDragOver
 ? 'ring-2 ring-blue-500 bg-blue-50/80 border-dashed border-blue-400 '
 : ''
 }`}
 dir="rtl"
 >
 {/* هدر ستون: عنوان، بج تعداد و مجموع ارزش */}
 <div className="flex items-center justify-between gap-2 border-b border-gray-200/70 pb-2.5 mb-3 ">
 <div className="flex items-center gap-2">
 <span className={`w-2.5 h-2.5 rounded-full ${color.dot}`} aria-hidden="true" />
 <h3 className="text-xs sm:text-sm font-bold text-gray-900 ">
 {title}
 </h3>
 <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-white border border-gray-200 text-gray-700 text-[11px] font-bold ">
 {toPersianDigits(leads.length)}
 </span>
 </div>

 {totalValue > 0 && (
 <span
 className="text-[11px] font-semibold text-emerald-700 "
 title="مجموع ارزش تخمینی لیدهای این مرحله"
 >
 {toPersianDigits(totalValue.toLocaleString('fa-IR'))} ت
 </span>
 )}
 </div>

 {/* فهرست کارت‌های لید */}
 <div className="flex-1 space-y-2.5 min-h-[140px]">
 {leads.length > 0 ? (
 leads.map((lead) => (
 <KanbanCard
 key={lead.id}
 lead={lead}
 isDragging={draggingLeadId === lead.id}
 onDragStart={onDragStart}
 onDragEnd={onDragEnd}
 onCopyPhone={onCopyPhone}
 onMobileStatusChange={onMobileStatusChange}
 />
 ))
 ) : (
 <div className="h-full min-h-[120px] flex items-center justify-center rounded-xl border border-dashed border-gray-200 p-4 text-center text-xs text-gray-400 ">
 <span>هیچ لیدی در این مرحله وجود ندارد</span>
 </div>
 )}
 </div>
 </div>
 );
}
