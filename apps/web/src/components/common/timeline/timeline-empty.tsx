import * as React from 'react';
import { Clock } from 'lucide-react';
import { EmptyState } from '../empty-state';

export interface TimelineEmptyProps {
 title?: string;
 description?: string;
 icon?: React.ReactNode;
 className?: string;
}

export function TimelineEmpty({
 title = 'رویدادی ثبت نشده است',
 description = 'هنوز هیچ رخداد یا فعالیتی در این بخش ثبت نشده است.',
 icon,
 className = '',
}: TimelineEmptyProps) {
 return (
 <EmptyState
 title={title}
 description={description}
 icon={icon || <Clock className="w-6 h-6 text-slate-400" aria-hidden="true" />}
 className={`border border-dashed border-slate-200 rounded-xl bg-slate-50/50 ${className}`}
 />
 );
}
