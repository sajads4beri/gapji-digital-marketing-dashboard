'use client';

import * as React from 'react';

export interface StatusConfig {
 label: string;
 className: string;
 dotClassName: string;
}

export const statusConfigMap: Record<string, StatusConfig> = {
 active: {
 label: 'فعال',
 className: 'bg-emerald-50 text-emerald-700 border-emerald-200 ',
 dotClassName: 'bg-emerald-500',
 },
 paused: {
 label: 'متوقف',
 className: 'bg-amber-50 text-amber-700 border-amber-200 ',
 dotClassName: 'bg-amber-500',
 },
 completed: {
 label: 'تکمیل شده',
 className: 'bg-blue-50 text-blue-700 border-blue-200 ',
 dotClassName: 'bg-blue-500',
 },
 draft: {
 label: 'پیش‌نویس',
 className: 'bg-slate-100 text-slate-700 border-slate-200 ',
 dotClassName: 'bg-slate-400',
 },
 archived: {
 label: 'بایگانی',
 className: 'bg-gray-100 text-gray-500 border-gray-200 ',
 dotClassName: 'bg-gray-400',
 },
};

export function getStatusConfig(status: string): StatusConfig {
 const normalized = (status || '').toLowerCase().trim();
 return (
 statusConfigMap[normalized] || {
 label: status || 'نامشخص',
 className: 'bg-gray-100 text-gray-700 border-gray-200 ',
 dotClassName: 'bg-gray-400',
 }
 );
}

export interface StatusBadgeProps {
 status: string;
 label?: string;
 showDot?: boolean;
 className?: string;
}

export function StatusBadge({
 status,
 label,
 showDot = true,
 className = '',
}: StatusBadgeProps) {
 const config = getStatusConfig(status);
 const displayLabel = label || config.label;

 return (
 <span
 className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border select-none transition-colors ${config.className} ${className}`}
 dir="rtl"
 >
 {showDot && (
 <span
 className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dotClassName}`}
 />
 )}
 <span>{displayLabel}</span>
 </span>
 );
}
