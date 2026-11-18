'use client';

import * as React from 'react';
import type { TaskPriority } from '../types';
import { TASK_PRIORITY_MAP } from '../types';

export interface TaskPriorityBadgeProps {
  priority?: TaskPriority;
  className?: string;
  showIcon?: boolean;
}

export function TaskPriorityBadge({
  priority = 'medium',
  className = '',
  showIcon = false,
}: TaskPriorityBadgeProps) {
  const config = TASK_PRIORITY_MAP[priority] || TASK_PRIORITY_MAP.medium;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border select-none transition-colors ${config.badgeClassName} ${className}`}
      dir="rtl"
    >
      {showIcon && (
        <span
          className="text-xs font-bold leading-none"
          aria-hidden="true"
        >
          {priority === 'urgent' ? '🔥' : priority === 'high' ? '⚡' : '•'}
        </span>
      )}
      <span>{config.label}</span>
    </span>
  );
}
