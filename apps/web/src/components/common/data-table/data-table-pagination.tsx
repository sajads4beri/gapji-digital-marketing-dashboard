'use client';

import * as React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

export interface DataTablePaginationProps {
  pageIndex: number; // ۱-based
  pageSize: number;
  totalItems: number;
  pageSizeOptions?: number[];
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newPageSize: number) => void;
  disabled?: boolean;
  className?: string;
}

export function DataTablePagination({
  pageIndex,
  pageSize,
  totalItems,
  pageSizeOptions = [20, 50, 100],
  onPageChange,
  onPageSizeChange,
  disabled = false,
  className = '',
}: DataTablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (pageIndex - 1) * pageSize + 1;
  const endItem = Math.min(totalItems, pageIndex * pageSize);

  const canPrev = pageIndex > 1 && !disabled;
  const canNext = pageIndex < totalPages && !disabled;

  return (
    <div
      className={`px-4 py-3 border-t border-[#1F2E45] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 bg-[#0B1423]/90 select-none transition-colors ${className}`}
    >
      {/* آمار رکوردها */}
      <div className="flex items-center gap-1.5 order-2 sm:order-1">
        <span>نمایش</span>
        <span className="font-bold text-slate-200 font-display">
          {startItem.toLocaleString('fa-IR')}
        </span>
        <span>تا</span>
        <span className="font-bold text-slate-200 font-display">
          {endItem.toLocaleString('fa-IR')}
        </span>
        <span>از</span>
        <span className="font-bold text-slate-200 font-display">
          {totalItems.toLocaleString('fa-IR')}
        </span>
        <span>رکورد</span>
      </div>

      {/* ابزارهای صفحه‌بندی و اندازه صفحه */}
      <div className="flex items-center gap-4 order-1 sm:order-2 flex-wrap justify-center">
        {/* انتخاب اندازه صفحه */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400">تعداد در صفحه:</span>
          <Select
            value={String(pageSize)}
            onValueChange={(val) => onPageSizeChange(Number(val))}
            disabled={disabled}
          >
            <SelectTrigger className="h-8 w-20 bg-[#18263A] border-[#1F2E45] px-2 py-1 text-xs text-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size.toLocaleString('fa-IR')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* دکمه‌های ناوبری صفحه */}
        <div className="flex items-center gap-1">
          {/* صفحه اول */}
          <button
            type="button"
            onClick={() => onPageChange(1)}
            disabled={!canPrev}
            title="صفحه اول"
            className="p-1.5 rounded-lg border border-[#1F2E45] bg-[#18263A] text-slate-300 hover:text-white hover:bg-[#20314A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronsRight size={14} />
          </button>

          {/* صفحه قبلی */}
          <button
            type="button"
            onClick={() => onPageChange(pageIndex - 1)}
            disabled={!canPrev}
            title="صفحه قبل"
            className="p-1.5 rounded-lg border border-[#1F2E45] bg-[#18263A] text-slate-300 hover:text-white hover:bg-[#20314A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={14} />
          </button>

          {/* شماره صفحه فعلی و کل */}
          <span className="px-2.5 py-1 text-xs font-semibold text-slate-200">
            صفحه <span className="font-bold text-[#719BDF] font-display">{pageIndex.toLocaleString('fa-IR')}</span> از{' '}
            <span className="font-bold font-display">{totalPages.toLocaleString('fa-IR')}</span>
          </span>

          {/* صفحه بعدی */}
          <button
            type="button"
            onClick={() => onPageChange(pageIndex + 1)}
            disabled={!canNext}
            title="صفحه بعد"
            className="p-1.5 rounded-lg border border-[#1F2E45] bg-[#18263A] text-slate-300 hover:text-white hover:bg-[#20314A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={14} />
          </button>

          {/* صفحه آخر */}
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            disabled={!canNext}
            title="صفحه آخر"
            className="p-1.5 rounded-lg border border-[#1F2E45] bg-[#18263A] text-slate-300 hover:text-white hover:bg-[#20314A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronsLeft size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
