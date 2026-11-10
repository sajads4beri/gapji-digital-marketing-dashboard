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
import type { LeadDetail, LeadStatus } from '../types';
import { LEAD_STATUS_LABELS } from '../types';
import { toPersianDigits } from '@/components/common/timeline';
import { resolveLeadOwner } from '../utils/lead-storage';

export interface LeadProfileCardProps {
 lead: LeadDetail;
 className?: string;
}

/**
 * تعیین استایل رنگی نشان وضعیت لید
 */
function getStatusBadgeClasses(status: LeadStatus): string {
 switch (status) {
 case 'new':
 return 'bg-blue-50 text-blue-700 border-blue-200 ';
 case 'in_progress':
 return 'bg-indigo-50 text-indigo-700 border-indigo-200 ';
 case 'qualified':
 return 'bg-purple-50 text-purple-700 border-purple-200 ';
 case 'proposal':
 return 'bg-amber-50 text-amber-700 border-amber-200 ';
 case 'won':
 return 'bg-emerald-50 text-emerald-700 border-emerald-200 ';
 case 'lost':
 return 'bg-rose-50 text-rose-700 border-rose-200 ';
 default:
 return 'bg-slate-100 text-slate-700 border-slate-200 ';
 }
}

export function LeadProfileCard({ lead, className = '' }: LeadProfileCardProps) {
 const statusLabel = LEAD_STATUS_LABELS[lead.status] || lead.status;
 const statusClasses = getStatusBadgeClasses(lead.status);

 const formattedEstimatedValue =
 lead.estimatedValue !== undefined && lead.estimatedValue !== null
 ? `${toPersianDigits(lead.estimatedValue.toLocaleString('fa-IR'))} تومان`
 : 'تعیین نشده';

 return (
 <div
 className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}
 dir="rtl"
 >
 {/* هدر کارت: آواتار، نام و نشان وضعیت */}
 <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4 ">
 <div className="flex items-center gap-3">
 <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ">
 <User className="h-6 w-6" aria-hidden="true" />
 </div>
 <div>
 <h2 className="text-base font-bold text-slate-900 ">
 {lead.fullName}
 </h2>
 <p className="mt-0.5 text-xs text-slate-500 ">
 شناسه لید: {toPersianDigits(lead.id)}
 </p>
 </div>
 </div>

 <span
 className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusClasses}`}
 >
 {statusLabel}
 </span>
 </div>

 {/* اطلاعات ارتباطی و مشخصات */}
 <div className="mt-4 space-y-3 text-xs sm:text-sm">
 {/* شماره تماس */}
 <div className="flex items-center justify-between py-1">
 <span className="flex items-center gap-2 text-slate-500 ">
 <Phone className="h-4 w-4 text-slate-400" aria-hidden="true" />
 شماره تماس:
 </span>
 <a
 href={`tel:${lead.phoneNumber}`}
 className="font-medium text-blue-600 hover:underline "
 dir="ltr"
 >
 {toPersianDigits(lead.phoneNumber)}
 </a>
 </div>

 {/* ایمیل */}
 <div className="flex items-center justify-between py-1">
 <span className="flex items-center gap-2 text-slate-500 ">
 <Mail className="h-4 w-4 text-slate-400" aria-hidden="true" />
 ایمیل:
 </span>
 <span className="font-medium text-slate-700 " dir="ltr">
 {lead.email || '—'}
 </span>
 </div>

 {/* نام شرکت / سازمان */}
 <div className="flex items-center justify-between py-1">
 <span className="flex items-center gap-2 text-slate-500 ">
 <Building className="h-4 w-4 text-slate-400" aria-hidden="true" />
 شرکت / سازمان:
 </span>
 <span className="font-medium text-slate-700 ">
 {lead.company || '—'}
 </span>
 </div>

 {/* کمپین مرتبط */}
 <div className="flex items-center justify-between py-1">
 <span className="flex items-center gap-2 text-slate-500 ">
 <Target className="h-4 w-4 text-slate-400" aria-hidden="true" />
 کمپین ورودی:
 </span>
 <span className="max-w-[160px] truncate font-medium text-slate-700 text-left" title={lead.campaignName}>
 {lead.campaignName || '—'}
 </span>
 </div>

 {/* کانال جذب */}
 <div className="flex items-center justify-between py-1">
 <span className="flex items-center gap-2 text-slate-500 ">
 <Share2 className="h-4 w-4 text-slate-400" aria-hidden="true" />
 کانال جذب:
 </span>
 <span className="font-medium text-slate-700 ">
 {lead.source || '—'}
 </span>
 </div>

 {/* ارزش تخمینی */}
 <div className="flex items-center justify-between py-1">
 <span className="flex items-center gap-2 text-slate-500 ">
 <DollarSign className="h-4 w-4 text-slate-400" aria-hidden="true" />
 ارزش تخمینی:
 </span>
 <span className="font-semibold text-emerald-600 ">
 {formattedEstimatedValue}
 </span>
 </div>

 {/* علت انصراف یا لغو در صورت وضعیت lost */}
 {lead.status === 'lost' && lead.lostReason && (
 <div className="flex items-center justify-between py-1 text-rose-600 ">
 <span className="flex items-center gap-2">
 <XCircle className="h-4 w-4 text-rose-500" aria-hidden="true" />
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
 <div className="border-t border-slate-100 pt-3 ">
 <span className="flex items-center gap-2 text-xs text-slate-500 ">
 <UserCheck className="h-4 w-4 text-slate-400" aria-hidden="true" />
 مسئول پیگیری:
 </span>
 {(() => {
 const owner = resolveLeadOwner(lead);
 if (!owner || !owner.name) {
 return <p className="mt-1 text-xs text-slate-400">تخصیص نیافته است</p>;
 }
 return (
 <div
 className="mt-2 flex items-center gap-2.5 rounded-xl bg-slate-50 p-2.5 "
 title={owner.hasConflict ? 'شناسه تخصیص‌یافته با شیء میراثی در تعارض است' : undefined}
 >
 {owner.avatarUrl ? (
 <img
 src={owner.avatarUrl}
 alt={owner.name}
 className="h-8 w-8 rounded-full object-cover"
 />
 ) : (
 <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-xs">
 {owner.name.slice(0, 2)}
 </div>
 )}
 <div className="min-w-0">
 <p className="truncate text-xs font-semibold text-slate-800 ">
 {owner.name}
 </p>
 {owner.role && (
 <p className="truncate text-[11px] text-slate-500 ">
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
