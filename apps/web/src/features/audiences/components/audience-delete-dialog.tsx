'use client';

import * as React from 'react';
import {
  AlertTriangle,
  Trash2,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Audience } from '../types';

export interface AudienceDeleteDialogProps {
  isOpen: boolean;
  audience: Audience | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function AudienceDeleteDialog({
  isOpen,
  audience,
  isDeleting,
  onClose,
  onConfirm,
}: AudienceDeleteDialogProps) {
  if (!isOpen || !audience) return null;

  const isBlocked = audience.campaignsCount > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl bg-[#111D2E] p-6 shadow-2xl border border-[#1F2E45] text-right">
        {isBlocked ? (
          <div>
            <div className="flex items-center gap-3 text-amber-400 mb-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
                <ShieldAlert className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">
                  عدم امکان حذف مخاطب
                </h3>
                <span className="text-xs text-amber-400/80 font-medium">
                  قانون محصول (PRD ص ۱۴): حذف فقط در صورت عدم استفاده
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3.5 my-4 text-xs text-amber-200/90 leading-relaxed">
              <p className="font-semibold mb-1">
                مخاطب «{audience.name}» هم‌اکنون به{' '}
                <span className="font-bold text-amber-300 underline decoration-amber-500">
                  {audience.campaignsCount} کمپین
                </span>{' '}
                متصل است.
              </p>
              <p className="text-amber-200/70 text-[11px] mt-1">
                جهت حفظ یکپارچگی داده‌های عملکردی و آمارهای مالی گذشته، حذف این گروه مخاطب امکان‌پذیر نیست. در صورت عدم نیاز، می‌توانید نام آن را ویرایش یا در کمپین‌های جدید از آن استفاده نکنید.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                onClick={onClose}
                className="bg-[#18263A] hover:bg-[#1F2E45] text-white border border-[#1F2E45] text-xs px-5"
              >
                متوجه شدم
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="h-6 w-6 text-rose-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">
                  تأیید حذف مخاطب هدف
                </h3>
                <span className="text-xs text-slate-400">
                  این عملیات غیرقابل بازگشت است
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 my-4 leading-relaxed">
              آیا از حذف کامل گروه مخاطب «<strong className="text-white">{audience.name}</strong>» اطمینان دارید؟ این مخاطب در هیچ کمپینی استفاده نشده و با خیال راحت قابل حذف است.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isDeleting}
                className="text-xs bg-[#18263A] border-[#1F2E45] text-slate-300 hover:text-white hover:bg-[#1F2E45]"
              >
                انصراف
              </Button>
              <Button
                type="button"
                onClick={onConfirm}
                disabled={isDeleting}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs gap-1.5 shadow-md shadow-rose-900/30"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    در حال حذف...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    تأیید و حذف
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
