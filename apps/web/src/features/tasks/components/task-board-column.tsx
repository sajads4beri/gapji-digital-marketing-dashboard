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
    headerBg: 'bg-[#111D2E]/80',
    borderTop: 'border-t-slate-500',
    dot: 'bg-slate-400',
    badgeBg: 'bg-[#18263A]',
    badgeText: 'text-slate-300',
  },
  in_progress: {
    headerBg: 'bg-[#111D2E]/80',
    borderTop: 'border-t-[#719BDF]',
    dot: 'bg-[#719BDF]',
    badgeBg: 'bg-[#719BDF]/20',
    badgeText: 'text-[#719BDF]',
  },
  waiting: {
    headerBg: 'bg-[#111D2E]/80',
    borderTop: 'border-t-amber-400',
    dot: 'bg-amber-400',
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-amber-400',
  },
  done: {
    headerBg: 'bg-[#111D2E]/80',
    borderTop: 'border-t-emerald-400',
    dot: 'bg-emerald-400',
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-400',
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
      className={`flex flex-col rounded-2xl border bg-[#0B1423]/70 p-3.5 min-w-[280px] sm:min-w-[300px] flex-1 h-[calc(100vh-270px)] min-h-[500px] max-h-[720px] transition-all duration-200 border-t-4 ${
        colStyle.borderTop
      } ${
        isDragOver
          ? 'bg-[#18263A] border-[#719BDF] ring-2 ring-[#719BDF]/40 shadow-xl'
          : 'border-[#1F2E45] hover:border-[#1F2E45]/80'
      }`}
    >
      {/* هدر ستون */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#1F2E45] shrink-0">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${colStyle.dot}`}
            aria-hidden="true"
          />
          <h3 className="text-sm font-bold text-slate-100">{config.label}</h3>
        </div>

        <span
          className={`inline-flex items-center justify-center min-w-[20px] h-5 px-2 text-xs font-bold rounded-full ${
            colStyle.badgeBg
          } ${colStyle.badgeText}`}
        >
          {count}
        </span>
      </div>

      {/* لیست کارت‌های داخل ستون - اسکرول عمودی درون هر باکس */}
      <div className="flex-1 space-y-2.5 overflow-y-auto pe-1.5 scrollbar-thin min-h-[140px]">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-28 border border-dashed border-[#1F2E45] rounded-xl text-center p-3">
            <p className="text-xs text-slate-500 select-none">
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
