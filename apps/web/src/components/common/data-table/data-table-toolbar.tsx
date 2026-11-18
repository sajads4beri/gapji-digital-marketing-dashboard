'use client';

import * as React from 'react';
import {
  Columns,
  Check,
  X,
  CheckSquare,
  Rows3,
  SlidersHorizontal,
} from 'lucide-react';
import { ColumnDef, TableDensity } from './types';

export interface DataTableToolbarProps<TData> {
  enableRowSelection?: boolean;
  selectedCount?: number;
  selectedInViewCount?: number;
  onClearSelection?: () => void;
  bulkActions?: React.ReactNode;
  enableColumnVisibility?: boolean;
  columns?: ColumnDef<TData, unknown>[];
  columnVisibility?: Record<string, boolean>;
  onToggleColumn?: (columnId: string) => void;
  enableDensityToggle?: boolean;
  density?: TableDensity;
  onDensityChange?: (density: TableDensity) => void;
  toolbarActions?: React.ReactNode;
  className?: string;
}

export function DataTableToolbar<TData>({
  enableRowSelection = false,
  selectedCount = 0,
  selectedInViewCount,
  onClearSelection,
  bulkActions,
  enableColumnVisibility = false,
  columns = [],
  columnVisibility = {},
  onToggleColumn,
  enableDensityToggle = false,
  density = 'comfortable',
  onDensityChange,
  toolbarActions,
  className = '',
}: DataTableToolbarProps<TData>) {
  const [isColumnsOpen, setIsColumnsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isColumnsOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsColumnsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsColumnsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isColumnsOpen]);

  // اگر ردیفی انتخاب شده باشد، نوار عملیات گروهی (Bulk Actions Bar)
  if (enableRowSelection && selectedCount > 0) {
    return (
      <div
        className={`bg-[#18263A] border border-[#719BDF]/30 rounded-2xl p-2.5 sm:px-4 sm:py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-100 shadow-xl transition-all animate-in fade-in slide-in-from-top-1 ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-bold text-slate-100">
            <CheckSquare size={16} className="text-[#719BDF] shrink-0" />
            <span>
              {selectedCount.toLocaleString('fa-IR')} ردیف انتخاب شده
              {selectedInViewCount !== undefined &&
                selectedInViewCount < selectedCount && (
                  <span className="font-normal text-slate-400 ms-1.5 text-[11px]">
                    ({selectedInViewCount.toLocaleString('fa-IR')} مورد در این نما)
                  </span>
                )}
            </span>
          </div>

          <button
            type="button"
            onClick={onClearSelection}
            aria-label="لغو انتخاب تمام ردیف‌ها"
            className="inline-flex items-center gap-1 text-[11px] text-slate-300 hover:text-white bg-[#111D2E] hover:bg-[#20314A] border border-[#1F2E45] px-2 py-0.5 rounded-lg transition-colors font-medium cursor-pointer"
          >
            <X size={12} />
            <span>لغو انتخاب‌ها</span>
          </button>
        </div>

        {bulkActions && (
          <div className="flex items-center gap-2 shrink-0">{bulkActions}</div>
        )}
      </div>
    );
  }

  const hasControls =
    enableColumnVisibility || enableDensityToggle || Boolean(toolbarActions);

  if (!hasControls) {
    return null;
  }

  const visibleCount = columns.filter(
    (col) => col.hideable === false || columnVisibility[col.id] !== false,
  ).length;

  return (
    <div
      className={`flex items-center justify-between gap-2.5 px-3 py-2 text-xs text-slate-400 bg-[#0B1423]/70 border-b border-[#1F2E45] transition-colors ${className}`}
    >
      <div className="flex items-center gap-2">
        {enableDensityToggle && onDensityChange && (
          <button
            type="button"
            onClick={() =>
              onDensityChange(
                density === 'comfortable' ? 'compact' : 'comfortable',
              )
            }
            title={
              density === 'comfortable'
                ? 'تغییر به حالت فشرده (Compact)'
                : 'تغییر به حالت معمولی (Comfortable)'
            }
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all text-xs font-semibold ${
              density === 'compact'
                ? 'bg-[#18263A] border-[#719BDF]/40 text-[#719BDF]'
                : 'bg-[#111D2E] hover:bg-[#18263A] border-[#1F2E45] text-slate-300'
            }`}
          >
            <Rows3 size={13} className="shrink-0" />
            <span>{density === 'compact' ? 'فشرده' : 'معمولی'}</span>
          </button>
        )}

        {enableColumnVisibility && (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsColumnsOpen((prev) => !prev)}
              aria-label="تنظیم نمایش و مخفی‌سازی ستون‌ها"
              aria-expanded={isColumnsOpen}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all text-xs font-semibold ${
                isColumnsOpen
                  ? 'bg-[#18263A] border-[#719BDF]/40 text-[#719BDF]'
                  : 'bg-[#111D2E] hover:bg-[#18263A] border-[#1F2E45] text-slate-300'
              }`}
            >
              <Columns size={13} className="shrink-0" />
              <span>ستون‌ها</span>
            </button>

            {isColumnsOpen && (
              <div className="absolute top-full right-0 z-40 mt-1.5 w-52 bg-[#111D2E] border border-[#1F2E45] rounded-2xl shadow-2xl p-2 space-y-1 animate-in fade-in zoom-in-95 select-none text-slate-200">
                <div className="px-2 py-1 border-b border-[#1F2E45] flex items-center justify-between text-[11px] font-bold text-slate-200">
                  <div className="flex items-center gap-1.5">
                    <SlidersHorizontal size={12} className="text-[#719BDF]" />
                    <span>نمایش ستون‌ها</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {visibleCount.toLocaleString('fa-IR')} از{' '}
                    {columns.length.toLocaleString('fa-IR')}
                  </span>
                </div>

                <div className="max-h-60 overflow-y-auto py-1 divide-y divide-[#1F2E45]/40">
                  {columns.map((column) => {
                    const isHideable = column.hideable !== false;
                    const isVisible =
                      !isHideable || columnVisibility[column.id] !== false;
                    const isLocked = !isHideable || (isVisible && visibleCount <= 1);
                    const headerText =
                      typeof column.header === 'string'
                        ? column.header
                        : column.id;

                    return (
                      <button
                        key={column.id}
                        type="button"
                        disabled={isLocked}
                        onClick={() => onToggleColumn?.(column.id)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-right text-xs transition-colors ${
                          isLocked
                            ? 'opacity-50 cursor-not-allowed text-slate-500'
                            : 'hover:bg-[#18263A] cursor-pointer text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                              isVisible
                                ? 'bg-[#719BDF] border-[#719BDF] text-[#080F1C]'
                                : 'border-[#1F2E45] bg-[#18263A]'
                            }`}
                          >
                            {isVisible && (
                              <Check size={11} strokeWidth={3} />
                            )}
                          </div>
                          <span
                            className={
                              isVisible
                                ? 'font-bold text-slate-100'
                                : 'text-slate-400'
                            }
                          >
                            {headerText}
                          </span>
                        </div>

                        {!isHideable && (
                          <span className="text-[9px] text-slate-500 font-medium">
                            ثابت
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {toolbarActions && (
        <div className="flex items-center gap-2 shrink-0">{toolbarActions}</div>
      )}
    </div>
  );
}
