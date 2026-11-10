'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
 value: string;
 label: string;
 disabled?: boolean;
}

export interface SelectProps
 extends React.SelectHTMLAttributes<HTMLSelectElement> {
 label?: string;
 error?: string;
 helperText?: string;
 placeholder?: string;
 options?: SelectOption[];
 containerClassName?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
 (
 {
 id: customId,
 label,
 error,
 helperText,
 placeholder,
 options,
 required = false,
 disabled = false,
 className = '',
 containerClassName = '',
 children,
 ...props
 },
 ref,
 ) => {
 const generatedId = React.useId();
 const id = customId || generatedId;

 return (
 <div className={`w-full flex flex-col gap-1.5 ${containerClassName}`}>
 {label && (
 <label
 htmlFor={id}
 className="block text-xs font-semibold text-gray-700 text-right select-none"
 >
 {label}
 {required && <span className="text-red-500 mr-1">*</span>}
 </label>
 )}

 <div className="relative w-full">
 <select
 ref={ref}
 id={id}
 required={required}
 disabled={disabled}
 className={`w-full text-right bg-white border rounded-xl text-sm text-gray-900 transition-colors appearance-none cursor-pointer focus:outline-none focus:ring-2 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed ${
 error
 ? 'border-red-400 focus:border-red-500 focus:ring-red-100 '
 : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100 '
 } pr-3.5 pl-10 py-2.5 ${className}`}
 {...props}
 >
 {placeholder && (
 <option value="" disabled className=" ">
 {placeholder}
 </option>
 )}

 {options
 ? options.map((opt) => (
 <option
 key={opt.value}
 value={opt.value}
 disabled={opt.disabled}
 className=" "
 >
 {opt.label}
 </option>
 ))
 : children}
 </select>

 <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400 shrink-0">
 <ChevronDown size={16} />
 </div>
 </div>

 {error ? (
 <p className="text-xs text-red-600 text-right leading-relaxed animate-in fade-in">
 {error}
 </p>
 ) : helperText ? (
 <p className="text-xs text-gray-500 text-right leading-relaxed">
 {helperText}
 </p>
 ) : null}
 </div>
 );
 },
);

Select.displayName = 'Select';
