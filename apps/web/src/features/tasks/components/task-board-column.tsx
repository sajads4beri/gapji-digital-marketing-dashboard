'use client';

import * as React from 'react';
import type { Task, StoredTaskStatus } from '../types';
import { TASK_STATUS_MAP } from '../types';
import { TaskCard } from './task-card';

export interface TaskBoardColumnProps {
  status: StoredTaskStatus;
  tasks: Task[];
  count: number;
  isDragOver?: boolean;
  draggingTaskId?: string | null;
  onDragStart?: (e: React.DragEvent, taskId: string) => void;
  onDragEnd?: () => void;
  onDragOver?: (status: StoredTaskStatus) => void;
  onDragLeave?: () => void;
  onDrop?: (taskId: string, targetStatus: StoredTaskStatus) => void;
  onOpenDetails?: (task: Task) => void;
  onMobileStatusChange?: (taskId: string, newStatus: StoredTaskStatus) => void;
  referenceDate?: Date | string;
}

const COLUMN_COLORS: Record<
  StoredTaskStatus,
  {
    headerBg: string;
    borderTop: string;
    dot: string;
    badgeBg: string;
    badgeText: string;
  }
> = {
  todo: {
    headerBg: 'bg-slate-50/80',
    borderTop: 'border-t-slate-500',
    dot: 'bg-slate-500',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-700',
  },
  in_progress: {
    headerBg: 'bg-blue-50/60',
    borderTop: 'border-t-blue-500',
    dot: 'bg-blue-500',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-800',
  },
  waiting: {
    headerBg: 'bg-amber-50/60',
    borderTop: 'border-t-amber-500',
    dot: 'bg-amber-500',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
  },
  done: {
    headerBg: 'bg-emerald-50/60',
    borderTop: 'border-t-emerald-500',
    dot: 'bg-emerald-500',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
  },
};

export function TaskBoardColumn({
  status,
  tasks,
  count,
  isDragOver = false,
  draggingTaskId = null,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onOpenDetails,
  onMobileStatusChange,
  referenceDate,
}: TaskBoardColumnProps) {
  const config = TASK_STATUS_MAP[status] || TASK_STATUS_MAP.todo;
  const colStyle = COLUMN_COLORS[status] || COLUMN_COLORS.todo;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    onDragOver?.(status);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggingTaskId;
    if (taskId && onDrop) {
      onDrop(taskId, status);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={onDragLeave}
      onDrop={handleDrop}
      dir="rtl"
      className={`flex flex-col rounded-2xl border bg-slate-50/50 p-3 min-w-[280px] sm:min-w-[300px] flex-1 transition-all duration-200 border-t-4 ${
        colStyle.borderTop
      } ${
        isDragOver
          ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-300 shadow-md'
          : 'border-slate-200/90 hover:border-slate-300'
      }`}
    >
      {/* هدر ستون */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${colStyle.dot}`}
            aria-hidden="true"
          />
          <h3 className="text-sm font-bold text-slate-800">{config.label}</h3>
        </div>

        <span
          className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold rounded-full ${
            colStyle.badgeBg
          } ${colStyle.badgeText}`}
        >
          {count}
        </span>
      </div>

      {/* لیست کارت‌های داخل ستون */}
      <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[calc(100vh-280px)] min-h-[140px] pr-0.5">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-28 border border-dashed border-slate-200 rounded-xl text-center p-3">
            <p className="text-xs text-slate-400 select-none">
              تسکی در این وضعیت نیست
            </p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isDragging={draggingTaskId === task.id}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onOpenDetails={onOpenDetails}
              onMobileStatusChange={onMobileStatusChange}
              referenceDate={referenceDate}
            />
          ))
        )}
      </div>
    </div>
  );
}
