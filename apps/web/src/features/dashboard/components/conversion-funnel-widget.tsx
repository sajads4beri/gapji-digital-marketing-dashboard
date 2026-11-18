'use client';

import * as React from 'react';
import { Filter, HelpCircle } from 'lucide-react';
import type { FunnelStage } from '../types';

export interface ConversionFunnelWidgetProps {
  funnel?: FunnelStage[];
}

export function ConversionFunnelWidget({ funnel = [] }: ConversionFunnelWidgetProps) {
  // حذف کامل داده‌های فرضی موک (D-04) - استفاده منحصربه‌فرد از داده‌های ارائه‌شده توسط سرور
  const displayFunnel = funnel || [];
  const hasData = displayFunnel.length > 0 && displayFunnel.some((s) => s.count !== null && s.count > 0);

  const validCounts = displayFunnel
    .map((s) => s.count)
    .filter((c): c is number => c !== null && c > 0);
  const maxCount = validCounts.length > 0 ? Math.max(...validCounts) : 1;

  const STAGE_GRADIENTS = [
    'from-slate-600 to-slate-500',
    'from-[#3B82F6] to-[#719BDF]',
    'from-[#6366F1] to-[#818CF8]',
    'from-[#F59E0B] to-[#FBBF24]',
    'from-[#10B981] to-[#34D399]',
  ];

  return (
    <div
      className="bg-[#111D2E]/85 backdrop-blur-md rounded-2xl border border-[#1F2E45] p-5 shadow-xl space-y-4 transition-all relative overflow-hidden"
      dir="rtl"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#719BDF]/30 to-transparent" />

      {/* هدر قیف تبدیل */}
      <div className="flex items-center justify-between border-b border-[#1F2E45]/80 pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#719BDF]" />
            <h3 className="text-sm font-bold text-slate-100 font-display">
              قیف تبدیل بازاریابی و فروش
            </h3>
          </div>
          <p className="text-[11px] text-slate-400">
            نرخ ریزش و عبور مرحله‌به‌مرحله از ورودی لید تا معامله نهایی
          </p>
        </div>
        <span className="text-[11px] font-semibold text-slate-400 bg-[#18263A] border border-[#1F2E45] px-2.5 py-1 rounded-xl">
          {displayFunnel.length > 0 ? `${displayFunnel.length} مرحله` : '—'}
        </span>
      </div>

      {/* حالت تهی (Empty State) در صورت عدم وجود لید در قیف (D-04) */}
      {!hasData ? (
        <div className="py-12 px-4 text-center space-y-2.5">
          <div className="w-12 h-12 rounded-2xl bg-[#18263A] border border-[#1F2E45] text-slate-400 flex items-center justify-center mx-auto">
            <Filter className="w-6 h-6 text-slate-500" />
          </div>
          <h4 className="text-xs font-bold text-slate-300">
            داده‌ای برای مراحل قیف تبدیل در این دوره وجود ندارد
          </h4>
          <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
            با حرکت سرنخ‌ها در پایپ‌لاین فروش و ثبت وضعیت‌های پیگیری، درصد تبدیل مراحل نمایش داده خواهد شد.
          </p>
        </div>
      ) : (
        /* مراحل ۵‌گانه قیف با مقادیر واقعی */
        <div className="space-y-3 pt-1">
          {displayFunnel.map((stage, index) => {
            const isAvailable = stage.count !== null && stage.isAvailable !== false;
            const countVal = stage.count;

            const widthPercent =
              isAvailable && countVal !== null && countVal > 0 && maxCount > 0
                ? Math.max(16, Math.min(100, Math.round((countVal / maxCount) * 100)))
                : 12;

            const gradientClass = isAvailable
              ? STAGE_GRADIENTS[index % STAGE_GRADIENTS.length]
              : 'from-slate-700 to-slate-600';

            return (
              <div key={stage.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#18263A] text-[#719BDF] border border-[#1F2E45] font-bold flex items-center justify-center text-[10px]">
                      {index + 1}
                    </span>
                    <span className="font-semibold text-slate-200">
                      {stage.label}
                    </span>
                    {!isAvailable && (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-[#18263A] px-2 py-0.5 rounded border border-[#1F2E45] cursor-help"
                        title="سامانه رهگیری کلیک فعال نیست"
                      >
                        <span>در دسترس نیست</span>
                        <HelpCircle className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="font-black text-slate-100 font-display text-[11px]">
                      {isAvailable && countVal !== null ? countVal.toLocaleString('fa-IR') : '—'}
                    </span>
                    {index > 0 && stage.conversionFromPrevious !== null && stage.conversionFromPrevious !== undefined && (
                      <span className="text-[10px] font-bold text-[#719BDF] bg-[#18263A] border border-[#1F2E45] px-2 py-0.5 rounded-full">
                        {stage.conversionFromPrevious.toLocaleString('fa-IR')}٪
                      </span>
                    )}
                  </div>
                </div>

                <div className="h-2.5 w-full bg-[#18263A] rounded-full overflow-hidden flex" dir="ltr">
                  <div
                    style={{ width: `${widthPercent}%` }}
                    className={`h-full bg-gradient-to-r ${gradientClass} rounded-full transition-all duration-500`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
