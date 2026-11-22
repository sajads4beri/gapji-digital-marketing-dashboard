'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ExtendedCampaign,
  CampaignStatusType,
} from '@/features/campaigns/types';
import { campaignService } from '@/features/campaigns/api';
import {
  DataTable,
  ColumnDef,
} from '@/components/common/data-table';
import { ConfirmModal } from '@/components/common/confirm-modal';
import { Modal } from '@/components/common/modal';
import { StatusBadge } from '@/components/common/status-badge';
import { useToast } from '@/components/common/toast-provider';
import {
  Loader2,
  Eye,
  Edit3,
  Trash2,
  CheckCircle2,
} from 'lucide-react';

export interface CampaignsTableProps {
  campaigns: ExtendedCampaign[];
  loading?: boolean;
  onDeleteCampaign?: (id: string) => Promise<void>;
  onUpdateStatus?: (id: string, newStatus: CampaignStatusType) => Promise<void>;
  onRefresh?: () => Promise<void> | void;
  // جهت حفظ سازگاری با کدهای پیشین
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  statusFilter?: string;
  onStatusFilterChange?: (value: string) => void;
}

export function CampaignsTable({
  campaigns,
  loading = false,
  onDeleteCampaign,
  onUpdateStatus,
  onRefresh,
}: CampaignsTableProps) {
  const router = useRouter();
  const { toast } = useToast();

  // وضعیت‌های مربوط به حذف تکی
  const [campaignToDelete, setCampaignToDelete] =
    useState<ExtendedCampaign | null>(null);
  const [isDeletingSingle, setIsDeletingSingle] = useState(false);

  // وضعیت در حال به‌روزرسانی برای تغییر وضعیت تکی
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  // وضعیت‌های مربوط به عملیات گروهی (Bulk Actions)
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [bulkTargetIds, setBulkTargetIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isBulkStatusModalOpen, setIsBulkStatusModalOpen] = useState(false);
  const [bulkTargetStatus, setBulkTargetStatus] =
    useState<CampaignStatusType>('active');
  const [isBulkOperating, setIsBulkOperating] = useState(false);

  // تغییر وضعیت تکی یک کمپین
  const handleStatusChange = async (
    id: string,
    newStatus: CampaignStatusType,
  ) => {
    setStatusUpdatingId(id);
    try {
      if (onUpdateStatus) {
        await onUpdateStatus(id, newStatus);
      } else {
        await campaignService.updateStatus(id, newStatus);
        toast.success('وضعیت کمپین با موفقیت به‌روزرسانی شد.');
        await onRefresh?.();
      }
    } catch (err: any) {
      console.error('Error updating status:', err);
      toast.error(err?.message || 'خطا در به‌روزرسانی وضعیت کمپین.');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  // تأیید حذف تکی کمپین
  const handleConfirmSingleDelete = async () => {
    if (!campaignToDelete) return;
    setIsDeletingSingle(true);
    try {
      if (onDeleteCampaign) {
        await onDeleteCampaign(campaignToDelete.id);
      } else {
        await campaignService.delete(campaignToDelete.id);
        toast.success('کمپین با موفقیت حذف شد.');
        await onRefresh?.();
      }
      setSelectedRowIds((prev) =>
        prev.filter((id) => id !== campaignToDelete.id),
      );
      setCampaignToDelete(null);
    } catch (err: any) {
      console.error('Error deleting campaign:', err);
      toast.error(err?.message || 'خطا در حذف کمپین.');
    } finally {
      setIsDeletingSingle(false);
    }
  };

  // تأیید و اجرای عملیات حذف گروهی
  const handleConfirmBulkDelete = async () => {
    if (bulkTargetIds.length === 0) return;
    setIsBulkOperating(true);
    try {
      const results = await Promise.allSettled(
        bulkTargetIds.map((id) =>
          onDeleteCampaign
            ? onDeleteCampaign(id)
            : campaignService.delete(id),
        ),
      );

      const succeededIds = bulkTargetIds.filter(
        (_, idx) => results[idx].status === 'fulfilled',
      );
      const failedIds = bulkTargetIds.filter(
        (_, idx) => results[idx].status === 'rejected',
      );

      if (failedIds.length === 0) {
        toast.success(
          `${succeededIds.length.toLocaleString('fa-IR')} کمپین انتخاب‌شده با موفقیت حذف شدند.`,
        );
        setSelectedRowIds([]);
        setIsBulkDeleteModalOpen(false);
        await onRefresh?.();
      } else if (succeededIds.length > 0) {
        toast.warning(
          `${succeededIds.length.toLocaleString('fa-IR')} کمپین حذف شدند؛ اما حذف ${failedIds.length.toLocaleString('fa-IR')} مورد با خطا مواجه شد.`,
        );
        // فقط شناسه‌های ناموفق برای امکان تلاش مجدد باقی می‌مانند
        setSelectedRowIds(failedIds);
        setIsBulkDeleteModalOpen(false);
        await onRefresh?.();
      } else {
        toast.error('خطا در اجرای حذف گروهی کمپین‌ها. لطفاً دوباره تلاش کنید.');
      }
    } catch (err: any) {
      console.error('Bulk delete fatal error:', err);
      toast.error(err?.message || 'خطا در حذف گروهی.');
    } finally {
      setIsBulkOperating(false);
    }
  };

  // تأیید و اجرای عملیات تغییر وضعیت گروهی
  const handleConfirmBulkStatusChange = async () => {
    if (bulkTargetIds.length === 0 || !bulkTargetStatus) return;
    setIsBulkOperating(true);
    try {
      const results = await Promise.allSettled(
        bulkTargetIds.map((id) =>
          onUpdateStatus
            ? onUpdateStatus(id, bulkTargetStatus)
            : campaignService.updateStatus(id, bulkTargetStatus),
        ),
      );

      const succeededIds = bulkTargetIds.filter(
        (_, idx) => results[idx].status === 'fulfilled',
      );
      const failedIds = bulkTargetIds.filter(
        (_, idx) => results[idx].status === 'rejected',
      );

      const statusLabel =
        bulkTargetStatus === 'active'
          ? 'فعال'
          : bulkTargetStatus === 'paused'
          ? 'متوقف'
          : bulkTargetStatus === 'completed'
          ? 'تکمیل شده'
          : bulkTargetStatus === 'draft'
          ? 'پیش‌نویس'
          : 'بایگانی';

      if (failedIds.length === 0) {
        toast.success(
          `وضعیت ${succeededIds.length.toLocaleString('fa-IR')} کمپین با موفقیت به «${statusLabel}» تغییر یافت.`,
        );
        setSelectedRowIds([]);
        setIsBulkStatusModalOpen(false);
        await onRefresh?.();
      } else if (succeededIds.length > 0) {
        toast.warning(
          `وضعیت ${succeededIds.length.toLocaleString('fa-IR')} کمپین تغییر یافت، اما ${failedIds.length.toLocaleString('fa-IR')} مورد با خطا مواجه شد.`,
        );
        // فقط شناسه‌های ناموفق برای امکان تلاش مجدد باقی می‌مانند
        setSelectedRowIds(failedIds);
        setIsBulkStatusModalOpen(false);
        await onRefresh?.();
      } else {
        toast.error('خطا در به‌روزرسانی وضعیت کمپین‌های انتخاب‌شده.');
      }
    } catch (err: any) {
      console.error('Bulk status change fatal error:', err);
      toast.error(err?.message || 'خطا در تغییر وضعیت گروهی.');
    } finally {
      setIsBulkOperating(false);
    }
  };

  // تعریف ساختار ۹ ستون استاندارد با استفاده از ColumnDef
  const columns: ColumnDef<ExtendedCampaign, unknown>[] = useMemo(
    () => [
      {
        id: 'name',
        header: 'نام کمپین',
        accessorKey: 'name',
        sortable: true,
        hideable: false,
        sticky: 'right',
        minWidth: '220px',
        cell: ({ row }) => (
          <Link
            href={`/campaigns/${row.id}`}
            className="font-bold text-slate-100 hover:text-[#719BDF] transition-colors block text-right"
            title="مشاهده صفحه جزئیات کمپین"
          >
            {row.name}
          </Link>
        ),
      },
      {
        id: 'channel',
        header: 'کانال',
        accessorKey: 'channel',
        sortable: true,
        hideable: true,
        minWidth: '110px',
        cell: ({ row }) => (
          <span className="inline-block bg-[#18263A] text-slate-300 border border-[#1F2E45] px-2.5 py-0.5 rounded-lg text-xs font-medium">
            {row.channel}
          </span>
        ),
      },
      {
        id: 'status',
        header: 'وضعیت',
        accessorKey: 'status',
        sortable: true,
        hideable: true,
        align: 'center',
        minWidth: '120px',
        cell: ({ row }) => (
          <div className="inline-flex items-center justify-center">
            {statusUpdatingId === row.id ? (
              <Loader2 size={14} className="animate-spin text-[#719BDF]" />
            ) : (
              <div
                className="relative group inline-flex items-center cursor-pointer"
                title="کلیک برای تغییر وضعیت این کمپین"
              >
                <StatusBadge status={row.status} />
                <select
                  value={row.status}
                  onChange={(e) =>
                    handleStatusChange(
                      row.id,
                      e.target.value as CampaignStatusType,
                    )
                  }
                  aria-label={`تغییر وضعیت کمپین ${row.name}`}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                >
                  <option value="active" className="bg-[#111D2E] text-slate-100">فعال</option>
                  <option value="paused" className="bg-[#111D2E] text-slate-100">متوقف</option>
                  <option value="completed" className="bg-[#111D2E] text-slate-100">تکمیل شده</option>
                  <option value="draft" className="bg-[#111D2E] text-slate-100">پیش‌نویس</option>
                  <option value="archived" className="bg-[#111D2E] text-slate-100">بایگانی</option>
                </select>
              </div>
            )}
          </div>
        ),
      },
      {
        id: 'budget',
        header: 'بودجه (تومان)',
        accessorKey: 'budget',
        sortable: true,
        hideable: true,
        align: 'right',
        minWidth: '130px',
        cell: ({ row }) => (
          <span className="font-semibold text-slate-200 tabular-nums font-display">
            {row.budget.toLocaleString('fa-IR')}
          </span>
        ),
      },
      {
        id: 'spend',
        header: 'هزینه (تومان)',
        accessorKey: 'spend',
        sortable: true,
        hideable: true,
        align: 'right',
        minWidth: '130px',
        cell: ({ row }) => (
          <span className="font-medium text-slate-300 tabular-nums font-display">
            {row.spend.toLocaleString('fa-IR')}
          </span>
        ),
      },
      {
        id: 'impressions',
        header: 'نمایش',
        accessorKey: 'impressions',
        sortable: true,
        hideable: true,
        align: 'right',
        minWidth: '100px',
        cell: ({ row }) => (
          <span className="text-slate-400 tabular-nums font-display">
            {row.impressions.toLocaleString('fa-IR')}
          </span>
        ),
      },
      {
        id: 'clicks',
        header: 'کلیک',
        accessorKey: 'clicks',
        sortable: true,
        hideable: true,
        align: 'right',
        minWidth: '100px',
        cell: ({ row }) => (
          <span className="text-slate-400 tabular-nums font-display">
            {row.clicks.toLocaleString('fa-IR')}
          </span>
        ),
      },
      {
        id: 'conversions',
        header: 'تبدیل',
        accessorKey: 'conversions',
        sortable: true,
        hideable: true,
        align: 'right',
        minWidth: '100px',
        cell: ({ row }) => (
          <span className="font-bold text-slate-100 tabular-nums font-display">
            {row.conversions.toLocaleString('fa-IR')}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'عملیات',
        sortable: false,
        hideable: false,
        align: 'center',
        sticky: 'left',
        width: '110px',
        minWidth: '110px',
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-1">
            <Link
              href={`/campaigns/${row.id}`}
              className="p-1.5 text-slate-400 hover:text-[#719BDF] hover:bg-[#719BDF]/10 rounded-lg transition-colors cursor-pointer"
              title="مشاهده جزئیات کامل کمپین"
              aria-label={`مشاهده جزئیات کمپین ${row.name}`}
            >
              <Eye size={15} />
            </Link>

            <Link
              href={`/campaigns/${row.id}/edit`}
              className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors cursor-pointer"
              title="ویرایش کمپین"
              aria-label={`ویرایش کمپین ${row.name}`}
            >
              <Edit3 size={15} />
            </Link>

            <button
              type="button"
              onClick={() => setCampaignToDelete(row)}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
              title="حذف کمپین"
              aria-label={`حذف کمپین ${row.name}`}
            >
              <Trash2 size={15} />
            </button>
          </div>
        ),
      },
    ],
    [statusUpdatingId, onUpdateStatus, onDeleteCampaign, onRefresh],
  );

  return (
    <div className="space-y-3">
      {/* جدول داده‌ها با استفاده از کامپوننت عمومی DataTable */}
      <DataTable<ExtendedCampaign>
        data={campaigns}
        columns={columns}
        keyExtractor={(item) => item.id}
        loading={loading}
        onRowClick={(row) => router.push(`/campaigns/${row.id}`)}
        enableRowSelection
        selectedRowIds={selectedRowIds}
        onRowSelectionChange={setSelectedRowIds}
        enableColumnVisibility
        enableDensityToggle
        emptyState={{
          title: 'هیچ کمپینی یافت نشد',
          description:
            'فیلترهای جستجو یا تاریخ را تغییر دهید یا کمپین جدیدی ثبت کنید.',
        }}
        toolbarActions={
          <div className="text-xs text-slate-400 font-medium px-1">
            مجموعاً{' '}
            <span className="font-bold text-slate-100 font-display">
              {campaigns.length.toLocaleString('fa-IR')}
            </span>{' '}
            کمپین
          </div>
        }
        bulkActions={(selectedIds) => (
          <div className="flex items-center gap-2">
            {/* دکمه تغییر وضعیت گروهی */}
            <button
              type="button"
              onClick={() => {
                setBulkTargetIds(selectedIds);
                setIsBulkStatusModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#719BDF] bg-[#111D2E] hover:bg-[#18263A] border border-[#719BDF]/30 transition-colors shadow-xs cursor-pointer"
            >
              <Edit3 size={13} />
              <span>تغییر وضعیت گروهی</span>
            </button>

            {/* دکمه حذف گروهی */}
            <button
              type="button"
              onClick={() => {
                setBulkTargetIds(selectedIds);
                setIsBulkDeleteModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-colors shadow-xs cursor-pointer"
            >
              <Trash2 size={13} />
              <span>
                حذف گروهی ({selectedIds.length.toLocaleString('fa-IR')})
              </span>
            </button>
          </div>
        )}
      />

      {/* مدال تأیید حذف تکی */}
      <ConfirmModal
        isOpen={Boolean(campaignToDelete)}
        title="تأیید حذف کمپین"
        message={`آیا از حذف کمپین «${campaignToDelete?.name || ''}» اطمینان دارید؟ تمامی داده‌های آماری مربوط به این کمپین حذف خواهند شد.`}
        confirmText="بله، حذف شود"
        cancelText="انصراف"
        variant="danger"
        isLoading={isDeletingSingle}
        onConfirm={handleConfirmSingleDelete}
        onClose={() => setCampaignToDelete(null)}
      />

      {/* مدال تأیید حذف گروهی */}
      <ConfirmModal
        isOpen={isBulkDeleteModalOpen}
        title="تأیید حذف گروهی کمپین‌ها"
        message={`آیا از حذف ${bulkTargetIds.length.toLocaleString('fa-IR')} کمپین انتخاب‌شده اطمینان دارید؟ این عملیات قابل بازگشت نیست.`}
        confirmText="بله، حذف شوند"
        cancelText="انصراف"
        variant="danger"
        isLoading={isBulkOperating}
        onConfirm={handleConfirmBulkDelete}
        onClose={() => setIsBulkDeleteModalOpen(false)}
      />

      {/* مدال انتخاب و اعمال تغییر وضعیت گروهی */}
      <Modal
        isOpen={isBulkStatusModalOpen}
        onClose={() => setIsBulkStatusModalOpen(false)}
        title={`تغییر وضعیت گروهی (${bulkTargetIds.length.toLocaleString('fa-IR')} کمپین)`}
        description="وضعیت جدید مورد نظر برای اعمال روی کمپین‌های انتخاب‌شده را انتخاب کنید:"
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => setIsBulkStatusModalOpen(false)}
              disabled={isBulkOperating}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-[#18263A] hover:bg-[#20314A] border border-[#1F2E45] transition-colors cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="button"
              onClick={handleConfirmBulkStatusChange}
              disabled={isBulkOperating}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#719BDF] to-[#3B82F6] hover:brightness-110 shadow-[0_0_15px_rgba(113,155,223,0.25)] transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isBulkOperating && (
                <Loader2 size={13} className="animate-spin" />
              )}
              <span>اعمال وضعیت جدید</span>
            </button>
          </div>
        }
      >
        <div className="space-y-2 py-2">
          {[
            { value: 'active', label: 'فعال', color: 'text-emerald-400' },
            { value: 'paused', label: 'متوقف', color: 'text-amber-400' },
            {
              value: 'completed',
              label: 'تکمیل شده',
              color: 'text-[#719BDF]',
            },
            { value: 'draft', label: 'پیش‌نویس', color: 'text-slate-300' },
            { value: 'archived', label: 'بایگانی', color: 'text-slate-400' },
          ].map((opt) => (
            <label
              key={opt.value}
              className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                bulkTargetStatus === opt.value
                  ? 'border-[#719BDF] bg-[#719BDF]/10 font-bold'
                  : 'border-[#1F2E45] bg-[#18263A]/40 hover:bg-[#18263A] text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <input
                  type="radio"
                  name="bulkStatus"
                  value={opt.value}
                  checked={bulkTargetStatus === opt.value}
                  onChange={(e) =>
                    setBulkTargetStatus(e.target.value as CampaignStatusType)
                  }
                  className="w-4 h-4 text-[#719BDF] focus:ring-[#719BDF]/30 border-[#1F2E45] bg-[#18263A] cursor-pointer"
                />
                <span className={`text-xs ${opt.color}`}>{opt.label}</span>
              </div>
              {bulkTargetStatus === opt.value && (
                <CheckCircle2 size={16} className="text-[#719BDF]" />
              )}
            </label>
          ))}
        </div>
      </Modal>
    </div>
  );
}
