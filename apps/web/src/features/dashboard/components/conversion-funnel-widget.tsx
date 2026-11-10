'use client';

import * as React from 'react';
import { Filter, ArrowDown, HelpCircle } from 'lucide-react';
import type { FunnelStage } from '../types';

export interface ConversionFunnelWidgetProps {
  funnel: FunnelStage[];
}

export function ConversionFunnelWidget({ funnel }: ConversionFunnelWidgetProps) {
  // پیدا کردن بیشترین مقدار معتبر برای مقیاس‌بندی نوارهای قیف
  const validCounts = funnel
    .map((s) => s.count)
    .filter((c): c is number => c !== null && c > 0);
  const maxCount = validCounts.length > 0 ? Math.max(...validCounts) : 1;

  const STAGE_COLORS = [
    'bg-slate-400', // کلیک (داده در دسترس نیست)
    'bg-blue-600',  // لید
    'bg-indigo-600', // واجد شرایط
    'bg-amber-500', // پیشنهاد قیمت
    'bg-emerald-600', // مشتری نهایی
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4 transition-colors" dir="rtl">
      {/* هدر قیف تبدیل */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">قیف تبدیل بازاریابی و فروش</h3>
          </div>
          <p className="text-[11px] text-slate-400">
            نرخ تبدیل تفکیک‌شده مرحله‌به‌مرحله از ورودی لید تا معامله نهایی (صفحه ۸ سند)
          </p>
        </div>
        <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg font-medium">
          ۵ مرحله اصلی
        </span>
      </div>

      {/* مراحل ۵‌گانه قیف */}
      <div className="space-y-3 pt-1">
        {funnel.map((stage, index) => {
          const isAvailable = stage.count !== null && stage.isAvailable !== false;
          const countVal = stage.count;

          const widthPercent =
            isAvailable && countVal !== null && countVal > 0 && maxCount > 0
              ? Math.max(15, Math.min(100, Math.round((countVal / maxCount) * 100)))
              : 12;

          const colorClass = isAvailable ? (STAGE_COLORS[index] || 'bg-blue-500') : 'bg-slate-200';

          return (
            <div key={stage.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-[10px]">
                    {index + 1}
                  </span>
                  <span className="font-semibold text-slate-800">{stage.label}</span>
                  {!isAvailable && (
                    <span
                      className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded cursor-help"
                      title="سامانه رهگیری کلیک در پلتفرم فعال نیست؛ داده ثبت رویداد کلیک در دسترس نمی‌باشد."
                    >
                      <span>در دسترس نیست</span>
                      <HelpCircle className="w-3 h-3" />
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-slate-900 font-mono text-[11px]">
                    {isAvailable && countVal !== null ? countVal.toLocaleString('fa-IR') : '—'}
                  </span>
                  {index > 0 && (
                    <span className="text-[10px] text-slate-400 font-medium">
                      (تبدیل:{' '}
                      {stage.conversionFromPrevious !== null
                        ? `${stage.conversionFromPrevious.toLocaleString('fa-IR')}٪`
                        : '—'}
                      )
                    </span>
                  )}
                </div>
              </div>

              {/* نوار بصری قیف */}
              <div className="h-6 w-full bg-slate-100/90 rounded-lg overflow-hidden flex items-center p-1">
                <div
                  style={{ width: `${widthPercent}%` }}
                  className={`h-full ${colorClass} rounded-md transition-all duration-300 flex items-center justify-end px-2`}
                >
                  <span
                    className={`text-[10px] font-bold whitespace-nowrap ${
                      isAvailable ? 'text-white' : 'text-slate-500 font-mono'
                    }`}
                  >
                    {isAvailable && countVal !== null ? countVal.toLocaleString('fa-IR') : '—'}
                  </span>
                </div>
              </div>

              {/* نشانگر ریزش بین مراحل */}
              {index < funnel.length - 1 && (
                <div className="flex items-center justify-center py-0.5 text-[10px] text-slate-400 gap-1">
                  <ArrowDown className="w-3 h-3 text-slate-300" />
                  <span>
                    ریزش این مرحله:{' '}
                    {funnel[index + 1].dropoffPercentage !== null
                      ? `${funnel[index + 1].dropoffPercentage?.toLocaleString('fa-IR')}٪`
                      : '—'}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
