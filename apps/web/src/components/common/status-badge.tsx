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
    className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    dotClassName: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]',
  },
  paused: {
    label: 'متوقف',
    className: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
    dotClassName: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]',
  },
  completed: {
    label: 'تکمیل شده',
    className: 'bg-[#719BDF]/15 text-[#719BDF] border-[#719BDF]/30',
    dotClassName: 'bg-[#719BDF] shadow-[0_0_8px_rgba(113,155,223,0.6)]',
  },
  draft: {
    label: 'پیش‌نویس',
    className: 'bg-slate-700/30 text-slate-300 border-slate-600/40',
    dotClassName: 'bg-slate-400',
  },
  archived: {
    label: 'بایگانی',
    className: 'bg-[#18263A] text-slate-400 border-[#1F2E45]',
    dotClassName: 'bg-slate-500',
  },
  healthy: {
    label: 'سالم',
    className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    dotClassName: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]',
  },
  needs_attention: {
    label: 'نیازمند توجه',
    className: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
    dotClassName: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]',
  },
  critical: {
    label: 'بحرانی / ضعیف',
    className: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    dotClassName: 'bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.6)]',
  },
};

export function getStatusConfig(status: string): StatusConfig {
  const normalized = (status || '').toLowerCase().trim();
  return (
    statusConfigMap[normalized] || {
      label: status || 'نامشخص',
      className: 'bg-[#18263A] text-slate-300 border-[#1F2E45]',
      dotClassName: 'bg-slate-400',
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
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${config.className} ${className}`}
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
