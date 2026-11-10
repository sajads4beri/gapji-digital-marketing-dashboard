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
            className={`w-full px-4 py-2.5 text-sm bg-white border rounded-xl shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-60 disabled:cursor-not-allowed ${
              errorMessage
                ? 'border-rose-300 focus:ring-rose-500 focus:border-rose-500'
                : 'border-slate-300 hover:border-slate-400'
            }`}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !title.trim()}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          <span>افزودن</span>
        </button>
      </form>

      {errorMessage && (
        <p className="mt-1.5 text-xs text-rose-600 pr-1 animate-in fade-in duration-150">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
