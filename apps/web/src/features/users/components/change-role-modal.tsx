'use client';

import * as React from 'react';
import { Shield, AlertTriangle, Check, ShieldAlert } from 'lucide-react';
import { Modal } from '@/components/common/modal';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/common/toast-provider';
import { userService } from '../users.api';
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
      console.error('Error changing user role:', err);
      toast.error(err?.message || 'خطا در تغییر نقش کاربر.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  const roleOptions = USER_ROLES.map((r) => ({
    value: r,
    label: `${USER_ROLE_LABELS[r]} (${r})`,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={isLoading ? () => {} : onClose}
      size="md"
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#719BDF]/15 text-[#719BDF] flex items-center justify-center shrink-0 border border-[#719BDF]/30">
            <Shield size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 font-display">تغییر نقش کاربری</h3>
            <p className="text-xs text-slate-400 font-normal mt-0.5">
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
            className="border-[#1F2E45] bg-[#18263A] text-slate-300 hover:bg-[#1F2E45]"
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
            className="bg-gradient-to-r from-[#719BDF] to-[#3B82F6] hover:from-[#5e8bd8] hover:to-[#2563eb] text-white border-0 shadow-[0_0_15px_rgba(113,155,223,0.25)]"
          >
            ذخیره تغییرات
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-1 text-slate-100" dir="rtl">
        {/* اطلاعات نقش فعلی */}
        <div className="bg-[#18263A] p-3 rounded-xl border border-[#1F2E45] flex items-center justify-between text-xs">
          <span className="text-slate-400">نقش فعلی کاربر:</span>
          <span className="font-bold text-[#719BDF] bg-[#111D2E] px-2.5 py-1 rounded-lg border border-[#1F2E45]">
            {USER_ROLE_LABELS[user.role]}
          </span>
        </div>

        {/* انتخابگر نقش جدید */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300 block">
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
          <div className="bg-amber-500/15 p-3.5 rounded-xl border border-amber-500/30 text-xs text-amber-300 space-y-1.5 animate-in fade-in">
            <div className="flex items-center gap-1.5 font-bold text-amber-400">
              <ShieldAlert size={16} className="shrink-0" />
              <span>عملیات غیرمجاز: آخرین ادمین فعال</span>
            </div>
            <p className="leading-relaxed text-[11px] text-amber-200">
              کاربر «{user.fullName}» تنها ادمین فعال سامانه است. شما نمی‌توانید نقش او را تغییر دهید مگر اینکه ابتدا کاربر فعال دیگری را به عنوان ادمین تعریف فرمایید.
            </p>
          </div>
        )}

        {/* شرح دسترسی‌های نقش انتخاب‌شده */}
        <div className="bg-[#111D2E] p-3.5 rounded-xl border border-[#1F2E45] text-xs space-y-1">
          <span className="font-bold text-[#719BDF] block">
            دسترسی‌های نقش {USER_ROLE_LABELS[selectedRole]}:
          </span>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {USER_ROLE_DESCRIPTIONS[selectedRole]}
          </p>
        </div>
      </form>
    </Modal>
  );
}
