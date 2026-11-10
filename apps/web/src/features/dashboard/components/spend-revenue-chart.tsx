'use client';

import * as React from 'react';
import { BarChart3, TrendingUp, Info } from 'lucide-react';
import type { TrendChartDataPoint } from '../types';

export interface SpendRevenueChartProps {
 trends: TrendChartDataPoint[];
}

export function SpendRevenueChart({ trends }: SpendRevenueChartProps) {
 const [hoveredPoint, setHoveredPoint] = React.useState<TrendChartDataPoint | null>(null);

 if (!trends || trends.length === 0) {
 return (
 <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center space-y-2 transition-colors" dir="rtl">
 <BarChart3 className="w-8 h-8 text-slate-300 mx-auto" />
 <h4 className="text-sm font-bold text-slate-700 ">داده‌ای در این بازه یافت نشد</h4>
 <p className="text-xs text-slate-400 ">لطفاً بازه زمانی دیگری را انتخاب نمایید.</p>
 </div>
 );
 }

 // محاسبه حداکثر مقدار برای مقیاس‌بندی ارتفاع نمودار
 const maxVal = Math.max(
 ...trends.flatMap((t) => [t.spend, t.revenue]),
 10_000_000
 );

 return (
 <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4 transition-colors" dir="rtl">
 {/* هدر نمودار و راهنمای رنگ‌ها */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
 <div className="space-y-0.5">
 <div className="flex items-center gap-2">
 <TrendingUp className="w-4 h-4 text-blue-600 " />
 <h3 className="text-sm font-bold text-slate-900 ">روند مقایسه‌ای هزینه در برابر درآمد</h3>
 </div>
 <p className="text-[11px] text-slate-400 ">
 توزیع روزانه سرمایه‌گذاری تبلیغاتی و بازگشت درآمدی در بازه زمانی منتخب
 </p>
 </div>

 {/* راهنمای رنگ‌ها (Legend) */}
 <div className="flex items-center gap-4 text-xs shrink-0">
 <div className="flex items-center gap-1.5">
 <span className="w-3 h-3 rounded bg-blue-500 shrink-0" />
 <span className="text-slate-600 font-medium">هزینه تبلیغات</span>
 </div>
 <div className="flex items-center gap-1.5">
 <span className="w-3 h-3 rounded bg-emerald-500 shrink-0" />
 <span className="text-slate-600 font-medium">درآمد حاصل</span>
 </div>
 </div>
 </div>

 {/* نمایش جزئیات نقطه انتخاب‌شده (Tooltip Info) */}
 <div className="h-7 flex items-center justify-between text-xs px-2 bg-slate-50 rounded-lg border border-slate-100 ">
 {hoveredPoint ? (
 <>
 <span className="font-semibold text-slate-800 ">
 تاریخ: {hoveredPoint.label}
 </span>
 <div className="flex items-center gap-4 text-[11px]">
 <span className="text-blue-700 ">
 هزینه: {hoveredPoint.spend.toLocaleString('fa-IR')} تومان
 </span>
 <span className="text-emerald-700 font-bold">
 درآمد: {hoveredPoint.revenue.toLocaleString('fa-IR')} تومان
 </span>
 <span className="text-slate-500 ">
 ({hoveredPoint.leadsCount} لید)
 </span>
 </div>
 </>
 ) : (
 <div className="flex items-center gap-1 text-[11px] text-slate-400 ">
 <Info className="w-3.5 h-3.5" />
 <span>نشانگر ماوس را روی هر ستون قرار دهید تا جزئیات دقیق روز نمایش داده شود.</span>
 </div>
 )}
 </div>

 {/* ناحیه میله‌های نمودار (SVG/CSS Hybrid Responsive Bar Chart) */}
 <div className="pt-4 overflow-x-auto pb-2">
 <div className="flex items-end justify-between gap-2 sm:gap-4 min-w-[500px] h-52 px-2 border-b border-slate-200 ">
 {trends.map((item, idx) => {
 const spendHeightPercent = Math.max(8, Math.round((item.spend / maxVal) * 100));
 const revenueHeightPercent = Math.max(8, Math.round((item.revenue / maxVal) * 100));

 return (
 <div
 key={idx}
 onMouseEnter={() => setHoveredPoint(item)}
 onMouseLeave={() => setHoveredPoint(null)}
 className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
 >
 {/* ستون‌های دوتایی هزینه و درآمد */}
 <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-full pb-1">
 {/* میله هزینه */}
 <div
 style={{ height: `${spendHeightPercent}%` }}
 className="w-1/2 max-w-[18px] bg-blue-500 hover:bg-blue-600 rounded-t-md transition-all duration-200 group-hover:scale-y-105"
 />
 {/* میله درآمد */}
 <div
 style={{ height: `${revenueHeightPercent}%` }}
 className="w-1/2 max-w-[18px] bg-emerald-500 hover:bg-emerald-600 rounded-t-md transition-all duration-200 group-hover:scale-y-105"
 />
 </div>

 {/* برچسب محور افقی (تاریخ) */}
 <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium whitespace-nowrap mt-2 group-hover:text-slate-900 group-hover:font-bold">
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
