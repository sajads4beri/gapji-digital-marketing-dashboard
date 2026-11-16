'use client';

import React from 'react';
import { WebinarFunnelMetrics } from '../types';
import { Users, UserCheck, Sparkles, TrendingUp } from 'lucide-react';

interface WebinarFunnelCardProps {
  funnel: WebinarFunnelMetrics;
}

export function WebinarFunnelCard({ funnel }: WebinarFunnelCardProps) {
  return (
    <div className="bg-[#111D2E]/80 backdrop-blur-md p-5 rounded-2xl border border-[#1F2E45] shadow-xl shadow-black/20">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-white">قیف تبدیل وبینار (Funnel)</h3>
          <p className="text-xs text-slate-400 mt-0.5">فرآیند تبدیل: ثبت‌نام ← حضور ← لید</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#719BDF] bg-[#719BDF]/15 border border-[#719BDF]/30 px-2.5 py-1 rounded-lg font-medium">
          <TrendingUp className="w-3.5 h-3.5" />
          <span className="tabular-nums">نرخ تبدیل نهایی: {funnel.conversionRate.toLocaleString('fa-IR')}٪</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Step 1: ثبت‌نام */}
        <div className="bg-[#18263A] p-4 rounded-xl border border-[#1F2E45] relative">
          <div className="flex items-center justify-between text-[#719BDF] mb-2">
            <span className="text-xs font-bold">۱. ثبت‌نام‌کنندگان</span>
            <Users className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-white tabular-nums">
            {funnel.registeredCount.toLocaleString('fa-IR')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">نفر متقاضی حضور</div>
        </div>

        {/* Step 2: حضور */}
        <div className="bg-[#18263A] p-4 rounded-xl border border-[#1F2E45] relative">
          <div className="flex items-center justify-between text-indigo-400 mb-2">
            <span className="text-xs font-bold">۲. حاضران در جلسه</span>
            <UserCheck className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-white tabular-nums">
            {funnel.attendedCount.toLocaleString('fa-IR')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>نفر در وبینار</span>
            <span className="font-bold bg-[#111D2E] border border-[#1F2E45] px-2 py-0.5 rounded-lg text-indigo-300 tabular-nums">
              {funnel.attendanceRate.toLocaleString('fa-IR')}٪ نرخ حضور
            </span>
          </div>
        </div>

        {/* Step 3: لید */}
        <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20 relative">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-bold">۳. لیدهای تبدیل‌شده</span>
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-emerald-400 tabular-nums">
            {funnel.convertedLeadsCount.toLocaleString('fa-IR')}
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-1 flex items-center justify-between">
            <span>سرنخ فروش و جذب</span>
            <span className="font-bold bg-emerald-500/20 px-2 py-0.5 rounded-lg text-emerald-300 tabular-nums">
              {funnel.conversionRate.toLocaleString('fa-IR')}٪ تبدیل حاضر به لید
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
