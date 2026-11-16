'use client';

import React from 'react';
import { CampaignFormData } from '../../../types';
import { MoneyInput, PersianDatePicker, Select } from '@/components/ui';
import { Info, HelpCircle } from 'lucide-react';
import { organizationService } from '@/features/organization';

const DEFAULT_CAMPAIGN_TYPE_OPTIONS = [
  { value: 'چندکاناله (Omnichannel)', label: 'چندکاناله — ترکیبی (Omnichannel)' },
  { value: 'گوگل ادز', label: 'تبلیغات جستجوی گوگل (Google Ads)' },
  { value: 'اینستاگرام', label: 'اینستاگرام و شبکه‌های اجتماعی' },
  { value: 'یکتانت', label: 'تبلیغات همسان و کلیکی (یکتانت)' },
  { value: 'ایمیل مارکتینگ', label: 'ایمیل مارکتینگ (Email Marketing)' },
  { value: 'پیامک', label: 'کمپین پیامک هوشمند (SMS)' },
];

interface Step1BasicInfoProps {
  formData: CampaignFormData;
  onUpdateFormData: (partial: Partial<CampaignFormData>) => void;
  errors?: Record<string, string>;
}

export function Step1BasicInfo({
  formData,
  onUpdateFormData,
  errors = {},
}: Step1BasicInfoProps) {
  const [channelOptions, setChannelOptions] = React.useState(DEFAULT_CAMPAIGN_TYPE_OPTIONS);

  React.useEffect(() => {
    organizationService
      .getListItems('campaign_types')
      .then((items) => {
        const activeTypes = items
          .filter((t) => t.isActive)
          .map((t) => ({ value: t.label, label: t.label }));
        if (activeTypes.length > 0) {
          setChannelOptions(activeTypes);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="bg-[#111D2E]/80 backdrop-blur-md rounded-2xl border border-[#1F2E45] p-6 sm:p-7 shadow-xl space-y-6">
      {/* هدر مرحله */}
      <div className="flex items-center justify-between pb-4 border-b border-[#1F2E45]">
        <div>
          <div className="flex items-center gap-2 text-[#719BDF] mb-1">
            <Info size={20} />
            <h3 className="text-base font-bold text-slate-100 font-display">
              اطلاعات پایه کمپین
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            نام، اهداف کلیدی، بودجه و بازه زمانی اجرای کمپین را تعیین فرمایید.
          </p>
        </div>
        <span className="text-xs bg-[#18263A] text-slate-300 border border-[#1F2E45] font-medium px-2.5 py-1 rounded-full">
          مرحله ۱ از ۶
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* ۱. نام کمپین */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="block text-xs font-semibold text-slate-300">
            نام کمپین <span className="text-[#D66B73]">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => onUpdateFormData({ name: e.target.value })}
            placeholder="مثال: کمپین جذب لید پاییزی — محصولات دیجیتال"
            className={`w-full bg-[#111D2E] border rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 transition-all focus:outline-none ${
              errors.name
                ? 'border-[#D66B73] ring-1 ring-[#D66B73]/20'
                : 'border-[#1F2E45] focus:border-[#719BDF] focus:ring-1 focus:ring-[#719BDF]/20'
            }`}
          />
          {errors.name && (
            <p className="text-xs text-[#D66B73] font-medium mt-1">
              {errors.name}
            </p>
          )}
        </div>

        {/* ۲. هدف کمپین */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-300">
              هدف کلیدی کمپین <span className="text-[#D66B73]">*</span>
            </label>
            <span
              className="text-slate-500 hover:text-slate-300 cursor-help"
              title="هدف کمپین، الگوریتم‌های پیشنهاد بودجه و شاخص‌های سنجش موفقیت را تنظیم می‌کند."
            >
              <HelpCircle size={13} />
            </span>
          </div>
          <Select
            value={formData.objective}
            onChange={(e) => onUpdateFormData({ objective: e.target.value })}
            error={errors.objective}
            options={[
              { value: 'lead_generation', label: 'دریافت لید و سرنخ فروش (Lead Gen)' },
              { value: 'direct_sales', label: 'فروش مستقیم محصول (E-Commerce)' },
              { value: 'brand_awareness', label: 'آگاهی و شناخت برند (Brand Awareness)' },
              { value: 'website_traffic', label: 'افزایش ترافیک وبسایت (Website Traffic)' },
              { value: 'app_install', label: 'نصب اپلیکیشن (App Install)' },
            ]}
          />
        </div>

        {/* ۳. نوع / کانال اصلی کمپین */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-300">
            نوع / کانال اصلی کمپین <span className="text-[#D66B73]">*</span>
          </label>
          <Select
            value={formData.channel}
            onChange={(e) => onUpdateFormData({ channel: e.target.value })}
            error={errors.channel}
            options={channelOptions}
          />
        </div>

        {/* ۴. بودجه کل کمپین */}
        <MoneyInput
          label="بودجه کل کمپین"
          required
          value={formData.budget || 0}
          onChange={(val) => onUpdateFormData({ budget: val })}
          error={errors.budget}
          placeholder="مثال: ۵۰٬۰۰۰٬۰۰۰"
        />

        {/* ۵. مسئول کمپین */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-300">
            مسئول / مدیر کمپین
          </label>
          <input
            type="text"
            value={formData.ownerName || ''}
            onChange={(e) => onUpdateFormData({ ownerName: e.target.value })}
            placeholder="نام کارشناس یا مدیر مارکتینگ"
            className="w-full bg-[#111D2E] border border-[#1F2E45] rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:border-[#719BDF] focus:ring-1 focus:ring-[#719BDF]/20 focus:outline-none transition-all"
          />
        </div>

        {/* ۶. تاریخ شروع (تقویم شبکه‌ای شمسی) */}
        <div className="space-y-1.5">
          <PersianDatePicker
            label="تاریخ شروع کمپین"
            required
            value={formData.startDate}
            onChange={(iso: string) => {
              const updates: Partial<CampaignFormData> = { startDate: iso };
              // در صورتی که تاریخ پایان قبلاً تنظیم شده و تاریخ شروع جدید بعد از آن باشد، تاریخ پایان تنظیم مجدد می‌شود
              if (formData.endDate && iso > formData.endDate) {
                updates.endDate = iso;
              }
              onUpdateFormData(updates);
            }}
            error={errors.startDate}
          />
        </div>

        {/* ۷. تاریخ پایان (تقویم شبکه‌ای شمسی) */}
        <div className="space-y-1.5">
          <PersianDatePicker
            label="تاریخ پایان کمپین"
            required
            value={formData.endDate}
            minDate={formData.startDate}
            onChange={(iso: string) => onUpdateFormData({ endDate: iso })}
            error={errors.endDate}
          />
        </div>

        {/* ۸. توضیحات کمپین */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="block text-xs font-semibold text-slate-300">
            توضیحات و یادداشت کمپین
          </label>
          <textarea
            rows={3}
            value={formData.description || ''}
            onChange={(e) => onUpdateFormData({ description: e.target.value })}
            placeholder="اهداف ویژه، شرایط تخفیف یا یادداشت‌های هماهنگی بین اعضای تیم..."
            className="w-full bg-[#111D2E] border border-[#1F2E45] rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-500 focus:border-[#719BDF] focus:ring-1 focus:ring-[#719BDF]/20 focus:outline-none transition-all resize-none"
          />
        </div>
      </div>
    </div>
  );
}
