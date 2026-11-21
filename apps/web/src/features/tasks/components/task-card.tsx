'use client';

import * as React from 'react';
import { Calendar, CheckSquare, MessageSquare, Layers, Inbox, Video, Target, Filter } from 'lucide-react';
import type { Task, StoredTaskStatus } from '../types';
import { TaskPriorityBadge } from './task-priority-badge';
import { TaskStatusBadge } from './task-status-badge';
import { isTaskOverdue, getOverdueDays, formatOverdueBadgeText } from '../utils/task-grouping';
import { isoToJalali, PERSIAN_MONTH_NAMES } from '@/lib/persian-date';

const FUNNEL_STAGE_LABELS: Record<string, string> = {
  awareness: 'آگاهی',
  interest: 'علاقه‌مندی',
  consideration: 'بررسی',
  intent: 'قصد خرید',
  evaluation: 'ارزیابی',
  purchase: 'خرید موفق',
};

export interface TaskCardProps {
  task: Task;
  onOpenDetails?: (task: Task) => void;
  referenceDate?: Date | string;
  isDraggable?: boolean;
  isDragging?: boolean;
  onDragStart?: (e: React.DragEvent, taskId: string) => void;
  onDragEnd?: () => void;
  onMobileStatusChange?: (taskId: string, newStatus: StoredTaskStatus) => void;
  className?: string;
}

export function TaskCard({
  task,
  onOpenDetails,
  referenceDate,
  isDraggable = true,
  isDragging = false,
  onDragStart,
  onDragEnd,
  onMobileStatusChange,
  className = '',
}: TaskCardProps) {
  const isDone = task.status === 'done';
  const isOverdue = isTaskOverdue(task, referenceDate);
  const overdueDays = isOverdue ? getOverdueDays(task, referenceDate) : 0;

  const jalaliDueDate = React.useMemo(() => {
    if (!task.dueDate) return '';
    const dateOnly = task.dueDate.split('T')[0];
    const j = isoToJalali(dateOnly);
    return j.isValid ? `${j.day} ${PERSIAN_MONTH_NAMES[j.month - 1] || ''}` : dateOnly;
  }, [task.dueDate]);

  const subtasksCount = task.subtasks.length;
  const completedSubtasksCount = task.subtasks.filter((s) => s.completed).length;

  const handleClick = () => {
    if (onOpenDetails) {
      onOpenDetails(task);
    }
  };

  const getRelatedIcon = (type?: string) => {
    switch (type) {
      case 'campaign':
        return <Layers className="w-3 h-3 text-blue-500" />;
      case 'lead':
        return <Inbox className="w-3 h-3 text-emerald-500" />;
      case 'webinar':
        return <Video className="w-3 h-3 text-purple-500" />;
      default:
        return null;
    }
  };

  return (
    <div
      onClick={handleClick}
      draggable={isDraggable && !isDone}
      onDragStart={(e) => {
        if (!isDraggable || isDone) return;
        try {
          e.dataTransfer.setData('text/plain', task.id);
          e.dataTransfer.effectAllowed = 'move';
        } catch {
          // ignore in environments without full dataTransfer support
        }
        onDragStart?.(e, task.id);
      }}
      onDragEnd={onDragEnd}
      dir="rtl"
      className={`group relative p-3.5 bg-[#111D2E] hover:bg-[#18263A] border rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer space-y-3 ${
        isDragging
          ? 'opacity-40 scale-95 border-[#719BDF] rotate-1 shadow-xl bg-[#18263A]'
          : isDone
          ? 'opacity-70 bg-[#111D2E]/60 border-[#1F2E45]'
          : 'border-[#1F2E45] cursor-grab active:cursor-grabbing hover:border-[#719BDF]/40'
      } ${className}`}
    >
      {/* هدر کارت: عنوان و اولویت */}
      <div className="flex items-start justify-between gap-2">
        <h4
          className={`text-xs sm:text-sm font-semibold leading-snug line-clamp-2 ${
            isDone ? 'line-through text-slate-500' : 'text-slate-100 group-hover:text-[#719BDF]'
          }`}
        >
          {task.title}
        </h4>
        <TaskPriorityBadge priority={task.priority} />
      </div>

      {/* متادیتا: برچسب مرتبط و تاخیر */}
      <div className="flex items-center gap-2 flex-wrap">
        {task.relatedTo && (
          <span className="inline-flex items-center gap-1 text-[11px] text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-lg max-w-[160px] truncate">
            {getRelatedIcon(task.relatedTo.type)}
            <span className="truncate">{task.relatedTo.title || task.relatedTo.id}</span>
          </span>
        )}

        {task.okr?.stageKey && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-300 bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 rounded-md">
            <Filter className="w-2.5 h-2.5 text-purple-400" />
            <span>قیف: {FUNNEL_STAGE_LABELS[task.okr.stageKey] || task.okr.stageKey}</span>
          </span>
        )}

        {task.okr?.keyResultTitle && (
          <span
            className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-md max-w-[140px] truncate"
            title={task.okr.keyResultTitle}
          >
            <Target className="w-2.5 h-2.5 text-emerald-400" />
            <span className="truncate">KR: {task.okr.keyResultTitle}</span>
          </span>
        )}

        {isOverdue && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-bold bg-[#D66B73]/15 text-[#D66B73] border border-[#D66B73]/30">
            {formatOverdueBadgeText(overdueDays)}
          </span>
        )}
      </div>

      {/* فوتر کارت: زیرتسک‌ها، تاریخ و آواتار */}
      <div className="flex items-center justify-between pt-2 border-t border-[#1F2E45] text-xs text-slate-400">
        <div className="flex items-center gap-2.5">
          {/* شمارنده زیرتسک‌ها */}
          {subtasksCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
              <CheckSquare className="w-3.5 h-3.5 text-slate-500" />
              <span>
                {completedSubtasksCount}/{subtasksCount}
              </span>
            </span>
          )}

          {/* کامنت‌ها */}
          {task.comments.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
              <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
              <span>{task.comments.length}</span>
            </span>
          )}

          {/* موعد سررسید */}
          {jalaliDueDate && (
            <span
              className={`inline-flex items-center gap-1 text-[11px] ${
                isOverdue ? 'text-[#D66B73] font-bold' : 'text-slate-400'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{jalaliDueDate}</span>
            </span>
          )}
        </div>

        {/* آواتار مسئول */}
        <div className="w-6 h-6 rounded-full bg-[#18263A] border border-[#1F2E45] flex items-center justify-center text-[10px] font-bold text-slate-300 overflow-hidden shrink-0">
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
            <span className="text-[9px] text-slate-400">—</span>
          )}
        </div>
      </div>

      {/* منوی تغییر وضعیت سریع در موبایل / بدون درگ */}
      {onMobileStatusChange && (
        <div
          className="sm:hidden pt-2 border-t border-slate-100 flex items-center justify-between"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-[10px] text-slate-500 font-medium">انتقال به:</span>
          <select
            value={task.status}
            onChange={(e) => onMobileStatusChange(task.id, e.target.value as StoredTaskStatus)}
            className="text-[11px] bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="todo">انجام نشده</option>
            <option value="in_progress">در جریان</option>
            <option value="waiting">در انتظار</option>
            <option value="done">انجام شد</option>
          </select>
        </div>
      )}
    </div>
  );
}
