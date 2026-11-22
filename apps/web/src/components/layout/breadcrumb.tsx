'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChevronLeft, Home, LayoutDashboard } from 'lucide-react';

export interface BreadcrumbItem {
 label: string;
 href?: string;
}

export interface BreadcrumbProps {
 items: BreadcrumbItem[];
 showHomeIcon?: boolean;
 className?: string;
}

export function Breadcrumb({
 items,
 showHomeIcon = true,
 className = '',
}: BreadcrumbProps) {
 if (!items || items.length === 0) return null;

 return (
 <nav
 aria-label="مسیر راهنما (Breadcrumb)"
 className={`flex items-center gap-1.5 text-xs text-gray-500 flex-wrap select-none ${className}`}
 dir="rtl"
 >
 {showHomeIcon && (
 <Link
 href="/"
 className="flex items-center gap-1 hover:text-blue-600 transition-colors"
 title="بازگشت به صفحه خانه"
 >
 <Home size={13} className="shrink-0" />
 <span className="hidden sm:inline">خانه</span>
 </Link>
 )}

 {showHomeIcon && items.length > 0 && (
 <ChevronLeft size={13} className="text-gray-400 shrink-0" />
 )}

 {items.map((item, index) => {
 const isLast = index === items.length - 1;

 if (isLast) {
 return (
 <span
 key={index}
 aria-current="page"
 className="text-gray-900 font-bold truncate max-w-[220px]"
 >
 {item.label}
 </span>
 );
 }

 return (
 <React.Fragment key={index}>
 {item.href ? (
 <Link
 href={item.href}
 className="hover:text-blue-600 transition-colors truncate max-w-[160px]"
 >
 {item.label}
 </Link>
 ) : (
 <span className="text-gray-500 truncate max-w-[160px]">
 {item.label}
 </span>
 )}
 <ChevronLeft size={13} className="text-gray-400 shrink-0" />
 </React.Fragment>
 );
 })}
 </nav>
 );
}
