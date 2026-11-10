'use client';

import * as React from 'react';
import { Layers, PieChart, AlertCircle, Info } from 'lucide-react';
import type { PlatformShareItem } from '../types';

export interface PlatformShareWidgetProps {
  platformShares: PlatformShareItem[];
}

export function PlatformShareWidget({ platformShares }: PlatformShareWidgetProps) {
  const totalSpend = platformShares.reduce((sum, p) => sum + p.spend, 0);
  const hasUnattributed = platformShares.some((p) => p.id === 'unlinked');
  const isAllZeroSpend = platformShares.length > 0 && totalSpend === 0;

  const PALETTE = [
    'bg-blue-600',
    'bg-pink-600',
    'bg-emerald-600',
    'bg-purple-600',
    'bg-amber-600',
    'bg-indigo-600',
    'bg-slate-500',
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4 transition-colors" dir="rtl">
      {/* هدر سهم پلتفرم‌ها */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-900">سهم پلتفرم‌ها از هزینه تبلیغات</h3>
          </div>
          <p className="text-[11px] text-slate-400">
            توزیع منابع مالی به تفکیک پلتفرم‌های مصوب در پایگاه‌داده (ردیف ۴ سند)
          </p>
        </div>
        <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg font-medium">
          {platformShares.length} مورد
        </span>
      </div>

      {/* ۱. وضعیت: عدم وجود رکورد پلتفرم در سازمان یا فیلتر جاری */}
      {platformShares.length === 0 ? (
        <div className="p-6 text-center space-y-2 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <Layers className="w-6 h-6 text-slate-300 mx-auto" />
          <h4 className="text-xs font-bold text-slate-700">هیچ پلتفرمی در پایگاه‌داده تعریف نشده است</h4>
          <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed">
            در این سازمان هنوز پلتفرم تبلیغاتی (مانند یکتانت، گوگل ادز یا صباویژن) در بخش تنظیمات پلتفرم‌ها ثبت نشده است.
          </p>
        </div>
      ) : isAllZeroSpend ? (
        /* ۲. وضعیت: پلتفرم‌ها وجود دارند اما هزینه واقعی در این بازه ۰ تومان است */
        <div className="space-y-3 pt-1">
          <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl flex items-center gap-2 text-xs text-blue-800">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>هزینه ثبت‌شده برای پلتفرم‌های موجود در این بازه زمانی صفر است (Zero Spend).</span>
          </div>

          <div className="space-y-2 pt-1 divide-y divide-slate-100">
            {platformShares.map((plat) => (
              <div key={plat.id} className="pt-2 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">{plat.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 font-mono text-[11px]">۰ تومان</span>
                  <span className="font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded text-[11px]">۰٪</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ۳. وضعیت: وجود هزینه‌های واقعی انتساب‌یافته یا بدون انتساب */
        <div className="space-y-3 pt-1">
          {hasUnattributed && (
            <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center gap-2 text-[11px] text-amber-800">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>بخشی از هزینه‌های این دوره فاقد انتساب پلتفرم مشخص هستند (هزینه مستقیم).</span>
            </div>
          )}

          {/* نوار تجمیعی سهم */}
          <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex" dir="ltr">
            {platformShares.map((plat, idx) => {
              const color = plat.id === 'unlinked' ? 'bg-slate-400' : PALETTE[idx % PALETTE.length];
              return (
                <div
                  key={plat.id}
                  style={{ width: `${plat.sharePercentage}%` }}
                  className={`h-full ${color} transition-all duration-300`}
                  title={`${plat.name}: ${plat.sharePercentage}%`}
                />
              );
            })}
          </div>

          {/* لیست پلتفرم‌ها */}
          <div className="space-y-2 pt-2 divide-y divide-slate-100">
            {platformShares.map((plat, idx) => {
              const isUnlinked = plat.id === 'unlinked';
              const color = isUnlinked ? 'bg-slate-400' : PALETTE[idx % PALETTE.length];
              return (
                <div key={plat.id} className="pt-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${color} shrink-0`} />
                    <span className={`font-semibold ${isUnlinked ? 'text-amber-800 italic' : 'text-slate-800'}`}>
                      {plat.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-600 font-mono text-[11px]">
                      {plat.spend.toLocaleString('fa-IR')} تومان
                    </span>
                    <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                      {plat.sharePercentage.toLocaleString('fa-IR')}٪
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
