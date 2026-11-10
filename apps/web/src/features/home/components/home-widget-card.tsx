'use client';

import * as React from 'react';
import Link from 'next/link';
import { LucideIcon, ChevronLeft, AlertTriangle, RefreshCw } from 'lucide-react';

export interface HomeWidgetCardProps {
 title: string;
 icon: LucideIcon;
 badge?: string;
 badgeColor?: 'blue' | 'amber' | 'rose' | 'emerald' | 'purple' | 'slate';
 viewAllHref?: string;
 viewAllLabel?: string;
 className?: string;
 children: React.ReactNode;
 isLoading?: boolean;
 error?: string | null;
 onRetry?: () => void;
 isEmpty?: boolean;
 emptyMessage?: string;
 emptyAction?: {
 label: string;
 onClick?: () => void;
 href?: string;
 };
}

export function HomeWidgetCard({
 title,
 icon: Icon,
 badge,
 badgeColor = 'blue',
 viewAllHref,
 viewAllLabel = 'مشاهده همه',
 className = 'col-span-12',
 children,
 isLoading = false,
 error = null,
 onRetry,
 isEmpty = false,
 emptyMessage = 'موردی برای نمایش یافت نشد.',
 emptyAction,
}: HomeWidgetCardProps) {
 const badgeColors = {
 blue: 'bg-blue-50 text-blue-700 border-blue-200 ',
 amber: 'bg-amber-50 text-amber-700 border-amber-200 ',
 rose: 'bg-rose-50 text-rose-700 border-rose-200 ',
 emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 ',
 purple: 'bg-purple-50 text-purple-700 border-purple-200 ',
 slate: 'bg-slate-100 text-slate-700 border-slate-200 ',
 };

 return (
 <div
 className={`bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex flex-col justify-between transition-all hover:border-slate-300 ${className}`}
 dir="rtl"
 >
 {/* سربرگ کارت ویجت مطابق ص ۶ مستند: عنوان، آیکون و پیوند «مشاهده همه» */}
 <div className="flex items-center justify-between gap-3 pb-3.5 mb-3.5 border-b border-slate-100 shrink-0">
 <div className="flex items-center gap-2.5 min-w-0">
 <div className="w-8 h-8 rounded-xl bg-slate-50 text-slate-700 border border-slate-200/80 flex items-center justify-center shrink-0">
 <Icon size={16} className="text-slate-600 " />
 </div>
 <div className="flex items-center gap-2 truncate">
 <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
 {title}
 </h3>
 {badge && (
 <span
 className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${badgeColors[badgeColor]}`}
 >
 {badge}
 </span>
 )}
 </div>
 </div>

 {viewAllHref && (
 <Link
 href={viewAllHref}
 className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors shrink-0 group"
 >
 <span>{viewAllLabel}</span>
 <ChevronLeft
 size={13}
 className="text-blue-500 transition-transform group-hover:-translate-x-0.5"
 />
 </Link>
 )}
 </div>

 {/* بدنه محتوا، بارگذاری، خطا یا حالت خالی */}
 <div className="flex-1 min-h-[140px] flex flex-col justify-center">
 {isLoading ? (
 <div className="space-y-3 animate-pulse py-2">
 <div className="h-4 bg-slate-100 rounded-md w-3/4" />
 <div className="h-10 bg-slate-100 rounded-xl" />
 <div className="h-4 bg-slate-100 rounded-md w-1/2" />
 </div>
 ) : error ? (
 <div className="p-4 bg-rose-50 border border-rose-200/80 rounded-xl text-center space-y-2">
 <AlertTriangle className="w-6 h-6 text-rose-500 mx-auto" />
 <p className="text-xs font-semibold text-rose-800 ">{error}</p>
 {onRetry && (
 <button
 type="button"
 onClick={onRetry}
 className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold text-rose-700 bg-white border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors"
 >
 <RefreshCw size={12} />
 <span>تلاش دوباره</span>
 </button>
 )}
 </div>
 ) : isEmpty ? (
 <div className="p-6 text-center space-y-2.5 text-slate-400 ">
 <p className="text-xs font-medium text-slate-600 leading-relaxed">
 {emptyMessage}
 </p>
 {emptyAction && (
 <div>
 {emptyAction.href ? (
 <Link
 href={emptyAction.href}
 className="inline-block px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
 >
 {emptyAction.label}
 </Link>
 ) : (
 <button
 type="button"
 onClick={emptyAction.onClick}
 className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
 >
 {emptyAction.label}
 </button>
 )}
 </div>
 )}
 </div>
 ) : (
 children
 )}
 </div>
 </div>
 );
}
