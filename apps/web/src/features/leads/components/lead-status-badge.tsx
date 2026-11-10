import * as React from 'react';
import type { LeadStatus } from '../types';
import { LEAD_STATUS_LABELS } from '../types';

export interface LeadStatusBadgeProps {
 status: LeadStatus;
 className?: string;
 showDot?: boolean;
}

/**
 * تعیین استایل رنگی نشان وضعیت لید منطبق بر هویت بصری سیستم
 */
export function getLeadStatusBadgeClasses(status: LeadStatus): {
 badge: string;
 dot: string;
} {
 switch (status) {
 case 'new':
 return {
 badge:
 'bg-blue-50 text-blue-700 border-blue-200 ',
 dot: 'bg-blue-500',
 };
 case 'in_progress':
 return {
 badge:
 'bg-indigo-50 text-indigo-700 border-indigo-200 ',
 dot: 'bg-indigo-500',
 };
 case 'qualified':
 return {
 badge:
 'bg-purple-50 text-purple-700 border-purple-200 ',
 dot: 'bg-purple-500',
 };
 case 'proposal':
 return {
 badge:
 'bg-amber-50 text-amber-700 border-amber-200 ',
 dot: 'bg-amber-500',
 };
 case 'won':
 return {
 badge:
 'bg-emerald-50 text-emerald-700 border-emerald-200 ',
 dot: 'bg-emerald-500',
 };
 case 'lost':
 return {
 badge:
 'bg-rose-50 text-rose-700 border-rose-200 ',
 dot: 'bg-rose-500',
 };
 default:
 return {
 badge:
 'bg-slate-100 text-slate-700 border-slate-200 ',
 dot: 'bg-slate-400',
 };
 }
}

export function LeadStatusBadge({
 status,
 className = '',
 showDot = true,
}: LeadStatusBadgeProps) {
 const label = LEAD_STATUS_LABELS[status] || status;
 const classes = getLeadStatusBadgeClasses(status);

 return (
 <span
 className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-semibold ${classes.badge} ${className}`}
 dir="rtl"
 >
 {showDot && (
 <span
 className={`w-1.5 h-1.5 rounded-full ${classes.dot} shrink-0`}
 aria-hidden="true"
 />
 )}
 <span className="truncate">{label}</span>
 </span>
 );
}
