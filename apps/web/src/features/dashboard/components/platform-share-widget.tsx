'use client';

import * as React from 'react';
import { PieChart, Layers } from 'lucide-react';
import type { PlatformShareItem } from '../types';

export interface PlatformShareWidgetProps {
  platformShares: PlatformShareItem[];
  totalLeads?: number | null;
}

export function PlatformShareWidget({
  platformShares = [],
  totalLeads,
}: PlatformShareWidgetProps) {
  // پالت رنگ‌های Quiet Luxury سازگار با تم نیمه‌شب
  const PALETTE = [
    { stroke: '#719BDF', bg: 'bg-[#719BDF]', text: 'text-[#719BDF]' }, // آبی یخی
    { stroke: '#818CF8', bg: 'bg-[#818CF8]', text: 'text-[#818CF8]' }, // نیلی ملایم
    { stroke: '#34D399', bg: 'bg-[#34D399]', text: 'text-[#34D399]' }, // زمردی ملایم
    { stroke: '#F59E0B', bg: 'bg-[#F59E0B]', text: 'text-[#F59E0B]' }, // کهربایی
    { stroke: '#F472B6', bg: 'bg-[#F472B6]', text: 'text-[#F472B6]' }, // صورتی ملایم
    { stroke: '#64748B', bg: 'bg-[#64748B]', text: 'text-[#64748B]' }, // اسلیت خنثی
  ];

  // فیلتر کردن آیتم‌هایی که سهم یا هزینه دارند (بدون هرگونه دیتای فیک موک)
  const activeItems = React.useMemo(() => {
    return (platformShares || []).filter((p) => p.sharePercentage > 0 || p.spend > 0);
  }, [platformShares]);

  const hasData = activeItems.length > 0;

  // متن و رقم مرکز دونات بایندشده دقیق به totalLeads واقعی (D-02)
  const centerDisplay = React.useMemo(() => {
    if (totalLeads !== undefined && totalLeads !== null) {
      return totalLeads.toLocaleString('fa-IR');
    }
    return '—';
  }, [totalLeads]);

  // پارامترهای هندسی چارت دونات
  const radius = 54;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;

  // محاسبه offset هر برش در دونات
  let accumulatedPercent = 0;
  const segments = activeItems.map((item, idx) => {
    const percent = Math.max(1, item.sharePercentage);
    const strokeDasharray = `${(percent / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
    accumulatedPercent += percent;
    const color = PALETTE[idx % PALETTE.length];

    return {
      ...item,
      strokeDasharray,
      strokeDashoffset,
      color,
    };
  });

  return (
    <div
      className="bg-[#111D2E]/85 backdrop-blur-md rounded-2xl border border-[#1F2E45] p-5 shadow-xl space-y-4 transition-all relative overflow-hidden"
      dir="rtl"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#719BDF]/30 to-transparent" />

      {/* هدر بخش منابع جذب لید */}
      <div className="flex items-center justify-between border-b border-[#1F2E45]/80 pb-3.5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-[#818CF8]" />
            <h3 className="text-sm font-bold text-slate-100 font-display">
              منابع جذب لید
            </h3>
          </div>
          <p className="text-[11px] text-slate-400">
            توزیع سهم کانال‌ها و پلتفرم‌های تبلیغاتی
          </p>
        </div>

        <span className="text-[11px] font-semibold text-slate-400 bg-[#18263A] border border-[#1F2E45] px-2.5 py-1 rounded-xl">
          {activeItems.length} کانال
        </span>
      </div>

      {/* حالت تهی (Empty State) در صورت عدم وجود سهم هزینه پلتفرم در این دوره (D-04) */}
      {!hasData ? (
        <div className="py-12 px-4 text-center space-y-2.5">
          <div className="w-12 h-12 rounded-2xl bg-[#18263A] border border-[#1F2E45] text-slate-400 flex items-center justify-center mx-auto">
            <Layers className="w-6 h-6 text-slate-500" />
          </div>
          <h4 className="text-xs font-bold text-slate-300">
            داده‌ای برای سهم پلتفرم‌ها در این دوره ثبت نشده است
          </h4>
          <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
            با ثبت هزینه‌های تبلیغاتی منتسب به پلتفرم‌ها در ماژول هزینه‌ها، نمودار توزیع فعال خواهد شد.
          </p>
        </div>
      ) : (
        /* محتوای دونات و راهنما بر اساس داده‌های واقعی */
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center pt-1">
          {/* چارت دونات SVG */}
          <div className="sm:col-span-5 flex justify-center items-center relative">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  stroke="#18263A"
                  strokeWidth={strokeWidth}
                />

                {segments.map((seg, idx) => (
                  <circle
                    key={seg.id || idx}
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="none"
                    stroke={seg.color.stroke}
                    strokeWidth={strokeWidth}
                    strokeDasharray={seg.strokeDasharray}
                    strokeDashoffset={seg.strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-500 hover:opacity-80"
                  />
                ))}
              </svg>

              {/* متن مرکزی بایندشده به لید واقعی (D-02) */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-lg font-black text-slate-100 font-display tracking-tight">
                  {centerDisplay}
                </span>
                <span className="text-[10px] text-slate-400 font-medium -mt-0.5">
                  کل لید
                </span>
              </div>
            </div>
          </div>

          {/* لیست کانال‌ها */}
          <div className="sm:col-span-7 space-y-2">
            {segments.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 rounded-xl bg-[#18263A]/40 hover:bg-[#18263A]/80 border border-transparent hover:border-[#1F2E45] transition-all text-xs"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${item.color.bg}`}
                    style={{ boxShadow: `0 0 6px ${item.color.stroke}` }}
                  />
                  <span className="font-semibold text-slate-300 truncate">
                    {item.name}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="font-bold text-slate-100 font-display text-[11px]">
                    {item.sharePercentage.toLocaleString('fa-IR')}٪
                  </span>
                  {item.spend > 0 && (
                    <span className="text-[10px] text-slate-400 bg-[#0E1726] border border-[#1F2E45] px-1.5 py-0.5 rounded">
                      {Math.round(item.spend / 1000000).toLocaleString('fa-IR')} م.ت
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
