'use client';

import * as React from 'react';
import { PersianDatePicker } from '@/components/ui/persian-date-picker';

export interface PersianDateFieldProps {
  label: string;
  value: string; // ISO format: YYYY-MM-DD
  onChange: (isoDate: string) => void;
  error?: string;
  required?: boolean;
  minDate?: string; // ISO format
}

/**
 * کامپوننت تطبیق‌دهنده (Adapter) برای حفظ سازگاری کامل با کدهای ویزارد کمپین
 * این کامپوننت درخواست‌ها را به کامپوننت مشترک PersianDatePicker هدایت می‌کند.
 */
export function PersianDateField({
  label,
  value,
  onChange,
  error,
  required = false,
  minDate,
}: PersianDateFieldProps) {
  return (
    <PersianDatePicker
      mode="single"
      label={label}
      value={value}
      onChange={(iso) => onChange(typeof iso === 'string' ? iso : '')}
      error={error}
      required={required}
      minDate={minDate}
    />
  );
}
