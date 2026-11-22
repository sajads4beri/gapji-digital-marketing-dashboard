'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
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
          'inline-flex items-center gap-2 cursor-pointer select-none text-xs sm:text-sm text-slate-200',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        <span className="relative flex items-center justify-center">
          <input
            type="checkbox"
            ref={ref}
            checked={checked}
            onChange={handleChange}
            disabled={disabled}
            className="peer sr-only"
            {...props}
          />
          <span
            className={cn(
              'h-4 w-4 shrink-0 rounded-md border border-[#1F2E45] bg-[#0B1423] transition-all duration-150 flex items-center justify-center',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-[#719BDF]/40 peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-[#080F1C]',
              'peer-checked:bg-[#719BDF] peer-checked:border-[#719BDF] peer-checked:text-[#080F1C]',
              'hover:border-[#719BDF]/50',
              className,
            )}
          >
            {checked && <Check className="h-3 w-3 stroke-[3]" />}
          </span>
        </span>
      </label>
    );
  },
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };
