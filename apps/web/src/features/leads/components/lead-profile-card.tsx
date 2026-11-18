import * as React from 'react';
import {
  User,
  Phone,
  Mail,
  Building,
  Target,
  Share2,
  DollarSign,
  UserCheck,
  XCircle,
} from 'lucide-react';
import type { LeadDetail } from '../types';
import { LeadStatusBadge } from './lead-status-badge';
import { toPersianDigits } from '@/components/common/timeline';
import { resolveLeadOwner } from '../utils/lead-storage';

export interface LeadProfileCardProps {
  lead: LeadDetail;
  className?: string;
}

export function LeadProfileCard({ lead, className = '' }: LeadProfileCardProps) {
  const formattedEstimatedValue =
    lead.estimatedValue !== undefined && lead.estimatedValue !== null
      ? `${toPersianDigits(lead.estimatedValue.toLocaleString('fa-IR'))} تومان`
      : 'تعیین نشده';

  return (
    <div
      className={`rounded-2xl border border-[#1F2E45] bg-[#111D2E]/80 backdrop-blur-md p-5 shadow-xl text-slate-200 ${className}`}
      dir="rtl"
    >
      {/* هدر کارت: آواتار، نام و نشان وضعیت */}
      <div className="flex items-start justify-between gap-3 border-b border-[#1F2E45] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#18263A] text-[#719BDF] border border-[#1F2E45] shadow-sm">
            <User className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 font-display">
              {lead.fullName}
            </h2>
            <p className="mt-0.5 text-xs text-slate-400 font-mono">
              شناسه لید: {toPersianDigits(lead.id)}
            </p>
          </div>
        </div>

        <LeadStatusBadge
          status={lead.status}
          label={lead.statusConfig?.label}
          color={lead.statusConfig?.color}
          statusConfig={lead.statusConfig}
        />
      </div>

      {/* اطلاعات ارتباطی و مشخصات */}
      <div className="mt-4 space-y-3 text-xs sm:text-sm">
        {/* شماره تماس */}
        <div className="flex items-center justify-between py-1">
          <span className="flex items-center gap-2 text-slate-400">
            <Phone className="h-4 w-4 text-slate-500" aria-hidden="true" />
            شماره تماس:
          </span>
          <a
            href={`tel:${lead.phoneNumber}`}
            className="font-medium text-[#719BDF] hover:underline font-mono"
            dir="ltr"
          >
            {toPersianDigits(lead.phoneNumber)}
          </a>
        </div>

        {/* ایمیل */}
        <div className="flex items-center justify-between py-1">
          <span className="flex items-center gap-2 text-slate-400">
            <Mail className="h-4 w-4 text-slate-500" aria-hidden="true" />
            ایمیل:
          </span>
          <span className="font-medium text-slate-200 font-mono" dir="ltr">
            {lead.email || '—'}
          </span>
        </div>

        {/* نام شرکت / سازمان */}
        <div className="flex items-center justify-between py-1">
          <span className="flex items-center gap-2 text-slate-400">
            <Building className="h-4 w-4 text-slate-500" aria-hidden="true" />
            شرکت / سازمان:
          </span>
          <span className="font-medium text-slate-200">
            {lead.company || '—'}
          </span>
        </div>

        {/* کمپین مرتبط */}
        <div className="flex items-center justify-between py-1">
          <span className="flex items-center gap-2 text-slate-400">
            <Target className="h-4 w-4 text-slate-500" aria-hidden="true" />
            کمپین ورودی:
          </span>
          <span className="max-w-[160px] truncate font-medium text-slate-200 text-left" title={lead.campaignName}>
            {lead.campaignName || '—'}
          </span>
        </div>

        {/* کانال جذب */}
        <div className="flex items-center justify-between py-1">
          <span className="flex items-center gap-2 text-slate-400">
            <Share2 className="h-4 w-4 text-slate-500" aria-hidden="true" />
            کانال جذب:
          </span>
          <span className="font-medium text-slate-200">
            {lead.source || '—'}
          </span>
        </div>

        {/* ارزش تخمینی */}
        <div className="flex items-center justify-between py-1">
          <span className="flex items-center gap-2 text-slate-400">
            <DollarSign className="h-4 w-4 text-slate-500" aria-hidden="true" />
            ارزش تخمینی:
          </span>
          <span className="font-semibold text-emerald-400 font-display">
            {formattedEstimatedValue}
          </span>
        </div>

        {/* علت انصراف یا لغو در صورت وضعیت lost */}
        {(lead.statusConfig?.group === 'lost' || lead.status === 'lost') && lead.lostReason && (
          <div className="flex items-center justify-between py-1 text-[#D66B73]">
            <span className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-[#D66B73]" aria-hidden="true" />
              علت انصراف / رد:
            </span>
            <span
              className="font-medium text-xs truncate max-w-[180px] text-left"
              title={lead.lostReason}
            >
              {lead.lostReason}
            </span>
          </div>
        )}

        {/* کارشناس مسئول بر اساس فیلد مرجع canonical assignedToId */}
        <div className="border-t border-[#1F2E45] pt-3">
          <span className="flex items-center gap-2 text-xs text-slate-400">
            <UserCheck className="h-4 w-4 text-slate-500" aria-hidden="true" />
            مسئول پیگیری:
          </span>
          {(() => {
            const owner = resolveLeadOwner(lead);
            if (!owner || !owner.name) {
              return <p className="mt-1 text-xs text-slate-500">تخصیص نیافته است</p>;
            }
            return (
              <div
                className="mt-2 flex items-center gap-2.5 rounded-xl bg-[#0B1423]/60 border border-[#1F2E45] p-2.5"
                title={owner.hasConflict ? 'شناسه تخصیص‌یافته با شیء میراثی در تعارض است' : undefined}
              >
                {owner.avatarUrl ? (
                  <img
                    src={owner.avatarUrl}
                    alt={owner.name}
                    className="h-8 w-8 rounded-full object-cover border border-[#1F2E45]"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#18263A] text-[#719BDF] border border-[#1F2E45] font-bold text-xs">
                    {owner.name.slice(0, 2)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-slate-200">
                    {owner.name}
                  </p>
                  {owner.role && (
                    <p className="truncate text-[11px] text-slate-400">
                      {owner.role}
                    </p>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
