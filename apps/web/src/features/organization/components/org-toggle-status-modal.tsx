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
        <div className="flex items-center gap-2 text-slate-900" dir="rtl">
          {isDeactivating ? (
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <AlertTriangle size={18} />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 size={18} />
            </div>
          )}
          <span className="font-bold text-sm sm:text-base">
            {isDeactivating
              ? `تأیید غیرفعال‌سازی «${item.label}»`
              : `تأیید فعال‌سازی مجدد «${item.label}»`}
          </span>
        </div>
      }
      size="md"
    >
      <div className="space-y-4 pt-1" dir="rtl">
        {isDeactivating ? (
          <>
            {/* هشدار صریح برای گزینه‌های دارای استفاده مطابق سند محصول */}
            {usage > 0 ? (
              <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-xs sm:text-sm">
                  <ShieldAlert size={16} className="text-amber-600 shrink-0" />
                  <span>
                    این گزینه در {usage.toLocaleString('fa-IR')} مورد استفاده شده است؛ فقط می‌توان آن را غیرفعال کرد.
                  </span>
                </div>
                <p className="text-xs text-amber-700/90 leading-relaxed">
                  بر اساس الزامات پایداری داده‌ها در سند محصول، حذف فیزیکی این گزینه به منظور حفظ سوابق آماری و مالی ممنوع است. با غیرفعال‌سازی، این گزینه در فرم‌های ثبت جدید نمایش داده نخواهد شد اما تمام اطلاعات پیشین پایدار می‌مانند.
                </p>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 space-y-1">
                <p className="font-medium text-slate-800">
                  آیا از غیرفعال‌سازی گزینه «{item.label}» در فهرست «{ORG_LIST_TITLES[listType]}» اطمینان دارید؟
                </p>
                <p className="text-[11px] text-slate-500">
                  این گزینه در فرم‌های انتخابی جدید غیرفعال می‌شود اما در صورت نیاز می‌توانید مجدداً آن را فعال فرمایید.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-800 space-y-1">
            <p className="font-bold">
              فعال‌سازی مجدد گزینه «{item.label}»
            </p>
            <p className="text-xs text-emerald-700/90">
              با فعال‌سازی، این گزینه بلافاصله در فرم‌ها، جدول‌ها و سلکتورهای مربوط به {ORG_LIST_TITLES[listType]} در دسترس اعضای سازمان قرار خواهد گرفت.
            </p>
          </div>
        )}

        {/* دکمه‌های اقدام */}
        <div className="pt-2 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
            className="text-xs"
          >
            انصراف
          </Button>

          <Button
            type="button"
            variant={isDeactivating ? 'primary' : 'primary'}
            size="sm"
            onClick={handleConfirm}
            disabled={isLoading}
            className={`text-xs text-white min-w-[100px] ${
              isDeactivating
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            <Power size={13} className="ml-1.5" />
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
