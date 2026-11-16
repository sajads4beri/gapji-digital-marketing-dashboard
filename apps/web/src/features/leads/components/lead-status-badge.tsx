import * as React from 'react';
import type { LeadStatus } from '../types';
import { LEAD_STATUS_LABELS } from '../types';

export interface LeadStatusBadgeProps {
  status: LeadStatus;
  label?: string;
  color?: string;
  statusConfig?: {
    label?: string;
    color?: string;
    isActive?: boolean;
  };
  className?: string;
  showDot?: boolean;
}

const COLOR_CLASSES: Record<string, { badge: string; dot: string }> = {
  blue: { badge: 'bg-blue-500/10 text-[#719BDF] border-blue-500/30', dot: 'bg-[#719BDF] shadow-sm shadow-[#719BDF]/50' },
  indigo: { badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30', dot: 'bg-indigo-400' },
  purple: { badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30', dot: 'bg-purple-400' },
  amber: { badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30', dot: 'bg-amber-400' },
  emerald: { badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-400' },
  rose: { badge: 'bg-[#D66B73]/10 text-[#D66B73] border-[#D66B73]/30', dot: 'bg-[#D66B73]' },
  teal: { badge: 'bg-teal-500/10 text-teal-400 border-teal-500/30', dot: 'bg-teal-400' },
  cyan: { badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30', dot: 'bg-cyan-400' },
  orange: { badge: 'bg-orange-500/10 text-orange-400 border-orange-500/30', dot: 'bg-orange-400' },
  slate: { badge: 'bg-slate-500/10 text-slate-300 border-slate-500/30', dot: 'bg-slate-400' },
};

/**
 * تعیین استایل رنگی نشان وضعیت لید منطبق بر هویت بصری سیستم
 */
export function getLeadStatusBadgeClasses(status: LeadStatus, colorOverride?: string): {
  badge: string;
  dot: string;
} {
  if (colorOverride && COLOR_CLASSES[colorOverride]) {
    return COLOR_CLASSES[colorOverride];
  }
  switch (status) {
    case 'new':
      return COLOR_CLASSES.blue;
    case 'in_progress':
      return COLOR_CLASSES.indigo;
    case 'qualified':
      return COLOR_CLASSES.purple;
    case 'proposal':
      return COLOR_CLASSES.amber;
    case 'won':
      return COLOR_CLASSES.emerald;
    case 'lost':
      return COLOR_CLASSES.rose;
    default:
      return COLOR_CLASSES[status] || COLOR_CLASSES.slate;
  }
}

export function LeadStatusBadge({
  status,
  label: customLabel,
  color,
  statusConfig,
  className = '',
  showDot = true,
}: LeadStatusBadgeProps) {
  const displayLabel =
    customLabel ||
    statusConfig?.label ||
    LEAD_STATUS_LABELS[status] ||
    status;
  const effectiveColor = color || statusConfig?.color;
  const classes = getLeadStatusBadgeClasses(status, effectiveColor);

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
      <span className="truncate">{displayLabel}</span>
    </span>
  );
}
