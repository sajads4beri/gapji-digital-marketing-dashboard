'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Layers,
  DollarSign,
  UploadCloud,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  ArrowUpRight,
} from 'lucide-react';
import { HomeWidgetCard } from './home-widget-card';
import { campaignService } from '@/features/campaigns/api';
import type { ExtendedCampaign } from '@/features/campaigns/types';
import { costService, type CostItem } from '@/features/costs';

export function CampaignManagerHomeView() {
  const [activeCampaignsWithoutTodayCost, setActiveCampaignsWithoutTodayCost] = React.useState<
    ExtendedCampaign[]
  >([]);
  const [myCampaigns, setMyCampaigns] = React.useState<ExtendedCampaign[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [allCampaigns, allCosts] = await Promise.all([
        campaignService.getAll().catch(() => []),
        costService.getAll().catch(() => []),
      ]);

      const todayIso = new Date().toISOString().split('T')[0];
      const todayCosts = allCosts.filter((c) => c.date === todayIso);
      const campaignIdsWithTodayCost = new Set(todayCosts.map((c) => c.campaignId));

      // کمپین‌های فعال فاقد هزینه امروز (ص ۷ مستند)
      const missingCosts = allCampaigns.filter(
        (c) => c.status === 'active' && !campaignIdsWithTodayCost.has(c.id),
      );

      setActiveCampaignsWithoutTodayCost(missingCosts);
      setMyCampaigns(allCampaigns);
    } catch (err: any) {
      setError(err?.message || 'خطا در بارگذاری اطلاعات پیشخوان کمپین‌چی');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="grid grid-cols-12 gap-5" dir="rtl">
      {/* هدر پیشخوان کمپین‌چی */}
      <div className="col-span-12 p-4 bg-gradient-to-r from-emerald-50/80 to-teal-50/50 border border-emerald-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
            <Layers size={20} />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900">
              پیشخوان عملیاتی کمپین‌چی (Campaign Manager)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              مدیریت ثبت روزانه هزینه‌ها، پایش بودجه مصرفی و ایمپورت داده‌های کانال‌ها
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/campaigns/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs"
          >
            <PlusCircle size={15} />
            <span>کمپین جدید (ویزارد)</span>
          </Link>
          <Link
            href="/performance/costs"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors shadow-2xs"
          >
            <DollarSign size={14} className="text-emerald-600" />
            <span>ثبت هزینه</span>
          </Link>
        </div>
      </div>

      {/* ویجت ۱: کمپین‌های فعال بدون هزینه ثبت‌شده امروز (الزام صریح سند: ص ۷) */}
      <HomeWidgetCard
        title="کمپین‌های فعال بدون هزینه ثبت‌شده امروز"
        icon={AlertCircle}
        badge={
          activeCampaignsWithoutTodayCost.length > 0
            ? `${activeCampaignsWithoutTodayCost.length} کمپین نیازمند ثبت`
            : 'تکمیل'
        }
        badgeColor={activeCampaignsWithoutTodayCost.length > 0 ? 'amber' : 'emerald'}
        viewAllHref="/performance/costs"
        viewAllLabel="ثبت هزینه در ماژول هزینه‌ها"
        isLoading={isLoading}
        error={error}
        onRetry={fetchData}
        isEmpty={activeCampaignsWithoutTodayCost.length === 0}
        emptyMessage="تمامی کمپین‌های فعال امروز دارای هزینه ثبت‌شده هستند و موردی جا نمانده است."
        className="col-span-12 lg:col-span-8"
      >
        <div className="space-y-3">
          {activeCampaignsWithoutTodayCost.map((c) => (
            <div
              key={c.id}
              className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs text-slate-900">
                    {c.name}
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    فعال
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                  <span>کانال: {c.channel || 'تبلیغات آنلاین'}</span>
                  <span>
                    بودجه مصوب: {c.budget ? `${(c.budget / 1000000).toLocaleString('fa-IR')} م.ت` : '—'}
                  </span>
                </div>
              </div>

              <Link
                href="/performance/costs"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-900 bg-amber-100/90 hover:bg-amber-200 rounded-xl transition-colors shrink-0"
              >
                <DollarSign size={13} />
                <span>ثبت هزینه امروز</span>
              </Link>
            </div>
          ))}
        </div>
      </HomeWidgetCard>

      {/* ویجت ۲: میان‌بر «ثبت هزینه» و «Import» (الزام صریح سند: ص ۷) */}
      <HomeWidgetCard
        title="میان‌برهای سریع عملیاتی"
        icon={PlusCircle}
        className="col-span-12 lg:col-span-4"
      >
        <div className="space-y-3">
          {/* میان‌بر ثبت هزینه */}
          <Link
            href="/performance/costs"
            className="p-3.5 bg-slate-50 hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-300 rounded-xl transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <DollarSign size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-900">
                  ثبت هزینه جدید
                </h4>
                <p className="text-[11px] text-slate-400">ثبت دستی یا دسته‌ای هزینه</p>
              </div>
            </div>
            <ArrowUpRight size={15} className="text-slate-400 group-hover:text-emerald-600" />
          </Link>

          {/* میان‌بر Import داده */}
          <Link
            href="/performance/costs"
            className="p-3.5 bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 rounded-xl transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <UploadCloud size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-900">
                  Import داده از فایل
                </h4>
                <p className="text-[11px] text-slate-400">آپلود اکسل هزینه‌های تجمیعی</p>
              </div>
            </div>
            <ArrowUpRight size={15} className="text-slate-400 group-hover:text-blue-600" />
          </Link>

          {/* میان‌بر ساخت کمپین جدید */}
          <Link
            href="/campaigns/new"
            className="p-3.5 bg-slate-50 hover:bg-purple-50/60 border border-slate-200 hover:border-purple-300 rounded-xl transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <PlusCircle size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-purple-900">
                  ساخت کمپین (ویزارد)
                </h4>
                <p className="text-[11px] text-slate-400">فرآیند ۶ مرحله‌ای تعریف کمپین</p>
              </div>
            </div>
            <ArrowUpRight size={15} className="text-slate-400 group-hover:text-purple-600" />
          </Link>
        </div>
      </HomeWidgetCard>

      {/* ویجت ۳: کمپین‌های تحت مدیریت و درصد مصرف بودجه */}
      <HomeWidgetCard
        title="وضعیت کمپین‌های تحت مدیریت شما"
        icon={TrendingUp}
        viewAllHref="/campaigns"
        viewAllLabel="مشاهده جدول کمپین‌ها"
        isLoading={isLoading}
        error={error}
        className="col-span-12"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myCampaigns.slice(0, 6).map((c) => {
            const spentPercent = c.budget && c.spend ? Math.round((c.spend / c.budget) * 100) : 0;
            return (
              <div
                key={c.id}
                className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-slate-900 truncate">
                    {c.name}
                  </h4>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      c.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {c.status === 'active' ? 'فعال' : c.status}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>مصرف بودجه:</span>
                    <span className="font-bold text-slate-800 font-mono">%{spentPercent}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        spentPercent > 90 ? 'bg-rose-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, spentPercent)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 text-slate-500">
                  <span>لید: {c.leadsCount || 0}</span>
                  <span>CPL: {c.cpl ? `${c.cpl.toLocaleString('fa-IR')} ت` : '—'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </HomeWidgetCard>
    </div>
  );
}
