'use client';

import * as React from 'react';
import {
 ChevronLeft,
 ChevronRight,
 ChevronsLeft,
 ChevronsRight,
} from 'lucide-react';

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
 className={`px-4 py-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600 bg-white select-none transition-colors ${className}`}
 >
 {/* آمار رکوردها */}
 <div className="flex items-center gap-1.5 order-2 sm:order-1">
 <span>نمایش</span>
 <span className="font-bold text-gray-900 ">
 {startItem.toLocaleString('fa-IR')}
 </span>
 <span>تا</span>
 <span className="font-bold text-gray-900 ">
 {endItem.toLocaleString('fa-IR')}
 </span>
 <span>از</span>
 <span className="font-bold text-gray-900 ">
 {totalItems.toLocaleString('fa-IR')}
 </span>
 <span>رکورد</span>
 </div>

 {/* ابزارهای صفحه‌بندی و اندازه صفحه */}
 <div className="flex items-center gap-4 order-1 sm:order-2 flex-wrap justify-center">
 {/* انتخاب اندازه صفحه */}
 <div className="flex items-center gap-2">
 <span className="text-gray-500 text-[11px]">تعداد در صفحه:</span>
 <select
 value={pageSize}
 disabled={disabled}
 onChange={(e) => onPageSizeChange(Number(e.target.value))}
 aria-label="تعداد ردیف در هر صفحه"
 className="bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors disabled:opacity-50"
 >
 {pageSizeOptions.map((opt) => (
 <option key={opt} value={opt} className="">
 {opt.toLocaleString('fa-IR')} ردیف
 </option>
 ))}
 </select>
 </div>

 {/* نمایش شماره صفحه و دکمه‌های ناوبری (سازگار با RTL) */}
 <div className="flex items-center gap-1.5">
 {/* صفحه اول: در چیدمان RTL جهت به راست اشاره دارد */}
 <button
 type="button"
 onClick={() => onPageChange(1)}
 disabled={!canPrev}
 title="رفتن به صفحه اول"
 aria-label="صفحه اول"
 className="p-1 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
 >
 <ChevronsRight size={15} />
 </button>

 {/* صفحه قبل: در چیدمان RTL فلش به راست */}
 <button
 type="button"
 onClick={() => onPageChange(pageIndex - 1)}
 disabled={!canPrev}
 title="صفحه قبل"
 aria-label="صفحه قبل"
 className="p-1 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
 >
 <ChevronRight size={15} />
 </button>

 {/* نشانگر شماره صفحه */}
 <span className="px-2 text-xs font-semibold text-gray-800 ">
 صفحه {pageIndex.toLocaleString('fa-IR')} از{' '}
 {totalPages.toLocaleString('fa-IR')}
 </span>

 {/* صفحه بعد: در چیدمان RTL فلش به چپ */}
 <button
 type="button"
 onClick={() => onPageChange(pageIndex + 1)}
 disabled={!canNext}
 title="صفحه بعد"
 aria-label="صفحه بعد"
 className="p-1 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
 >
 <ChevronLeft size={15} />
 </button>

 {/* صفحه آخر: در چیدمان RTL جهت به چپ */}
 <button
 type="button"
 onClick={() => onPageChange(totalPages)}
 disabled={!canNext}
 title="رفتن به صفحه آخر"
 aria-label="صفحه آخر"
 className="p-1 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
 >
 <ChevronsLeft size={15} />
 </button>
 </div>
 </div>
 </div>
 );
}
