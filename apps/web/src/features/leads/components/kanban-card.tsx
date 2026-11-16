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
  availableStatuses?: Array<{ key: string; label: string }>;
}

const DEFAULT_STATUS_OPTIONS: Array<{ key: string; label: string }> = [
  { key: 'new', label: 'جدید' },
  { key: 'in_progress', label: 'تماس گرفته شد' },
  { key: 'qualified', label: 'واجد شرایط' },
  { key: 'proposal', label: 'پیشنهاد' },
  { key: 'won', label: 'مشتری' },
  { key: 'lost', label: 'ردشده' },
];

export function KanbanCard({
  lead,
  isDragging = false,
  onDragStart,
  onDragEnd,
  onCopyPhone,
  onMobileStatusChange,
  availableStatuses,
}: KanbanCardProps) {
  const statusOptions = availableStatuses && availableStatuses.length > 0
    ? availableStatuses
    : DEFAULT_STATUS_OPTIONS;
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
      className={`group relative rounded-xl border bg-[#18263A]/90 p-3.5 shadow-md transition-all duration-150 select-none ${
        isDragging
          ? 'opacity-40 scale-95 border-[#719BDF] rotate-1 shadow-2xl'
          : 'border-[#1F2E45] hover:border-[#719BDF]/50 hover:bg-[#1F2E45]/90 cursor-grab active:cursor-grabbing'
      }`}
    >
      {/* ردیف بالا: نام لید و آیکون درگ */}
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/leads/${lead.id}`}
          onClick={(e) => e.stopPropagation()}
          className="text-xs sm:text-sm font-bold text-slate-100 hover:text-[#719BDF] font-display truncate flex-1 block"
        >
          {lead.fullName}
        </Link>

        <GripVertical
          size={14}
          className="text-slate-500 group-hover:text-slate-300 shrink-0 transition-colors hidden sm:block"
          aria-hidden="true"
        />
      </div>

      {/* نام کمپین در صورت وجود */}
      {lead.campaignName && (
        <div
          className="mt-1 flex items-center gap-1 text-[11px] text-slate-400 truncate"
          title={lead.campaignName}
        >
          <Target size={11} className="shrink-0 text-slate-500" />
          <span className="truncate">{lead.campaignName}</span>
        </div>
      )}

      {/* هشدار لید جدید بیش از ۲۴ ساعت */}
      {isOverdueNew && (
        <div className="mt-2 flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
          <Clock size={11} className="text-amber-400 animate-pulse shrink-0" />
          <span>بیش از ۲۴ ساعت بدون بررسی</span>
        </div>
      )}

      {/* ردیف شماره تماس و عملیات سریع */}
      <div className="mt-2.5 flex items-center justify-between border-t border-[#1F2E45] pt-2 text-[11px]">
        <span className="font-semibold text-slate-300 font-mono" dir="ltr">
          {toPersianDigits(lead.phoneNumber)}
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => onCopyPhone(e, lead.phoneNumber)}
            aria-label="کپی شماره تماس"
            title="کپی شماره تماس"
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-[#111D2E] transition-colors"
          >
            <Copy size={12} />
          </button>

          <a
            href={`tel:${lead.phoneNumber}`}
            onClick={(e) => e.stopPropagation()}
            aria-label="تماس تلفنی"
            title="تماس مستقیم"
            className="p-1 text-emerald-400 hover:text-emerald-300 rounded-lg hover:bg-emerald-500/10 transition-colors"
          >
            <Phone size={12} />
          </a>
        </div>
      </div>

      {/* اطلاعات پایین کارت: ارزش معامله و کارشناس / تاریخ پیگیری */}
      <div className="mt-2 space-y-1 text-[11px] text-slate-400">
        {/* ارزش تخمینی معامله */}
        {lead.estimatedValue !== undefined && lead.estimatedValue !== null && lead.estimatedValue > 0 && (
          <div className="flex items-center justify-between font-semibold text-emerald-400 font-display">
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
              isFollowUpOverdue ? 'text-[#D66B73] font-bold' : ''
            }`}
          >
            <span className="flex items-center gap-1">
              <Calendar size={11} className="shrink-0" />
              <span>پیگیری:</span>
            </span>
            <span>{formatPersianDate(lead.nextFollowUpDate)}</span>
          </div>
        )}

        {/* کارشناس مسئول */}
        {(() => {
          const owner = resolveLeadOwner(lead);
          if (!owner || !owner.name) return null;
          return (
            <div className="flex items-center justify-between pt-1 border-t border-[#1F2E45]">
              <span className="text-[10px] text-slate-500">مسئول:</span>
              <div
                className="flex items-center gap-1"
                title={owner.hasConflict ? 'شناسه تخصیص‌یافته با شیء میراثی در تعارض است' : undefined}
              >
                <div className="w-4 h-4 rounded-full bg-[#0B1423] text-[#719BDF] border border-[#1F2E45] flex items-center justify-center font-bold text-[9px]">
                  {owner.name.slice(0, 1)}
                </div>
                <span className="text-[11px] font-medium text-slate-200 truncate max-w-[120px]">
                  {owner.name}
                </span>
              </div>
            </div>
          );
        })()}
      </div>

      {/* منوی انتخاب وضعیت در موبایل */}
      <div className="mt-2.5 pt-2 border-t border-[#1F2E45] sm:hidden">
        <label className="block text-[10px] text-slate-400 mb-1">
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
          className="w-full bg-[#0B1423] border border-[#1F2E45] rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-[#719BDF]"
        >
          {statusOptions.map((s) => (
            <option key={s.key} value={s.key} className="bg-[#0B1423] text-slate-200">
              {s.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
