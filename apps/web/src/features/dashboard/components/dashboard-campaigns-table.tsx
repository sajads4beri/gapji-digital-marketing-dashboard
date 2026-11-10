'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Layers, ChevronLeft, ShieldCheck, AlertTriangle, AlertCircle } from 'lucide-react';
import type { DashboardCampaignItem } from '../types';

export interface DashboardCampaignsTableProps {
  campaigns: DashboardCampaignItem[];
}

export function DashboardCampaignsTable({ campaigns }: DashboardCampaignsTableProps) {
  const router = useRouter();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">فعال</span>;
      case 'paused':
        return <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">متوقف</span>;
      case 'completed':
        return <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">پایان‌یافته</span>;
      case 'planned':
        return <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">برنامه‌ریزی‌شده</span>;
      case 'draft':
      default:
        return <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">پیش‌نویس</span>;
    }
  };

  const getHealthBadge = (health: string) => {
    switch (health) {
      case 'healthy':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>سالم</span>
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>نیازمند توجه</span>
          </span>
        );
      case 'critical':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>ضعیف</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-colors" dir="rtl">
      {/* هدر جدول کمپین‌ها */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">جدول عملکرد کمپین‌ها</h3>
          </div>
          <p className="text-[11px] text-slate-400">
            پایش وضعیت عملیاتی، هزینه ثبتی، جذب لید و سلامت کمپین‌ها (ردیف ۵ صفحه ۸ سند)
          </p>
        </div>
        <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded-lg">
          {campaigns.length} کمپین
        </span>
      </div>

      {campaigns.length === 0 ? (
        <div className="p-8 text-center space-y-2">
          <Layers className="w-8 h-8 text-slate-300 mx-auto" />
          <h4 className="text-xs font-bold text-slate-700">هیچ کمپینی یافت نشد</h4>
          <p className="text-[11px] text-slate-400">با فیلترهای انتخابی هیچ کمپینی مطابقت ندارد.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">نام کمپین</th>
                <th className="py-3 px-3">وضعیت</th>
                <th className="py-3 px-3">هزینه بازه (تومان)</th>
                <th className="py-3 px-3">تعداد لید</th>
                <th className="py-3 px-3">CPL</th>
                <th className="py-3 px-3">نرخ تبدیل</th>
                <th className="py-3 px-4">سلامت</th>
                <th className="py-3 px-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {campaigns.map((camp) => (
                <tr
                  key={camp.id}
                  onClick={() => router.push(`/campaigns/${camp.id}`)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  title="مشاهده صفحه جزئیات کمپین"
                >
                  <td className="py-3.5 px-4 font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {camp.name}
                  </td>
                  <td className="py-3.5 px-3">
                    {getStatusBadge(camp.status)}
                  </td>
                  <td className="py-3.5 px-3 font-mono text-slate-700 text-[11px]">
                    {camp.spend.toLocaleString('fa-IR')}
                  </td>
                  <td className="py-3.5 px-3 font-bold text-blue-700">
                    {camp.leadsCount.toLocaleString('fa-IR')}
                  </td>
                  <td className="py-3.5 px-3 text-slate-600 text-[11px]">
                    {camp.cpl !== null ? `${camp.cpl.toLocaleString('fa-IR')} ت` : '—'}
                  </td>
                  <td className="py-3.5 px-3 font-bold text-emerald-700">
                    {camp.conversionRate !== null ? `${camp.conversionRate.toLocaleString('fa-IR')}٪` : '—'}
                  </td>
                  <td className="py-3.5 px-4">
                    {getHealthBadge(camp.health)}
                  </td>
                  <td className="py-3.5 px-2 text-slate-400 group-hover:text-blue-600 transition-colors">
                    <ChevronLeft className="w-4 h-4" />
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
