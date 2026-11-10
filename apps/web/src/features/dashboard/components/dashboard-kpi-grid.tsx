'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  DollarSign,
  Users,
  Target,
  Percent,
  TrendingUp,
  UserCheck,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
} from 'lucide-react';
import type { ExecutiveKpiSummary } from '../types';

export interface DashboardKpiGridProps {
  kpis: ExecutiveKpiSummary;
}

export function DashboardKpiGrid({ kpis }: DashboardKpiGridProps) {
  const router = useRouter();

  // ۶ کارت شاخص اصلی منطبق دقیق بر صفحه ۸ سند محصول
  const cards = [
    {
      id: 'total-spend',
      title: 'هزینه کل تبلیغات',
      value: kpis.totalSpend > 0 ? kpis.totalSpend.toLocaleString('fa-IR') : '۰',
      unit: 'تومان',
      change: kpis.totalSpendChangePercentage,
      isLowerBetter: false,
      progress: kpis.totalSpendTargetProgress,
      progressLabel: 'از بودجه مصوب',
      icon: DollarSign,
      sortParam: 'spend',
      sortOrder: 'desc',
    },
    {
      id: 'total-leads',
      title: 'تعداد کل لیدها',
      value: kpis.totalLeads > 0 ? kpis.totalLeads.toLocaleString('fa-IR') : '۰',
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
      id: 'cpl',
      title: 'هزینه هر لید (CPL)',
      value: kpis.cpl !== null ? kpis.cpl.toLocaleString('fa-IR') : '—',
      unit: kpis.cpl !== null ? 'تومان' : '',
      change: kpis.cplChangePercentage,
      isLowerBetter: true, // طبق صفحه ۵: برای CPL کاهش مثبت و افزایش منفی است
      icon: Target,
      sortParam: 'cpl',
      sortOrder: 'asc',
    },
    {
      id: 'conversion-rate',
      title: 'نرخ تبدیل کل',
      value: kpis.conversionRate !== null ? `${kpis.conversionRate.toLocaleString('fa-IR')}٪` : '—',
      unit: '',
      change: kpis.conversionRateChangePercentage,
      isLowerBetter: false,
      icon: Percent,
      sortParam: 'conversionRate',
      sortOrder: 'desc',
    },
    {
      id: 'roas',
      title: 'بازگشت هزینه (ROAS)',
      value: kpis.roas !== null ? `${kpis.roas.toLocaleString('fa-IR')}x` : '—',
      unit: kpis.roas !== null ? 'برابر' : '',
      change: kpis.roasChangePercentage,
      isLowerBetter: false,
      icon: TrendingUp,
      sortParam: 'roas',
      sortOrder: 'desc',
    },
    {
      id: 'cac',
      title: 'هزینه جذب مشتری (CAC)',
      value: kpis.cac !== null ? kpis.cac.toLocaleString('fa-IR') : '—',
      unit: kpis.cac !== null ? 'تومان' : '',
      change: kpis.cacChangePercentage,
      isLowerBetter: true, // طبق صفحه ۵: برای CAC کاهش مثبت و افزایش منفی است
      icon: UserCheck,
      sortParam: 'cac',
      sortOrder: 'asc',
    },
  ];

  const handleCardClick = (sortParam: string, sortOrder: string) => {
    // تعامل صفحه ۸: کلیک روی کارت: رفتن به لیست کمپین‌ها مرتب‌شده بر همان شاخص
    router.push(`/campaigns?sortBy=${sortParam}&sortOrder=${sortOrder}`);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5" dir="rtl">
      {cards.map((card) => {
        const IconComponent = card.icon;

        // محاسبه جهت و رنگ درصد تغییر (قاعده صفحه ۵: شاخص «کمتر بهتر»)
        let isPositiveChange = false;
        let isNegativeChange = false;
        if (card.change !== null && card.change !== undefined) {
          if (card.isLowerBetter) {
            isPositiveChange = card.change < 0; // کاهش برای CPL/CAC مثبت است
            isNegativeChange = card.change > 0;
          } else {
            isPositiveChange = card.change > 0;
            isNegativeChange = card.change < 0;
          }
        }

        return (
          <div
            key={card.id}
            onClick={() => handleCardClick(card.sortParam, card.sortOrder)}
            className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-blue-300 hover:ring-1 hover:ring-blue-100 transition-all flex flex-col justify-between group cursor-pointer"
            title={`مشاهده کمپین‌ها مرتب‌شده بر اساس ${card.title}`}
          >
            {/* هدر کارت */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-600 truncate">
                {card.title}
              </span>
              <div className="w-7 h-7 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center border border-slate-100 group-hover:scale-105 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all shrink-0">
                <IconComponent className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* مقدار اصلی */}
            <div className="flex items-baseline gap-1 pt-3 pb-2">
              <span className="text-xl font-black text-slate-900 tracking-tight">
                {card.value}
              </span>
              {card.unit && (
                <span className="text-[11px] text-slate-400 font-medium">
                  {card.unit}
                </span>
              )}
            </div>

            {/* درصد تغییر نسبت به دوره قبل و پیشرفت هدف (صفحه ۸) */}
            <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100/90">
              {card.change !== null && card.change !== undefined ? (
                <span
                  className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                    isPositiveChange
                      ? 'bg-emerald-50 text-emerald-700'
                      : isNegativeChange
                      ? 'bg-rose-50 text-rose-700'
                      : 'bg-slate-50 text-slate-600'
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
                <span className="text-[10px] text-slate-400">بدون مقایسه</span>
              )}

              {card.progress !== null && card.progress !== undefined ? (
                <span className="text-[10px] text-slate-500 font-medium truncate">
                  {card.progress.toLocaleString('fa-IR')}٪ {card.progressLabel}
                </span>
              ) : (
                <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-blue-500 transition-colors" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
