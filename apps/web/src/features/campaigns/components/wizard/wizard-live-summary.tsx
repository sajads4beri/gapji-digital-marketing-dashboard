'use client';

import React from 'react';
import { formatPersianDate } from '@/lib/persian-date';
import { CampaignFormData } from '../../types';
import {
  Wallet,
  AlertTriangle,
  CheckCircle2,
  PieChart,
  Calendar,
  Layers,
} from 'lucide-react';

interface WizardLiveSummaryProps {
  formData: CampaignFormData;
}

export function WizardLiveSummary({ formData }: WizardLiveSummaryProps) {
  const totalBudget = Number(formData.budget) || 0;

  // محاسبه مجموع بودجه تخصیص‌یافته به پلتفرم‌های فعال
  const allocatedBudget = (formData.platforms || [])
    .filter((p) => p.enabled)
    .reduce((sum, p) => sum + (Number(p.allocatedBudget) || 0), 0);

  const remainingBudget = totalBudget - allocatedBudget;
  const isBudgetExceeded = remainingBudget < 0;
  const isBudgetMatched = totalBudget > 0 && remainingBudget === 0;
  const percentage =
    totalBudget > 0
      ? Math.min(100, Math.round((allocatedBudget / totalBudget) * 100))
      : 0;

  return (
    <aside className="bg-[#111D2E]/80 backdrop-blur-md rounded-2xl border border-[#1F2E45] p-5 shadow-xl space-y-5 sticky top-6">
      {/* هدر سایدبار */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1F2E45]">
        <div className="flex items-center gap-2 text-slate-100 font-bold text-sm">
          <PieChart size={18} className="text-[#719BDF]" />
          <span>خلاصه زنده بودجه و پلتفرم‌ها</span>
        </div>
        <span className="text-xs bg-[#18263A] text-[#719BDF] font-medium px-2 py-0.5 rounded-full border border-[#1F2E45]">
          مرحله {formData.currentStep} از ۶
        </span>
      </div>

      {/* کارت بودجه کل */}
      <div className="bg-[#0B1423]/60 rounded-xl p-4 border border-[#1F2E45] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Wallet size={15} className="text-slate-500" />
            <span>بودجه کل کمپین:</span>
          </div>
          <span className="text-sm font-bold text-slate-100 font-display">
            {totalBudget.toLocaleString('fa-IR')} تومان
          </span>
        </div>

        {/* نوار پیشرفت درصد تخصیص */}
        <div>
          <div className="flex justify-between text-[11px] mb-1 font-medium">
            <span className="text-slate-400">تخصیص پلتفرم‌ها</span>
            <span
              className={
                isBudgetExceeded
                  ? 'text-[#D66B73] font-bold'
                  : 'text-[#719BDF] font-semibold'
              }
            >
              {percentage.toLocaleString('fa-IR')}٪
            </span>
          </div>
          <div className="w-full bg-[#18263A] rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isBudgetExceeded
                  ? 'bg-[#D66B73]'
                  : isBudgetMatched
                  ? 'bg-emerald-500'
                  : 'bg-gradient-to-r from-blue-600 to-[#719BDF]'
              }`}
              style={{
                width: `${Math.min(100, isBudgetExceeded ? 100 : percentage)}%`,
              }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs pt-1 border-t border-[#1F2E45]">
          <span className="text-slate-400">مجموع تخصیص‌یافته:</span>
          <span className="font-semibold text-slate-200 font-display">
            {allocatedBudget.toLocaleString('fa-IR')} تومان
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">باقیمانده:</span>
          <span
            className={`font-bold font-display ${
              isBudgetExceeded
                ? 'text-[#D66B73]'
                : isBudgetMatched
                ? 'text-emerald-400'
                : 'text-amber-400'
            }`}
          >
            {Math.abs(remainingBudget).toLocaleString('fa-IR')} تومان
            {isBudgetExceeded && ' (مازاد)'}
          </span>
        </div>
      </div>

      {/* پیام‌های هشدار یا تایید هوشمند بودجه */}
      {isBudgetExceeded && (
        <div className="flex items-start gap-2 bg-[#D66B73]/10 border border-[#D66B73]/30 text-[#D66B73] p-3 rounded-xl text-xs">
          <AlertTriangle size={16} className="shrink-0 mt-0.5 text-[#D66B73]" />
          <span>
            مجموع بودجه پلتفرم‌ها بیشتر از بودجه کل کمپین است. لطفاً مبالغ پلتفرم‌ها
            را تعدیل کنید.
          </span>
        </div>
      )}

      {isBudgetMatched && (
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-xl text-xs">
          <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
          <span>بودجه تمام پلتفرم‌ها با بودجه کل تطابق ۱۰۰٪ دارد.</span>
        </div>
      )}

      {/* پلتفرم‌های فعال */}
      <div className="space-y-2">
        <h5 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <Layers size={14} className="text-slate-500" />
          <span>کانال‌های تبلیغاتی فعال ({formData.platforms.filter((p) => p.enabled).length})</span>
        </h5>
        <div className="space-y-1.5">
          {formData.platforms
            .filter((p) => p.enabled)
            .map((p) => (
              <div
                key={p.platformId}
                className="flex items-center justify-between bg-[#0B1423]/60 px-3 py-2 rounded-lg text-xs border border-[#1F2E45]"
              >
                <span className="text-slate-300 font-medium">{p.name}</span>
                <span className="text-slate-400 text-[11px] font-display">
                  {p.allocatedBudget > 0
                    ? `${p.allocatedBudget.toLocaleString('fa-IR')} ت`
                    : 'بدون بودجه'}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* اطلاعات کلیدی کمپین */}
      <div className="pt-2 border-t border-[#1F2E45] text-xs text-slate-400 space-y-1.5">
        <div className="flex items-center justify-between">
          <span>نام کمپین:</span>
          <span className="font-medium text-slate-200 truncate max-w-[140px]">
            {formData.name || 'نامشخص'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Calendar size={12} />
            <span>بازه زمانی:</span>
          </span>
          <span className="font-medium text-slate-300 text-[11px]">
            {formatPersianDate(formData.startDate)} تا {formatPersianDate(formData.endDate)}
          </span>
        </div>
      </div>
    </aside>
  );
}
