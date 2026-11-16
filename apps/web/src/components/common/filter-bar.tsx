'use client';

import * as React from 'react';
import {
  Search,
  Filter,
  X,
  ChevronDown,
  RotateCcw,
  Check,
} from 'lucide-react';
import {
  PersianDatePicker,
  DateRangeValue,
} from '@/components/ui/persian-date-picker';

export interface FilterOption {
  label: string;
  value: string;
  badge?: string | number;
}

export interface FilterConfig {
  id: string;
  label: string;
  type?: 'select' | 'multi-select';
  options: FilterOption[];
  placeholder?: string;
}

export interface FilterBarProps {
  // ۱. جستجو
  showSearch?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;

  // ۲. بازه تاریخ شمسی
  showDateRange?: boolean;
  dateRangePlaceholder?: string;
  dateRange?: DateRangeValue;
  onDateRangeChange?: (range: DateRangeValue) => void;

  // ۳. فیلترهای گزینشی (Single / Multi Select)
  filtersConfig?: FilterConfig[];
  selectedFilters?: Record<string, string | string[]>;
  onFilterChange?: (filterId: string, value: string | string[]) => void;

  // ۴. بازنشانی فیلترها
  onClearAll?: () => void;
  hasActiveFilters?: boolean;

  // ۵. اکشن‌های اختیاری (مثلاً دکمه اکسل یا ایجاد)
  actions?: React.ReactNode;
  className?: string;
}

export function FilterBar({
  showSearch = true,
  searchPlaceholder = 'جستجو...',
  searchValue = '',
  onSearchChange,
  showDateRange = true,
  dateRangePlaceholder = 'بازه تاریخ شمسی...',
  dateRange,
  onDateRangeChange,
  filtersConfig = [],
  selectedFilters = {},
  onFilterChange,
  onClearAll,
  hasActiveFilters = false,
  actions,
  className = '',
}: FilterBarProps) {
  const [openDropdownId, setOpenDropdownId] = React.useState<string | null>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // بستن منو با کلیک بیرون یا فشردن Escape
  React.useEffect(() => {
    if (!openDropdownId) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpenDropdownId(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openDropdownId]);

  return (
    <div
      ref={dropdownRef}
      className={`relative z-30 bg-[#111D2E]/80 backdrop-blur-md rounded-2xl border border-[#1F2E45] p-3 sm:p-4 shadow-xl space-y-3 transition-colors ${className}`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* بخش راست: فیلترها و ورودی‌ها */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
          {/* ورودی جستجو */}
          {showSearch && (
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search
                size={15}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
              />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-[#18263A] border border-[#1F2E45] rounded-xl ps-9 pe-8 py-2 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:border-[#719BDF]/50 focus:ring-1 focus:ring-[#719BDF]/30 focus:outline-none transition-all font-medium"
              />
              {searchValue && (
                <button
                  type="button"
                  onClick={() => onSearchChange?.('')}
                  aria-label="پاک کردن جستجو"
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200 rounded-md transition-colors"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          )}

          {/* فیلترهای گزینشی پویا (Single / Multi Select) */}
          {filtersConfig.map((config) => {
            const isMulti = config.type === 'multi-select';
            const rawVal = selectedFilters[config.id];
            const currentSelected: string[] = Array.isArray(rawVal)
              ? rawVal
              : rawVal
              ? [rawVal]
              : [];

            const isOpen = openDropdownId === config.id;
            const count = currentSelected.length;

            return (
              <div key={config.id} className="relative">
                {isMulti ? (
                  // حالت Multi-Select با Popover و Checkbox
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setOpenDropdownId(isOpen ? null : config.id)
                      }
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        count > 0
                          ? 'bg-[#18263A] border-[#719BDF]/40 text-[#719BDF] shadow-[0_0_10px_rgba(113,155,223,0.15)] font-bold'
                          : 'bg-[#18263A]/70 hover:bg-[#18263A] border-[#1F2E45] text-slate-300'
                      }`}
                    >
                      <Filter size={13} className={count > 0 ? 'text-[#719BDF]' : 'text-slate-400'} />
                      <span>{config.label}</span>
                      {count > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-[#719BDF] text-[#080F1C] text-[10px] font-black">
                          {count.toLocaleString('fa-IR')}
                        </span>
                      )}
                      <ChevronDown
                        size={14}
                        className={`text-slate-400 transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {isOpen && (
                      <div className="absolute top-full right-0 z-50 mt-1.5 w-56 bg-[#111D2E] border border-[#1F2E45] rounded-2xl shadow-2xl p-2 space-y-1 animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between px-2 py-1.5 border-b border-[#1F2E45] text-[11px] font-bold text-slate-200">
                          <span>{config.label}</span>
                          {count > 0 && (
                            <button
                              type="button"
                              onClick={() => onFilterChange?.(config.id, [])}
                              className="text-[10px] text-[#D66B73] hover:underline"
                            >
                              پاک کردن
                            </button>
                          )}
                        </div>

                        <div className="max-h-56 overflow-y-auto divide-y divide-[#1F2E45]/40 py-1">
                          {config.options.map((opt) => {
                            const isChecked = currentSelected.includes(opt.value);
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                  const next = isChecked
                                    ? currentSelected.filter((v) => v !== opt.value)
                                    : [...currentSelected, opt.value];
                                  onFilterChange?.(config.id, next);
                                }}
                                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#18263A] transition-colors text-right text-xs text-slate-200"
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                                      isChecked
                                        ? 'bg-[#719BDF] border-[#719BDF] text-[#080F1C]'
                                        : 'border-[#1F2E45] bg-[#18263A]'
                                    }`}
                                  >
                                    {isChecked && <Check size={11} strokeWidth={3} />}
                                  </div>
                                  <span className={isChecked ? 'font-bold text-slate-100' : 'text-slate-300'}>
                                    {opt.label}
                                  </span>
                                </div>
                                {opt.badge !== undefined && (
                                  <span className="text-[10px] text-slate-500 font-normal">
                                    {typeof opt.badge === 'number'
                                      ? opt.badge.toLocaleString('fa-IR')
                                      : opt.badge}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  // حالت Single-Select
                  <div className="relative flex items-center">
                    <Filter
                      size={13}
                      className="absolute right-3 text-slate-400 pointer-events-none"
                    />
                    <select
                      value={(selectedFilters[config.id] as string) || ''}
                      onChange={(e) =>
                        onFilterChange?.(config.id, e.target.value)
                      }
                      className="bg-[#18263A] border border-[#1F2E45] text-slate-200 rounded-xl ps-8 pe-8 py-2 text-xs font-semibold focus:border-[#719BDF]/50 focus:ring-1 focus:ring-[#719BDF]/30 focus:outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="" className="bg-[#111D2E] text-slate-400">
                        {config.placeholder || `همه ${config.label}`}
                      </option>
                      {config.options.map((opt) => (
                        <option
                          key={opt.value}
                          value={opt.value}
                          className="bg-[#111D2E] text-slate-200"
                        >
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute left-2.5 text-slate-400 pointer-events-none"
                    />
                  </div>
                )}
              </div>
            );
          })}

          {/* بازه تاریخ شمسی */}
          {showDateRange && (
            <div className="w-full sm:w-auto min-w-[210px]">
              <PersianDatePicker
                mode="range"
                value={dateRange}
                onChange={onDateRangeChange}
                placeholder={dateRangePlaceholder}
              />
            </div>
          )}

          {/* دکمه پاک کردن کلیه فیلترها */}
          {hasActiveFilters && onClearAll && (
            <button
              type="button"
              onClick={onClearAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#D66B73] hover:text-[#E07C84] bg-[#D66B73]/10 hover:bg-[#D66B73]/20 border border-[#D66B73]/30 rounded-xl font-medium transition-colors"
            >
              <RotateCcw size={12} />
              <span>بازنشانی فیلترها</span>
            </button>
          )}
        </div>

        {/* بخش چپ: اکشن‌های اضافی */}
        {actions && (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>
    </div>
  );
}
