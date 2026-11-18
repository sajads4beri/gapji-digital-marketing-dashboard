'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right' | 'start' | 'end';
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      id: customId,
      label,
      error,
      helperText,
      icon,
      iconPosition = 'start',
      required = false,
      disabled = false,
      className,
      containerClassName,
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const id = customId || generatedId;

    const hasStartIcon = icon && (iconPosition === 'right' || iconPosition === 'start');
    const hasEndIcon = icon && (iconPosition === 'left' || iconPosition === 'end');

    return (
      <div className={cn('w-full flex flex-col gap-1.5', containerClassName)}>
        {label && (
          <label
            htmlFor={id}
            className="block text-xs font-semibold text-slate-300 text-start select-none"
          >
            {label}
            {required && <span className="text-[#D66B73] ms-1">*</span>}
          </label>
        )}

        <div className="relative w-full">
          {hasStartIcon && (
            <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none text-slate-400 shrink-0">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            id={id}
            required={required}
            disabled={disabled}
            className={cn(
              'w-full text-start bg-[#111D2E] border rounded-xl text-xs text-slate-100 placeholder:text-slate-500 transition-colors focus:outline-none focus:ring-1 disabled:bg-[#0B1423] disabled:text-slate-600 disabled:cursor-not-allowed',
              error
                ? 'border-[#D66B73] focus:border-[#D66B73] focus:ring-[#D66B73]/20'
                : 'border-[#1F2E45] focus:border-[#719BDF] focus:ring-[#719BDF]/20',
              hasStartIcon ? 'ps-10' : 'ps-3.5',
              hasEndIcon ? 'pe-10' : 'pe-3.5',
              'py-2.5',
              className,
            )}
            {...props}
          />

          {hasEndIcon && (
            <div className="absolute inset-y-0 end-0 flex items-center pe-3.5 pointer-events-none text-slate-400 shrink-0">
              {icon}
            </div>
          )}
        </div>

        {error ? (
          <p className="text-xs text-[#D66B73] text-start leading-relaxed animate-in fade-in">
            {error}
          </p>
        ) : helperText ? (
          <p className="text-xs text-slate-400 text-start leading-relaxed">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = 'Input';
