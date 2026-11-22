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
  color = 'text-[#719BDF]',
  className = '',
}: KpiCardProps) {
  return (
    <div
      className={`bg-[#111D2E]/80 backdrop-blur-md p-5 sm:p-6 rounded-2xl shadow-xl border border-[#1F2E45] flex flex-col justify-between transition-all hover:border-[#719BDF]/40 hover:shadow-[0_0_20px_rgba(113,155,223,0.08)] ${className}`}
      dir="rtl"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1.5">
          <p className="text-xs sm:text-sm font-semibold text-slate-400">{title}</p>
          <p className="text-xl sm:text-2xl font-black text-slate-100 font-display tracking-tight">
            {value}
          </p>
        </div>

        {icon && (
          <div className="p-3 rounded-xl bg-[#18263A] border border-[#1F2E45]/80 shrink-0 text-[#719BDF]">
            {React.isValidElement(icon)
              ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
                  className: `${(icon.props as { className?: string }).className || ''} ${color}`.trim(),
                })
              : icon}
          </div>
        )}
      </div>

      {(change || subtitle) && (
        <div className="border-t border-[#1F2E45]/80 pt-3 mt-4 flex items-center justify-between text-xs text-slate-400">
          {change && (
            <div
              className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-lg border text-[11px] ${
                change.type === 'positive'
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                  : change.type === 'negative'
                  ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                  : 'text-slate-300 bg-[#18263A] border-[#1F2E45]'
              }`}
            >
              {change.type === 'positive' ? (
                <TrendingUp size={12} />
              ) : change.type === 'negative' ? (
                <TrendingDown size={12} />
              ) : (
                <Minus size={12} />
              )}
              <span dir="ltr">{change.value}</span>
              {change.label && (
                <span className="font-normal text-slate-400 ms-0.5">
                  {change.label}
                </span>
              )}
            </div>
          )}

          {subtitle && (
            <span className="text-slate-500 text-[11px] ms-auto">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
