'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

  // محدودیت‌های تصویر لوگو
  const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024; // ۲ مگابایت

  // همگام‌سازی هنگام تغییر initialData
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
    const trimmedName = name.trim();

    if (!trimmedName) {
      setErrors({ name: 'نام سازمان نمی‌تواند خالی باشد.' });
      return;
    }

    setErrors({});
    await onSave({
      name: trimmedName,
      logoUrl: logoUrl.trim(),
      currency,
      timezone,
    });
  };

  // پاکسازی Object URL در صورت Unmount جهت جلوگیری از نشت حافظه
  React.useEffect(() => {
    return () => {
      if (logoUrl && logoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(logoUrl);
      }
    };
  }, [logoUrl]);

  // شبیه‌سازی انتخاب لوگو با پیش‌نمایش محلی همراه با اعتبارسنجی نوع و حجم فایل
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // ۱. بررسی نوع فایل (فقط تصاویر)
    if (!file.type.startsWith('image/')) {
      setFileError('فرمت فایل انتخابی نامعتبر است. فقط فایل‌های تصویری (PNG, JPG, SVG, WebP) مجاز هستند.');
      e.target.value = '';
      return;
    }

    // ۲. بررسی حداکثر حجم فایل (۲ مگابایت)
    if (file.size > MAX_LOGO_SIZE_BYTES) {
      setFileError('حجم فایل لوگو بیشتر از حد مجاز است. حداکثر حجم مجاز ۲ مگابایت می‌باشد.');
      e.target.value = '';
      return;
    }

    // ۳. آزادسازی Object URL قبلی جهت جلوگیری از نشت حافظه
    if (logoUrl && logoUrl.startsWith('blob:')) {
      URL.revokeObjectURL(logoUrl);
    }

    const simulatedUrl = URL.createObjectURL(file);
    setLogoUrl(simulatedUrl);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
      {/* کارت اصلی تنظیمات عمومی */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-6">
        {/* ۱. نام رسمی سازمان */}
        <div className="space-y-2">
          <label className="block text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
            <Building2 size={16} className="text-purple-600" />
            <span>نام سازمان یا کسب‌وکار</span>
            <span className="text-rose-500">*</span>
          </label>
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors({});
            }}
            placeholder="مثال: شرکت فناوری گپ‌جی، آژانس دیجیتال مارکتینگ و ..."
            disabled={isLoading || isSaving}
            className={`text-xs sm:text-sm max-w-xl ${
              errors.name ? 'border-rose-400 focus:ring-rose-200' : ''
            }`}
          />
          {errors.name ? (
            <p className="text-[11px] text-rose-600 font-medium">{errors.name}</p>
          ) : (
            <p className="text-[11px] text-slate-500">
              این نام در هدر بالای سامانه، گزارش‌ها و فاکتورهای رسمی نمایش داده خواهد شد.
            </p>
          )}
        </div>

        {/* ۲. لوگوی سازمان */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <label className="block text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
            <ImageIcon size={16} className="text-purple-600" />
            <span>لوگوی سازمان</span>
          </label>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* پیش‌نمایش لوگو */}
            <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50 overflow-hidden shrink-0 shadow-2xs">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt="لوگوی سازمان"
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <div className="text-center text-slate-400 space-y-1">
                  <Building2 size={24} className="mx-auto text-slate-300" />
                  <span className="text-[9px] block">بدون لوگو</span>
                </div>
              )}
            </div>

            {/* کنترل‌های آپلود و وارد کردن URL */}
            <div className="space-y-2 flex-1 max-w-lg">
              <div className="flex items-center gap-2">
                <label className="cursor-pointer">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors shadow-2xs">
                    <UploadCloud size={14} className="text-purple-600" />
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
                    className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                  >
                    حذف لوگو
                  </Button>
                )}
              </div>

              {fileError && (
                <p className="text-[11px] text-rose-600 font-medium">{fileError}</p>
              )}

              {logoUrl && logoUrl.startsWith('blob:') && (
                <p className="text-[10px] text-amber-700 bg-amber-50 px-2 py-1 rounded-md border border-amber-200 leading-relaxed">
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
                className="text-xs text-left"
              />
            </div>
          </div>
        </div>

        {/* ۳. واحد پول کل سامانه */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="block text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
              <DollarSign size={16} className="text-purple-600" />
              <span>واحد پول اصلی سامانه</span>
              <span className="text-rose-500">*</span>
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
                      ? 'border-purple-600 bg-purple-50/50 ring-2 ring-purple-100 text-purple-950'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-bold">{curr.label}</span>
                    {isSelected && <CheckCircle2 size={16} className="text-purple-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{curr.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ۴. منطقه زمانی سامانه */}
        <div className="space-y-2 pt-4 border-t border-slate-100">
          <label className="block text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
            <Globe size={16} className="text-purple-600" />
            <span>منطقه زمانی سامانه (Timezone)</span>
            <span className="text-rose-500">*</span>
          </label>

          <div className="max-w-xl">
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              disabled={isLoading || isSaving}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              {TIMEZONE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
              <Clock size={12} className="text-slate-400" />
              <span>کلیه تاریخ‌ها و ساعت‌های رویدادها، کمپین‌ها و لاگ‌ها بر اساس این منطقه زمانی ثبت می‌شوند.</span>
            </p>
          </div>
        </div>

        {/* دکمه ذخیره تغییرات */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isLoading || isSaving}
            className="text-xs bg-purple-600 hover:bg-purple-700 text-white min-w-[120px] shadow-2xs hover:shadow-xs"
          >
            {isSaving ? 'در حال ذخیره‌سازی...' : 'ذخیره تنظیمات عمومی'}
          </Button>
        </div>
      </div>
    </form>
  );
}
