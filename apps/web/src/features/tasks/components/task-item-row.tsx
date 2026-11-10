'use client';

import * as React from 'react';
import {
  Calendar,
  Check,
  CheckSquare,
  MessageSquare,
  FileText,
  Layers,
  Inbox,
  Video,
  Loader2,
} from 'lucide-react';
import type { Task } from '../types';
import { TaskStatusBadge } from './task-status-badge';
import { TaskPriorityBadge } from './task-priority-badge';
import { isTaskOverdue, getOverdueDays, formatOverdueBadgeText } from '../utils/task-grouping';
import { isoToJalali, PERSIAN_MONTH_NAMES } from '@/lib/persian-date';

export interface TaskItemRowProps {
  task: Task;
  onOpenDetails?: (task: Task) => void;
  onToggleComplete?: (task: Task, completed: boolean) => void;
  isToggling?: boolean;
  referenceDate?: Date | string;
  className?: string;
}

export function TaskItemRow({
  task,
  onOpenDetails,
  onToggleComplete,
  isToggling = false,
  referenceDate,
  className = '',
}: TaskItemRowProps) {
  const isDone = task.status === 'done';
  const isOverdue = isTaskOverdue(task, referenceDate);
  const overdueDays = isOverdue ? getOverdueDays(task, referenceDate) : 0;

  // فرمت‌بندی تاریخ سررسید به تقویم شمسی
  const jalaliDueDate = React.useMemo(() => {
    if (!task.dueDate) return '';
    const dateOnly = task.dueDate.split('T')[0];
    const j = isoToJalali(dateOnly);
    return j.isValid ? `${j.day} ${PERSIAN_MONTH_NAMES[j.month - 1] || ''}` : dateOnly;
  }, [task.dueDate]);

  // آمار زیرتسک‌ها
  const subtasksCount = task.subtasks.length;
  const completedSubtasksCount = task.subtasks.filter((s) => s.completed).length;

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isToggling) return;
    if (onToggleComplete) {
      onToggleComplete(task, !isDone);
    }
  };

  const handleRowClick = () => {
    if (onOpenDetails) {
      onOpenDetails(task);
    }
  };

  const getRelatedIcon = (type?: string) => {
    switch (type) {
      case 'campaign':
        return <Layers className="w-3.5 h-3.5 text-blue-500" />;
      case 'lead':
        return <Inbox className="w-3.5 h-3.5 text-emerald-500" />;
      case 'webinar':
        return <Video className="w-3.5 h-3.5 text-purple-500" />;
      default:
        return null;
    }
  };

  return (
    <div
      onClick={handleRowClick}
      dir="rtl"
      className={`group relative flex items-center justify-between p-3.5 sm:p-4 bg-white hover:bg-slate-50/80 border border-slate-200/80 rounded-xl transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-xs gap-3 ${
        isDone ? 'bg-slate-50/50' : ''
      } ${className}`}
    >
      {/* بخش راست: چک‌باکس و مشخصات تسک */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* چک‌باکس سفارشی تکمیل تسک */}
        <button
          type="button"
          onClick={handleCheckboxClick}
          disabled={isToggling}
          aria-label={isDone ? 'علامت به عنوان انجام‌نشده' : 'علامت به عنوان انجام‌شده'}
          className={`shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
            isDone
              ? 'bg-emerald-600 border-emerald-600 text-white'
              : 'border-slate-300 hover:border-blue-500 bg-white'
          } ${isToggling ? 'opacity-60 cursor-wait' : ''}`}
        >
          {isToggling ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
          ) : isDone ? (
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
          ) : null}
        </button>

        {/* عنوان و متادیتا */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-sm font-medium transition-colors ${
                isDone
                  ? 'line-through text-slate-400'
                  : 'text-slate-900 group-hover:text-blue-600'
              }`}
            >
              {task.title}
            </span>

            {/* برچسب اولویت */}
            <TaskPriorityBadge priority={task.priority} />

            {/* برچسب تأخیر در صورت عقب‌افتادگی */}
            {isOverdue && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                {formatOverdueBadgeText(overdueDays)}
              </span>
            )}
          </div>

          {/* ردیف دوم مشخصات: موجودیت مرتبط، زیرتسک‌ها، کامنت‌ها */}
          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 flex-wrap">
            {/* موجودیت مرتبط (کمپین / لید / وبینار) */}
            {task.relatedTo && (
              <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100/80 px-2 py-0.5 rounded-md">
                {getRelatedIcon(task.relatedTo.type)}
                <span className="max-w-[140px] truncate">
                  {task.relatedTo.title || task.relatedTo.id}
                </span>
              </span>
            )}

            {/* نشان SOP */}
            {task.sop && (
              <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100/80 px-2 py-0.5 rounded-md">
                <FileText className="w-3.5 h-3.5 text-amber-500" />
                <span className="max-w-[120px] truncate">
                  {task.sop.title || 'SOP'}
                </span>
              </span>
            )}

            {/* چک‌لیست زیرتسک‌ها */}
            {subtasksCount > 0 && (
              <span className="inline-flex items-center gap-1 text-slate-500">
                <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {completedSubtasksCount} از {subtasksCount}
                </span>
              </span>
            )}

            {/* تعداد کامنت‌ها */}
            {task.comments.length > 0 && (
              <span className="inline-flex items-center gap-1 text-slate-500">
                <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                <span>{task.comments.length}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* بخش چپ: تاریخ سررسید و آواتار مسئول */}
      <div className="flex items-center gap-3 shrink-0 mr-2">
        {/* وضعیت تسک در صورتی که عقب‌افتاده نباشد */}
        {!isOverdue && (
          <div className="hidden sm:block">
            <TaskStatusBadge status={task.status} />
          </div>
        )}

        {/* تاریخ سررسید */}
        {jalaliDueDate && (
          <div
            className={`flex items-center gap-1 text-xs select-none ${
              isOverdue
                ? 'text-rose-600 font-medium'
                : isDone
                ? 'text-slate-400'
                : 'text-slate-500'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{jalaliDueDate}</span>
          </div>
        )}

        {/* آواتار مسئول */}
        <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-medium text-slate-700 overflow-hidden shrink-0">
          {task.assignee ? (
            task.assignee.avatarUrl ? (
              <img
                src={task.assignee.avatarUrl}
                alt={task.assignee.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{task.assignee.name.substring(0, 1)}</span>
            )
          ) : (
            <span className="text-[10px] text-slate-400">—</span>
          )}
        </div>
      </div>
    </div>
  );
}
