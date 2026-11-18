'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Building2,
  DollarSign,
  Globe,
  ImageIcon,
  UploadCloud,
  CheckCircle2,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import type {
  OrganizationGeneralSettings,
  UpdateGeneralSettingsInput,
} from '../types';

export interface GeneralSettingsFormProps {
  initialData?: OrganizationGeneralSettings;
  isLoading?: boolean;
  isSaving?: boolean;
  readOnly?: boolean;
  onSave: (data: UpdateGeneralSettingsInput) => Promise<void> | void;
}

const SUPPORTED_CURRENCIES = [
  {
    id: 'TOMAN',
    label: 'تومان (TOMAN)',
    description: 'واحد پولی پیش‌فرض و استاندارد کل سامانه برای ثبت هزینه‌ها و مبالغ معامله',
  },
  {
    id: 'IRR',
    label: 'ریال (IRR)',
    description: 'واحد پولی رسمی ریال با ضریب تبدیل ۱ تومان = ۱۰ ریال',
  },
];

const TIMEZONE_OPTIONS = [
  { value: 'Asia/Tehran', label: 'تهران — ایران (GMT+3:30)' },
  { value: 'Asia/Dubai', label: 'دبی — امارات (GMT+4:00)' },
  { value: 'UTC', label: 'زمان هماهنگ جهانی (UTC+0:00)' },
  { value: 'Europe/Istanbul', label: 'استانبول — ترکیه (GMT+3:00)' },
  { value: 'Europe/London', label: 'لندن — بریتانیا (GMT+0:00)' },
];

export function GeneralSettingsForm({
  initialData,
  isLoading = false,
  isSaving = false,
  readOnly = false,
  onSave,
}: GeneralSettingsFormProps) {
  const [name, setName] = React.useState(initialData?.name || 'شرکت فناوری گپ‌جی');
  const [logoUrl, setLogoUrl] = React.useState(initialData?.logoUrl || '');
  const [currency, setCurrency] = React.useState<'TOMAN' | 'IRR'>(
    initialData?.currency || 'TOMAN'
  );
  const [timezone, setTimezone] = React.useState(
    initialData?.timezone || 'Asia/Tehran'
  );
  const [errors, setErrors] = React.useState<{ name?: string }>({});
  const [fileError, setFileError] = React.useState<string | null>(null);

  const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024; // ۲ مگابایت

  React.useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setLogoUrl(initialData.logoUrl || '');
      setCurrency(initialData.currency || 'TOMAN');
      setTimezone(initialData.timezone || 'Asia/Tehran');
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly || isSaving) return;

    if (!name.trim()) {
      setErrors({ name: 'نام سازمان الزامی است.' });
      return;
    }

    setErrors({});
    await onSave({
      name: name.trim(),
      logoUrl: logoUrl.trim() || undefined,
      currency,
      timezone,
    });
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFileError('فرمت فایل نامعتبر است. لطفاً یک تصویر (PNG, JPG, SVG) انتخاب فرمایید.');
      e.target.value = '';
      return;
    }

    if (file.size > MAX_LOGO_SIZE_BYTES) {
      setFileError('حجم فایل لوگو بیشتر از حد مجاز است. حداکثر حجم مجاز ۲ مگابایت می‌باشد.');
      e.target.value = '';
      return;
    }

    if (logoUrl && logoUrl.startsWith('blob:')) {
      URL.revokeObjectURL(logoUrl);
    }

    const simulatedUrl = URL.createObjectURL(file);
    setLogoUrl(simulatedUrl);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-slate-100" dir="rtl">
      {/* کارت اصلی تنظیمات عمومی با استایل لوکس Midnight Executive */}
      <div className="bg-[#111D2E] rounded-2xl border border-[#1F2E45] shadow-xl p-5 sm:p-6 space-y-6">
        {/* ۱. نام رسمی سازمان */}
        <div className="space-y-2">
          <label className="block text-xs sm:text-sm font-bold text-slate-200 flex items-center gap-2">
            <Building2 size={16} className="text-[#719BDF]" />
            <span>نام سازمان یا کسب‌وکار</span>
            <span className="text-[#D66B73]">*</span>
          </label>
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors({});
            }}
            placeholder="مثال: شرکت فناوری گپ‌جی، آژانس دیجیتال مارکتینگ و ..."
            disabled={isLoading || isSaving}
            className={`text-xs sm:text-sm max-w-xl bg-[#0B1423] border-[#1F2E45] text-slate-100 placeholder:text-slate-500 ${
              errors.name ? 'border-[#D66B73] focus:ring-[#D66B73]/20' : ''
            }`}
          />
          {errors.name ? (
            <p className="text-[11px] text-[#D66B73] font-medium">{errors.name}</p>
          ) : (
            <p className="text-[11px] text-slate-400">
              این نام در هدر بالای سامانه، گزارش‌ها و فاکتورهای رسمی نمایش داده خواهد شد.
            </p>
          )}
        </div>

        {/* ۲. لوگوی سازمان */}
        <div className="space-y-3 pt-4 border-t border-[#1F2E45]">
          <label className="block text-xs sm:text-sm font-bold text-slate-200 flex items-center gap-2">
            <ImageIcon size={16} className="text-[#719BDF]" />
            <span>لوگوی سازمان</span>
          </label>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* پیش‌نمایش لوگو */}
            <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-[#1F2E45] flex items-center justify-center bg-[#0B1423] overflow-hidden shrink-0 shadow-lg">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt="لوگوی سازمان"
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <div className="text-center text-slate-500 space-y-1">
                  <Building2 size={24} className="mx-auto text-slate-600" />
                  <span className="text-[9px] block">بدون لوگو</span>
                </div>
              )}
            </div>

            {/* کنترل‌های آپلود و وارد کردن URL */}
            <div className="space-y-2 flex-1 max-w-lg">
              <div className="flex items-center gap-2">
                <label className="cursor-pointer">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#1F2E45] bg-[#18263A] hover:bg-[#1F2E45] text-xs font-bold text-slate-200 transition-colors shadow-xs">
                    <UploadCloud size={14} className="text-[#719BDF]" />
                    انتخاب فایل لوگو
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoFileChange}
                    disabled={isLoading || isSaving}
                    className="sr-only"
                  />
                </label>

                {logoUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (logoUrl.startsWith('blob:')) {
                        URL.revokeObjectURL(logoUrl);
                      }
                      setLogoUrl('');
                      setFileError(null);
                    }}
                    disabled={isLoading || isSaving}
                    className="text-xs text-[#D66B73] hover:text-rose-300 hover:bg-[#D66B73]/10"
                  >
                    حذف لوگو
                  </Button>
                )}
              </div>

              {fileError && (
                <p className="text-[11px] text-[#D66B73] font-medium">{fileError}</p>
              )}

              {logoUrl && logoUrl.startsWith('blob:') && (
                <p className="text-[10px] text-amber-300 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20 leading-relaxed">
                  پیش‌نمایش موقت فایل محلی در نشست جاری (جهت پایداری لوگو پس از رفرش صفحه از آدرس اینترنتی استفاده فرمایید).
                </p>
              )}

              <Input
                value={logoUrl}
                onChange={(e) => {
                  const val = e.target.value;
                  if (logoUrl && logoUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(logoUrl);
                  }
                  setLogoUrl(val);
                  if (fileError) setFileError(null);
                }}
                placeholder="یا آدرس اینترنتی تصویر را وارد کنید (https://...)"
                disabled={isLoading || isSaving}
                dir="ltr"
                className="text-xs text-left font-mono bg-[#0B1423] border-[#1F2E45] text-slate-100 placeholder:text-slate-500"
              />
            </div>
          </div>
        </div>

        {/* ۳. واحد پول کل سامانه */}
        <div className="space-y-3 pt-4 border-t border-[#1F2E45]">
          <div className="flex items-center justify-between">
            <label className="block text-xs sm:text-sm font-bold text-slate-200 flex items-center gap-2">
              <DollarSign size={16} className="text-[#719BDF]" />
              <span>واحد پول اصلی سامانه</span>
              <span className="text-[#D66B73]">*</span>
            </label>
            <span className="text-[11px] text-slate-400">یک واحد برای کل سیستم (صفحه ۴ سند)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
            {SUPPORTED_CURRENCIES.map((curr) => {
              const isSelected = currency === curr.id;
              return (
                <div
                  key={curr.id}
                  onClick={() => !isLoading && !isSaving && setCurrency(curr.id as 'TOMAN' | 'IRR')}
                  className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                    isSelected
                      ? 'border-[#719BDF] bg-[#18263A] ring-1 ring-[#719BDF]/40 text-slate-100 shadow-[0_0_12px_rgba(113,155,223,0.15)]'
                      : 'border-[#1F2E45] hover:border-slate-600 bg-[#0B1423] text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-bold">{curr.label}</span>
                    {isSelected && <CheckCircle2 size={16} className="text-[#719BDF]" />}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{curr.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ۴. منطقه زمانی سامانه با کامپوننت منطبق با shadcn */}
        <div className="space-y-2 pt-4 border-t border-[#1F2E45]">
          <label className="block text-xs sm:text-sm font-bold text-slate-200 flex items-center gap-2">
            <Globe size={16} className="text-[#719BDF]" />
            <span>منطقه زمانی سامانه (Timezone)</span>
            <span className="text-[#D66B73]">*</span>
          </label>

          <div className="max-w-xl">
            <Select
              value={timezone}
              onValueChange={(val) => setTimezone(val)}
              disabled={isLoading || isSaving}
            >
              <SelectTrigger className="w-full bg-[#0B1423] border-[#1F2E45] text-slate-100">
                <SelectValue placeholder="منطقه زمانی را انتخاب فرمایید..." />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
              <Clock size={12} className="text-slate-500" />
              <span>کلیه تاریخ‌ها و ساعت‌های رویدادها، کمپین‌ها و لاگ‌ها بر اساس این منطقه زمانی ثبت می‌شوند.</span>
            </p>
          </div>
        </div>

        {/* دکمه ذخیره تغییرات */}
        <div className="pt-4 border-t border-[#1F2E45] flex items-center justify-between">
          {readOnly ? (
            <span className="text-xs text-slate-400 font-medium bg-[#18263A] border border-[#1F2E45] py-1.5 px-3 rounded-xl">
              حالت فقط‌خواندنی: ویرایش مشخصات عمومی سازمان منحصراً در اختیارات مدیر ارشد (Admin) سامانه می‌باشد.
            </span>
          ) : (
            <div className="ms-auto">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isLoading || isSaving}
                className="text-xs bg-gradient-to-r from-[#719BDF] to-[#3B82F6] hover:from-[#5e8bd8] hover:to-[#2563eb] text-white min-w-[120px] border-0 shadow-[0_0_15px_rgba(113,155,223,0.25)]"
              >
                {isSaving ? 'در حال ذخیره‌سازی...' : 'ذخیره تنظیمات عمومی'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
