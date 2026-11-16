'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Layers, ChevronLeft, ShieldCheck, AlertTriangle, AlertCircle, ArrowUpRight } from 'lucide-react';
import type { DashboardCampaignItem } from '../types';

export interface DashboardCampaignsTableProps {
  campaigns?: DashboardCampaignItem[];
}

export function DashboardCampaignsTable({ campaigns = [] }: DashboardCampaignsTableProps) {
  const router = useRouter();

  // حذف کامل رکوردهای موک هاردکدشده (D-04) - استفاده منحصربه‌فرد از آرایه ارائه‌شده توسط API
  const displayCampaigns = campaigns || [];
  const hasData = displayCampaigns.length > 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            فعال
          </span>
        );
      case 'paused':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            متوقف
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-700/50 text-slate-300 border border-slate-600">
            پایان‌یافته
          </span>
        );
      case 'planned':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#719BDF]/15 text-[#719BDF] border border-[#719BDF]/30">
            برنامه‌ریزی‌شده
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
            پیش‌نویس
          </span>
        );
    }
  };

  const getHealthBadge = (health: string) => {
    switch (health) {
      case 'healthy':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>سالم</span>
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>نیازمند توجه</span>
          </span>
        );
      case 'critical':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#D66B73]">
            <AlertCircle className="w-3.5 h-3.5 text-[#D66B73]" />
            <span>ضعیف</span>
          </span>
        );
    }
  };

  return (
    <div
      className="bg-[#111D2E]/85 backdrop-blur-md rounded-2xl border border-[#1F2E45] shadow-xl overflow-hidden transition-all relative"
      dir="rtl"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#719BDF]/30 to-transparent" />

      {/* هدر جدول کمپین‌ها */}
      <div className="p-4 sm:p-5 border-b border-[#1F2E45]/80 flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#719BDF]" />
            <h3 className="text-sm font-bold text-slate-100 font-display">
              جدول عملکرد کمپین‌ها
            </h3>
          </div>
          <p className="text-[11px] text-slate-400">
            پایش وضعیت عملیاتی، هزینه ثبتی، جذب لید و سلامت کمپین‌ها
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/campaigns')}
          className="text-xs text-[#719BDF] hover:text-[#96B9F2] font-bold inline-flex items-center gap-1 bg-[#18263A] border border-[#1F2E45] px-3 py-1.5 rounded-xl hover:bg-[#20314A] transition-colors"
        >
          <span>مشاهده همه کمپین‌ها</span>
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* حالت تهی (Empty State) در صورت عدم وجود کمپین (D-04) */}
      {!hasData ? (
        <div className="py-14 px-4 text-center space-y-2.5">
          <div className="w-12 h-12 rounded-2xl bg-[#18263A] border border-[#1F2E45] text-slate-400 flex items-center justify-center mx-auto">
            <Layers className="w-6 h-6 text-slate-500" />
          </div>
          <h4 className="text-xs font-bold text-slate-300">
            هیچ کمپینی با فیلترهای انتخابی یافت نشد
          </h4>
          <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
            با ساخت کمپین جدید یا تغییر بازه زمانی و فیلترها، جدول عملکرد به صورت خودکار بارگذاری خواهد شد.
          </p>
        </div>
      ) : (
        /* جدول داده‌های واقعی */
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-[#1F2E45] bg-[#0E1726]/80 text-slate-400">
                <th className="py-3 px-4 font-bold">نام کمپین</th>
                <th className="py-3 px-4 font-bold">وضعیت</th>
                <th className="py-3 px-4 font-bold">هزینه دوره</th>
                <th className="py-3 px-4 font-bold">لیدها</th>
                <th className="py-3 px-4 font-bold">نرخ تبدیل</th>
                <th className="py-3 px-4 font-bold">هزینه هر لید (CPL)</th>
                <th className="py-3 px-4 font-bold">شاخص سلامت</th>
                <th className="py-3 px-4 text-center font-bold">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2E45]/60">
              {displayCampaigns.map((camp) => (
                <tr
                  key={camp.id}
                  onClick={() => router.push(`/campaigns/${camp.id}`)}
                  className="hover:bg-[#18263A]/50 transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 px-4 font-semibold text-slate-100 group-hover:text-[#719BDF] transition-colors">
                    {camp.name}
                  </td>
                  <td className="py-3.5 px-4">
                    {getStatusBadge(camp.status)}
                  </td>
                  <td className="py-3.5 px-4 font-black text-slate-200 font-display">
                    {camp.spend.toLocaleString('fa-IR')} <span className="text-[10px] text-slate-400 font-normal">تومان</span>
                  </td>
                  <td className="py-3.5 px-4 font-black text-[#719BDF] font-display">
                    {camp.leadsCount.toLocaleString('fa-IR')}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-300 font-display">
                    {camp.conversionRate !== null ? `${camp.conversionRate.toLocaleString('fa-IR')}٪` : '—'}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-300 font-display">
                    {camp.cpl !== null ? `${camp.cpl.toLocaleString('fa-IR')} تومان` : '—'}
                  </td>
                  <td className="py-3.5 px-4">
                    {getHealthBadge(camp.health)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="w-7 h-7 rounded-lg bg-[#18263A] text-slate-400 group-hover:text-[#719BDF] group-hover:bg-[#20314A] inline-flex items-center justify-center transition-colors">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
