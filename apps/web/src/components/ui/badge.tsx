'use client';

import * as React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
 variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success';
}

const variantStyles: Record<NonNullable<BadgeProps['variant']>, string> = {
 default:
 'bg-blue-600 text-white hover:bg-blue-700 border-transparent',
 secondary:
 'bg-gray-100 text-gray-800 border-transparent',
 destructive:
 'bg-red-500 text-white hover:bg-red-600 border-transparent',
 outline:
 'border border-gray-200 text-gray-800 bg-transparent',
 success:
 'bg-emerald-50 text-emerald-700 border border-emerald-200 ',
};

export function Badge({
 className = '',
 variant = 'default',
 ...props
}: BadgeProps) {
 return (
 <div
 className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${variantStyles[variant]} ${className}`}
 {...props}
 />
 );
}
