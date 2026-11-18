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
    blue: 'bg-[#719BDF]/10 text-[#719BDF] border-[#719BDF]/25',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/25',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/25',
    slate: 'bg-[#18263A] text-slate-300 border-[#1F2E45]',
  };

  return (
    <div
      className={`bg-[#111D2E]/80 backdrop-blur-md border border-[#1F2E45] rounded-2xl p-5 shadow-xl flex flex-col justify-between transition-all hover:border-[#719BDF]/40 ${className}`}
      dir="rtl"
    >
      {/* سربرگ کارت ویجت مطابق ص ۶ مستند: عنوان، آیکون و پیوند «مشاهده همه» */}
      <div className="flex items-center justify-between gap-3 pb-3.5 mb-3.5 border-b border-[#1F2E45] shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#0B1423] text-[#719BDF] border border-[#1F2E45] flex items-center justify-center shrink-0">
            <Icon size={16} className="text-[#719BDF]" />
          </div>
          <div className="flex items-center gap-2 truncate">
            <h3 className="font-extrabold text-xs sm:text-sm text-white font-display truncate">
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
            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#719BDF] hover:text-[#93bbf5] transition-colors shrink-0 group"
          >
            <span>{viewAllLabel}</span>
            <ChevronLeft
              size={13}
              className="text-[#719BDF] transition-transform group-hover:-translate-x-0.5"
            />
          </Link>
        )}
      </div>

      {/* بدنه محتوا، بارگذاری، خطا یا حالت خالی */}
      <div className="flex-1 min-h-[140px] flex flex-col justify-center">
        {isLoading ? (
          <div className="space-y-3 animate-pulse py-2">
            <div className="h-4 bg-[#18263A] rounded-md w-3/4" />
            <div className="h-10 bg-[#0B1423] rounded-xl" />
            <div className="h-4 bg-[#18263A] rounded-md w-1/2" />
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-500/10 border border-rose-500/25 rounded-xl text-center space-y-2">
            <AlertTriangle className="w-6 h-6 text-rose-400 mx-auto" />
            <p className="text-xs font-semibold text-rose-300">{error}</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold text-slate-200 bg-[#0B1423] border border-[#1F2E45] rounded-lg hover:bg-[#18263A] transition-colors"
              >
                <RefreshCw size={12} />
                <span>تلاش دوباره</span>
              </button>
            )}
          </div>
        ) : isEmpty ? (
          <div className="p-6 text-center space-y-2.5 text-slate-400">
            <p className="text-xs font-medium text-slate-400 leading-relaxed">
              {emptyMessage}
            </p>
            {emptyAction && (
              <div>
                {emptyAction.href ? (
                  <Link
                    href={emptyAction.href}
                    className="inline-block px-3 py-1.5 text-xs font-bold text-[#719BDF] bg-[#719BDF]/10 border border-[#719BDF]/25 rounded-xl hover:bg-[#719BDF]/20 transition-colors"
                  >
                    {emptyAction.label}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={emptyAction.onClick}
                    className="px-3 py-1.5 text-xs font-bold text-[#719BDF] bg-[#719BDF]/10 border border-[#719BDF]/25 rounded-xl hover:bg-[#719BDF]/20 transition-colors"
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
