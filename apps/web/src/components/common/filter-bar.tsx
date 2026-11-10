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
 // پاپ‌اور منوی فیلتر فعال باز
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
 className={`bg-white rounded-2xl border border-gray-200/80 p-3 sm:p-4 shadow-2xs space-y-3 transition-colors ${className}`}
 >
 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
 {/* بخش راست: فیلترها و ورودی‌ها */}
 <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
 {/* ورودی جستجو */}
 {showSearch && (
 <div className="relative flex-1 min-w-[200px] max-w-md">
 <Search
 size={15}
 className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
 />
 <input
 type="text"
 value={searchValue}
 onChange={(e) => onSearchChange?.(e.target.value)}
 placeholder={searchPlaceholder}
 className="w-full bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 rounded-xl pr-9 pl-8 py-2 text-xs sm:text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all placeholder:text-gray-400 font-medium"
 />
 {searchValue && (
 <button
 type="button"
 onClick={() => onSearchChange?.('')}
 aria-label="پاک کردن جستجو"
 className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
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
 ? 'bg-blue-50/70 border-blue-200 text-blue-900 shadow-2xs'
 : 'bg-gray-50 hover:bg-white border-gray-200 text-gray-700 '
 }`}
 >
 <Filter size={13} className={count > 0 ? 'text-blue-600 ' : 'text-gray-400 '} />
 <span>{config.label}</span>
 {count > 0 && (
 <span className="px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[10px] font-bold">
 {count.toLocaleString('fa-IR')}
 </span>
 )}
 <ChevronDown
 size={14}
 className={`text-gray-400 transition-transform ${
 isOpen ? 'rotate-180' : ''
 }`}
 />
 </button>

 {isOpen && (
 <div className="absolute top-full right-0 z-40 mt-1.5 w-56 bg-white border border-gray-200 rounded-2xl shadow-xl p-2 space-y-1 animate-in fade-in zoom-in-95">
 <div className="flex items-center justify-between px-2 py-1.5 border-b border-gray-100 text-[11px] font-bold text-gray-700 ">
 <span>{config.label}</span>
 {count > 0 && (
 <button
 type="button"
 onClick={() => onFilterChange?.(config.id, [])}
 className="text-[10px] text-red-600 hover:underline"
 >
 پاک کردن
 </button>
 )}
 </div>

 <div className="max-h-56 overflow-y-auto divide-y divide-gray-50 py-1">
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
 className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition-colors text-right text-xs text-gray-700 "
 >
 <div className="flex items-center gap-2">
 <div
 className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
 isChecked
 ? 'bg-blue-600 border-blue-600 text-white'
 : 'border-gray-300 bg-white '
 }`}
 >
 {isChecked && <Check size={11} strokeWidth={3} />}
 </div>
 <span className={isChecked ? 'font-bold text-gray-900 ' : 'text-gray-700 '}>
 {opt.label}
 </span>
 </div>
 {opt.badge !== undefined && (
 <span className="text-[10px] text-gray-400 font-normal">
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
 // حالت Single-Select ساده
 <div className="relative flex items-center">
 <Filter
 size={13}
 className="absolute right-3 text-gray-400 pointer-events-none"
 />
 <select
 value={(rawVal as string) || ''}
 onChange={(e) => onFilterChange?.(config.id, e.target.value)}
 className={`bg-gray-50 hover:bg-white border rounded-xl pr-8 pl-3 py-2 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors ${
 rawVal
 ? 'border-blue-200 bg-blue-50/50 text-blue-900 font-bold'
 : 'border-gray-200 text-gray-700 '
 }`}
 >
 <option value="" className="">{config.placeholder || `همه ${config.label}‌ها`}</option>
 {config.options.map((opt) => (
 <option key={opt.value} value={opt.value} className="">
 {opt.label}
 </option>
 ))}
 </select>
 </div>
 )}
 </div>
 );
 })}

 {/* فیلتر بازه تاریخ شمسی با PersianDatePicker */}
 {showDateRange && (
 <div className="w-full sm:w-auto sm:min-w-[220px]">
 <PersianDatePicker
 mode="range"
 value={dateRange}
 onChange={onDateRangeChange}
 placeholder={dateRangePlaceholder}
 clearable
 />
 </div>
 )}

 {/* دکمه پاک کردن کلیه فیلترها (تنها در صورت فعال بودن فیلتر نمایش داده می‌شود) */}
 {hasActiveFilters && onClearAll && (
 <button
 type="button"
 onClick={onClearAll}
 className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors shrink-0"
 title="بازنشانی تمام فیلترها به حالت پیش‌فرض"
 >
 <RotateCcw size={12} />
 <span>پاک کردن فیلترها</span>
 </button>
 )}
 </div>

 {/* بخش چپ: اکشن‌های اختیاری صفحه (دکمه‌های خروجی اکسل یا ساخت) */}
 {actions && (
 <div className="flex items-center gap-2 shrink-0 border-t lg:border-t-0 border-gray-100 pt-2 lg:pt-0">
 {actions}
 </div>
 )}
 </div>
 </div>
 );
}
