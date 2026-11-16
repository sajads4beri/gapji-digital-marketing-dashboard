'use client';

import * as React from 'react';

/**
 * تبدیل هر نوع رقم فارسی، عربی یا انگلیسی به رقم استاندارد انگلیسی
 * و حذف تمام کاراکترهای غیررقمی (شامل حروف، جداکننده‌ها و ...)
 * همچنین جلوگیری صریح از ورود مقادیر منفی
 */
export function normalizeToEnglishDigits(str: string): string {
  if (!str) return '';
  // رد صریح مقادیر منفی
  if (str.includes('-') || str.includes('−')) {
    return '';
  }
  return str
    .replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1776 + 48))
    .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1632 + 48))
    .replace(/[^0-9]/g, '');
}

/**
 * فرمت‌بندی مقدار عددی به صورت نمایش ارقام فارسی با جداکننده هزارگان
 */
export function formatMoneyDisplay(num: number | string | null | undefined): string {
  if (num === null || num === undefined || num === '') return '';
  const cleanStr =
    typeof num === 'number'
      ? Math.floor(Math.abs(num)).toString()
      : normalizeToEnglishDigits(num);
  if (!cleanStr) return '';

  const intVal = parseInt(cleanStr, 10);
  if (isNaN(intVal)) return '';

  return cleanStr === '0' ? '۰' : intVal.toLocaleString('fa-IR');
}

export interface MoneyInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'value' | 'onChange' | 'type'
  > {
  value?: number;
  onChange?: (val: number) => void;
  label?: string;
  error?: string;
  helperText?: string;
  unit?: string;
  containerClassName?: string;
}

export const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  (
    {
      id: customId,
      value,
      onChange,
      label,
      error,
      helperText,
      unit = 'تومان',
      required = false,
      disabled = false,
      placeholder = '۰',
      className = '',
      containerClassName = '',
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const id = customId || generatedId;

    // مقدار نمایشی رشته‌ای با جداکننده هزارگان و ارقام فارسی
    const [displayValue, setDisplayValue] = React.useState<string>(() => {
      if (value === undefined || value === null || value === 0) return '';
      return formatMoneyDisplay(value);
    });

    // همگام‌سازی نمایش در صورت تغییر مقدار عددی value از خارج کامپوننت
    React.useEffect(() => {
      if (value === undefined || value === null || value === 0) {
        setDisplayValue((prev) => {
          const currentNum = parseInt(normalizeToEnglishDigits(prev), 10) || 0;
          if (currentNum === 0 && (value === 0 || !value)) {
            return prev === '۰' ? '۰' : '';
          }
          if (value === 0) return '';
          return formatMoneyDisplay(value);
        });
      } else {
        const currentNum =
          parseInt(normalizeToEnglishDigits(displayValue), 10) || 0;
        if (currentNum !== value) {
          setDisplayValue(formatMoneyDisplay(value));
        }
      }
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawInput = e.target.value;
      const cleanDigits = normalizeToEnglishDigits(rawInput);

      if (!cleanDigits) {
        setDisplayValue('');
        onChange?.(0);
        return;
      }

      const numericValue = parseInt(cleanDigits, 10);
      const formatted =
        cleanDigits === '0' ? '۰' : numericValue.toLocaleString('fa-IR');

      setDisplayValue(formatted);
      onChange?.(numericValue);
    };

    return (
      <div className={`w-full flex flex-col gap-1.5 ${containerClassName}`}>
        {label && (
          <label
            htmlFor={id}
            className="block text-xs font-semibold text-slate-300 text-right select-none"
          >
            {label}
            {required && <span className="text-[#D66B73] ms-1">*</span>}
          </label>
        )}

        <div className="relative w-full">
          <input
            ref={ref}
            id={id}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            dir="rtl"
            value={displayValue}
            onChange={handleInputChange}
            required={required}
            disabled={disabled}
            placeholder={placeholder}
            className={`w-full text-right bg-[#111D2E] border rounded-xl text-xs font-medium text-slate-100 placeholder:text-slate-500 transition-colors focus:outline-none focus:ring-1 disabled:bg-[#0B1423] disabled:text-slate-600 disabled:cursor-not-allowed ${
              error
                ? 'border-[#D66B73] focus:border-[#D66B73] focus:ring-[#D66B73]/20'
                : 'border-[#1F2E45] focus:border-[#719BDF] focus:ring-[#719BDF]/20'
            } ps-3.5 pe-14 py-2.5 ${className}`}
            {...props}
          />

          {unit && (
            <div className="absolute inset-y-0 left-0 flex items-center pe-3.5 pointer-events-none text-xs font-semibold text-slate-400 select-none">
              {unit}
            </div>
          )}
        </div>

        {error ? (
          <p className="text-xs text-[#D66B73] text-right leading-relaxed animate-in fade-in">
            {error}
          </p>
        ) : helperText ? (
          <p className="text-xs text-slate-400 text-right leading-relaxed">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);

MoneyInput.displayName = 'MoneyInput';
