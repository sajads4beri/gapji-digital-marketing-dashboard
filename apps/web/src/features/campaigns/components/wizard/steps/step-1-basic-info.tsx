'use client';

import React from 'react';
import { CampaignFormData } from '../../../types';
import { MoneyInput, PersianDatePicker } from '@/components/ui';
import { Info, HelpCircle } from 'lucide-react';

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
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-7 shadow-sm space-y-6">
      {/* هدر مرحله */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <Info size={20} />
            <h3 className="text-base font-bold text-gray-900">
              اطلاعات پایه کمپین
            </h3>
          </div>
          <p className="text-xs text-gray-500">
            نام، اهداف کلیدی، بودجه و بازه زمانی اجرای کمپین را تعیین فرمایید.
          </p>
        </div>
        <span className="text-xs bg-gray-100 text-gray-600 font-medium px-2.5 py-1 rounded-full">
          مرحله ۱ از ۶
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* ۱. نام کمپین */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="block text-xs font-bold text-gray-700">
            نام کمپین <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => onUpdateFormData({ name: e.target.value })}
            placeholder="مثال: کمپین جذب لید پاییزی — محصولات دیجیتال"
            className={`w-full bg-gray-50 border rounded-xl px-4 py-2.5 text-sm text-gray-900 transition-all focus:outline-none ${
              errors.name
                ? 'border-red-300 ring-2 ring-red-100'
                : 'border-gray-200 focus:ring-2 focus:ring-blue-500 focus:bg-white'
            }`}
          />
          {errors.name && (
            <p className="text-[11px] text-red-600 font-medium mt-1">
              {errors.name}
            </p>
          )}
        </div>

        {/* ۲. هدف کمپین */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-gray-700">
              هدف کلیدی کمپین <span className="text-red-500">*</span>
            </label>
            <span
              className="text-gray-400 hover:text-gray-600 cursor-help"
              title="هدف کمپین، الگوریتم‌های پیشنهاد بودجه و شاخص‌های سنجش موفقیت را تنظیم می‌کند."
            >
              <HelpCircle size={13} />
            </span>
          </div>
          <select
            value={formData.objective}
            onChange={(e) => onUpdateFormData({ objective: e.target.value })}
            className={`w-full bg-gray-50 border rounded-xl px-3 py-2.5 text-sm text-gray-800 transition-all focus:outline-none ${
              errors.objective
                ? 'border-red-300 ring-2 ring-red-100'
                : 'border-gray-200 focus:ring-2 focus:ring-blue-500 focus:bg-white'
            }`}
          >
            <option value="lead_generation">دریافت لید و سرنخ فروش (Lead Gen)</option>
            <option value="direct_sales">فروش مستقیم محصول (E-Commerce)</option>
            <option value="brand_awareness">آگاهی و شناخت برند (Brand Awareness)</option>
            <option value="website_traffic">افزایش ترافیک وبسایت (Website Traffic)</option>
            <option value="app_install">نصب اپلیکیشن (App Install)</option>
          </select>
          {errors.objective && (
            <p className="text-[11px] text-red-600 font-medium mt-1">
              {errors.objective}
            </p>
          )}
        </div>

        {/* ۳. نوع / کانال اصلی کمپین */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-gray-700">
            نوع / کانال اصلی کمپین <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.channel}
            onChange={(e) => onUpdateFormData({ channel: e.target.value })}
            className={`w-full bg-gray-50 border rounded-xl px-3 py-2.5 text-sm text-gray-800 transition-all focus:outline-none ${
              errors.channel
                ? 'border-red-300 ring-2 ring-red-100'
                : 'border-gray-200 focus:ring-2 focus:ring-blue-500 focus:bg-white'
            }`}
          >
            <option value="چندکاناله (Omnichannel)">چندکاناله — ترکیبی (Omnichannel)</option>
            <option value="گوگل ادز">تبلیغات جستجوی گوگل (Google Ads)</option>
            <option value="اینستاگرام">اینستاگرام و شبکه‌های اجتماعی</option>
            <option value="یکتانت">تبلیغات همسان و کلیکی (یکتانت)</option>
            <option value="ایمیل مارکتینگ">ایمیل مارکتینگ (Email Marketing)</option>
            <option value="پیامک">کمپین پیامک هوشمند (SMS)</option>
          </select>
          {errors.channel && (
            <p className="text-[11px] text-red-600 font-medium mt-1">
              {errors.channel}
            </p>
          )}
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
          <label className="block text-xs font-bold text-gray-700">
            مسئول / مدیر کمپین
          </label>
          <input
            type="text"
            value={formData.ownerName || ''}
            onChange={(e) => onUpdateFormData({ ownerName: e.target.value })}
            placeholder="نام کارشناس یا مدیر مارکتینگ"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all"
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
          <label className="block text-xs font-bold text-gray-700">
            توضیحات و یادداشت کمپین
          </label>
          <textarea
            rows={3}
            value={formData.description || ''}
            onChange={(e) => onUpdateFormData({ description: e.target.value })}
            placeholder="اهداف ویژه، شرایط تخفیف یا یادداشت‌های هماهنگی بین اعضای تیم..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all resize-none"
          />
        </div>
      </div>
    </div>
  );
}
