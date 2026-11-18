'use client';

import * as React from 'react';
import {
 Table,
 TableHeader,
 TableBody,
 TableRow,
 TableHead,
 TableCell,
} from '@/components/ui/table';
import { EmptyState } from '@/components/common/empty-state';
import {
 ColumnDef,
 DataTableProps,
 SortingState,
 PaginationState,
 TableDensity,
} from './types';
import { DataTablePagination } from './data-table-pagination';
import { DataTableToolbar } from './data-table-toolbar';
import {
 ArrowUpDown,
 ArrowUp,
 ArrowDown,
 Loader2,
 AlertTriangle,
} from 'lucide-react';

/**
 * چک‌باکس با پشتیبانی کامل از حالت Indeterminate (نیمه‌انتخاب)
 */
function IndeterminateCheckbox({
 indeterminate = false,
 checked = false,
 onChange,
 disabled = false,
 'aria-label': ariaLabel,
 className = '',
}: {
 indeterminate?: boolean;
 checked?: boolean;
 onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
 disabled?: boolean;
 'aria-label'?: string;
 className?: string;
}) {
 const ref = React.useRef<HTMLInputElement>(null);

 React.useEffect(() => {
 if (ref.current) {
 ref.current.indeterminate = Boolean(indeterminate);
 }
 }, [indeterminate]);

 return (
 <input
 ref={ref}
 type="checkbox"
 checked={checked}
 onChange={onChange}
 disabled={disabled}
 aria-label={ariaLabel}
 className={`w-4 h-4 rounded border-[#1F2E45] bg-[#18263A] text-[#719BDF] focus:ring-[#719BDF]/30 transition-colors cursor-pointer disabled:cursor-not-allowed ${className}`}
 />
 );
}

/**
 * استخراج مقدار سلول بر اساس accessorFn یا accessorKey بدون نیاز به any
 */
function getCellValue<TData>(
 row: TData,
 column: ColumnDef<TData, unknown>,
): unknown {
 if (column.accessorFn) {
 return column.accessorFn(row);
 }
 if (column.accessorKey && typeof row === 'object' && row !== null) {
 return (row as Record<string, unknown>)[column.accessorKey as string];
 }
 return undefined;
}

/**
 * مقایسه دو مقدار برای مرتب‌سازی قابل پیش‌بینی (عدد، تاریخ و رشته‌های فارسی)
 */
function compareValues(a: unknown, b: unknown): number {
 if (a == null && b == null) return 0;
 if (a == null) return 1;
 if (b == null) return -1;

 // ۱. مقایسه اعداد
 if (typeof a === 'number' && typeof b === 'number') {
 return a - b;
 }

 // ۲. مقایسه شیء Date
 if (a instanceof Date && b instanceof Date) {
 return a.getTime() - b.getTime();
 }

 // ۳. مقایسه رشته‌های حاوی تاریخ ISO معتبر
 if (
 typeof a === 'string' &&
 typeof b === 'string' &&
 (a.includes('-') || a.includes('/')) &&
 isNaN(Number(a)) &&
 isNaN(Number(b))
 ) {
 const timeA = Date.parse(a);
 const timeB = Date.parse(b);
 if (!isNaN(timeA) && !isNaN(timeB)) {
 return timeA - timeB;
 }
 }

 // ۴. مقایسه الفبایی با زبان فارسی و در نظر گرفتن ارقام متنی (Natural Sort)
 return String(a).localeCompare(String(b), 'fa-IR', {
 numeric: true,
 sensitivity: 'base',
 });
}

function getAlignClass(align?: 'right' | 'center' | 'left'): string {
 switch (align) {
 case 'center':
 return 'text-center';
 case 'left':
 return 'text-left';
 case 'right':
 default:
 return 'text-right';
 }
}

export function DataTable<TData>({
 data,
 columns,
 keyExtractor,
 loading = false,
 error = null,
 emptyState,
 sorting: controlledSorting,
 onSortingChange,
 manualSorting = false,
 pagination: controlledPagination,
 onPaginationChange,
 totalCount,
 pageSizeOptions = [20, 50, 100],
 manualPagination = false,
 enableRowSelection = false,
 selectedRowIds: controlledSelectedRowIds,
 onRowSelectionChange,
 bulkActions,
 enableColumnVisibility = false,
 columnVisibility: controlledColumnVisibility,
 onColumnVisibilityChange,
 enableDensityToggle = false,
 density: controlledDensity,
 onDensityChange,
 toolbarActions,
 className = '',
 tableClassName = '',
 onRowClick,
}: DataTableProps<TData>) {
 // ۱. مدیریت مرتب‌سازی
 const [internalSorting, setInternalSorting] =
 React.useState<SortingState | null>(null);
 const sorting =
 controlledSorting !== undefined ? controlledSorting : internalSorting;

 // ۲. مدیریت صفحه‌بندی
 const [internalPagination, setInternalPagination] =
 React.useState<PaginationState>({
 pageIndex: 1,
 pageSize: pageSizeOptions[0] || 20,
 });
 const pagination = controlledPagination || internalPagination;

 // ۳. مدیریت تراکم (Density Mode)
 const [internalDensity, setInternalDensity] =
 React.useState<TableDensity>('comfortable');
 const density =
 controlledDensity !== undefined ? controlledDensity : internalDensity;

 const handleDensityChange = (newDensity: TableDensity) => {
 if (onDensityChange) {
 onDensityChange(newDensity);
 } else {
 setInternalDensity(newDensity);
 }
 };

 // ۴. مدیریت نمایش ستون‌ها (Column Visibility)
 const initialVisibility = React.useMemo(() => {
 const state: Record<string, boolean> = {};
 columns.forEach((col) => {
 state[col.id] = col.defaultHidden ? false : true;
 });
 return state;
 }, [columns]);

 const [internalColumnVisibility, setInternalColumnVisibility] =
 React.useState<Record<string, boolean>>(initialVisibility);
 const columnVisibility =
 controlledColumnVisibility !== undefined
 ? controlledColumnVisibility
 : internalColumnVisibility;

 const handleToggleColumn = (colId: string) => {
 const isVisible = columnVisibility[colId] !== false;
 const next = { ...columnVisibility, [colId]: !isVisible };
 if (onColumnVisibilityChange) {
 onColumnVisibilityChange(next);
 } else {
 setInternalColumnVisibility(next);
 }
 };

 // ستون‌های مرئی قابل رندر
 const visibleColumns = React.useMemo(() => {
 if (!enableColumnVisibility) return columns;
 return columns.filter((col) => {
 if (col.hideable === false) return true;
 return columnVisibility[col.id] !== false;
 });
 }, [columns, columnVisibility, enableColumnVisibility]);

 // ۵. تابع استخراج شناسه یکتای ردیف
 const getRowId = React.useCallback(
 (row: TData, index: number): string => {
 if (keyExtractor) {
 return keyExtractor(row, index);
 }
 if (typeof row === 'object' && row !== null && 'id' in row) {
 return String((row as Record<string, unknown>).id);
 }
 return String(index);
 },
 [keyExtractor],
 );

 // ۶. مدیریت انتخاب ردیف‌ها (Row Selection)
 const [internalSelectedRowIds, setInternalSelectedRowIds] = React.useState<
 string[]
 >([]);
 const selectedRowIds =
 controlledSelectedRowIds !== undefined
 ? controlledSelectedRowIds
 : internalSelectedRowIds;

 const updateSelectedRowIds = React.useCallback(
 (next: string[]) => {
 if (onRowSelectionChange) {
 onRowSelectionChange(next);
 } else {
 setInternalSelectedRowIds(next);
 }
 },
 [onRowSelectionChange],
 );

 const clearSelection = React.useCallback(() => {
 updateSelectedRowIds([]);
 }, [updateSelectedRowIds]);

 const selectedSet = React.useMemo(
 () => new Set(selectedRowIds),
 [selectedRowIds],
 );

 // تعداد کل رکوردها
 const totalItems = manualPagination
 ? totalCount ?? data.length
 : data.length;

 const totalPages = Math.max(1, Math.ceil(totalItems / pagination.pageSize));

 // اصلاح و تصحیح خودکار شماره صفحه در صورت کاهش تعداد رکوردها
 React.useEffect(() => {
 if (!manualPagination && pagination.pageIndex > totalPages) {
 const correctedPage = totalPages;
 if (onPaginationChange) {
 onPaginationChange({
 ...pagination,
 pageIndex: correctedPage,
 });
 } else {
 setInternalPagination((prev) => ({
 ...prev,
 pageIndex: correctedPage,
 }));
 }
 }
 }, [totalPages, pagination, manualPagination, onPaginationChange]);

 // تغییر مرتب‌سازی ستون با چرخه سه مرحله‌ای: asc -> desc -> null
 const handleSortToggle = (column: ColumnDef<TData, unknown>) => {
 if (!column.sortable) return;

 let nextSorting: SortingState | null = null;
 if (!sorting || sorting.columnId !== column.id) {
 nextSorting = { columnId: column.id, direction: 'asc' };
 } else if (sorting.direction === 'asc') {
 nextSorting = { columnId: column.id, direction: 'desc' };
 } else {
 nextSorting = null;
 }

 if (onSortingChange) {
 onSortingChange(nextSorting);
 } else {
 setInternalSorting(nextSorting);
 }

 // تغییر مرتب‌سازی، صفحه را به صفحه اول برمی‌گرداند
 if (!manualPagination) {
 if (onPaginationChange) {
 onPaginationChange({ ...pagination, pageIndex: 1 });
 } else {
 setInternalPagination((prev) => ({ ...prev, pageIndex: 1 }));
 }
 }
 };

 // تغییر صفحه
 const handlePageChange = (newPage: number) => {
 const clamped = Math.max(1, Math.min(newPage, totalPages));
 if (onPaginationChange) {
 onPaginationChange({ ...pagination, pageIndex: clamped });
 } else {
 setInternalPagination((prev) => ({ ...prev, pageIndex: clamped }));
 }
 };

 // تغییر اندازه صفحه (بازگشت به صفحه اول الزامی است)
 const handlePageSizeChange = (newPageSize: number) => {
 if (onPaginationChange) {
 onPaginationChange({ pageIndex: 1, pageSize: newPageSize });
 } else {
 setInternalPagination({ pageIndex: 1, pageSize: newPageSize });
 }
 };

 // مرتب‌سازی کلاینتی داده‌ها بدون تغییر آرایه ورودی اصلی
 const sortedData = React.useMemo(() => {
 if (manualSorting || !sorting) {
 return data;
 }

 const sortColumn = columns.find((c) => c.id === sorting.columnId);
 if (!sortColumn) {
 return data;
 }

 return [...data].sort((a, b) => {
 const valA = getCellValue(a, sortColumn);
 const valB = getCellValue(b, sortColumn);
 const cmp = compareValues(valA, valB);
 return sorting.direction === 'desc' ? -cmp : cmp;
 });
 }, [data, columns, sorting, manualSorting]);

 // برش داده‌های صفحه جاری (در حالت کلاینتی)
 const displayedRows = React.useMemo(() => {
 if (manualPagination) {
 return sortedData;
 }
 const startIndex = (pagination.pageIndex - 1) * pagination.pageSize;
 const endIndex = startIndex + pagination.pageSize;
 return sortedData.slice(startIndex, endIndex);
 }, [sortedData, pagination, manualPagination]);

 // شناسه‌های ردیف‌های مرئی در صفحه جاری
 const visibleRowIds = React.useMemo(() => {
 return displayedRows.map((row, idx) => {
 const originalIdx = (pagination.pageIndex - 1) * pagination.pageSize + idx;
 return getRowId(row, originalIdx);
 });
 }, [displayedRows, pagination.pageIndex, pagination.pageSize, getRowId]);

 // وضعیت چک‌باکس انتخاب همه در هدر صفحه جاری
 const selectedVisibleCount = visibleRowIds.filter((id) =>
 selectedSet.has(id),
 ).length;

 const isAllVisibleSelected =
 visibleRowIds.length > 0 &&
 selectedVisibleCount === visibleRowIds.length;

 const isSomeVisibleSelected =
 selectedVisibleCount > 0 &&
 selectedVisibleCount < visibleRowIds.length;

 const handleToggleSelectAllVisible = () => {
 if (isAllVisibleSelected) {
 // لغو انتخاب تمام ردیف‌های صفحه جاری
 const next = selectedRowIds.filter((id) => !visibleRowIds.includes(id));
 updateSelectedRowIds(next);
 } else {
 // انتخاب تمام ردیف‌های صفحه جاری
 const next = Array.from(new Set([...selectedRowIds, ...visibleRowIds]));
 updateSelectedRowIds(next);
 }
 };

 const handleToggleRow = (rowId: string) => {
 const isSelected = selectedSet.has(rowId);
 const next = isSelected
 ? selectedRowIds.filter((id) => id !== rowId)
 : [...selectedRowIds, rowId];
 updateSelectedRowIds(next);
 };

 // اشیاء ردیف‌های انتخاب شده جهت پاس دادن به bulkActions
 const selectedRows = React.useMemo(() => {
 if (selectedRowIds.length === 0) return [];
 return data.filter((row, idx) => selectedSet.has(getRowId(row, idx)));
 }, [data, selectedRowIds, selectedSet, getRowId]);

 // تعداد کل ستون‌های رندرشده
 const totalColumnsCount =
 visibleColumns.length + (enableRowSelection ? 1 : 0);

 // کلاس‌های پدینگ بر اساس Density
 const headerPaddingClass =
 density === 'compact'
 ? 'px-3 py-2 text-[11px]'
 : 'px-4 py-3.5 text-xs';

 const cellPaddingClass =
 density === 'compact'
 ? 'px-3 py-2 text-xs'
 : 'px-4 py-3.5 text-sm';

 const checkboxPaddingClass =
 density === 'compact'
 ? 'px-2 py-2'
 : 'px-3.5 py-3.5';

 return (
 <div
 className={`bg-[#111D2E]/80 backdrop-blur-md rounded-2xl shadow-xl border border-[#1F2E45] overflow-hidden flex flex-col transition-colors ${className}`}
 >
 {/* تولبار بالای جدول (شامل نوار عملیات گروهی یا ابزارهای نمایش ستون و تراکم) */}
 <DataTableToolbar
 enableRowSelection={enableRowSelection}
 selectedCount={selectedRowIds.length}
 selectedInViewCount={selectedRows.length}
 onClearSelection={clearSelection}
 bulkActions={
 bulkActions && selectedRowIds.length > 0
 ? bulkActions(selectedRowIds, selectedRows, clearSelection)
 : undefined
 }
 enableColumnVisibility={enableColumnVisibility}
 columns={columns}
 columnVisibility={columnVisibility}
 onToggleColumn={handleToggleColumn}
 enableDensityToggle={enableDensityToggle}
 density={density}
 onDensityChange={handleDensityChange}
 toolbarActions={toolbarActions}
 />

 {/* جدول با قابلیت اسکرول افقی واکنش‌گرا */}
 <div className="overflow-x-auto">
 <Table className={`w-full text-right ${tableClassName}`}>
 <TableHeader>
 <TableRow className="bg-[#0B1423]/90 border-b border-[#1F2E45]">
 {/* ستون چک‌باکس انتخاب ردیف‌ها */}
 {enableRowSelection && (
 <TableHead
 style={{ width: '44px', minWidth: '44px' }}
 className={`text-center align-middle whitespace-nowrap select-none sticky right-0 bg-[#0B1423] z-20 shadow-[-2px_0_4px_rgba(0,0,0,0.1)] ${checkboxPaddingClass}`}
 >
 <div className="flex items-center justify-center">
 <IndeterminateCheckbox
 checked={isAllVisibleSelected}
 indeterminate={isSomeVisibleSelected}
 onChange={handleToggleSelectAllVisible}
 disabled={loading || displayedRows.length === 0}
 aria-label="انتخاب تمام ردیف‌های صفحه جاری"
 />
 </div>
 </TableHead>
 )}

 {/* ستون‌های داده مرئی */}
 {visibleColumns.map((column) => {
 const isSorted = sorting?.columnId === column.id;
 const sortDirection = isSorted ? sorting?.direction : null;
 const alignClass = getAlignClass(column.align);
 const rightOffset = enableRowSelection ? 'right-[44px]' : 'right-0';
 const stickyClass =
 column.sticky === 'left'
 ? 'sticky left-0 bg-[#0B1423] z-20 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.2)]'
 : column.sticky === 'right'
 ? `sticky ${rightOffset} bg-[#0B1423] z-20 shadow-[-3px_0_6px_-2px_rgba(0,0,0,0.2)]`
 : '';

 return (
 <TableHead
 key={column.id}
 style={{
 width: column.width,
 minWidth: column.minWidth,
 }}
 className={`font-bold text-slate-300 whitespace-nowrap select-none ${headerPaddingClass} ${alignClass} ${stickyClass}`}
 >
 {column.sortable ? (
 <button
 type="button"
 onClick={() => handleSortToggle(column)}
 className={`inline-flex items-center gap-1.5 group cursor-pointer hover:text-blue-600 transition-colors ${
 column.align === 'center'
 ? 'justify-center mx-auto'
 : column.align === 'left'
 ? 'justify-start'
 : 'justify-start'
 }`}
 title={`مرتب‌سازی بر اساس ${
 typeof column.header === 'string'
 ? column.header
 : column.id
 }`}
 >
 <span>
 {typeof column.header === 'function'
 ? column.header({ column, sorting })
 : column.header}
 </span>
 <span className="shrink-0">
 {sortDirection === 'asc' ? (
 <ArrowUp
 size={13}
 strokeWidth={2.5}
 className="text-blue-600 "
 />
 ) : sortDirection === 'desc' ? (
 <ArrowDown
 size={13}
 strokeWidth={2.5}
 className="text-blue-600 "
 />
 ) : (
 <ArrowUpDown
 size={13}
 className="text-gray-400 group-hover:text-gray-600 transition-colors opacity-70"
 />
 )}
 </span>
 </button>
 ) : typeof column.header === 'function' ? (
 column.header({ column, sorting })
 ) : (
 column.header
 )}
 </TableHead>
 );
 })}
 </TableRow>
 </TableHeader>

 <TableBody>
 {loading ? (
 <TableRow>
 <TableCell
 colSpan={totalColumnsCount}
 className="h-44 text-center text-slate-400 py-10"
 >
 <div className="flex flex-col items-center justify-center gap-2">
 <Loader2 size={24} className="animate-spin text-[#719BDF]" />
 <span className="text-sm font-medium">
 در حال بارگذاری داده‌ها...
 </span>
 </div>
 </TableCell>
 </TableRow>
 ) : error ? (
 <TableRow>
 <TableCell
 colSpan={totalColumnsCount}
 className="py-10 text-center"
 >
 <div className="inline-flex items-center gap-2 text-[#D66B73] bg-[#D66B73]/10 border border-[#D66B73]/30 px-4 py-2.5 rounded-xl text-xs font-semibold">
 <AlertTriangle size={16} />
 <span>{error}</span>
 </div>
 </TableCell>
 </TableRow>
 ) : displayedRows.length === 0 ? (
 <TableRow>
 <TableCell colSpan={totalColumnsCount} className="py-8">
 <EmptyState
 title={emptyState?.title || 'هیچ داده‌ای یافت نشد'}
 description={
 emptyState?.description ||
 'موردی برای نمایش در این جدول وجود ندارد.'
 }
 icon={emptyState?.icon}
 action={emptyState?.action}
 />
 </TableCell>
 </TableRow>
 ) : (
 displayedRows.map((row, rowIndex) => {
 const originalIndex =
 (pagination.pageIndex - 1) * pagination.pageSize + rowIndex;
 const rowId = getRowId(row, originalIndex);
 const isSelected = selectedSet.has(rowId);

 return (
 <TableRow
 key={rowId}
 onClick={() => onRowClick?.(row, rowIndex)}
 className={`group/row border-b border-[#1F2E45]/60 last:border-0 transition-colors text-slate-200 ${
 isSelected
 ? 'bg-[#18263A] hover:bg-[#20314A]'
 : 'bg-[#111D2E] hover:bg-[#18263A]'
 } ${onRowClick ? 'cursor-pointer' : ''}`}
 >
 {/* سلول چک‌باکس انتخاب ردیف */}
 {enableRowSelection && (
 <TableCell
 style={{ width: '44px', minWidth: '44px' }}
 className={`text-center align-middle sticky right-0 z-10 transition-colors ${
 isSelected
 ? 'bg-[#18263A] group-hover/row:bg-[#20314A]'
 : 'bg-[#111D2E] group-hover/row:bg-[#18263A]'
 } shadow-[-2px_0_4px_rgba(0,0,0,0.1)] ${checkboxPaddingClass}`}
 onClick={(e) => e.stopPropagation()}
 >
 <div className="flex items-center justify-center">
 <input
 type="checkbox"
 checked={isSelected}
 onChange={() => handleToggleRow(rowId)}
 aria-label={`انتخاب ردیف ${rowId}`}
 className="w-4 h-4 rounded border-[#1F2E45] bg-[#18263A] text-[#719BDF] focus:ring-[#719BDF]/30 transition-colors cursor-pointer"
 />
 </div>
 </TableCell>
 )}

 {/* سلول‌های داده‌های مرئی */}
 {visibleColumns.map((column) => {
 const value = getCellValue(row, column);
 const alignClass = getAlignClass(column.align);
 const rightOffset = enableRowSelection ? 'right-[44px]' : 'right-0';
 const stickyClass =
 column.sticky === 'left'
 ? `sticky left-0 transition-colors ${
 isSelected
 ? 'bg-[#18263A] group-hover/row:bg-[#20314A]'
 : 'bg-[#111D2E] group-hover/row:bg-[#18263A]'
 } z-10 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.2)]`
 : column.sticky === 'right'
 ? `sticky ${rightOffset} transition-colors ${
 isSelected
 ? 'bg-[#18263A] group-hover/row:bg-[#20314A]'
 : 'bg-[#111D2E] group-hover/row:bg-[#18263A]'
 } z-10 shadow-[-3px_0_6px_-2px_rgba(0,0,0,0.2)]`
 : '';

 return (
 <TableCell
 key={column.id}
 style={{
 width: column.width,
 minWidth: column.minWidth,
 }}
 className={`${cellPaddingClass} ${alignClass} ${stickyClass}`}
 >
 {column.cell
 ? column.cell({
 row,
 value,
 index: originalIndex,
 })
 : value == null
 ? ''
 : String(value)}
 </TableCell>
 );
 })}
 </TableRow>
 );
 })
 )}
 </TableBody>
 </Table>
 </div>

 {/* نوار صفحه‌بندی پایینی (تنها در صورت عدم لودینگ و وجود داده) */}
 {!loading && !error && data.length > 0 && (
 <DataTablePagination
 pageIndex={pagination.pageIndex}
 pageSize={pagination.pageSize}
 totalItems={totalItems}
 pageSizeOptions={pageSizeOptions}
 onPageChange={handlePageChange}
 onPageSizeChange={handlePageSizeChange}
 />
 )}
 </div>
 );
}
