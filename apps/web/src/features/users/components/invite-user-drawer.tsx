'use client';

import * as React from 'react';
import { UserPlus, Mail, Phone, Shield, User, Info, AlertTriangle } from 'lucide-react';
import { Drawer } from '@/components/common/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

export interface InviteUserDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (createdUser: UserItem) => void;
}

export function InviteUserDrawer({
  isOpen,
  onClose,
  onSuccess,
}: InviteUserDrawerProps) {
  const { toast } = useToast();

  const [email, setEmail] = React.useState('');
  const [fullName, setFullName] = React.useState('');
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [role, setRole] = React.useState<UserRole>('sales_agent');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<{ email?: string; role?: string }>({});

  // بازنشانی فرم هنگام باز شدن
  React.useEffect(() => {
    if (isOpen) {
      setEmail('');
      setFullName('');
      setPhoneNumber('');
      setRole('sales_agent');
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    const newErrors: { email?: string; role?: string } = {};

    if (!email || !email.trim()) {
      newErrors.email = 'ورود نشانی ایمیل الزامی است.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        newErrors.email = 'فرمت نشانی ایمیل نامعتبر است.';
      }
    }

    if (!role || !USER_ROLES.includes(role)) {
      newErrors.role = 'انتخاب نقش کاربری الزامی است.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isSubmitting) return;

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      const createdUser = await userService.inviteUser({
        email: email.trim(),
        fullName: fullName.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
        role,
      });

      toast.success(`دعوت‌نامه با موفقیت برای «${createdUser.email}» ارسال شد.`);
      onSuccess?.(createdUser);
      onClose();
    } catch (err: any) {
      const message = err?.message || 'خطا در ثبت و ارسال دعوت‌نامه.';
      toast.error(message);
      setErrors((prev) => ({
        ...prev,
        email: message.includes('ایمیل') ? message : prev.email,
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleOptions = USER_ROLES.map((r) => ({
    value: r,
    label: USER_ROLE_LABELS[r],
  }));

  return (
    <Drawer
      isOpen={isOpen}
      onClose={isSubmitting ? () => {} : onClose}
      size="md"
      placement="right"
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
            <UserPlus size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">دعوت کاربر جدید</h3>
            <p className="text-[11px] text-slate-500 font-normal">
              ارسال پیوند عضویت و تخصیص نقش سازمانی
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
            disabled={isSubmitting}
          >
            انصراف
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            className="bg-purple-600 hover:bg-purple-700 focus:ring-purple-500"
          >
            ارسال دعوت‌نامه
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-2" dir="rtl">
        {/* راهنمای کوتاه */}
        <div className="bg-purple-50/60 p-3 rounded-xl border border-purple-100 text-[11px] text-purple-800 flex items-start gap-2">
          <Info size={16} className="text-purple-600 shrink-0 mt-0.5" />
          <span>
            کاربر دعوت‌شده با دریافت پیوند فعال‌سازی به سامانه دسترسی خواهد داشت و وضعیت اولیه او به صورت «دعوت‌شده» ثبت می‌شود.
          </span>
        </div>

        {/* فیلد ایمیل */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
            <span>نشانی ایمیل</span>
            <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              placeholder="user@example.com"
              dir="ltr"
              disabled={isSubmitting}
              className={`text-left font-mono text-xs ${
                errors.email ? 'border-rose-400 focus:ring-rose-400' : ''
              }`}
            />
          </div>
          {errors.email && (
            <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1 mt-1">
              <AlertTriangle size={12} />
              <span>{errors.email}</span>
            </p>
          )}
        </div>

        {/* فیلد نام و نام خانوادگی */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
            <span>نام و نام خانوادگی</span>
            <span className="text-slate-400 text-[10px] font-normal">(اختیاری)</span>
          </label>
          <Input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="مثال: پرهام رادمنش"
            disabled={isSubmitting}
            className="text-xs"
          />
          <p className="text-[10px] text-slate-400">
            در صورت خالی ماندن، نام کاربری به طور خودکار از روی ایمیل تنظیم می‌شود.
          </p>
        </div>

        {/* فیلد شماره موبایل */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
            <span>شماره تماس</span>
            <span className="text-slate-400 text-[10px] font-normal">(اختیاری)</span>
          </label>
          <Input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="۰۹۱۲۳۴۵۶۷۸۹"
            dir="ltr"
            disabled={isSubmitting}
            className="text-left font-mono text-xs"
          />
        </div>

        {/* فیلد انتخاب نقش */}
        <div className="space-y-1 pt-1">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
            <span>نقش سازمانی</span>
            <span className="text-rose-500">*</span>
          </label>
          <Select
            value={role}
            onChange={(e) => {
              setRole(e.target.value as UserRole);
              if (errors.role) setErrors((prev) => ({ ...prev, role: undefined }));
            }}
            options={roleOptions}
            disabled={isSubmitting}
          />
          {errors.role && (
            <p className="text-[11px] text-rose-600 font-medium">{errors.role}</p>
          )}
          {/* توضیحات نقش انتخاب‌شده */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] text-slate-600 mt-2">
            <span className="font-bold text-slate-800 block mb-0.5">
              شرح دسترسی {USER_ROLE_LABELS[role]}:
            </span>
            <span>{USER_ROLE_DESCRIPTIONS[role]}</span>
          </div>
        </div>
      </form>
    </Drawer>
  );
}
