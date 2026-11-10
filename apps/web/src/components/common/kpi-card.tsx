'use client';

import * as React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface KpiChange {
 value: string | number;
 type?: 'positive' | 'negative' | 'neutral';
 label?: string;
}

export interface KpiCardProps {
 title: string;
 value: React.ReactNode;
 subtitle?: string;
 change?: KpiChange;
 icon?: React.ReactNode;
 color?: string;
 className?: string;
}

export function KpiCard({
 title,
 value,
 subtitle,
 change,
 icon,
 color = 'text-blue-600 ',
 className = '',
}: KpiCardProps) {
 return (
 <div
 className={`bg-white p-6 rounded-2xl shadow-xs border border-gray-100 flex flex-col justify-between transition-all hover:shadow-md ${className}`}
 dir="rtl"
 >
 <div className="flex items-center justify-between gap-4">
 <div className="space-y-1">
 <p className="text-xs sm:text-sm font-medium text-gray-500 ">{title}</p>
 <p className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
 {value}
 </p>
 </div>

 {icon && (
 <div className="p-3 rounded-xl bg-gray-50 shrink-0">
 {React.isValidElement(icon)
 ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
 className: `${(icon.props as { className?: string }).className || ''} ${color}`.trim(),
 })
 : icon}
 </div>
 )}
 </div>

 {(change || subtitle) && (
 <div className="border-t border-gray-100 pt-3 mt-4 flex items-center justify-between text-xs text-gray-500 ">
 {change && (
 <div
 className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-lg border text-[11px] ${
 change.type === 'positive'
 ? 'text-emerald-700 bg-emerald-50 border-emerald-100 '
 : change.type === 'negative'
 ? 'text-red-700 bg-red-50 border-red-100 '
 : 'text-gray-700 bg-gray-50 border-gray-100 '
 }`}
 >
 {change.type === 'positive' ? (
 <TrendingUp size={12} />
 ) : change.type === 'negative' ? (
 <TrendingDown size={12} />
 ) : (
 <Minus size={12} />
 )}
 <span>{change.value}</span>
 {change.label && (
 <span className="font-normal text-gray-500 mr-0.5">
 {change.label}
 </span>
 )}
 </div>
 )}

 {subtitle && (
 <span className="text-gray-400 text-[11px] mr-auto">
 {subtitle}
 </span>
 )}
 </div>
 )}
 </div>
 );
}
