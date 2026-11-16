'use client';

import * as React from 'react';
import { Plus, Loader2 } from 'lucide-react';
import type { Task } from '../types';
import { taskService } from '../api';
import { toEndOfDay } from '../utils/task-grouping';

export interface TaskQuickAddProps {
  onTaskCreated?: (task: Task) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export function TaskQuickAdd({
  onTaskCreated,
  placeholder = 'افزودن تسک جدید... (عنوان را بنویسید و Enter بزنید)',
  className = '',
  autoFocus = false,
}: TaskQuickAddProps) {
  const [title, setTitle] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setErrorMessage('لطفاً عنوان تسک را وارد کنید.');
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // ایجاد تسک با مقادیر پیش‌فرض مصوب محصول: وضعیت todo، اولویت medium، سررسید امروز، بدون مسئول
      const todayDue = toEndOfDay(new Date()).toISOString();
      const newTask = await taskService.create({
        title: trimmedTitle,
        dueDate: todayDue,
        priority: 'medium',
        status: 'todo',
        assignee: undefined,
      });

      setTitle('');
      if (onTaskCreated) {
        onTaskCreated(newTask);
      }

      // بازگرداندن فوکوس به اینپوت برای ورود تسک بعدی
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } catch (err: any) {
      console.error('Error creating quick task:', err);
      setErrorMessage(err?.message || 'خطا در ثبت سریع تسک.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={`w-full ${className}`} dir="rtl">
      <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isSubmitting}
            autoFocus={autoFocus}
            className={`w-full px-4 py-2.5 text-xs sm:text-sm bg-[#0B1423] border rounded-xl shadow-xs transition-all text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#719BDF]/30 focus:border-[#719BDF] disabled:opacity-60 disabled:cursor-not-allowed ${
              errorMessage
                ? 'border-[#D66B73] focus:ring-[#D66B73]/30 focus:border-[#D66B73]'
                : 'border-[#1F2E45] hover:border-[#1F2E45]/80'
            }`}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !title.trim()}
          className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#719BDF] to-[#3B82F6] hover:brightness-110 active:brightness-95 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all shrink-0 shadow-[0_0_15px_rgba(113,155,223,0.2)] focus:outline-none focus:ring-1 focus:ring-[#719BDF]"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" strokeWidth={2.5} />
          )}
          <span>افزودن تسک</span>
        </button>
      </form>

      {errorMessage && (
        <p className="mt-1.5 text-xs text-[#D66B73] font-medium ps-1 animate-in fade-in duration-150">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
