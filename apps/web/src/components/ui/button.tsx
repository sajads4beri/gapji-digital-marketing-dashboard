'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps
 extends React.ButtonHTMLAttributes<HTMLButtonElement> {
 variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
 size?: 'sm' | 'md' | 'lg';
 isLoading?: boolean;
 icon?: React.ReactNode;
 iconPosition?: 'left' | 'right';
}

const variantStyles: Record<NonNullable<ButtonProps['variant']>, string> = {
 primary:
 'bg-blue-600 hover:bg-blue-700 text-white border-transparent shadow-sm focus:ring-blue-500',
 secondary:
 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-transparent focus:ring-gray-400',
 outline:
 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 shadow-sm focus:ring-blue-500',
 ghost:
 'bg-transparent hover:bg-gray-100 text-gray-600 hover:text-gray-900 border-transparent focus:ring-gray-300',
 danger:
 'bg-red-600 hover:bg-red-700 text-white border-transparent shadow-sm focus:ring-red-500',
};

const sizeStyles: Record<NonNullable<ButtonProps['size']>, string> = {
 sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5',
 md: 'text-sm px-4 py-2 rounded-xl gap-2',
 lg: 'text-base px-5 py-2.5 rounded-xl gap-2.5',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
 (
 {
 className = '',
 variant = 'primary',
 size = 'md',
 isLoading = false,
 disabled = false,
 type = 'button',
 icon,
 iconPosition = 'right',
 children,
 ...props
 },
 ref,
 ) => {
 const isDisabled = disabled || isLoading;

 return (
 <button
 ref={ref}
 type={type}
 disabled={isDisabled}
 className={`inline-flex items-center justify-center font-bold border transition-colors select-none focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${
 variantStyles[variant]
 } ${sizeStyles[size]} ${className}`}
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
 {icon && iconPosition === 'right' && (
 <span className="shrink-0">{icon}</span>
 )}
 {children}
 {icon && iconPosition === 'left' && (
 <span className="shrink-0">{icon}</span>
 )}
 </>
 )}
 </button>
 );
 },
);

Button.displayName = 'Button';
