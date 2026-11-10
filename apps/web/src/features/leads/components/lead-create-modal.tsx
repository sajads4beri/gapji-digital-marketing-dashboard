'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Megaphone,
  UserCheck,
  Calendar,
  FileText,
  AlertCircle,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { Modal } from '@/components/common/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/common/toast-provider';
import { useAuth } from '@/features/auth';
import { getCampaigns } from '@/lib/api';
import type { Campaign } from '@gapji/shared';
import { leadApi, DuplicateLeadError, type ExistingLeadSummary } from '../api/lead.api';
import type { LeadDetail } from '../types';

export interface LeadCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (lead: LeadDetail) => void;
}

const SOURCE_OPTIONS = [
  { value: 'manual', label: 'دستی (ورود مستقیم)' },
  { value: 'سایت مستقیم', label: 'وب‌سایت مستقیم' },
  { value: 'اینستاگرام', label: 'اینستاگرام' },
  { value: 'گوگل ادز', label: 'گوگل ادز (Google Ads)' },
  { value: 'تماس ورودی', label: 'تماس تلفنی ورودی' },
  { value: 'معرفی', label: 'معرفی / ارجاع مشتری' },
  { value: 'پیامک', label: 'پیامک تبلیغاتی' },
  { value: 'سایر', label: 'سایر کانال‌ها' },
];

export function LeadCreateModal({ isOpen, onClose, onSuccess }: LeadCreateModalProps) {
  const { user, activeRole } = useAuth();
  const { toast } = useToast();

  // فیلدهای فرم
  const [fullName, setFullName] = React.useState('');
  const [mobile, setMobile] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [city, setCity] = React.useState('');
  const [source, setSource] = React.useState('manual');
  const [campaignId, setCampaignId] = React.useState('');
  const [assignedToId, setAssignedToId] = React.useState('');
  const [nextFollowUpAt, setNextFollowUpAt] = React.useState('');
  const [nextFollowUpNote, setNextFollowUpNote] = React.useState('');

  // وضعیت‌های بارگذاری داده‌های جانبی
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
  const [assignees, setAssignees] = React.useState<Array<{ id: string; name: string; role?: string }>>([]);
  const [isLoadingMeta, setIsLoadingMeta] = React.useState(false);

  // وضعیت‌های ثبت و اعتبارسنجی
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [duplicateLead, setDuplicateLead] = React.useState<ExistingLeadSummary | null>(null);
  const [showDirtyAlert, setShowDirtyAlert] = React.useState(false);

  const isSalesAgent = activeRole === 'sales_agent';

  // بررسی تغییر داده شدن فرم جهت هشدار بستن (الزام صفحه ۴ سند محصول)
  const isDirty = Boolean(
    fullName.trim() ||
    mobile.trim() ||
    email.trim() ||
    city.trim() ||
    campaignId ||
    nextFollowUpAt ||
    nextFollowUpNote.trim()
  );

  // بارگذاری لیست کمپین‌ها و کارشناسان فعال هنگام باز شدن مدال
  React.useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoadingMeta(true);
    setDuplicateLead(null);
    setErrors({});

    // اگر کاربر کارشناس فروش باشد، پیش‌فرض خودش انتخاب می‌شود
    if (isSalesAgent && user?.id) {
      setAssignedToId(user.id);
    }

    Promise.all([
      getCampaigns().catch(() => []),
      isSalesAgent ? Promise.resolve([]) : leadApi.getAssignees().catch(() => []),
    ])
      .then(([camps, members]) => {
        if (!isMounted) return;
        setCampaigns(camps);
        setAssignees(members);
      })
      .finally(() => {
        if (isMounted) setIsLoadingMeta(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, isSalesAgent, user?.id]);

  // ریست کردن فیلدهای فرم
  const resetForm = () => {
    setFullName('');
    setMobile('');
    setEmail('');
    setCity('');
    setSource('manual');
    setCampaignId('');
    setAssignedToId(isSalesAgent && user?.id ? user.id : '');
    setNextFollowUpAt('');
    setNextFollowUpNote('');
    setErrors({});
    setDuplicateLead(null);
    setShowDirtyAlert(false);
  };

  // بستن ایمن مدال با بررسی وضعیت فرم
  const handleSafeClose = () => {
    if (isDirty && !showDirtyAlert) {
      setShowDirtyAlert(true);
      return;
    }
    resetForm();
    onClose();
  };

  const handleConfirmDiscard = () => {
    resetForm();
    onClose();
  };

  // اعتبارسنجی سمت کلاینت
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'لطفاً نام و نام خانوادگی لید را وارد نمایید.';
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = 'نام باید حداقل ۲ کاراکتر باشد.';
    }

    if (!mobile.trim()) {
      newErrors.mobile = 'لطفاً شماره تلفن همراه را وارد نمایید.';
    } else {
      // تبدیل ارقام فارسی به انگلیسی جهت بررسی اولیه
      const cleanMobile = mobile
        .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
        .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
        .replace(/[\s\-\(\)\+]/g, '');

      if (!/^(09|989|9)[0-9]{9}$/.test(cleanMobile)) {
        newErrors.mobile = 'شماره موبایل وارد شده معتبر نیست (مثال: ۰۹۱۲۳۴۵۶۷۸۹).';
      }
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'فرمت آدرس ایمیل نامعتبر است.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ارسال فرم به بک‌اند
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDuplicateLead(null);
    setShowDirtyAlert(false);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const createdLead = await leadApi.createLead({
        fullName: fullName.trim(),
        mobile: mobile.trim(),
        email: email.trim() || undefined,
        city: city.trim() || undefined,
        source: source.trim() || 'manual',
        campaignId: campaignId || undefined,
        assignedToId: isSalesAgent ? user?.id : assignedToId || undefined,
        nextFollowUpAt: nextFollowUpAt ? new Date(nextFollowUpAt).toISOString() : undefined,
        nextFollowUpNote: nextFollowUpNote.trim() || undefined,
        statusKey: 'new',
      });

      toast.success(`لید «${createdLead.fullName}» با موفقیت در سامانه ذخیره شد.`);

      if (onSuccess) {
        onSuccess(createdLead);
      }

      resetForm();
      onClose();
    } catch (err: unknown) {
      if (err instanceof DuplicateLeadError) {
        // الزام صریح صفحه ۱۵ سند محصول: نمایش پیام «این شماره قبلاً ثبت شده» + لینک لید قبلی
        setDuplicateLead(err.existingLead || { id: '', mobile });
        setErrors((prev) => ({
          ...prev,
          mobile: 'این شماره قبلاً در سامانه ثبت شده است.',
        }));
      } else if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as any;
        const resData = axiosErr.response?.data;
        const status = axiosErr.response?.status;

        if (status === 403) {
          setErrors({ form: 'شما مجوز ثبت لید در این سازمان را ندارید (DEC-AUTH-11).' });
        } else if (resData?.message) {
          const msg = Array.isArray(resData.message)
            ? resData.message.join('، ')
            : resData.message;
          setErrors({ form: msg });
        } else {
          setErrors({ form: 'خطایی در ثبت لید در سرور رخ داد. لطفاً مجدداً تلاش نمایید.' });
        }
      } else {
        setErrors({ form: 'خطای ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی نمایید.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleSafeClose}
      title={
        <div className="flex items-center gap-2 text-gray-900 font-bold">
          <Sparkles className="text-blue-600 shrink-0" size={18} />
          <span>لید جدید (ثبت دستی)</span>
        </div>
      }
      description="مشخصات مخاطب را جهت ایجاد فرصت فروش و پیگیری در صندوق لیدها وارد نمایید."
      size="lg"
      closeOnBackdropClick={!isDirty}
    >
      <form onSubmit={handleSubmit} className="space-y-4" dir="rtl" noValidate>
        {/* هشدار فرم تغییر یافته در صورت تلاش برای بستن */}
        {showDirtyAlert && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-600 shrink-0" />
              <span>اطلاعات تغییر یافته ذخیره نشده‌اند. آیا از بستن فرم اطمینان دارید؟</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleConfirmDiscard}
                className="px-2 py-1 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 transition"
              >
                بله، ببند
              </button>
              <button
                type="button"
                onClick={() => setShowDirtyAlert(false)}
                className="px-2 py-1 bg-white border border-amber-300 font-medium rounded-lg hover:bg-amber-100 transition"
              >
                ادامه ویرایش
              </button>
            </div>
          </div>
        )}

        {/* پیام خطای عمومی فرم */}
        {errors.form && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
            <span className="font-semibold">{errors.form}</span>
          </div>
        )}

        {/* جعبه پیام اختصاصی شماره تکراری همراه با لینک لید قبلی طبق سند محصول (Page 15) */}
        {duplicateLead && (
          <div
            role="alert"
            className="p-3.5 bg-amber-50/90 border border-amber-300 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-amber-900 animate-in fade-in"
          >
            <div className="flex items-center gap-2 text-xs font-bold">
              <AlertCircle size={17} className="text-amber-600 shrink-0" />
              <span>این شماره قبلاً ثبت شده</span>
              {duplicateLead.fullName && (
                <span className="text-amber-750 font-normal">
                  (به نام {duplicateLead.fullName})
                </span>
              )}
            </div>

            {duplicateLead.id && (
              <Link
                href={`/leads/${duplicateLead.id}`}
                onClick={handleSafeClose}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-amber-900 hover:bg-amber-100/60 shadow-2xs transition shrink-0"
              >
                <span>مشاهده پرونده لید قبلی</span>
                <ExternalLink size={13} className="text-amber-700" />
              </Link>
            )}
          </div>
        )}

        {/* ردیف ۱: نام و شماره تماس (فیلدهای اجباری سند) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            id="lead-fullName"
            label="نام و نام خانوادگی"
            required
            placeholder="مثال: رضا محمدی"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
            }}
            error={errors.fullName}
            icon={<User size={15} className="text-gray-400" />}
          />

          <Input
            id="lead-mobile"
            label="شماره تلفن همراه"
            required
            dir="ltr"
            placeholder="۰۹۱۲۳۴۵۶۷۸۹"
            value={mobile}
            onChange={(e) => {
              setMobile(e.target.value);
              setDuplicateLead(null);
              if (errors.mobile) setErrors((prev) => ({ ...prev, mobile: '' }));
            }}
            error={errors.mobile}
            icon={<Phone size={15} className="text-gray-400" />}
          />
        </div>

        {/* ردیف ۲: ایمیل و شهر */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            id="lead-email"
            label="پست الکترونیکی (اختیاری)"
            dir="ltr"
            type="email"
            placeholder="example@domain.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
            }}
            error={errors.email}
            icon={<Mail size={15} className="text-gray-400" />}
          />

          <Input
            id="lead-city"
            label="شهر (اختیاری)"
            placeholder="مثال: تهران، اصفهان..."
            value={city}
            onChange={(e) => setCity(e.target.value)}
            icon={<MapPin size={15} className="text-gray-400" />}
          />
        </div>

        {/* ردیف ۳: منبع جذب و کمپین مرتبط */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Select
            id="lead-source"
            label="منبع ورودی لید"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            options={SOURCE_OPTIONS}
          />

          <Select
            id="lead-campaign"
            label="کمپین مرتبط (اختیاری)"
            value={campaignId}
            onChange={(e) => setCampaignId(e.target.value)}
            options={[
              { value: '', label: 'بدون اتصال به کمپین (مستقل)' },
              ...campaigns.map((c) => ({
                value: c.id,
                label: c.name,
              })),
            ]}
            helperText={isLoadingMeta ? 'در حال بارگذاری کمپین‌ها...' : undefined}
          />
        </div>

        {/* ردیف ۴: کارشناس مسئول پیگیری (با رعایت سطح دسترسی نقش‌ها) */}
        <div>
          {isSalesAgent ? (
            <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck size={16} className="text-blue-600" />
                <span className="font-semibold">کارشناس مسئول:</span>
                <span className="font-bold">{user?.fullName || 'شما'} (تخصیص خودکار به خودتان)</span>
              </div>
              <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md font-medium">
                نقش فروش
              </span>
            </div>
          ) : (
            <Select
              id="lead-assignedTo"
              label="تخصیص به کارشناس پیگیری"
              value={assignedToId}
              onChange={(e) => setAssignedToId(e.target.value)}
              options={[
                { value: '', label: 'تخصیص‌نیافته (تعیین بعداً در صندوق)' },
                ...assignees.map((a) => ({
                  value: a.id,
                  label: a.name + (a.role ? ` (${a.role})` : ''),
                })),
              ]}
              helperText="لید پس از ثبت در صندوق کارشناس مربوطه قرار خواهد گرفت."
            />
          )}
        </div>

        {/* ردیف ۵: پیگیری بعدی (تاریخ و یادداشت) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            id="lead-nextFollowUpAt"
            label="تاریخ و زمان پیگیری بعدی (اختیاری)"
            type="datetime-local"
            value={nextFollowUpAt}
            onChange={(e) => setNextFollowUpAt(e.target.value)}
            icon={<Calendar size={15} className="text-gray-400" />}
          />

          <Input
            id="lead-nextFollowUpNote"
            label="دستورالعمل / یادداشت اولیه (اختیاری)"
            placeholder="مثال: تماس جهت هماهنگی جلسه دمو..."
            value={nextFollowUpNote}
            onChange={(e) => setNextFollowUpNote(e.target.value)}
            icon={<FileText size={15} className="text-gray-400" />}
          />
        </div>

        {/* دکمه‌های اقدام انتهای مدال */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={handleSafeClose}
            disabled={isSubmitting}
            className="text-xs"
          >
            انصراف
          </Button>

          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            disabled={isSubmitting}
            className="text-xs font-bold px-5"
          >
            <span>ثبت لید</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}
