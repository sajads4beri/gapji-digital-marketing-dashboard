'use client';

import * as React from 'react';
import Link from 'next/link';
import { FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface EmptyStateAction {
 label: string;
 onClick?: () => void;
 href?: string;
}

export interface EmptyStateProps {
 title?: string;
 description?: string;
 icon?: React.ReactNode;
 action?: EmptyStateAction | React.ReactNode;
 className?: string;
}

export function EmptyState({
 title = 'داده‌ای یافت نشد',
 description,
 icon,
 action,
 className = '',
}: EmptyStateProps) {
 const isCustomActionNode = React.isValidElement(action);
 const actionConfig = !isCustomActionNode
 ? (action as EmptyStateAction | undefined)
 : undefined;

 return (
 <div
 className={`flex flex-col items-center justify-center text-center p-6 sm:p-8 select-none ${className}`}
 dir="rtl"
 >
 <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 mb-3.5 shrink-0">
 {icon || <FolderOpen size={24} />}
 </div>

 {title && (
 <h4 className="text-sm sm:text-base font-bold text-gray-800 mb-1">
 {title}
 </h4>
 )}

 {description && (
 <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
 {description}
 </p>
 )}

 {action && (
 <div className="mt-4">
 {isCustomActionNode ? (
 action
 ) : actionConfig?.href ? (
 <Link href={actionConfig.href}>
 <Button size="sm" variant="primary">
 {actionConfig.label}
 </Button>
 </Link>
 ) : actionConfig?.onClick ? (
 <Button
 size="sm"
 variant="primary"
 onClick={actionConfig.onClick}
 >
 {actionConfig.label}
 </Button>
 ) : null}
 </div>
 )}
 </div>
 );
}
