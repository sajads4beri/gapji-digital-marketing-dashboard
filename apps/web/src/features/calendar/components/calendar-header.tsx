'use client';

import React from 'react';
import {
  ChevronRight,
  ChevronLeft,
  Calendar as CalendarIcon,
  Plus,
  RotateCcw,
  LayoutGrid,
  CalendarDays,
  ListFilter,
} from 'lucide-react';
import { CalendarViewMode } from '../types';
import { PERSIAN_MONTH_NAMES } from '@/lib/persian-date';

interface CalendarHeaderProps {
  currentYear: number;
  currentMonth: number; // 1-12
  subtitle?: string;
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onAddEvent: () => void;
  onResetData?: () => void;
  isTodayDisabled?: boolean;
}

export function CalendarHeader({
  currentYear,
  currentMonth,
  subtitle,
  viewMode,
  onViewModeChange,
  onPrevious,
  onNext,
  onToday,
  onAddEvent,
  onResetData,
  isTodayDisabled = false,
}: CalendarHeaderProps) {
  const monthName = PERSIAN_MONTH_NAMES[currentMonth - 1] || '';

  return (
    <div
      className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0F1B2D] border border-[#1E2F47] shadow-xl"
      dir="rtl"
    >
      {/* بخش ناوبری تاریخ و دکمه امروز */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 bg-[#090E17] p-1 rounded-xl border border-[#1E2F47]">
          {/* دکمه قبلی (در چیدمان راست‌به‌چپ، جهت راست معادل عقب‌گرد در زمان است) */}
          <button
            type="button"
            onClick={onPrevious}
            className="p-2 text-slate-300 hover:text-white hover:bg-[#1A2638] rounded-lg transition-all"
            title={viewMode === 'week' ? 'هفته قبل' : 'ماه قبل'}
            aria-label={viewMode === 'week' ? 'هفته قبل' : 'ماه قبل'}
          >
            <ChevronRight size={18} />
          </button>

          {/* دکمه بعدی (در چیدمان راست‌به‌چپ، جهت چپ معادل پیش‌روی در زمان است) */}
          <button
            type="button"
            onClick={onNext}
            className="p-2 text-slate-300 hover:text-white hover:bg-[#1A2638] rounded-lg transition-all"
            title={viewMode === 'week' ? 'هفته بعد' : 'ماه بعد'}
            aria-label={viewMode === 'week' ? 'هفته بعد' : 'ماه بعد'}
          >
            <ChevronLeft size={18} />
          </button>
        </div>

        <button
          type="button"
          onClick={onToday}
          disabled={isTodayDisabled}
          className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all ${
            isTodayDisabled
              ? 'bg-[#131D2D]/50 border-[#1E2F47] text-slate-500 cursor-default'
              : 'bg-[#152336] border-[#294066] text-slate-200 hover:text-white hover:bg-[#1C2F4A] hover:border-[#3B82F6]'
          }`}
          title="پرش به تاریخ امروز"
        >
          امروز
        </button>

        {/* عنوان ماه و سال شمسی */}
        <div className="flex items-center gap-2 mr-2">
          <CalendarIcon size={20} className="text-[#38BDF8]" />
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              {monthName} {currentYear.toLocaleString('fa-IR', { useGrouping: false })}
            </h2>
            {subtitle && (
              <div className="text-[11px] text-[#38BDF8] font-bold">
                {subtitle}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* بخش سوئیچ نما و دکمه افزودن رویداد */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* سوئیچ نما: ماه / هفته / فهرست */}
        <div className="flex items-center bg-[#090E17] p-1 rounded-xl border border-[#1E2F47]">
          <button
            type="button"
            onClick={() => onViewModeChange('month')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'month'
                ? 'bg-[#38BDF8] text-[#06090F] shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-[#152336]'
            }`}
          >
            <LayoutGrid size={15} />
            <span>ماه</span>
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange('week')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'week'
                ? 'bg-[#38BDF8] text-[#06090F] shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-[#152336]'
            }`}
          >
            <CalendarDays size={15} />
            <span>هفته</span>
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'list'
                ? 'bg-[#38BDF8] text-[#06090F] shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-[#152336]'
            }`}
          >
            <ListFilter size={15} />
            <span>فهرست</span>
          </button>
        </div>

        {/* دکمه بازنشانی آزمایشی */}
        {onResetData && (
          <button
            type="button"
            onClick={onResetData}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-[#152336] border border-[#1E2F47] rounded-xl transition-all"
            title="بازنشانی داده‌های نمونه تقویم"
          >
            <RotateCcw size={16} />
          </button>
        )}

        {/* دکمه ایجاد رویداد / تسک جدید */}
        <button
          type="button"
          onClick={onAddEvent}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#1D4ED8] hover:to-[#1E40AF] text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-900/30 transition-all transform active:scale-95"
        >
          <Plus size={16} />
          <span>رویداد جدید</span>
        </button>
      </div>
    </div>
  );
}
