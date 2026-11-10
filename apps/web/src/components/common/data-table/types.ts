import * as React from 'react';

/**
 * جهت مرتب‌سازی ستون
 */
export type SortDirection = 'asc' | 'desc';

/**
 * وضعیت مرتب‌سازی فعلی جدول
 * در صورتی که null باشد، جدول فاقد مرتب‌سازی است (چرخه: asc -> desc -> null)
 */
export interface SortingState {
  columnId: string;
  direction: SortDirection;
}

/**
 * وضعیت صفحه‌بندی جدول
 * pageIndex بر مبنای ۱ است (صفحه ۱، ۲، ۳...)
 */
export interface PaginationState {
  pageIndex: number;
  pageSize: number;
}

/**
 * تراکم سطرهای جدول
 */
export type TableDensity = 'comfortable' | 'compact';

/**
 * کانتکست سلول جهت سفارشی‌سازی رندرینگ
 */
export interface CellContext<TData, TValue = unknown> {
  row: TData;
  value: TValue;
  index: number;
}

/**
 * کانتکست هدر جهت سفارشی‌سازی رندرینگ عنوان ستون
 */
export interface HeaderContext<TData> {
  column: ColumnDef<TData, unknown>;
  sorting: SortingState | null;
}

/**
 * تعریف ستون کامپوننت عمومی DataTable
 */
export interface ColumnDef<TData, TValue = unknown> {
  id: string;
  header: string | ((context: HeaderContext<TData>) => React.ReactNode);
  accessorKey?: keyof TData;
  accessorFn?: (row: TData) => TValue;
  cell?: (context: CellContext<TData, TValue>) => React.ReactNode;
  sortable?: boolean;
  align?: 'right' | 'center' | 'left';
  width?: string | number;
  minWidth?: string | number;
  hideable?: boolean; // آیا در منوی مخفی‌سازی ستون‌ها قابل پنهان‌سازی است؟ (پیش‌فرض: true)
  defaultHidden?: boolean; // آیا در ابتدای بارگذاری پنهان است؟ (پیش‌فرض: false)
  sticky?: 'left' | 'right'; // تثبیت ستون در اسکرول افقی
}

/**
 * وضعیت‌های خالی سفارشی (Empty State)
 */
export interface DataTableEmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

/**
 * پراپ‌های اصلی کامپوننت عمومی DataTable
 */
export interface DataTableProps<TData> {
  // ۱. داده‌ها و ساختار ستون‌ها
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  keyExtractor?: (item: TData, index: number) => string;

  // ۲. وضعیت‌های بارگذاری، خالی و خطا
  loading?: boolean;
  error?: string | null;
  emptyState?: DataTableEmptyStateProps;

  // ۳. مرتب‌سازی (Sorting)
  sorting?: SortingState | null;
  onSortingChange?: (sorting: SortingState | null) => void;
  manualSorting?: boolean;

  // ۴. صفحه‌بندی (Pagination)
  pagination?: PaginationState;
  onPaginationChange?: (pagination: PaginationState) => void;
  totalCount?: number;
  pageSizeOptions?: number[];
  manualPagination?: boolean;

  // ۵. انتخاب ردیف‌ها (Row Selection)
  enableRowSelection?: boolean;
  selectedRowIds?: string[];
  onRowSelectionChange?: (selectedIds: string[]) => void;

  // ۶. عملیات گروهی (Bulk Actions)
  bulkActions?: (
    selectedIds: string[],
    selectedRows: TData[],
    clearSelection: () => void,
  ) => React.ReactNode;

  // ۷. مدیریت نمایش ستون‌ها (Column Visibility)
  enableColumnVisibility?: boolean;
  columnVisibility?: Record<string, boolean>;
  onColumnVisibilityChange?: (visibility: Record<string, boolean>) => void;

  // ۸. تراکم ردیف‌ها (Density)
  enableDensityToggle?: boolean;
  density?: TableDensity;
  onDensityChange?: (density: TableDensity) => void;

  // ۹. اکشن‌های سفارشی تولبار و استایل
  toolbarActions?: React.ReactNode;
  className?: string;
  tableClassName?: string;
  onRowClick?: (row: TData, index: number) => void;
}
