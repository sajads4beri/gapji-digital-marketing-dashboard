'use client';

import React from 'react';
import { CampaignFormData } from '../../../types';
import { LucideIcon, Sparkles, Clock, AlertCircle } from 'lucide-react';

interface StepPlaceholderProps {
  stepId: number;
  title: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  formData: CampaignFormData;
  onUpdateFormData?: (data: Partial<CampaignFormData>) => void;
}

export function StepPlaceholder({
  stepId,
  title,
  subtitle,
  description,
  icon: Icon,
  formData,
  onUpdateFormData,
}: StepPlaceholderProps) {
  // اگر مرحله ۱ باشد، کنترل‌های پایه را ارائه دهیم تا فرم قابل تست و استفاده باشد
  if (stepId === 1) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm space-y-6">
        <div>
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <Icon size={20} />
            <h3 className="text-base font-bold text-gray-900">{title}</h3>
          </div>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* نام کمپین */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-bold text-gray-700">
              نام کمپین <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => onUpdateFormData?.({ name: e.target.value })}
              placeholder="مثال: کمپین فروش ویژه پاییزه ۱۴۰۳"
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
            />
          </div>

          {/* هدف کمپین */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700">
              هدف کلیدی کمپین <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.objective}
              onChange={(e) => onUpdateFormData?.({ objective: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
            >
              <option value="lead_generation">دریافت لید و سرنخ فروش (Lead Gen)</option>
              <option value="brand_awareness">آگاهی از برند (Brand Awareness)</option>
              <option value="direct_sales">فروش مستقیم محصول (E-Commerce)</option>
              <option value="website_traffic">افزایش ترافیک وبسایت (Traffic)</option>
              <option value="app_install">نصب اپلیکیشن (App Install)</option>
            </select>
          </div>

          {/* کانال اصلی */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700">
              کانال اصلی <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.channel}
              onChange={(e) => onUpdateFormData?.({ channel: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
            >
              <option value="گوگل ادز">گوگل ادز (Google Ads)</option>
              <option value="اینستاگرام">اینستاگرام (Instagram)</option>
              <option value="یکتانت">یکتانت (Yektanet)</option>
              <option value="ایمیل مارکتینگ">ایمیل مارکتینگ (Email)</option>
              <option value="پیامک">پیامک تبلیغاتی (SMS)</option>
            </select>
          </div>

          {/* بودجه کل کمپین */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700">
              بودجه کل کمپین (تومان) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="1000000"
              value={formData.budget || ''}
              onChange={(e) =>
                onUpdateFormData?.({ budget: Number(e.target.value) || 0 })
              }
              placeholder="مثال: ۵۰,۰۰۰,۰۰۰"
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
            />
          </div>

          {/* نام مسئول کمپین */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700">
              مدیر / مسئول کمپین
            </label>
            <input
              type="text"
              value={formData.ownerName || ''}
              onChange={(e) => onUpdateFormData?.({ ownerName: e.target.value })}
              placeholder="نام مسئول کمپین..."
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
            />
          </div>

          {/* توضیحات کمپین */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-bold text-gray-700">
              توضیحات و یادداشت کمپین
            </label>
            <textarea
              rows={3}
              value={formData.description || ''}
              onChange={(e) => onUpdateFormData?.({ description: e.target.value })}
              placeholder="اهداف تکمیلی، مخاطب ویژه یا یادداشت‌های هماهنگی تیم مارکتینگ..."
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors resize-none"
            />
          </div>
        </div>
      </div>
    );
  }

  // برای سایر مراحل ۲ تا ۶: ارائه ساختار اطلاعاتی شکیل به همراه Placeholder آماده برای گام‌های بعدی
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-8 shadow-sm space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Icon size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">{title}</h3>
            <p className="text-xs text-gray-500">{subtitle}</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-full font-medium">
          <Clock size={13} />
          <span>آماده‌سازی ساختار مرحله در گام بعد</span>
        </span>
      </div>

      <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5 text-sm text-gray-700 space-y-2">
        <div className="flex items-center gap-2 font-bold text-blue-900">
          <Sparkles size={16} className="text-blue-600" />
          <span>خلاصه پیکربندی مرحله {stepId}:</span>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed">{description}</p>
      </div>

      {/* خلاصه پیش‌نمایش متغیرهای این مرحله در مدل داده */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
        <h4 className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
          <AlertCircle size={14} className="text-gray-400" />
          <span>داده‌های آماده‌شده در مدل برای این مرحله:</span>
        </h4>
        <pre className="text-[11px] text-gray-600 font-mono bg-white p-3 rounded-lg border border-gray-200/80 overflow-x-auto text-left" dir="ltr">
          {stepId === 2 && JSON.stringify(formData.targetAudience, null, 2)}
          {stepId === 3 && JSON.stringify(formData.platforms, null, 2)}
          {stepId === 4 && JSON.stringify(formData.targetKpis, null, 2)}
          {stepId === 5 && JSON.stringify(formData.trackingUtm, null, 2)}
          {stepId === 6 &&
            JSON.stringify(
              {
                campaignName: formData.name || '(نامشخص)',
                budget: formData.budget,
                platformsCount: formData.platforms.filter((p) => p.enabled).length,
                landingUrl: formData.trackingUtm.landingUrl,
                status: 'آماده برای تأیید نهایی و انتشار',
              },
              null,
              2,
            )}
        </pre>
      </div>
    </div>
  );
}
