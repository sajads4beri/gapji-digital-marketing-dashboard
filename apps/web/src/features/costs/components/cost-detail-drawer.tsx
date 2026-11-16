'use client';

import * as React from 'react';
import {
  DollarSign,
  Calendar,
  Building,
  FileText,
  Tag,
  Share2,
  Layers,
  Edit2,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Drawer } from '@/components/common/drawer';
import { Button } from '@/components/ui/button';
import { ConfirmModal } from '@/components/common/confirm-modal';
import { useToast } from '@/components/common/toast-provider';
import { formatMoneyDisplay } from '@/components/ui/money-input';
import { formatPersianDate } from '@/lib/persian-date';
import {
  CostItem,
  COST_CATEGORY_LABELS,
  COST_CHANNEL_LABELS,
  COST_CURRENCY_LABELS,
  COST_STATUS_LABELS,
} from '../types';
import { costService } from '../index';

export interface CostDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cost: CostItem | null;
  onEdit?: (cost: CostItem) => void;
  onDelete?: (costId: string) => void;
}

export function CostDetailDrawer({
  isOpen,
  onClose,
  cost,
  onEdit,
  onDelete,
}: CostDetailDrawerProps) {
  const { toast } = useToast();

  const [isDeleting, setIsDeleting] = React.useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = React.useState(false);

  if (!cost) {
    return null;
  }

  // مدیریت فرآیند حذف
  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      const success = await costService.delete(cost.id);
      if (success) {
        toast.success('هزینه با موفقیت حذف شد.');
        setShowConfirmDelete(false);
        onDelete?.(cost.id);
        onClose();
      } else {
        toast.error('هزینه یافت نشد یا قبلاً حذف شده است.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'خطا در حذف هزینه';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // نشان وضعیت پرداخت
  const renderStatusBadge = () => {
    if (cost.status === 'paid') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {COST_STATUS_LABELS.paid}
        </span>
      );
    }
    if (cost.status === 'pending') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
          <Clock className="w-3.5 h-3.5" />
          {COST_STATUS_LABELS.pending}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/30">
        <AlertCircle className="w-3.5 h-3.5" />
        {COST_STATUS_LABELS.draft}
      </span>
    );
  };

  return (
    <>
      <Drawer
        open={isOpen}
        onClose={onClose}
        placement="right"
        size="md"
        title={
          <div className="flex items-center gap-2" dir="rtl">
            <div className="w-8 h-8 rounded-lg bg-[#18263A] text-[#719BDF] border border-[#1F2E45] flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
            <div className="truncate">
              <span className="text-xs text-slate-400 font-normal block">جزئیات سند هزینه</span>
              <span className="text-sm font-bold text-slate-100 font-display truncate block">
                {cost.title}
              </span>
            </div>
          </div>
        }
        footer={
          <div className="flex items-center justify-between w-full gap-3" dir="rtl">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfirmDelete(true)}
              className="text-[#D66B73] border-[#D66B73]/30 hover:bg-[#D66B73]/10 hover:text-[#D66B73]"
            >
              <Trash2 className="w-4 h-4 me-1.5" />
              حذف هزینه
            </Button>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onClose} className="text-slate-400 hover:text-white">
                بستن
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onEdit?.(cost);
                  onClose();
                }}
                className="bg-gradient-to-r from-blue-600 to-[#719BDF] text-white shadow-md shadow-blue-500/20"
              >
                <Edit2 className="w-4 h-4 me-1.5" />
                ویرایش
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-6 text-sm text-slate-200" dir="rtl">
          {/* کارت برجسته مبلغ تومانی */}
          <div className="p-4 bg-gradient-to-br from-[#18263A] to-[#111D2E] rounded-2xl border border-[#1F2E45] text-center space-y-1.5 shadow-xl">
            <span className="text-xs text-slate-400">معادل نهایی تومانی</span>
            <div className="text-2xl font-bold text-slate-100 font-display tracking-tight flex items-baseline justify-center gap-1.5">
              <span>{formatMoneyDisplay(cost.normalizedAmountToman) || '۰'}</span>
              <span className="text-xs font-normal text-slate-400">تومان</span>
            </div>
            {cost.currency !== 'TOMAN' && (
              <p className="text-xs text-slate-400 pt-1 border-t border-[#1F2E45]">
                مبلغ اصلی: {cost.amount.toLocaleString()} {COST_CURRENCY_LABELS[cost.currency]} (با نرخ{' '}
                {cost.exchangeRate.toLocaleString()} تومان)
              </p>
            )}
          </div>

          {/* اطلاعات کلیدی ردیف */}
          <div className="grid grid-cols-2 gap-4 bg-[#0B1423]/60 p-4 rounded-xl border border-[#1F2E45]">
            <div>
              <span className="text-xs text-slate-400 block mb-1">وضعیت پرداخت</span>
              {renderStatusBadge()}
            </div>

            <div>
              <span className="text-xs text-slate-400 block mb-1">تاریخ ثبت هزینه</span>
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-200">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>{formatPersianDate(cost.date)}</span>
              </div>
            </div>

            <div>
              <span className="text-xs text-slate-400 block mb-1">دسته‌بندی</span>
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-200">
                <Tag className="w-3.5 h-3.5 text-slate-500" />
                <span>{COST_CATEGORY_LABELS[cost.category] || cost.category}</span>
              </div>
            </div>

            <div>
              <span className="text-xs text-slate-400 block mb-1">کانال / پلتفرم</span>
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-200">
                <Share2 className="w-3.5 h-3.5 text-slate-500" />
                <span>{cost.channel ? COST_CHANNEL_LABELS[cost.channel] || cost.channel : 'عمومی'}</span>
              </div>
            </div>
          </div>

          {/* کمپین مرتبط */}
          <div className="space-y-1.5 border-t border-[#1F2E45] pt-4">
            <span className="text-xs text-slate-400 block">کمپین مرتبط</span>
            <div className="flex items-center gap-2 p-3 bg-[#0B1423]/60 rounded-xl border border-[#1F2E45]">
              <Layers className="w-4 h-4 text-[#719BDF] shrink-0" />
              <div className="truncate">
                {cost.campaignId ? (
                  <>
                    <span className="text-xs font-bold text-slate-100 font-display block truncate">
                      {cost.campaignName || cost.campaignId}
                    </span>
                    <span className="text-[11px] text-slate-400 block font-mono">
                      شناسه: {cost.campaignId}
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-slate-400">
                    هزینه عمومی بازاریابی (بدون ارتباط با کمپین خاص)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* اطلاعات فاکتور و فروشنده */}
          <div className="space-y-3 border-t border-[#1F2E45] pt-4">
            <span className="text-xs text-slate-400 block">اطلاعات فاکتور و مجری</span>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#0B1423]/60 rounded-xl border border-[#1F2E45] space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Building className="w-3.5 h-3.5" />
                  <span>فروشنده / آژانس</span>
                </div>
                <p className="font-semibold text-slate-200 truncate">
                  {cost.vendor || 'ثبت نشده'}
                </p>
              </div>

              <div className="p-3 bg-[#0B1423]/60 rounded-xl border border-[#1F2E45] space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <FileText className="w-3.5 h-3.5" />
                  <span>شماره فاکتور / رهگیری</span>
                </div>
                <p className="font-semibold text-slate-200 truncate font-mono" dir="ltr">
                  {cost.invoiceNumber || '—'}
                </p>
              </div>
            </div>
          </div>

          {/* توضیحات تکمیلی */}
          {cost.notes && (
            <div className="space-y-1.5 border-t border-[#1F2E45] pt-4">
              <span className="text-xs text-slate-400 block">توضیحات و یادداشت‌ها</span>
              <div className="p-3 bg-[#0B1423]/60 rounded-xl text-xs text-slate-300 leading-relaxed whitespace-pre-wrap border border-[#1F2E45]">
                {cost.notes}
              </div>
            </div>
          )}

          {/* فراداده و تاریخچه ثبت */}
          <div className="border-t border-[#1F2E45] pt-4 text-[11px] text-slate-500 space-y-1 font-mono">
            <div className="flex justify-between">
              <span>شناسه ردیف:</span>
              <span className="text-slate-400">{cost.id}</span>
            </div>
            <div className="flex justify-between">
              <span>زمان ثبت اولیه:</span>
              <span>{formatPersianDate(cost.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span>آخرین ویرایش:</span>
              <span>{formatPersianDate(cost.updatedAt)}</span>
            </div>
          </div>
        </div>
      </Drawer>

      {/* مودال تأیید حذف */}
      <ConfirmModal
        isOpen={showConfirmDelete}
        onClose={() => !isDeleting && setShowConfirmDelete(false)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        variant="danger"
        title="حذف ردیف هزینه"
        message={`آیا از حذف هزینه «${cost.title}» به مبلغ ${formatMoneyDisplay(cost.normalizedAmountToman)} تومان اطمینان دارید؟ این عملیات قابل بازگشت نیست.`}
        confirmText="بله، حذف شود"
        cancelText="انصراف"
      />
    </>
  );
}
