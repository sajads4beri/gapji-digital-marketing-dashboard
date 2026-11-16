'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'default' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'destructive' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'default' | 'icon';
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right' | 'start' | 'end';
}

const variantStyles: Record<string, string> = {
  primary:
    'bg-[#719BDF] hover:bg-[#5A85C9] text-white font-bold border-transparent shadow-[0_0_15px_rgba(113,155,223,0.25)] focus-visible:ring-[#719BDF]',
  default:
    'bg-[#719BDF] hover:bg-[#5A85C9] text-white font-bold border-transparent shadow-[0_0_15px_rgba(113,155,223,0.25)] focus-visible:ring-[#719BDF]',
  secondary:
    'bg-[#18263A] hover:bg-[#20314A] text-slate-200 border border-[#1F2E45] focus-visible:ring-[#719BDF]',
  outline:
    'bg-[#0B1423] hover:bg-[#18263A] text-slate-200 border border-[#1F2E45] shadow-xs focus-visible:ring-[#719BDF]',
  ghost:
    'bg-transparent hover:bg-[#18263A] text-slate-400 hover:text-slate-100 border-transparent focus-visible:ring-[#1F2E45]',
  danger:
    'bg-[#D66B73] hover:bg-[#E07C84] text-white border-transparent shadow-xs focus-visible:ring-[#D66B73]',
  destructive:
    'bg-[#D66B73] hover:bg-[#E07C84] text-white border-transparent shadow-xs focus-visible:ring-[#D66B73]',
  link:
    'text-[#719BDF] underline-offset-4 hover:underline p-0 h-auto border-transparent bg-transparent',
};

const sizeStyles: Record<string, string> = {
  sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5',
  md: 'text-sm px-4 py-2 rounded-xl gap-2',
  default: 'text-sm px-4 py-2 rounded-xl gap-2',
  lg: 'text-base px-5 py-2.5 rounded-xl gap-2.5',
  icon: 'h-9 w-9 p-0 rounded-xl justify-center',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      type = 'button',
      icon,
      iconPosition = 'start',
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || isLoading;
    const isStart = iconPosition === 'right' || iconPosition === 'start';
    const isEnd = iconPosition === 'left' || iconPosition === 'end';

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={cn(
          'inline-flex items-center justify-center font-bold border transition-colors select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-[#080F1C] disabled:opacity-50 disabled:cursor-not-allowed',
          variantStyles[variant] || variantStyles.primary,
          sizeStyles[size] || sizeStyles.md,
          className,
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2
              size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16}
              className="animate-spin shrink-0"
            />
            {children}
          </>
        ) : (
          <>
            {icon && isStart && (
              <span className="shrink-0">{icon}</span>
            )}
            {children}
            {icon && isEnd && (
              <span className="shrink-0">{icon}</span>
            )}
          </>
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';
