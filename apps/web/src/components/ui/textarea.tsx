'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-xl border bg-[#111D2E]/90 px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 shadow-inner backdrop-blur-md transition-all duration-200 outline-none',
          'focus:border-[#719BDF]/70 focus:bg-[#152338] focus:ring-2 focus:ring-[#719BDF]/20',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#0B1423]',
          error
            ? 'border-[#D66B73] focus:border-[#D66B73] focus:ring-[#D66B73]/20'
            : 'border-[#1F2E45]',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = 'Textarea';

export { Textarea };
