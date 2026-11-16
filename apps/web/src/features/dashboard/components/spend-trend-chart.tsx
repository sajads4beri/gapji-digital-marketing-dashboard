'use client';

import * as React from 'react';
import { DollarSign, Info } from 'lucide-react';
import type { SpendTrendPoint } from '../types';

export interface SpendTrendChartProps {
  trends?: SpendTrendPoint[];
}

export function SpendTrendChart({ trends = [] }: SpendTrendChartProps) {
  const [hoveredPoint, setHoveredPoint] = React.useState<SpendTrendPoint | null>(null);

  // حذف کامل مقادیر موک پیش‌فرض (D-04) - استفاده ۱۰۰٪ از داده‌های واقعی trends
  const dataPoints: SpendTrendPoint[] = trends || [];
  const hasData = dataPoints.length > 0 && dataPoints.some((t) => t.spend > 0);

  const maxVal = Math.max(...dataPoints.map((t) => t.spend || 0), 1000000);
  const totalSpend = dataPoints.reduce((sum, t) => sum + (t.spend || 0), 0);

  return (
    <div
      className="bg-[#111D2E]/85 backdrop-blur-md rounded-2xl border border-[#1F2E45] p-5 shadow-xl space-y-3.5 transition-all relative overflow-hidden"
      dir="rtl"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#719BDF]/30 to-transparent" />

      {/* هدر نمودار هزینه */}
      <div className="flex items-center justify-between border-b border-[#1F2E45]/80 pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100 font-display">
              روند روزانه هزینه تبلیغات
            </h3>
          </div>
          <p className="text-[11px] text-slate-400">
            توزیع مخارج ثبت‌شده در طول روزهای دوره
          </p>
        </div>
        <div className="text-left bg-[#18263A] border border-[#1F2E45] px-3 py-1 rounded-xl">
          <span className="text-xs font-black text-emerald-400 font-display me-1">
            {totalSpend.toLocaleString('fa-IR')}
          </span>
          <span className="text-[10px] text-slate-400">تومان</span>
        </div>
      </div>

      {/* حالت تهی (Empty State) در صورت عدم وجود مخارج واقعی (D-04) */}
      {!hasData ? (
        <div className="py-12 px-4 text-center space-y-2.5">
          <div className="w-12 h-12 rounded-2xl bg-[#18263A] border border-[#1F2E45] text-slate-400 flex items-center justify-center mx-auto">
            <DollarSign className="w-6 h-6 text-slate-500" />
          </div>
          <h4 className="text-xs font-bold text-slate-300">
            در این بازه زمانی هیچ هزینه‌ای ثبت نشده است
          </h4>
          <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
            با ثبت مخارج تبلیغاتی در بخش هزینه‌ها، روند مصرف بودجه روزانه فعال می‌شود.
          </p>
        </div>
      ) : (
        <>
          {/* وضعیت Tooltip هنگام هاور */}
          <div className="h-7 flex items-center justify-between text-xs px-3 bg-[#18263A]/60 rounded-xl border border-[#1F2E45] text-[11px]">
            {hoveredPoint ? (
              <>
                <span className="font-semibold text-slate-300">
                  تاریخ: {hoveredPoint.label}
                </span>
                <span className="font-bold text-emerald-400 font-display">
                  هزینه: {(hoveredPoint.spend || 0).toLocaleString('fa-IR')} تومان
                </span>
              </>
            ) : (
              <div className="flex items-center gap-1.5 text-slate-400">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                <span>نشانگر ماوس را روی ستون‌ها قرار دهید تا جزئیات نمایش یابد.</span>
              </div>
            )}
          </div>

          {/* ناحیه ستون‌های عمودی */}
          <div className="pt-2 overflow-x-auto pb-1">
            <div className="flex items-end justify-between gap-2 min-w-[320px] h-36 px-1 border-b border-[#1F2E45]">
              {dataPoints.map((item, idx) => {
                const heightPercent =
                  (item.spend || 0) > 0 ? Math.max(8, Math.round(((item.spend || 0) / maxVal) * 100)) : 3;

                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredPoint(item)}
                    onMouseLeave={() => setHoveredPoint(null)}
                    className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                  >
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full max-w-[18px] rounded-t-md transition-all duration-200 ${
                        (item.spend || 0) > 0
                          ? 'bg-gradient-to-t from-emerald-600/70 to-emerald-400 hover:to-emerald-300 group-hover:shadow-[0_0_10px_rgba(52,211,153,0.35)]'
                          : 'bg-[#18263A]'
                      }`}
                    />
                    <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap mt-2 group-hover:text-slate-100 group-hover:font-bold">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
