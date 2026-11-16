'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  CreditCard,
  Users,
  Target,
  Percent,
  TrendingUp,
  UserCheck,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
} from 'lucide-react';
import type { ExecutiveKpiSummary } from '../types';

export interface DashboardKpiGridProps {
  kpis: ExecutiveKpiSummary;
  campaignsCount?: number;
  activeCampaignsCount?: number;
}

export function DashboardKpiGrid({
  kpis,
  campaignsCount = 0,
  activeCampaignsCount = 0,
}: DashboardKpiGridProps) {
  const router = useRouter();

  // ۴ کارت اصلی هیرو - داده‌های ۱۰۰٪ واقعی از API و بدون هرگونه مقدار هاردکدشده فیک (D-01 & D-03)
  const heroCards = [
    {
      id: 'total-spend',
      title: 'مجموع هزینه',
      subtitle: 'کل بودجه تبلیغاتی مصرف‌شده',
      value: kpis.totalSpend > 0 ? kpis.totalSpend.toLocaleString('fa-IR') : '۰',
      unit: 'تومان',
      change: kpis.totalSpendChangePercentage,
      isLowerBetter: false,
      progress: kpis.totalSpendTargetProgress,
      progressLabel: 'از بودجه مصوب',
      icon: CreditCard,
      sortParam: 'spend',
      sortOrder: 'desc',
    },
    {
      id: 'active-campaigns',
      title: 'کمپین‌های فعال',
      subtitle: `از مجموع ${campaignsCount.toLocaleString('fa-IR')} کمپین ثبت‌شده`,
      value: activeCampaignsCount.toLocaleString('fa-IR'),
      unit: 'کمپین',
      change: null, // بدون مقایسه تا زمان پیاده‌سازی متد مقایسه تعداد کمپین در بک‌اند
      isLowerBetter: false,
      progress: campaignsCount > 0 ? Math.round((activeCampaignsCount / campaignsCount) * 100) : null,
      progressLabel: 'نرخ کمپین‌های فعال',
      icon: Layers,
      sortParam: 'spend',
      sortOrder: 'desc',
    },
    {
      id: 'total-leads',
      title: 'لیدهای جدید',
      subtitle: 'سرنخ‌های ثبت‌شده در دوره',
      value: (kpis.totalLeads !== undefined && kpis.totalLeads !== null)
        ? kpis.totalLeads.toLocaleString('fa-IR')
        : '۰',
      unit: 'لید',
      change: kpis.totalLeadsChangePercentage,
      isLowerBetter: false,
      progress: kpis.totalLeadsTargetProgress,
      progressLabel: 'از تارگت جذب',
      icon: Users,
      sortParam: 'leads',
      sortOrder: 'desc',
    },
    {
      id: 'conversion-rate',
      title: 'نرخ تبدیل لید',
      subtitle: 'نسبت لیدهای برنده به کل سرنخ‌ها',
      value: (kpis.conversionRate !== null && kpis.conversionRate !== undefined)
        ? `${kpis.conversionRate.toLocaleString('fa-IR')}٪`
        : '—',
      unit: '',
      change: kpis.conversionRateChangePercentage,
      isLowerBetter: false,
      progress: null,
      progressLabel: '',
      icon: Percent,
      sortParam: 'conversionRate',
      sortOrder: 'desc',
    },
  ];

  // ردیف شاخص‌های اقتصاد واحد (CPL, ROAS, CAC) منطبق بر سند نیازمندی‌های محصول
  const unitEconomicsCards = [
    {
      id: 'cpl',
      title: 'هزینه هر لید (CPL)',
      value: kpis.cpl !== null && kpis.cpl !== undefined ? kpis.cpl.toLocaleString('fa-IR') : '—',
      unit: kpis.cpl !== null && kpis.cpl !== undefined ? 'تومان' : '',
      change: kpis.cplChangePercentage,
      isLowerBetter: true,
      icon: Target,
      sortParam: 'cpl',
      sortOrder: 'asc',
    },
    {
      id: 'roas',
      title: 'بازگشت هزینه (ROAS)',
      value: kpis.roas !== null && kpis.roas !== undefined ? `${kpis.roas.toLocaleString('fa-IR')}x` : '—',
      unit: kpis.roas !== null && kpis.roas !== undefined ? 'برابر' : '',
      change: kpis.roasChangePercentage,
      isLowerBetter: false,
      icon: TrendingUp,
      sortParam: 'roas',
      sortOrder: 'desc',
    },
    {
      id: 'cac',
      title: 'هزینه جذب مشتری (CAC)',
      value: kpis.cac !== null && kpis.cac !== undefined ? kpis.cac.toLocaleString('fa-IR') : '—',
      unit: kpis.cac !== null && kpis.cac !== undefined ? 'تومان' : '',
      change: kpis.cacChangePercentage,
      isLowerBetter: true,
      icon: UserCheck,
      sortParam: 'cac',
      sortOrder: 'asc',
    },
  ];

  const handleCardClick = (sortParam: string, sortOrder: string) => {
    router.push(`/campaigns?sortBy=${sortParam}&sortOrder=${sortOrder}`);
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* ردیف اصلی ۴ کارت هیرو */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {heroCards.map((card) => {
          const IconComponent = card.icon;

          let isPositive = false;
          let isNegative = false;
          if (card.change !== null && card.change !== undefined) {
            if (card.isLowerBetter) {
              isPositive = card.change < 0;
              isNegative = card.change > 0;
            } else {
              isPositive = card.change > 0;
              isNegative = card.change < 0;
            }
          }

          return (
            <div
              key={card.id}
              onClick={() => handleCardClick(card.sortParam, card.sortOrder)}
              className="group relative bg-[#111D2E]/85 backdrop-blur-md rounded-2xl border border-[#1F2E45] p-5 hover:border-[#719BDF]/40 hover:shadow-[0_4px_25px_rgba(0,0,0,0.5)] transition-all cursor-pointer overflow-hidden flex flex-col justify-between"
              title={`مشاهده کمپین‌ها مرتب‌شده بر اساس ${card.title}`}
            >
              {/* خط نورانی گرادینت بالای کارت */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#719BDF]/30 to-transparent" />

              {/* هدر کارت: عنوان + آیکون */}
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5 truncate">
                  <span className="text-xs font-semibold text-slate-300 group-hover:text-slate-100 transition-colors">
                    {card.title}
                  </span>
                  <p className="text-[10px] text-slate-400 truncate">
                    {card.subtitle}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-[#18263A] border border-[#1F2E45] text-[#719BDF] flex items-center justify-center group-hover:border-[#719BDF]/40 group-hover:shadow-[0_0_12px_rgba(113,155,223,0.25)] transition-all shrink-0">
                  <IconComponent className="w-4 h-4" />
                </div>
              </div>

              {/* مقدار اصلی رقم بزرگ */}
              <div className="flex items-baseline gap-1.5 my-3">
                <span className="text-2xl sm:text-3xl font-black text-slate-100 font-display tracking-tight">
                  {card.value}
                </span>
                {card.unit && (
                  <span className="text-[11px] text-slate-400 font-medium">
                    {card.unit}
                  </span>
                )}
              </div>

              {/* فوتر کارت: بج درصد تغییر واقعی + برچسب پیشرفت واقعی */}
              <div className="flex items-center justify-between pt-2.5 border-t border-[#1F2E45]/60 text-[11px]">
                {card.change !== null && card.change !== undefined ? (
                  <span
                    className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isPositive
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : isNegative
                        ? 'bg-[#D66B73]/15 text-[#D66B73] border border-[#D66B73]/30'
                        : 'bg-[#18263A] text-slate-400 border border-[#1F2E45]'
                    }`}
                    dir="ltr"
                  >
                    {card.change > 0 ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : card.change < 0 ? (
                      <ArrowDownRight className="w-3 h-3" />
                    ) : null}
                    <span>{Math.abs(card.change).toLocaleString('fa-IR')}٪</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 font-normal">
                    بدون مقایسه
                  </span>
                )}

                {card.progress !== null && card.progress !== undefined ? (
                  <span className="text-[10px] text-slate-400 truncate">
                    {card.progress.toLocaleString('fa-IR')}٪ {card.progressLabel}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 font-mono">—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ردیف ثانویه اقتصاد واحد (CPL, ROAS, CAC) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {unitEconomicsCards.map((card) => {
          const IconComponent = card.icon;

          let isPositive = false;
          let isNegative = false;
          if (card.change !== null && card.change !== undefined) {
            if (card.isLowerBetter) {
              isPositive = card.change < 0;
              isNegative = card.change > 0;
            } else {
              isPositive = card.change > 0;
              isNegative = card.change < 0;
            }
          }

          return (
            <div
              key={card.id}
              onClick={() => handleCardClick(card.sortParam, card.sortOrder)}
              className="bg-[#111D2E]/60 backdrop-blur-sm rounded-xl border border-[#1F2E45]/80 px-4 py-3 flex items-center justify-between hover:bg-[#18263A]/70 hover:border-[#719BDF]/30 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#18263A] text-slate-300 border border-[#1F2E45] flex items-center justify-center group-hover:text-[#719BDF] transition-colors shrink-0">
                  <IconComponent className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-400 block">
                    {card.title}
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-base font-black text-slate-200 font-display">
                      {card.value}
                    </span>
                    {card.unit && (
                      <span className="text-[10px] text-slate-400">
                        {card.unit}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {card.change !== null && card.change !== undefined ? (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isPositive
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : isNegative
                      ? 'bg-[#D66B73]/15 text-[#D66B73] border border-[#D66B73]/30'
                      : 'bg-[#18263A] text-slate-400'
                  }`}
                  dir="ltr"
                >
                  {card.change > 0 ? '+' : ''}{card.change.toLocaleString('fa-IR')}٪
                </span>
              ) : (
                <span className="text-[10px] text-slate-500">—</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
