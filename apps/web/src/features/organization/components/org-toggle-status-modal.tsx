'use client';

import * as React from 'react';
import { Modal } from '@/components/common/modal';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Power, CheckCircle2, ShieldAlert } from 'lucide-react';
import type { OrgListType, OrgListItem } from '../types';
import { ORG_LIST_TITLES } from '../types';

export interface OrgToggleStatusModalProps {
  isOpen: boolean;
  item: OrgListItem | null;
  listType: OrgListType;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: (item: OrgListItem) => Promise<void> | void;
}

export function OrgToggleStatusModal({
  isOpen,
  item,
  listType,
  isLoading = false,
  onClose,
  onConfirm,
}: OrgToggleStatusModalProps) {
  if (!item) return null;

  const isDeactivating = item.isActive;
  const usage = item.usageCount ?? 0;

  const handleConfirm = async () => {
    await onConfirm(item);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isLoading ? () => {} : onClose}
      title={
        <div className="flex items-center gap-2.5 text-slate-100" dir="rtl">
          {isDeactivating ? (
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
              <AlertTriangle size={18} />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <CheckCircle2 size={18} />
            </div>
          )}
          <span className="font-bold text-sm sm:text-base font-display">
            {isDeactivating
              ? `تأیید غیرفعال‌سازی «${item.label}»`
              : `تأیید فعال‌سازی مجدد «${item.label}»`}
          </span>
        </div>
      }
      size="md"
    >
      <div className="space-y-4 pt-1 text-slate-100" dir="rtl">
        {isDeactivating ? (
          <>
            {usage > 0 ? (
              <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs sm:text-sm">
                  <ShieldAlert size={16} className="text-amber-400 shrink-0" />
                  <span>
                    این گزینه در {usage.toLocaleString('fa-IR')} مورد استفاده شده است؛ فقط می‌توان آن را غیرفعال کرد.
                  </span>
                </div>
                <p className="text-xs text-amber-200/80 leading-relaxed">
                  بر اساس الزامات پایداری داده‌ها در سند محصول، حذف فیزیکی این گزینه به منظور حفظ سوابق آماری و مالی ممنوع است. با غیرفعال‌سازی، این گزینه در فرم‌های ثبت جدید نمایش داده نخواهد شد اما تمام اطلاعات پیشین پایدار می‌مانند.
                </p>
              </div>
            ) : (
              <div className="bg-[#18263A] border border-[#1F2E45] rounded-2xl p-4 text-xs text-slate-300 space-y-1">
                <p className="font-medium text-slate-100">
                  آیا از غیرفعال‌سازی گزینه «{item.label}» در فهرست «{ORG_LIST_TITLES[listType]}» اطمینان دارید؟
                </p>
                <p className="text-[11px] text-slate-400">
                  این گزینه در فرم‌های انتخابی جدید غیرفعال می‌شود اما در صورت نیاز می‌توانید مجدداً آن را فعال فرمایید.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-4 text-xs text-emerald-200 space-y-1">
            <p className="font-bold text-emerald-300">
              فعال‌سازی مجدد گزینه «{item.label}»
            </p>
            <p className="text-xs text-emerald-200/80">
              با فعال‌سازی، این گزینه بلافاصله در فرم‌ها، جدول‌ها و سلکتورهای مربوط به {ORG_LIST_TITLES[listType]} در دسترس اعضای سازمان قرار خواهد گرفت.
            </p>
          </div>
        )}

        {/* دکمه‌های اقدام */}
        <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#1F2E45]">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
            className="text-xs border-[#1F2E45] bg-[#18263A] text-slate-300 hover:bg-[#1F2E45]"
          >
            انصراف
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleConfirm}
            disabled={isLoading}
            className={`text-xs text-white min-w-[100px] border-0 shadow-md ${
              isDeactivating
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-900/30'
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/30'
            }`}
          >
            <Power size={13} className="me-1.5" />
            {isLoading
              ? 'در حال اعمال...'
              : isDeactivating
              ? 'تأیید غیرفعال‌سازی'
              : 'تأیید فعال‌سازی'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
