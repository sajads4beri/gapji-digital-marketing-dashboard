'use client';

import * as React from 'react';
import { Calendar, CheckSquare, MessageSquare, Layers, Inbox, Video } from 'lucide-react';
import type { Task, StoredTaskStatus } from '../types';
import { TaskPriorityBadge } from './task-priority-badge';
import { TaskStatusBadge } from './task-status-badge';
import { isTaskOverdue, getOverdueDays, formatOverdueBadgeText } from '../utils/task-grouping';
import { isoToJalali, PERSIAN_MONTH_NAMES } from '@/lib/persian-date';

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
      className={`group relative p-3.5 bg-white hover:bg-slate-50/90 border rounded-xl shadow-2xs hover:shadow-xs transition-all cursor-pointer space-y-3 ${
        isDragging
          ? 'opacity-40 scale-95 border-blue-400 rotate-1 shadow-md bg-blue-50/30'
          : isDone
          ? 'opacity-70 bg-slate-50/50 border-slate-200'
          : 'border-slate-200 cursor-grab active:cursor-grabbing hover:border-blue-300'
      } ${className}`}
    >
      {/* هدر کارت: عنوان و اولویت */}
      <div className="flex items-start justify-between gap-2">
        <h4
          className={`text-sm font-medium leading-snug line-clamp-2 ${
            isDone ? 'line-through text-slate-400' : 'text-slate-900 group-hover:text-blue-600'
          }`}
        >
          {task.title}
        </h4>
        <TaskPriorityBadge priority={task.priority} />
      </div>

      {/* متادیتا: برچسب مرتبط و تاخیر */}
      <div className="flex items-center gap-2 flex-wrap">
        {task.relatedTo && (
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md max-w-[160px] truncate">
            {getRelatedIcon(task.relatedTo.type)}
            <span className="truncate">{task.relatedTo.title || task.relatedTo.id}</span>
          </span>
        )}

        {isOverdue && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            {formatOverdueBadgeText(overdueDays)}
          </span>
        )}
      </div>

      {/* فوتر کارت: زیرتسک‌ها، تاریخ و آواتار */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-2.5">
          {/* شمارنده زیرتسک‌ها */}
          {subtasksCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
              <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {completedSubtasksCount}/{subtasksCount}
              </span>
            </span>
          )}

          {/* کامنت‌ها */}
          {task.comments.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
              <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
              <span>{task.comments.length}</span>
            </span>
          )}

          {/* موعد سررسید */}
          {jalaliDueDate && (
            <span
              className={`inline-flex items-center gap-1 text-[11px] ${
                isOverdue ? 'text-rose-600 font-medium' : 'text-slate-500'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{jalaliDueDate}</span>
            </span>
          )}
        </div>

        {/* آواتار مسئول */}
        <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-medium text-slate-700 overflow-hidden shrink-0">
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
