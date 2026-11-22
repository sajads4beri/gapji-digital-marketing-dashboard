import * as React from 'react';
import Link from 'next/link';
import { Phone, Copy, Calendar, Clock, ChevronLeft, Building, Target } from 'lucide-react';
import type { LeadDetail } from '../types';
import { LeadStatusBadge } from './lead-status-badge';
import { formatPersianDate } from '@/lib/persian-date';
import { toPersianDigits } from '@/components/common/timeline';

export interface LeadInboxMobileCardProps {
 lead: LeadDetail;
 isSelected?: boolean;
 onToggleSelect?: (id: string) => void;
 onCopyPhone: (e: React.MouseEvent, phone: string) => void;
}

/**
 * تشخیص هشدار لید جدید با بیش از ۲۴ ساعت تاخیر
 */
export function isNewLeadOverdue(lead: LeadDetail): boolean {
 if (lead.status !== 'new' || !lead.createdAt) return false;
 const createdTime = new Date(lead.createdAt).getTime();
 if (Number.isNaN(createdTime)) return false;
 return Date.now() - createdTime > 24 * 3600 * 1000;
}

export function LeadInboxMobileCard({
 lead,
 isSelected = false,
 onToggleSelect,
 onCopyPhone,
}: LeadInboxMobileCardProps) {
 const isOverdueNew = isNewLeadOverdue(lead);

 // بررسی سررسید تاریخ پیگیری بعدی
 const isFollowUpOverdue =
 lead.nextFollowUpDate &&
 new Date(lead.nextFollowUpDate).getTime() < Date.now();

 return (
 <div
 className={`rounded-2xl border p-4 transition-all bg-white ${
 isSelected
 ? 'border-blue-400 bg-blue-50/50 shadow-xs '
 : 'border-gray-200 hover:border-gray-300 '
 }`}
 dir="rtl"
 >
 {/* ردیف بالا: نام، چک‌باکس و نشان وضعیت */}
 <div className="flex items-start justify-between gap-3">
 <div className="flex items-center gap-2.5 min-w-0">
 {onToggleSelect && (
 <input
 type="checkbox"
 checked={isSelected}
 onChange={() => onToggleSelect(lead.id)}
 onClick={(e) => e.stopPropagation()}
 aria-label={`انتخاب ${lead.fullName}`}
 className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
 />
 )}

 <div className="min-w-0">
 <Link
 href={`/leads/${lead.id}`}
 className="text-sm font-bold text-gray-900 hover:text-blue-600 truncate block"
 >
 {lead.fullName}
 </Link>
 {lead.company && (
 <p className="flex items-center gap-1 text-[11px] text-gray-500 truncate mt-0.5">
 <Building size={11} className="shrink-0" />
 <span className="truncate">{lead.company}</span>
 </p>
 )}
 </div>
 </div>

 <LeadStatusBadge status={lead.status} />
 </div>

 {/* هشدار لید جدید بیش از ۲۴ ساعت */}
 {isOverdueNew && (
 <div className="mt-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold ">
 <Clock size={13} className="text-amber-600 animate-pulse shrink-0" />
 <span>بیش از ۲۴ ساعت بدون بررسی</span>
 </div>
 )}

 {/* ردیف شماره تماس و عملیات سریع */}
 <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2.5 ">
 <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 ">
 <Phone size={13} className="text-gray-400 shrink-0" />
 <span dir="ltr">{toPersianDigits(lead.phoneNumber)}</span>
 </div>

 <div className="flex items-center gap-1.5">
 {/* دکمه کپی شماره */}
 <button
 type="button"
 onClick={(e) => onCopyPhone(e, lead.phoneNumber)}
 aria-label="کپی شماره تماس"
 title="کپی شماره تماس"
 className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors "
 >
 <Copy size={13} />
 </button>

 {/* دکمه تماس تلفنی */}
 <a
 href={`tel:${lead.phoneNumber}`}
 onClick={(e) => e.stopPropagation()}
 aria-label="تماس تلفنی"
 title="تماس تلفنی مستقیم"
 className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold transition-colors "
 >
 <Phone size={11} />
 <span>تماس</span>
 </a>
 </div>
 </div>

 {/* اطلاعات تکمیلی: کمپین / کارشناس / تاریخ پیگیری */}
 <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11px] text-gray-500 ">
 {lead.campaignName && (
 <div className="flex items-center gap-1 truncate" title={lead.campaignName}>
 <Target size={11} className="shrink-0 text-gray-400" />
 <span className="truncate">{lead.campaignName}</span>
 </div>
 )}

 {lead.nextFollowUpDate ? (
 <div
 className={`flex items-center gap-1 truncate justify-end ${
 isFollowUpOverdue ? 'text-rose-600 font-bold ' : ''
 }`}
 >
 <Calendar size={11} className="shrink-0" />
 <span>پیگیری: {formatPersianDate(lead.nextFollowUpDate)}</span>
 </div>
 ) : (
 <div className="text-left text-gray-400">بدون تاریخ پیگیری</div>
 )}
 </div>

 {/* دکمه ناوبری به جزئیات */}
 <Link
 href={`/leads/${lead.id}`}
 className="mt-3 flex items-center justify-between w-full py-1.5 px-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-xs font-semibold text-gray-700 transition-colors "
 >
 <span>مشاهده جزئیات کامل و تایم‌لاین</span>
 <ChevronLeft size={14} className="text-gray-400" />
 </Link>
 </div>
 );
}
