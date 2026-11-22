'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success';
}

const variantStyles: Record<NonNullable<BadgeProps['variant']>, string> = {
  default:
    'bg-[#719BDF] text-[#080F1C] font-bold border-transparent shadow-[0_0_10px_rgba(113,155,223,0.2)]',
  secondary:
    'bg-[#18263A] text-slate-300 border border-[#1F2E45]',
  destructive:
    'bg-[#D66B73]/15 text-[#D66B73] border border-[#D66B73]/30',
  outline:
    'border border-[#1F2E45] text-slate-300 bg-transparent',
  success:
    'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
};

export function Badge({
  className,
  variant = 'default',
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
}
