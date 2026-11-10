'use client';

import * as React from 'react';
import { DollarSign, Info } from 'lucide-react';
import type { SpendTrendPoint } from '../types';

export interface SpendTrendChartProps {
  trends: SpendTrendPoint[];
}

export function SpendTrendChart({ trends }: SpendTrendChartProps) {
  const [hoveredPoint, setHoveredPoint] = React.useState<SpendTrendPoint | null>(null);

  if (!trends || trends.length === 0) {
    return (
      <div className="p-6 bg-white border border-slate-200/90 rounded-2xl text-center space-y-2" dir="rtl">
        <DollarSign className="w-7 h-7 text-slate-300 mx-auto" />
        <h4 className="text-xs font-bold text-slate-700">داده هزینه‌ای در این بازه یافت نشد</h4>
        <p className="text-[11px] text-slate-400">در بازه انتخابی هیچ هزینه‌ای ثبت نگردیده است.</p>
      </div>
    );
  }

  const maxVal = Math.max(...trends.map((t) => t.spend), 1_000_000);
  const totalSpendInRange = trends.reduce((sum, t) => sum + t.spend, 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3.5 transition-colors" dir="rtl">
      {/* هدر نمودار روند هزینه */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">روند روزانه هزینه تبلیغات</h3>
          </div>
          <p className="text-[11px] text-slate-400">
            توزیع روزانه مبالغ پرداختی و تحقق‌یافته در بازه زمانی منتخب
          </p>
        </div>
        <div className="text-left shrink-0">
          <span className="text-xs font-black text-slate-900 font-mono">
            {totalSpendInRange.toLocaleString('fa-IR')}
          </span>
          <span className="text-[10px] text-slate-400 mr-1">تومان</span>
        </div>
      </div>

      {/* وضعیت Tooltip هنگام هاور */}
      <div className="h-6 flex items-center justify-between text-xs px-2.5 bg-slate-50 rounded-lg border border-slate-100 text-[11px]">
        {hoveredPoint ? (
          <>
            <span className="font-semibold text-slate-700">تاریخ: {hoveredPoint.label}</span>
            <span className="font-bold text-blue-700">
              هزینه: {hoveredPoint.spend.toLocaleString('fa-IR')} تومان
            </span>
          </>
        ) : (
          <div className="flex items-center gap-1.5 text-slate-400">
            <Info className="w-3 h-3 text-slate-400" />
            <span>نشانگر ماوس را روی ستون‌ها قرار دهید تا مبلغ روزانه نمایش داده شود.</span>
          </div>
        )}
      </div>

      {/* ناحیه ستون‌های نمودار */}
      <div className="pt-2 overflow-x-auto pb-1">
        <div className="flex items-end justify-between gap-1.5 min-w-[320px] h-40 px-1 border-b border-slate-200">
          {trends.map((item, idx) => {
            const heightPercent = item.spend > 0 ? Math.max(8, Math.round((item.spend / maxVal) * 100)) : 2;

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredPoint(item)}
                onMouseLeave={() => setHoveredPoint(null)}
                className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
              >
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full max-w-[16px] rounded-t-md transition-all duration-150 ${
                    item.spend > 0
                      ? 'bg-blue-500 hover:bg-blue-600 group-hover:scale-y-105'
                      : 'bg-slate-200/60'
                  }`}
                />
                <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap mt-2 group-hover:text-slate-900 group-hover:font-bold">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
