'use client';

import * as React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  id?: string;
  title?: string;
  description?: string;
  duration?: number; // In ms. 0 or Infinity = persistent (no auto-dismiss)
  action?: ToastAction;
  onDismiss?: () => void;
}

export interface ToastItem extends ToastOptions {
  id: string;
  type: ToastType;
  message: string;
  createdAt: number;
}

export interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

const typeConfig: Record<
  ToastType,
  {
    containerClasses: string;
    icon: React.ReactNode;
    titleColor: string;
    textColor: string;
  }
> = {
  success: {
    containerClasses:
      'bg-[#111D2E]/95 border-emerald-500/30 text-emerald-400 shadow-2xl backdrop-blur-md',
    icon: (
      <CheckCircle2
        className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5"
        aria-hidden="true"
      />
    ),
    titleColor: 'text-emerald-300 font-bold',
    textColor: 'text-slate-300',
  },
  error: {
    containerClasses:
      'bg-[#111D2E]/95 border-[#D66B73]/30 text-[#D66B73] shadow-2xl backdrop-blur-md',
    icon: (
      <AlertCircle
        className="w-5 h-5 text-[#D66B73] shrink-0 mt-0.5"
        aria-hidden="true"
      />
    ),
    titleColor: 'text-[#D66B73] font-bold',
    textColor: 'text-slate-300',
  },
  warning: {
    containerClasses:
      'bg-[#111D2E]/95 border-amber-500/30 text-amber-400 shadow-2xl backdrop-blur-md',
    icon: (
      <AlertTriangle
        className="w-5 h-5 text-amber-400 shrink-0 mt-0.5"
        aria-hidden="true"
      />
    ),
    titleColor: 'text-amber-300 font-bold',
    textColor: 'text-slate-300',
  },
  info: {
    containerClasses:
      'bg-[#111D2E]/95 border-[#719BDF]/30 text-[#719BDF] shadow-2xl backdrop-blur-md',
    icon: (
      <Info
        className="w-5 h-5 text-[#719BDF] shrink-0 mt-0.5"
        aria-hidden="true"
      />
    ),
    titleColor: 'text-[#719BDF] font-bold',
    textColor: 'text-slate-300',
  },
};

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const config = typeConfig[toast.type];
  const isError = toast.type === 'error';

  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      className={cn(
        'pointer-events-auto flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl border text-right w-full sm:w-[380px] max-w-full transition-all duration-200',
        config.containerClasses,
      )}
      style={{
        animation: 'toast-enter 200ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* آیکون وضعیت */}
      {config.icon}

      {/* متن پیام، عنوان، توضیحات و اکشن */}
      <div className="flex-1 min-w-0">
        {toast.title && (
          <h4
            className={cn(
              'text-xs sm:text-sm font-bold leading-tight',
              config.titleColor,
            )}
          >
            {toast.title}
          </h4>
        )}
        <p
          className={cn(
            'text-xs leading-relaxed',
            toast.title ? `mt-1 ${config.textColor}` : `font-bold ${config.titleColor}`,
          )}
        >
          {toast.message}
        </p>

        {toast.description && (
          <p className="text-[11px] text-slate-400 mt-1 leading-normal">
            {toast.description}
          </p>
        )}

        {toast.action && (
          <div className="mt-2.5">
            <button
              type="button"
              onClick={() => {
                toast.action?.onClick();
                onDismiss(toast.id);
              }}
              className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold rounded-lg bg-[#18263A] hover:bg-[#1F2E45] text-slate-200 border border-[#1F2E45] shadow-xs transition-colors"
            >
              {toast.action.label}
            </button>
          </div>
        )}
      </div>

      {/* دکمه بستن دستی */}
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="بستن اعلان"
        className="shrink-0 p-1 -mt-0.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#18263A] transition-colors focus:outline-none focus:ring-2 focus:ring-[#719BDF]"
      >
        <X size={15} />
      </button>
    </div>
  );
};
