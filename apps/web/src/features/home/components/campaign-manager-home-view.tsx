'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Layers,
  DollarSign,
  UploadCloud,
  PlusCircle,
  AlertCircle,
  TrendingUp,
  ArrowUpRight,
} from 'lucide-react';
import { HomeWidgetCard } from './home-widget-card';
import { campaignService } from '@/features/campaigns/api';
import type { ExtendedCampaign } from '@/features/campaigns/types';
import { costService } from '@/features/costs';

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
      <div className="col-span-12 p-4 sm:p-5 bg-gradient-to-r from-[#111D2E] to-[#18263A] border border-[#1F2E45] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)] shrink-0">
            <Layers size={20} />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-white font-display">
              پیشخوان عملیاتی کمپین‌چی (Campaign Manager)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              مدیریت ثبت روزانه هزینه‌ها، پایش بودجه مصرفی و ایمپورت داده‌های کانال‌ها
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/campaigns/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-md shadow-emerald-900/30"
          >
            <PlusCircle size={15} />
            <span>کمپین جدید (ویزارد)</span>
          </Link>
          <Link
            href="/performance/costs"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-300 bg-[#0B1423] border border-[#1F2E45] hover:text-white hover:bg-[#18263A] rounded-xl transition-colors"
          >
            <DollarSign size={14} className="text-emerald-400" />
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
              className="p-3.5 bg-[#0B1423] border border-amber-500/25 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs text-white">
                    {c.name}
                  </span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/25">
                    فعال
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-400 font-display">
                  <span>کانال: {c.channel || 'تبلیغات آنلاین'}</span>
                  <span>
                    بودجه مصوب: {c.budget ? `${(c.budget / 1000000).toLocaleString('fa-IR')} م.ت` : '—'}
                  </span>
                </div>
              </div>

              <Link
                href="/performance/costs"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/25 hover:bg-amber-500/20 rounded-xl transition-colors shrink-0"
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
            className="p-3.5 bg-[#0B1423] hover:bg-[#18263A]/70 border border-[#1F2E45] hover:border-emerald-500/40 rounded-xl transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold">
                <DollarSign size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                  ثبت هزینه جدید
                </h4>
                <p className="text-[11px] text-slate-400">ثبت دستی یا دسته‌ای هزینه</p>
              </div>
            </div>
            <ArrowUpRight size={15} className="text-slate-500 group-hover:text-emerald-400 transition-colors" />
          </Link>

          {/* میان‌بر Import داده */}
          <Link
            href="/performance/imports"
            className="p-3.5 bg-[#0B1423] hover:bg-[#18263A]/70 border border-[#1F2E45] hover:border-[#719BDF]/40 rounded-xl transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#719BDF]/10 text-[#719BDF] border border-[#719BDF]/20 flex items-center justify-center font-bold">
                <UploadCloud size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-[#719BDF] transition-colors">
                  Import داده از فایل
                </h4>
                <p className="text-[11px] text-slate-400">آپلود اکسل هزینه‌های تجمیعی</p>
              </div>
            </div>
            <ArrowUpRight size={15} className="text-slate-500 group-hover:text-[#719BDF] transition-colors" />
          </Link>

          {/* میان‌بر ساخت کمپین جدید */}
          <Link
            href="/campaigns/new"
            className="p-3.5 bg-[#0B1423] hover:bg-[#18263A]/70 border border-[#1F2E45] hover:border-purple-500/40 rounded-xl transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center font-bold">
                <PlusCircle size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                  ساخت کمپین (ویزارد)
                </h4>
                <p className="text-[11px] text-slate-400">فرآیند ۶ مرحله‌ای تعریف کمپین</p>
              </div>
            </div>
            <ArrowUpRight size={15} className="text-slate-500 group-hover:text-purple-400 transition-colors" />
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
                className="p-4 bg-[#0B1423] border border-[#1F2E45] rounded-xl space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-white truncate font-display">
                    {c.name}
                  </h4>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      c.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                        : 'bg-[#18263A] text-slate-400 border-[#1F2E45]'
                    }`}
                  >
                    {c.status === 'active' ? 'فعال' : c.status}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400 font-display">
                    <span>مصرف بودجه:</span>
                    <span className="font-bold text-slate-200">%{spentPercent}</span>
                  </div>
                  <div className="w-full bg-[#18263A] h-2 rounded-full overflow-hidden border border-[#1F2E45]/40">
                    <div
                      className={`h-full rounded-full ${
                        spentPercent > 90 ? 'bg-rose-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, spentPercent)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-[#1F2E45] text-slate-400 font-display">
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
