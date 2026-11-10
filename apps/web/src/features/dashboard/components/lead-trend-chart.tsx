'use client';

import * as React from 'react';
import { Users, Info } from 'lucide-react';
import type { LeadTrendPoint } from '../types';

export interface LeadTrendChartProps {
  trends: LeadTrendPoint[];
}

export function LeadTrendChart({ trends }: LeadTrendChartProps) {
  const [hoveredPoint, setHoveredPoint] = React.useState<LeadTrendPoint | null>(null);

  if (!trends || trends.length === 0) {
    return (
      <div className="p-6 bg-white border border-slate-200/90 rounded-2xl text-center space-y-2" dir="rtl">
        <Users className="w-7 h-7 text-slate-300 mx-auto" />
        <h4 className="text-xs font-bold text-slate-700">داده لید در این بازه یافت نشد</h4>
        <p className="text-[11px] text-slate-400">در بازه انتخابی هیچ سرنخی ثبت نشده است.</p>
      </div>
    );
  }

  const maxVal = Math.max(...trends.map((t) => t.leadsCount), 5);
  const totalLeadsInRange = trends.reduce((sum, t) => sum + t.leadsCount, 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3.5 transition-colors" dir="rtl">
      {/* هدر نمودار روند لید */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">روند روزانه جذب سرنخ (Leads)</h3>
          </div>
          <p className="text-[11px] text-slate-400">
            تعداد لیدهای ورودی به سیستم در بازه زمانی منتخب
          </p>
        </div>
        <div className="text-left shrink-0">
          <span className="text-xs font-black text-slate-900 font-mono">
            {totalLeadsInRange.toLocaleString('fa-IR')}
          </span>
          <span className="text-[10px] text-slate-400 mr-1">لید</span>
        </div>
      </div>

      {/* وضعیت Tooltip هنگام هاور */}
      <div className="h-6 flex items-center justify-between text-xs px-2.5 bg-slate-50 rounded-lg border border-slate-100 text-[11px]">
        {hoveredPoint ? (
          <>
            <span className="font-semibold text-slate-700">تاریخ: {hoveredPoint.label}</span>
            <span className="font-bold text-emerald-700">
              تعداد لید: {hoveredPoint.leadsCount.toLocaleString('fa-IR')} عدد
            </span>
          </>
        ) : (
          <div className="flex items-center gap-1.5 text-slate-400">
            <Info className="w-3 h-3 text-slate-400" />
            <span>نشانگر ماوس را روی ستون‌ها قرار دهید تا تعداد لید روزانه نمایش داده شود.</span>
          </div>
        )}
      </div>

      {/* ناحیه ستون‌های نمودار */}
      <div className="pt-2 overflow-x-auto pb-1">
        <div className="flex items-end justify-between gap-1.5 min-w-[320px] h-40 px-1 border-b border-slate-200">
          {trends.map((item, idx) => {
            const heightPercent = item.leadsCount > 0 ? Math.max(8, Math.round((item.leadsCount / maxVal) * 100)) : 2;

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
                    item.leadsCount > 0
                      ? 'bg-emerald-500 hover:bg-emerald-600 group-hover:scale-y-105'
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
