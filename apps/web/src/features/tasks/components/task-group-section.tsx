'use client';

import * as React from 'react';
import { ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import type { TaskGroupKey } from '../types';

export interface TaskGroupSectionProps {
  title: string;
  count: number;
  groupKey?: TaskGroupKey;
  children: React.ReactNode;
  hideIfEmpty?: boolean;
  defaultOpen?: boolean;
  className?: string;
}

export function TaskGroupSection({
  title,
  count,
  groupKey,
  children,
  hideIfEmpty = true,
  defaultOpen = true,
  className = '',
}: TaskGroupSectionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  // اگر طبق الزامات سند گروه خالی باید پنهان شود
  if (hideIfEmpty && count === 0) {
    return null;
  }

  const isOverdue = groupKey === 'overdue';

  return (
    <section className={`w-full space-y-2 ${className}`} dir="rtl">
      {/* هدر سرگروه */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between py-2 px-1 text-right select-none group focus:outline-none"
      >
        <div className="flex items-center gap-2">
          {isOverdue && (
            <AlertCircle className="w-4 h-4 text-[#D66B73] shrink-0" />
          )}

          <h3
            className={`text-sm font-bold transition-colors ${
              isOverdue
                ? 'text-[#D66B73]'
                : 'text-slate-100 group-hover:text-[#719BDF]'
            }`}
          >
            {title}
          </h3>

          <span
            className={`inline-flex items-center justify-center min-w-[22px] h-5 px-2 text-xs font-bold rounded-full ${
              isOverdue
                ? 'bg-[#D66B73]/20 text-[#D66B73] border border-[#D66B73]/30'
                : 'bg-[#18263A] text-slate-300 border border-[#1F2E45] group-hover:border-[#719BDF]/40 group-hover:text-[#719BDF]'
            }`}
          >
            {count}
          </span>
        </div>

        <span className="text-slate-500 group-hover:text-slate-300 transition-colors p-1">
          {isOpen ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </span>
      </button>

      {/* محتوای ردیف‌های تسک داخل گروه */}
      {isOpen && (
        <div className="space-y-2 animate-in fade-in duration-150">
          {children}
        </div>
      )}
    </section>
  );
}
