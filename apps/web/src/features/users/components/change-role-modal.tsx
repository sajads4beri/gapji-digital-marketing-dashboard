'use client';

import * as React from 'react';
import { Shield, AlertTriangle, Check, ShieldAlert } from 'lucide-react';
import { Modal } from '@/components/common/modal';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/common/toast-provider';
import { userService } from '../users.mock';
import {
  UserItem,
  UserRole,
  USER_ROLES,
  USER_ROLE_LABELS,
  USER_ROLE_DESCRIPTIONS,
} from '../types';

export interface ChangeRoleModalProps {
  isOpen: boolean;
  user: UserItem | null;
  activeAdminsCount?: number;
  onClose: () => void;
  onSuccess?: (updatedUser: UserItem) => void;
}

export function ChangeRoleModal({
  isOpen,
  user,
  activeAdminsCount = 1,
  onClose,
  onSuccess,
}: ChangeRoleModalProps) {
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = React.useState<UserRole>('sales_agent');
  const [isLoading, setIsLoading] = React.useState(false);

  // پیش‌مقداردهی با نقش فعلی کاربر هنگام باز شدن
  React.useEffect(() => {
    if (user && isOpen) {
      setSelectedRole(user.role);
      setIsLoading(false);
    }
  }, [user, isOpen]);

  // بررسی گارد امنیتی: آیا خلع نقش آخرین ادمین فعال صورت می‌گیرد؟
  const isLastAdminDemotionBlocked =
    user?.role === 'admin' &&
    user?.status === 'active' &&
    activeAdminsCount <= 1 &&
    selectedRole !== 'admin';

  const isSameRole = user?.role === selectedRole;

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!user || isSameRole || isLastAdminDemotionBlocked || isLoading) return;

    try {
      setIsLoading(true);
      const updated = await userService.changeUserRole(user.id, selectedRole);
      toast.success(
        `نقش کاربری «${user.fullName}» با موفقیت به «${USER_ROLE_LABELS[selectedRole]}» تغییر یافت.`
      );
      onSuccess?.(updated);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'خطا در تغییر نقش کاربری.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  const roleOptions = USER_ROLES.map((r) => ({
    value: r,
    label: USER_ROLE_LABELS[r],
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={isLoading ? () => {} : onClose}
      size="md"
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-200">
            <Shield size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">تغییر نقش کاربری</h3>
            <p className="text-xs text-slate-500 font-normal mt-0.5">
              کاربر: {user.fullName} ({user.email})
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
            انصراف
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={isSameRole || isLastAdminDemotionBlocked}
            className="bg-purple-600 hover:bg-purple-700 focus:ring-purple-500"
          >
            ذخیره تغییرات
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-1" dir="rtl">
        {/* اطلاعات نقش فعلی */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
          <span className="text-slate-500">نقش فعلی کاربر:</span>
          <span className="font-bold text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
            {USER_ROLE_LABELS[user.role]}
          </span>
        </div>

        {/* انتخابگر نقش جدید */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 block">
            نقش جدید سازمانی:
          </label>
          <Select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as UserRole)}
            options={roleOptions}
            disabled={isLoading}
          />
        </div>

        {/* هشدار ممانعت از خلع نقش آخرین ادمین */}
        {isLastAdminDemotionBlocked && (
          <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1.5 animate-in fade-in">
            <div className="flex items-center gap-1.5 font-bold text-amber-800">
              <ShieldAlert size={16} className="text-amber-600 shrink-0" />
              <span>عملیات غیرمجاز: آخرین ادمین فعال</span>
            </div>
            <p className="leading-relaxed text-[11px]">
              کاربر «{user.fullName}» تنها ادمین فعال سامانه است. شما نمی‌توانید نقش او را تغییر دهید مگر اینکه ابتدا کاربر فعال دیگری را به عنوان ادمین تعریف فرمایید.
            </p>
          </div>
        )}

        {/* شرح دسترسی‌های نقش انتخاب‌شده */}
        <div className="bg-purple-50/60 p-3.5 rounded-xl border border-purple-100 text-xs text-purple-900 space-y-1">
          <span className="font-bold text-purple-950 block">
            دسترسی‌های نقش {USER_ROLE_LABELS[selectedRole]}:
          </span>
          <p className="text-[11px] text-purple-800 leading-relaxed">
            {USER_ROLE_DESCRIPTIONS[selectedRole]}
          </p>
        </div>
      </form>
    </Modal>
  );
}
