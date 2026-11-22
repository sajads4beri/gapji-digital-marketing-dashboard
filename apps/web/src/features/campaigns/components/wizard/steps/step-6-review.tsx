'use client';

import React from 'react';
import { CampaignFormData } from '../../../types';
import { formatPersianDate } from '../../../utils/persian-date';
import {
  Eye,
  Edit3,
  Calendar,
  Layers,
  Users,
  Target,
  Link2,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface Step6ReviewProps {
  formData: CampaignFormData;
  onEditStep: (stepNumber: number) => void;
}

export function Step6Review({ formData, onEditStep }: Step6ReviewProps) {
  const totalBudget = Number(formData.budget) || 0;
  const activePlatforms = (formData.platforms || []).filter((p) => p.enabled);
  const totalAllocated = activePlatforms.reduce(
    (sum, p) => sum + (Number(p.allocatedBudget) || 0),
    0,
  );
  const remainingBudget = totalBudget - totalAllocated;
  const isBudgetExceeded = remainingBudget < 0;

  const selectedAudienceCount =
    formData.targetAudience.selectedAudienceIds?.length || 0;
  const selectedKpis = formData.targetKpis.selectedKpiItems || [];

  return (
    <div className="bg-[#111D2E]/80 backdrop-blur-md rounded-2xl border border-[#1F2E45] p-6 sm:p-7 shadow-xl space-y-6">
      {/* هدر مرحله مرور */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1F2E45]">
        <div>
          <div className="flex items-center gap-2 text-[#719BDF] mb-1">
            <Eye size={20} />
            <h3 className="text-base font-bold text-slate-100 font-display">
              مرور نهایی و اعتبارسنجی کلی کمپین
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            تمامی مشخصات و تنظیمات کمپین را پیش از انتشار نهایی یا ذخیره به عنوان پیش‌نویس بازبینی کنید.
          </p>
        </div>
        <span className="text-xs bg-emerald-500/10 text-emerald-400 font-bold px-3 py-1 rounded-full border border-emerald-500/30 self-start sm:self-auto">
          مرحله ۶ از ۶ — آماده انتشار
        </span>
      </div>

      {/* هشدار مازاد بودجه در صورت وجود */}
      {isBudgetExceeded && (
        <div className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 p-3.5 rounded-xl text-xs">
          <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">یادآوری: مازاد بودجه در تخصیص پلتفرم‌ها</span>
            <p className="text-amber-300/80 text-[11px] mt-0.5">
              مجموع بودجه کانال‌ها ({totalAllocated.toLocaleString('fa-IR')} تومان)، به میزان {Math.abs(remainingBudget).toLocaleString('fa-IR')} تومان فراتر از سقف کل بودجه کمپین است.
            </p>
          </div>
        </div>
      )}

      {/* کارت‌های خلاصه ۵ مرحله قبلی با دکمه ویرایش */}
      <div className="space-y-4">
        {/* ۱. کارت اطلاعات پایه (مرحله ۱) */}
        <div className="bg-[#0B1423]/60 rounded-xl border border-[#1F2E45] p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#1F2E45]">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-100">
              <span className="w-6 h-6 rounded-lg bg-[#18263A] text-[#719BDF] border border-[#1F2E45] flex items-center justify-center text-[11px]">
                ۱
              </span>
              <span>اطلاعات پایه و زمان‌بندی</span>
            </div>
            <button
              type="button"
              onClick={() => onEditStep(1)}
              className="flex items-center gap-1 text-xs text-[#719BDF] hover:text-white font-semibold px-2 py-1 rounded-lg hover:bg-[#18263A] transition-colors"
            >
              <Edit3 size={13} />
              <span>ویرایش مرحله ۱</span>
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">نام کمپین:</span>
              <span className="font-bold text-slate-100">{formData.name || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">هدف کمپین:</span>
              <span className="font-semibold text-slate-200">
                {getObjectiveTitle(formData.objective)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">کانال اصلی:</span>
              <span className="font-semibold text-slate-200">{formData.channel}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">مسئول کمپین:</span>
              <span className="font-semibold text-slate-200">
                {formData.ownerName || 'کاربر جاری'}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400 block text-[11px]">بازه زمانی (شمسی):</span>
              <span className="font-semibold text-slate-200 flex items-center gap-1 mt-0.5">
                <Calendar size={13} className="text-slate-500" />
                <span>از {formatPersianDate(formData.startDate)} تا {formatPersianDate(formData.endDate)}</span>
              </span>
            </div>
            {formData.description && (
              <div className="col-span-2">
                <span className="text-slate-400 block text-[11px]">توضیحات:</span>
                <p className="text-slate-300 text-[11px] line-clamp-1">{formData.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* ۲. کارت مخاطبان هدف (مرحله ۲) */}
        <div className="bg-[#0B1423]/60 rounded-xl border border-[#1F2E45] p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#1F2E45]">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-100">
              <span className="w-6 h-6 rounded-lg bg-[#18263A] text-[#719BDF] border border-[#1F2E45] flex items-center justify-center text-[11px]">
                ۲
              </span>
              <span>مخاطبان هدف کمپین</span>
            </div>
            <button
              type="button"
              onClick={() => onEditStep(2)}
              className="flex items-center gap-1 text-xs text-[#719BDF] hover:text-white font-semibold px-2 py-1 rounded-lg hover:bg-[#18263A] transition-colors"
            >
              <Edit3 size={13} />
              <span>ویرایش مرحله ۲</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-slate-500" />
              <span className="font-medium text-slate-300">
                تعداد دسته‌های انتخابی: <strong className="text-slate-100">{selectedAudienceCount} سگمنت</strong>
              </span>
            </div>
            {formData.targetAudience.estimatedReach ? (
              <span className="text-[#719BDF] font-bold bg-[#18263A] border border-[#1F2E45] px-2.5 py-1 rounded-lg font-display">
                پوشش تخمینی: {formData.targetAudience.estimatedReach.toLocaleString('fa-IR')} کاربر
              </span>
            ) : null}
          </div>
        </div>

        {/* ۳. کارت بودجه و پلتفرم‌ها (مرحله ۳) */}
        <div className="bg-[#0B1423]/60 rounded-xl border border-[#1F2E45] p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#1F2E45]">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-100">
              <span className="w-6 h-6 rounded-lg bg-[#18263A] text-[#719BDF] border border-[#1F2E45] flex items-center justify-center text-[11px]">
                ۳
              </span>
              <span>تخصیص بودجه و پلتفرم‌ها</span>
            </div>
            <button
              type="button"
              onClick={() => onEditStep(3)}
              className="flex items-center gap-1 text-xs text-[#719BDF] hover:text-white font-semibold px-2 py-1 rounded-lg hover:bg-[#18263A] transition-colors"
            >
              <Edit3 size={13} />
              <span>ویرایش مرحله ۳</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-xs pb-2 border-b border-[#1F2E45]">
            <span className="text-slate-400">بودجه کل کمپین:</span>
            <span className="font-bold text-slate-100 text-sm font-display">
              {totalBudget.toLocaleString('fa-IR')} تومان
            </span>
          </div>

          <div className="space-y-1.5">
            {activePlatforms.map((p) => (
              <div
                key={p.platformId}
                className="flex items-center justify-between text-xs bg-[#111D2E] px-3 py-1.5 rounded-lg border border-[#1F2E45]"
              >
                <span className="font-medium text-slate-200">{p.name}</span>
                <div className="flex items-center gap-2 font-mono" dir="ltr">
                  <span className="text-[#719BDF] font-bold text-xs font-display">
                    {p.allocatedBudget.toLocaleString('fa-IR')} T
                  </span>
                  <span className="text-slate-500 text-[10px]">
                    ({p.percentage}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ۴. کارت KPI و اهداف (مرحله ۴) */}
        <div className="bg-[#0B1423]/60 rounded-xl border border-[#1F2E45] p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#1F2E45]">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-100">
              <span className="w-6 h-6 rounded-lg bg-[#18263A] text-[#719BDF] border border-[#1F2E45] flex items-center justify-center text-[11px]">
                ۴
              </span>
              <span>شاخص‌های کلیدی عملکرد و KPIها</span>
            </div>
            <button
              type="button"
              onClick={() => onEditStep(4)}
              className="flex items-center gap-1 text-xs text-[#719BDF] hover:text-white font-semibold px-2 py-1 rounded-lg hover:bg-[#18263A] transition-colors"
            >
              <Edit3 size={13} />
              <span>ویرایش مرحله ۴</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {selectedKpis.map((kpi) => (
              <div
                key={kpi.id}
                className="bg-[#111D2E] p-2.5 rounded-lg border border-[#1F2E45] text-xs"
              >
                <span className="text-slate-400 block text-[10px] truncate">
                  {kpi.name}:
                </span>
                <span className="font-bold text-slate-100 mt-0.5 inline-block font-display" dir="ltr">
                  {kpi.targetValue.toLocaleString('fa-IR')} {kpi.unit}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ۵. کارت صفحه فرود و پارامترهای UTM (مرحله ۵) */}
        <div className="bg-[#0B1423]/60 rounded-xl border border-[#1F2E45] p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#1F2E45]">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-100">
              <span className="w-6 h-6 rounded-lg bg-[#18263A] text-[#719BDF] border border-[#1F2E45] flex items-center justify-center text-[11px]">
                ۵
              </span>
              <span>صفحه فرود و لینک‌های رهگیری UTM</span>
            </div>
            <button
              type="button"
              onClick={() => onEditStep(5)}
              className="flex items-center gap-1 text-xs text-[#719BDF] hover:text-white font-semibold px-2 py-1 rounded-lg hover:bg-[#18263A] transition-colors"
            >
              <Edit3 size={13} />
              <span>ویرایش مرحله ۵</span>
            </button>
          </div>

          <div className="space-y-1 text-xs">
            <span className="text-slate-400 text-[11px] block">صفحه فرود هدف:</span>
            <p className="font-mono text-slate-200 text-left text-xs truncate bg-[#111D2E] p-2 rounded-lg border border-[#1F2E45]" dir="ltr">
              {formData.trackingUtm.landingUrl}
            </p>
          </div>

          <div className="space-y-1.5 pt-1">
            <span className="text-slate-400 text-[10px] block font-medium">
              لینک‌های تولیدشده برای پلتفرم‌ها:
            </span>
            {(formData.trackingUtm.platformUtms || []).map((cfg) => (
              <div
                key={cfg.platformId}
                className="bg-[#111D2E] p-2.5 rounded-lg border border-[#1F2E45] flex items-center justify-between gap-2 text-xs"
              >
                <span className="font-bold text-slate-300 shrink-0 text-[11px]">
                  {cfg.platformName}:
                </span>
                <p className="font-mono text-[#719BDF] truncate text-[11px] text-left min-w-0" dir="ltr">
                  {cfg.finalUrl}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function getObjectiveTitle(obj: string): string {
  switch (obj) {
    case 'lead_generation':
      return 'دریافت لید و سرنخ فروش';
    case 'direct_sales':
      return 'فروش مستقیم محصول';
    case 'brand_awareness':
      return 'آگاهی از برند';
    case 'website_traffic':
      return 'افزایش ترافیک وبسایت';
    case 'app_install':
      return 'نصب اپلیکیشن';
    default:
      return obj || 'نامشخص';
  }
}
