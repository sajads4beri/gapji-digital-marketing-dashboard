'use client';

import * as React from 'react';
import Link from 'next/link';
import { FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
}

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: EmptyStateAction | React.ReactNode;
  className?: string;
}

export function EmptyState({
  title = 'داده‌ای یافت نشد',
  description,
  icon,
  action,
  className = '',
}: EmptyStateProps) {
  const isCustomActionNode = React.isValidElement(action);
  const actionConfig = !isCustomActionNode
    ? (action as EmptyStateAction | undefined)
    : undefined;

  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 select-none ${className}`}
      dir="rtl"
    >
      <div className="w-14 h-14 rounded-2xl bg-[#18263A] border border-[#1F2E45] flex items-center justify-center text-[#719BDF] shadow-[0_0_15px_rgba(113,155,223,0.1)] mb-4 shrink-0">
        {icon || <FolderOpen size={26} strokeWidth={1.5} />}
      </div>

      {title && (
        <h4 className="text-sm sm:text-base font-bold text-slate-100 font-display mb-1.5">
          {title}
        </h4>
      )}

      {description && (
        <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-5">
          {description}
        </p>
      )}

      {action && (
        <div>
          {isCustomActionNode ? (
            action
          ) : actionConfig?.href ? (
            <Link
              href={actionConfig.href}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#719BDF] to-[#3B82F6] hover:brightness-110 shadow-[0_0_15px_rgba(113,155,223,0.25)] transition-all"
            >
              {actionConfig.label}
            </Link>
          ) : actionConfig?.onClick ? (
            <button
              type="button"
              onClick={actionConfig.onClick}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#719BDF] to-[#3B82F6] hover:brightness-110 shadow-[0_0_15px_rgba(113,155,223,0.25)] transition-all"
            >
              {actionConfig.label}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
