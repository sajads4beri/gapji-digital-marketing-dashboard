'use client';

import * as React from 'react';

export interface InputProps
 extends React.InputHTMLAttributes<HTMLInputElement> {
 label?: string;
 error?: string;
 helperText?: string;
 icon?: React.ReactNode;
 iconPosition?: 'left' | 'right';
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
 iconPosition = 'right',
 required = false,
 disabled = false,
 className = '',
 containerClassName = '',
 ...props
 },
 ref,
 ) => {
 const generatedId = React.useId();
 const id = customId || generatedId;

 const hasLeftIcon = icon && iconPosition === 'left';
 const hasRightIcon = icon && iconPosition === 'right';

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
 {hasRightIcon && (
 <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400 shrink-0">
 {icon}
 </div>
 )}

 <input
 ref={ref}
 id={id}
 required={required}
 disabled={disabled}
 className={`w-full text-right bg-white border rounded-xl text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:outline-none focus:ring-2 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed ${
 error
 ? 'border-red-400 focus:border-red-500 focus:ring-red-100 '
 : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100 '
 } ${hasRightIcon ? 'pr-10' : 'pr-3.5'} ${
 hasLeftIcon ? 'pl-10' : 'pl-3.5'
 } py-2.5 ${className}`}
 {...props}
 />

 {hasLeftIcon && (
 <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400 shrink-0">
 {icon}
 </div>
 )}
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

Input.displayName = 'Input';
