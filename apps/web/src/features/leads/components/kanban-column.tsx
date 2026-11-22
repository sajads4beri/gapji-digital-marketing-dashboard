import * as React from 'react';
import type { LeadDetail, LeadStatus } from '../types';
import { LEAD_STATUS_LABELS } from '../types';
import { KanbanCard } from './kanban-card';
import { toPersianDigits } from '@/components/common/timeline';

export interface KanbanColumnProps {
  status: LeadStatus;
  leads: LeadDetail[];
  statusConfig?: {
    key: string;
    label: string;
    color?: string;
    group?: string;
    isActive?: boolean;
  };
  availableStatuses?: Array<{ key: string; label: string }>;
  isDropDisabled?: boolean;
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

// نگاشت پالت رنگی داینامیک هدر ستون‌ها
const COLOR_PALETTE: Record<string, { dot: string; border: string; bg: string }> = {
  blue: { dot: 'bg-[#719BDF]', border: 'border-t-[#719BDF]', bg: 'bg-blue-500/10' },
  indigo: { dot: 'bg-indigo-400', border: 'border-t-indigo-500', bg: 'bg-indigo-500/10' },
  purple: { dot: 'bg-purple-400', border: 'border-t-purple-500', bg: 'bg-purple-500/10' },
  amber: { dot: 'bg-amber-400', border: 'border-t-amber-500', bg: 'bg-amber-500/10' },
  emerald: { dot: 'bg-emerald-400', border: 'border-t-emerald-500', bg: 'bg-emerald-500/10' },
  rose: { dot: 'bg-[#D66B73]', border: 'border-t-[#D66B73]', bg: 'bg-[#D66B73]/10' },
  teal: { dot: 'bg-teal-400', border: 'border-t-teal-500', bg: 'bg-teal-500/10' },
  cyan: { dot: 'bg-cyan-400', border: 'border-t-cyan-500', bg: 'bg-cyan-500/10' },
  orange: { dot: 'bg-orange-400', border: 'border-t-orange-500', bg: 'bg-orange-500/10' },
  slate: { dot: 'bg-slate-400', border: 'border-t-slate-500', bg: 'bg-slate-500/10' },
};

// نگاشت استایل رنگی نشان وضعیت ستون‌های پیش‌فرض
const statusHeaderColors: Record<string, { dot: string; border: string; bg: string }> = {
  new: { dot: 'bg-[#719BDF]', border: 'border-t-[#719BDF]', bg: 'bg-blue-500/10' },
  in_progress: { dot: 'bg-indigo-400', border: 'border-t-indigo-500', bg: 'bg-indigo-500/10' },
  qualified: { dot: 'bg-purple-400', border: 'border-t-purple-500', bg: 'bg-purple-500/10' },
  proposal: { dot: 'bg-amber-400', border: 'border-t-amber-500', bg: 'bg-amber-500/10' },
  won: { dot: 'bg-emerald-400', border: 'border-t-emerald-500', bg: 'bg-emerald-500/10' },
  lost: { dot: 'bg-[#D66B73]', border: 'border-t-[#D66B73]', bg: 'bg-[#D66B73]/10' },
};

export function KanbanColumn({
  status,
  leads,
  statusConfig,
  availableStatuses,
  isDropDisabled = false,
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
  const configuredColor = statusConfig?.color ? COLOR_PALETTE[statusConfig.color] : undefined;
  const color = configuredColor || COLOR_PALETTE[status] || statusHeaderColors[status] || COLOR_PALETTE.blue;
  const title = statusConfig?.label || LEAD_STATUS_LABELS[status as keyof typeof LEAD_STATUS_LABELS] || status;
  const isInactive = statusConfig?.isActive === false || isDropDisabled;

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
        if (isInactive) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        onDragOver?.(status);
      }}
      onDragLeave={onDragLeave}
      onDrop={(e) => {
        if (isInactive) return;
        e.preventDefault();
        const leadId = e.dataTransfer.getData('text/plain');
        if (leadId) {
          onDrop?.(leadId, status);
        }
      }}
      className={`flex flex-col flex-1 min-w-[280px] max-w-sm h-[calc(100vh-270px)] min-h-[500px] max-h-[720px] rounded-2xl border border-[#1F2E45] bg-[#111D2E]/80 backdrop-blur-md p-3.5 shadow-xl transition-all duration-150 border-t-4 ${
        color.border
      } ${
        isDragOver && !isInactive
          ? 'ring-2 ring-[#719BDF] bg-[#18263A] border-dashed border-[#719BDF]'
          : ''
      } ${isInactive ? 'opacity-70 bg-[#0B1423]/60 border-dashed' : ''}`}
      dir="rtl"
    >
      {/* هدر ستون: عنوان، بج تعداد و مجموع ارزش */}
      <div className="flex items-center justify-between gap-2 border-b border-[#1F2E45] pb-2.5 mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${color.dot}`} aria-hidden="true" />
          <h3 className="text-xs sm:text-sm font-bold text-slate-100 font-display">
            {title}
          </h3>
          {isInactive && (
            <span className="text-[10px] bg-[#D66B73]/10 text-[#D66B73] border border-[#D66B73]/30 px-1.5 py-0.5 rounded font-medium">
              غیرفعال
            </span>
          )}
          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#18263A] border border-[#1F2E45] text-slate-300 text-[11px] font-bold font-display">
            {toPersianDigits(leads.length)}
          </span>
        </div>

        {totalValue > 0 && (
          <span
            className="text-[11px] font-semibold text-emerald-400 font-display"
            title="مجموع ارزش تخمینی لیدهای این مرحله"
          >
            {toPersianDigits(totalValue.toLocaleString('fa-IR'))} ت
          </span>
        )}
      </div>

      {/* فهرست کارت‌های لید - اسکرول عمودی داخل هر باکس */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pe-1.5 scrollbar-thin min-h-[140px]">
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
              availableStatuses={availableStatuses}
            />
          ))
        ) : (
          <div className="h-full min-h-[120px] flex items-center justify-center rounded-xl border border-dashed border-[#1F2E45] p-4 text-center text-xs text-slate-500">
            <span>هیچ لیدی در این مرحله وجود ندارد</span>
          </div>
        )}
      </div>
    </div>
  );
}
