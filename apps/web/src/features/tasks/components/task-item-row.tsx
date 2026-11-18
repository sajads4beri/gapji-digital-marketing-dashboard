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
      className={`group relative flex items-center justify-between p-3.5 sm:p-4 bg-[#111D2E] hover:bg-[#18263A] border border-[#1F2E45] rounded-2xl transition-all duration-150 cursor-pointer shadow-md hover:shadow-lg gap-3 ${
        isDone ? 'opacity-70 bg-[#111D2E]/60' : ''
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
          className={`shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-colors focus:outline-none focus:ring-1 focus:ring-[#719BDF] ${
            isDone
              ? 'bg-emerald-500 border-emerald-500 text-white'
              : 'border-[#1F2E45] hover:border-[#719BDF] bg-[#0B1423]'
          } ${isToggling ? 'opacity-60 cursor-wait' : ''}`}
        >
          {isToggling ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
          ) : isDone ? (
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
          ) : null}
        </button>

        {/* عنوان و متادیتا */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-xs sm:text-sm font-semibold transition-colors ${
                isDone
                  ? 'line-through text-slate-500'
                  : 'text-slate-100 group-hover:text-[#719BDF]'
              }`}
            >
              {task.title}
            </span>

            {/* برچسب اولویت */}
            <TaskPriorityBadge priority={task.priority} />

            {/* برچسب تأخیر در صورت عقب‌افتادگی */}
            {isOverdue && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#D66B73]/15 text-[#D66B73] border border-[#D66B73]/30">
                {formatOverdueBadgeText(overdueDays)}
              </span>
            )}
          </div>

          {/* ردیف دوم مشخصات: موجودیت مرتبط، زیرتسک‌ها، کامنت‌ها */}
          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400 flex-wrap">
            {/* موجودیت مرتبط (کمپین / لید / وبینار) */}
            {task.relatedTo && (
              <span className="inline-flex items-center gap-1 text-slate-300 bg-[#18263A] border border-[#1F2E45] px-2 py-0.5 rounded-lg text-[11px]">
                {getRelatedIcon(task.relatedTo.type)}
                <span className="max-w-[140px] truncate">
                  {task.relatedTo.title || task.relatedTo.id}
                </span>
              </span>
            )}

            {/* نشان SOP */}
            {task.sop && (
              <span className="inline-flex items-center gap-1 text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-lg text-[11px]">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span className="max-w-[120px] truncate">
                  {task.sop.title || 'SOP'}
                </span>
              </span>
            )}

            {/* چک‌لیست زیرتسک‌ها */}
            {subtasksCount > 0 && (
              <span className="inline-flex items-center gap-1 text-slate-400 text-[11px]">
                <CheckSquare className="w-3.5 h-3.5 text-slate-500" />
                <span>
                  {completedSubtasksCount} از {subtasksCount}
                </span>
              </span>
            )}

            {/* تعداد کامنت‌ها */}
            {task.comments.length > 0 && (
              <span className="inline-flex items-center gap-1 text-slate-400 text-[11px]">
                <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                <span>{task.comments.length}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* بخش چپ: تاریخ سررسید و آواتار مسئول */}
      <div className="flex items-center gap-3 shrink-0 ms-2">
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
                ? 'text-[#D66B73] font-bold'
                : isDone
                ? 'text-slate-500'
                : 'text-slate-400'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{jalaliDueDate}</span>
          </div>
        )}

        {/* آواتار مسئول */}
        <div className="w-7 h-7 rounded-full bg-[#18263A] border border-[#1F2E45] flex items-center justify-center text-xs font-bold text-slate-300 overflow-hidden shrink-0">
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
            <span className="text-[10px] text-slate-500">—</span>
          )}
        </div>
      </div>
    </div>
  );
}
