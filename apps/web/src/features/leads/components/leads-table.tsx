import * as React from 'react';
import Link from 'next/link';
import {
  Phone,
  Copy,
  Clock,
  ChevronLeft,
  Calendar,
  Building,
} from 'lucide-react';
import {
  DataTable,
  type ColumnDef,
  type SortingState,
  type PaginationState,
  type TableDensity,
} from '@/components/common/data-table';
import type { LeadDetail } from '../types';
import { LeadStatusBadge } from './lead-status-badge';
import { isNewLeadOverdue } from './lead-inbox-mobile-card';
import { formatPersianDate } from '@/lib/persian-date';
import { toPersianDigits } from '@/components/common/timeline';
import { resolveLeadOwner } from '../utils/lead-storage';

export interface LeadsTableProps {
  data: LeadDetail[];
  loading?: boolean;
  error?: string | null;
  sorting?: SortingState | null;
  onSortingChange?: (sorting: SortingState | null) => void;
  pagination?: PaginationState;
  onPaginationChange?: (pagination: PaginationState) => void;
  selectedRowIds?: string[];
  onRowSelectionChange?: (ids: string[]) => void;
  bulkActions?: (
    selectedIds: string[],
    selectedRows: LeadDetail[],
    clearSelection: () => void
  ) => React.ReactNode;
  density?: TableDensity;
  onDensityChange?: (density: TableDensity) => void;
  onRowClick?: (lead: LeadDetail) => void;
  onCopyPhone: (e: React.MouseEvent, phone: string) => void;
  className?: string;
}

export function LeadsTable({
  data,
  loading = false,
  error = null,
  sorting,
  onSortingChange,
  pagination,
  onPaginationChange,
  selectedRowIds,
  onRowSelectionChange,
  bulkActions,
  density,
  onDensityChange,
  onRowClick,
  onCopyPhone,
  className = '',
}: LeadsTableProps) {
  const columns: ColumnDef<LeadDetail, unknown>[] = React.useMemo(
    () => [
      // ۱. نام و شرکت
      {
        id: 'fullName',
        header: 'نام و شرکت',
        sortable: true,
        accessorFn: (row) => row.fullName,
        cell: ({ row }) => {
          const isOverdue = isNewLeadOverdue(row);
          return (
            <div className="flex flex-col gap-1 text-right py-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-100 font-display text-xs sm:text-sm">
                  {row.fullName}
                </span>
                {isOverdue && (
                  <span
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30"
                    title="بیش از ۲۴ ساعت از ثبت لید جدید گذشته است"
                  >
                    <Clock size={10} className="text-amber-400 animate-pulse shrink-0" />
                    <span>تاخیر ۲۴ ساعته</span>
                  </span>
                )}
              </div>
              {row.company && (
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Building size={11} className="shrink-0 text-slate-500" />
                  <span className="truncate max-w-[160px]">{row.company}</span>
                </div>
              )}
            </div>
          );
        },
      },

      // ۲. شماره تماس
      {
        id: 'phoneNumber',
        header: 'شماره تماس',
        cell: ({ row }) => {
          return (
            <div
              className="flex items-center gap-1.5 justify-start text-xs font-semibold text-slate-200"
              onClick={(e) => e.stopPropagation()}
            >
              <span dir="ltr" className="font-mono">{toPersianDigits(row.phoneNumber)}</span>

              {/* دکمه کپی شماره تماس */}
              <button
                type="button"
                onClick={(e) => onCopyPhone(e, row.phoneNumber)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-[#18263A] transition-colors"
                title="کپی شماره تماس"
                aria-label="کپی شماره تماس"
              >
                <Copy size={13} />
              </button>

              {/* دکمه تماس مستقیم */}
              <a
                href={`tel:${row.phoneNumber}`}
                onClick={(e) => e.stopPropagation()}
                className="p-1 text-emerald-400 hover:text-emerald-300 rounded-lg hover:bg-emerald-500/10 transition-colors"
                title="تماس مستقیم"
                aria-label="تماس مستقیم با شماره"
              >
                <Phone size={13} />
              </a>
            </div>
          );
        },
      },

      // ۳. منبع جذب
      {
        id: 'source',
        header: 'منبع ورودی',
        sortable: true,
        accessorFn: (row) => row.source,
        cell: ({ row }) => (
          <span className="text-xs text-slate-300">
            {row.source}
          </span>
        ),
      },

      // ۴. کمپین
      {
        id: 'campaignName',
        header: 'کمپین',
        sortable: true,
        accessorFn: (row) => row.campaignName || '',
        cell: ({ row }) => (
          <span
            className="text-xs text-slate-300 truncate max-w-[180px] block"
            title={row.campaignName}
          >
            {row.campaignName || '—'}
          </span>
        ),
      },

      // ۵. تبلیغ / UTM
      {
        id: 'adUtm',
        header: 'تبلیغ / UTM',
        cell: ({ row }) => {
          const text =
            row.adName ||
            row.utm?.campaign ||
            row.utm?.source ||
            '—';
          return (
            <span
              className="text-xs text-slate-400 truncate max-w-[140px] block font-mono"
              title={text}
            >
              {text}
            </span>
          );
        },
      },

      // ۶. تاریخ ورود
      {
        id: 'createdAt',
        header: 'تاریخ ورود',
        sortable: true,
        accessorFn: (row) => row.createdAt,
        cell: ({ row }) => (
          <span className="text-xs text-slate-300 font-medium">
            {formatPersianDate(row.createdAt)}
          </span>
        ),
      },

      // ۷. وضعیت
      {
        id: 'status',
        header: 'وضعیت',
        sortable: true,
        accessorFn: (row) => row.status,
        cell: ({ row }) => <LeadStatusBadge status={row.status} />,
      },

      // ۸. کارشناس مسئول
      {
        id: 'assignedTo',
        header: 'کارشناس',
        cell: ({ row }) => {
          const owner = resolveLeadOwner(row);
          if (!owner || !owner.name) {
            return (
              <span className="text-xs text-slate-500">
                تخصیص‌نیافته
              </span>
            );
          }
          return (
            <div
              className="flex items-center gap-1.5"
              title={owner.hasConflict ? 'شناسه تخصیص‌یافته با شیء میراثی در تعارض است' : undefined}
            >
              <div className="w-6 h-6 rounded-full bg-[#18263A] text-[#719BDF] border border-[#1F2E45] flex items-center justify-center font-bold text-[10px] shrink-0">
                {owner.name.slice(0, 2)}
              </div>
              <span className="text-xs font-medium text-slate-200 truncate max-w-[110px]">
                {owner.name}
              </span>
            </div>
          );
        },
      },

      // ۹. تاریخ پیگیری بعدی
      {
        id: 'nextFollowUpDate',
        header: 'پیگیری بعدی',
        sortable: true,
        accessorFn: (row) => row.nextFollowUpDate || '',
        cell: ({ row }) => {
          if (!row.nextFollowUpDate) {
            return (
              <span className="text-xs text-slate-500">
                —
              </span>
            );
          }
          const isOverdue =
            new Date(row.nextFollowUpDate).getTime() < Date.now();
          return (
            <div
              className={`flex items-center gap-1 text-xs ${
                isOverdue
                  ? 'text-[#D66B73] font-bold'
                  : 'text-slate-300 font-medium'
              }`}
            >
              <Calendar size={12} className="shrink-0" />
              <span>{formatPersianDate(row.nextFollowUpDate)}</span>
            </div>
          );
        },
      },

      // ۱۰. عملیات
      {
        id: 'actions',
        header: 'عملیات',
        align: 'center',
        hideable: false,
        sticky: 'left',
        width: 100,
        cell: ({ row }) => {
          return (
            <div
              className="flex items-center justify-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <Link
                href={`/leads/${row.id}`}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#18263A] hover:bg-[#1F2E45] text-slate-300 hover:text-white border border-[#1F2E45] transition-colors"
                title="مشاهده جزئیات لید"
              >
                <span>جزئیات</span>
                <ChevronLeft size={12} />
              </Link>
            </div>
          );
        },
      },
    ],
    [onCopyPhone]
  );

  return (
    <div className="bg-[#111D2E]/80 backdrop-blur-md rounded-2xl border border-[#1F2E45] shadow-xl overflow-hidden">
      <DataTable<LeadDetail>
        data={data}
        columns={columns}
        keyExtractor={(item) => item.id}
        loading={loading}
        error={error}
        sorting={sorting}
        onSortingChange={onSortingChange}
        pagination={pagination}
        onPaginationChange={onPaginationChange}
        pageSizeOptions={[20, 50, 100]}
        enableRowSelection
        selectedRowIds={selectedRowIds}
        onRowSelectionChange={onRowSelectionChange}
        bulkActions={bulkActions}
        enableColumnVisibility
        enableDensityToggle
        density={density}
        onDensityChange={onDensityChange}
        onRowClick={onRowClick}
        className={className}
      />
    </div>
  );
}
