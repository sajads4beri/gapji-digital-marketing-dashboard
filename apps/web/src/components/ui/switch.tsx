'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  (
    { className, checked = false, onCheckedChange, onChange, disabled, ...props },
    ref,
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e);
      onCheckedChange?.(e.target.checked);
    };

    return (
      <label
        className={cn(
          'inline-flex items-center cursor-pointer select-none',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        <span className="relative inline-flex items-center">
          <input
            type="checkbox"
            role="switch"
            ref={ref}
            checked={checked}
            onChange={handleChange}
            disabled={disabled}
            className="peer sr-only"
            {...props}
          />
          <span
            className={cn(
              'h-5 w-9 shrink-0 rounded-full border border-[#1F2E45] bg-[#18263A] transition-colors duration-200 ease-in-out p-0.5',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-[#719BDF]/40 peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-[#080F1C]',
              'peer-checked:bg-[#719BDF] peer-checked:border-[#719BDF]',
              className,
            )}
          >
            <span
              className={cn(
                'pointer-events-none block h-3.5 w-3.5 rounded-full bg-slate-300 shadow-md transition-transform duration-200 ease-in-out',
                checked
                  ? 'translate-x-4 bg-[#080F1C] rtl:-translate-x-4'
                  : 'translate-x-0',
              )}
            />
          </span>
        </span>
      </label>
    );
  },
);
Switch.displayName = 'Switch';

export { Switch };
