'use client';

import * as React from 'react';
import { UserX, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Modal } from '@/components/common/modal';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/common/toast-provider';
import { userService } from '../users.mock';
import { UserItem, USER_ROLE_LABELS } from '../types';

export interface DeactivateUserModalProps {
  isOpen: boolean;
  user: UserItem | null;
  activeAdminsCount?: number;
  onClose: () => void;
  onSuccess?: (updatedUser: UserItem) => void;
}

export function DeactivateUserModal({
  isOpen,
  user,
  activeAdminsCount = 1,
  onClose,
  onSuccess,
}: DeactivateUserModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  // بررسی گارد حیاتی: آیا کاربر تنها ادمین فعال سامانه است؟
  const isLastActiveAdmin =
    user?.role === 'admin' && user?.status === 'active' && activeAdminsCount <= 1;

  const handleConfirm = async () => {
    if (!user || isLastActiveAdmin || isLoading) return;

    try {
      setIsLoading(true);
      const updated = await userService.deactivateUser(user.id);
      toast.success(`حساب کاربری «${user.fullName}» با موفقیت غیرفعال شد.`);
      onSuccess?.(updated);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'خطا در غیرفعال‌سازی کاربر.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={isLoading ? () => {} : onClose}
      size="md"
      title={
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isLastActiveAdmin
                ? 'bg-amber-50 text-amber-600 border-amber-200'
                : 'bg-rose-50 text-rose-600 border-rose-200'
            }`}
          >
            {isLastActiveAdmin ? <ShieldAlert size={20} /> : <UserX size={20} />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {isLastActiveAdmin ? 'محدودیت امنیتی سیستم' : 'تأیید غیرفعال‌سازی کاربر'}
            </h3>
            <p className="text-xs text-slate-500 font-normal mt-0.5">
              کاربر: {user.fullName} ({USER_ROLE_LABELS[user.role]})
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            {isLastActiveAdmin ? 'متوجه شدم' : 'انصراف'}
          </Button>

          {!isLastActiveAdmin && (
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleConfirm}
              isLoading={isLoading}
              className="bg-rose-600 hover:bg-rose-700 focus:ring-rose-500"
            >
              غیرفعال‌سازی حساب
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-3 py-1" dir="rtl">
        {isLastActiveAdmin ? (
          /* هشدار مسدودیت عملیات برای آخرین ادمین فعال */
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-800">
              <AlertTriangle size={16} className="text-amber-600" />
              <span>عملیات غیرمجاز: آخرین ادمین فعال سامانه</span>
            </div>
            <p className="leading-relaxed">
              کاربر «{user.fullName}» در حال حاضر <strong>تنها ادمین فعال</strong> سامانه است. طبق قوانین امنیتی و نیازمندی‌های محصول، سیستم همواره باید حداقل یک ادمین فعال برای مدیریت سازمان داشته باشد و امکان غیرفعال‌سازی آن وجود ندارد.
            </p>
            <p className="text-[11px] text-amber-700 pt-1 border-t border-amber-200/60">
              راهکار: ابتدا کاربر دیگری را به عنوان ادمین فعال تعریف کنید، سپس نسبت به غیرفعال‌سازی این حساب اقدام فرمایید.
            </p>
          </div>
        ) : (
          /* پیام تایید استاندارد و توضیح اثر عملیات */
          <div className="space-y-3">
            <p className="text-xs text-slate-600 leading-relaxed">
              آیا از غیرفعال‌سازی حساب کاربری <strong>«{user.fullName}»</strong> با نشانی{' '}
              <span className="font-mono text-slate-800 font-bold" dir="ltr">
                {user.email}
              </span>{' '}
              اطمینان دارید؟
            </p>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs text-slate-600 space-y-1.5">
              <span className="font-bold text-slate-800 block">اثر این عملیات بر دسترسی کاربر:</span>
              <ul className="list-disc list-inside text-[11px] text-slate-500 space-y-1">
                <li>امکان ورود به سامانه بلافاصله برای این کاربر مسدود خواهد شد.</li>
                <li>نشست‌های فعال او در سیستم خاتمه می‌یابد.</li>
                <li>کلیه سوابق، گزارش‌ها و تاریخچه اقدامات کاربر دست‌نخورده باقی می‌ماند.</li>
                <li>شما هر زمان می‌توانید با کلیک بر روی «فعال‌سازی»، دسترسی او را مجدداً برقرار کنید.</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
