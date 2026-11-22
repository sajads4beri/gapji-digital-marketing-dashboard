'use client';

import * as React from 'react';
import type { Task, TaskStatus } from '../types';
import { TASK_STATUS_MAP } from '../types';
import { computeTaskDisplayStatus, getOverdueDays, formatOverdueBadgeText } from '../utils/task-grouping';

export interface TaskStatusBadgeProps {
  status?: TaskStatus;
  task?: Task;
  referenceDate?: Date | string;
  showDot?: boolean;
  showOverdueDays?: boolean;
  className?: string;
}

export function TaskStatusBadge({
  status,
  task,
  referenceDate,
  showDot = true,
  showOverdueDays = false,
  className = '',
}: TaskStatusBadgeProps) {
  // اگر تسک پاس داده شده باشد، وضعیت نمایشی محاسبه می‌شود؛ در غیر این صورت از status ورودی استفاده می‌شود
  const computedStatus: TaskStatus = React.useMemo(() => {
    if (task) {
      return computeTaskDisplayStatus(task, referenceDate);
    }
    return status || 'todo';
  }, [task, status, referenceDate]);

  const config = TASK_STATUS_MAP[computedStatus] || TASK_STATUS_MAP.todo;

  // اگر عقب‌افتاده باشد و درخواست نمایش تعداد روز تأخیر شده باشد
  const overdueText = React.useMemo(() => {
    if (computedStatus === 'overdue' && showOverdueDays && task) {
      const days = getOverdueDays(task, referenceDate);
      return formatOverdueBadgeText(days);
    }
    return null;
  }, [computedStatus, showOverdueDays, task, referenceDate]);

  const displayText = overdueText || config.label;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border select-none transition-colors ${config.badgeClassName} ${className}`}
      dir="rtl"
    >
      {showDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dotClassName}`}
          aria-hidden="true"
        />
      )}
      <span>{displayText}</span>
    </span>
  );
}
