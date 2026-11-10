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
 // اطلاعات انتخاب ردیف‌ها
 enableRowSelection?: boolean;
 selectedCount?: number;
 selectedInViewCount?: number;
 onClearSelection?: () => void;
 bulkActions?: React.ReactNode;

 // اطلاعات نمایش ستون‌ها
 enableColumnVisibility?: boolean;
 columns?: ColumnDef<TData, unknown>[];
 columnVisibility?: Record<string, boolean>;
 onToggleColumn?: (columnId: string) => void;

 // تراکم جدول
 enableDensityToggle?: boolean;
 density?: TableDensity;
 onDensityChange?: (density: TableDensity) => void;

 // اکشن‌های اختیاری سفارشی
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

 // بستن منوی پاپ‌اور با کلیک در بیرون یا زدن Escape
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

 // اگر ردیفی انتخاب شده باشد، نوار عملیات گروهی (Bulk Actions Bar) نمایش داده می‌شود
 if (enableRowSelection && selectedCount > 0) {
 return (
 <div
 className={`bg-blue-50/90 border border-blue-200/90 rounded-2xl p-2.5 sm:px-4 sm:py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-blue-900 shadow-2xs transition-all animate-in fade-in slide-in-from-top-1 ${className}`}
 >
 <div className="flex items-center gap-3">
 <div className="flex items-center gap-2 font-bold text-blue-950 ">
 <CheckSquare size={16} className="text-blue-600 shrink-0" />
 <span>
 {selectedCount.toLocaleString('fa-IR')} ردیف انتخاب شده
 {selectedInViewCount !== undefined &&
 selectedInViewCount < selectedCount && (
 <span className="font-normal text-blue-700 mr-1.5 text-[11px]">
 ({selectedInViewCount.toLocaleString('fa-IR')} مورد در این
 نما)
 </span>
 )}
 </span>
 </div>

 <button
 type="button"
 onClick={onClearSelection}
 aria-label="لغو انتخاب تمام ردیف‌ها"
 className="inline-flex items-center gap-1 text-[11px] text-blue-700 hover:text-blue-900 bg-white/70 hover:bg-white border border-blue-200 px-2 py-0.5 rounded-lg transition-colors font-medium cursor-pointer"
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

 // اگر هیچ ابزاری فعال نباشد، چیزی رندر نمی‌کنیم
 const hasControls =
 enableColumnVisibility || enableDensityToggle || Boolean(toolbarActions);

 if (!hasControls) {
 return null;
 }

 // محاسبه تعداد ستون‌های در حال حاضر مرئی جهت جلوگیری از مخفی شدن تمام ستون‌ها
 const visibleCount = columns.filter(
 (col) => col.hideable === false || columnVisibility[col.id] !== false,
 ).length;

 return (
 <div
 className={`flex items-center justify-between gap-2.5 px-3 py-2 text-xs text-gray-600 bg-gray-50/50 border-b border-gray-100 transition-colors ${className}`}
 >
 <div className="flex items-center gap-2">
 {/* سوییچ تراکم (Density Mode) */}
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
 : 'تغییر به حالت استاندارد (Comfortable)'
 }
 aria-label="تغییر تراکم جدول"
 className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all text-xs font-semibold ${
 density === 'compact'
 ? 'bg-blue-50 border-blue-200 text-blue-800 '
 : 'bg-white hover:bg-gray-100 border-gray-200 text-gray-700 shadow-2xs'
 }`}
 >
 <Rows3 size={13} className="shrink-0" />
 <span>
 {density === 'compact' ? 'حالت فشرده' : 'تراکم استاندارد'}
 </span>
 </button>
 )}

 {/* منوی Popover مدیریت نمایش ستون‌ها */}
 {enableColumnVisibility && (
 <div className="relative" ref={dropdownRef}>
 <button
 type="button"
 onClick={() => setIsColumnsOpen((prev) => !prev)}
 aria-label="تنظیم نمایش و مخفی‌سازی ستون‌ها"
 aria-expanded={isColumnsOpen}
 className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all text-xs font-semibold ${
 isColumnsOpen
 ? 'bg-blue-50 border-blue-300 text-blue-800 '
 : 'bg-white hover:bg-gray-100 border-gray-200 text-gray-700 shadow-2xs'
 }`}
 >
 <Columns size={13} className="shrink-0" />
 <span>ستون‌ها</span>
 </button>

 {isColumnsOpen && (
 <div className="absolute top-full right-0 z-40 mt-1.5 w-52 bg-white border border-gray-200 rounded-2xl shadow-xl p-2 space-y-1 animate-in fade-in zoom-in-95 select-none text-gray-900 ">
 <div className="px-2 py-1 border-b border-gray-100 flex items-center justify-between text-[11px] font-bold text-gray-800 ">
 <div className="flex items-center gap-1.5">
 <SlidersHorizontal size={12} className="text-gray-400 " />
 <span>نمایش ستون‌ها</span>
 </div>
 <span className="text-[10px] text-gray-400 font-normal">
 {visibleCount.toLocaleString('fa-IR')} از{' '}
 {columns.length.toLocaleString('fa-IR')}
 </span>
 </div>

 <div className="max-h-60 overflow-y-auto py-1 divide-y divide-gray-50 ">
 {columns.map((column) => {
 const isHideable = column.hideable !== false;
 const isVisible =
 !isHideable || columnVisibility[column.id] !== false;
 // اگر فقط یک ستون باقی مانده باشد و این ستون مرئی باشد، غیرفعال می‌شود تا کل جدول پنهان نشود
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
 ? 'opacity-60 cursor-not-allowed bg-gray-50/50 text-gray-400'
 : 'hover:bg-gray-50 cursor-pointer text-gray-700 '
 }`}
 >
 <div className="flex items-center gap-2">
 <div
 className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
 isVisible
 ? 'bg-blue-600 border-blue-600 text-white'
 : 'border-gray-300 bg-white '
 }`}
 >
 {isVisible && (
 <Check size={11} strokeWidth={3} />
 )}
 </div>
 <span
 className={
 isVisible
 ? 'font-bold text-gray-900 '
 : 'text-gray-500 '
 }
 >
 {headerText}
 </span>
 </div>

 {!isHideable && (
 <span className="text-[9px] text-gray-400 font-medium">
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
 <div className="flex items-center gap-2 shrink-0">
 {toolbarActions}
 </div>
 )}
 </div>
 );
}
