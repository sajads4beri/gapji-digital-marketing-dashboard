'use client';

import * as React from 'react';
import { DollarSign, Target, Clock, Layers } from 'lucide-react';
import { KpiCard } from '@/components/common/kpi-card';
import { formatMoneyDisplay } from '@/components/ui/money-input';
import { CostStatsSummary } from '../types';

export interface CostSummaryBarProps {
  stats: CostStatsSummary | null;
  isLoading?: boolean;
  onCardClick?: (key: 'total' | 'direct' | 'pending' | 'count') => void;
  className?: string;
}

export function CostSummaryBar({
  stats,
  isLoading = false,
  onCardClick,
  className = '',
}: CostSummaryBarProps) {
  if (isLoading || !stats) {
    return (
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}
        dir="rtl"
        aria-busy="true"
        aria-label="در حال بارگذاری آمار هزینه‌ها"
      >
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-[#111D2E]/80 backdrop-blur-md p-6 rounded-2xl border border-[#1F2E45] shadow-xl animate-pulse space-y-4"
          >
            <div className="flex justify-between items-center">
              <div className="h-4 bg-[#18263A] rounded w-24" />
              <div className="w-10 h-10 bg-[#18263A] rounded-xl" />
            </div>
            <div className="h-8 bg-[#18263A] rounded w-36" />
            <div className="h-4 bg-[#18263A] rounded w-28" />
          </div>
        ))}
      </div>
    );
  }

  // محاسبه سهم هزینه رسانه از کل
  const directAdSharePercent =
    stats.totalSpendToman > 0
      ? Math.round((stats.directAdSpendToman / stats.totalSpendToman) * 100)
      : 0;

  const pendingSpend = (stats.pendingInvoicesAmountToman || 0) + (stats.draftSpendToman || 0);
  const totalCount = (stats as any).totalCount ?? (stats.spendByCampaign ? stats.spendByCampaign.reduce((sum, c) => sum + (c.count || 0), 0) : 0);

  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}
      dir="rtl"
    >
      {/* ۱. مجموع هزینه‌های قطعی */}
      <div
        onClick={() => onCardClick?.('total')}
        className={onCardClick ? 'cursor-pointer' : ''}
      >
        <KpiCard
          title="مجموع هزینه‌های قطعی"
          value={
            <span className="flex items-baseline gap-1 font-display">
              <span>{formatMoneyDisplay(stats.totalSpendToman) || '۰'}</span>
              <span className="text-xs font-normal text-slate-400">تومان</span>
            </span>
          }
          subtitle="مجموع مصارف پرداخت‌شده و تعهدشده"
          change={
            stats.monthOverMonthChangePercent !== 0
              ? {
                  value: `${Math.abs(stats.monthOverMonthChangePercent)}٪`,
                  type: stats.monthOverMonthChangePercent > 0 ? 'negative' : 'positive',
                  label: 'نسبت به ماه قبل',
                }
              : undefined
          }
          icon={<DollarSign className="w-5 h-5" />}
          color="text-[#719BDF]"
        />
      </div>

      {/* ۲. هزینه رسانه‌ای مستقیم */}
      <div
        onClick={() => onCardClick?.('direct')}
        className={onCardClick ? 'cursor-pointer' : ''}
      >
        <KpiCard
          title="هزینه رسانه‌ای مستقیم"
          value={
            <span className="flex items-baseline gap-1 font-display">
              <span>{formatMoneyDisplay(stats.directAdSpendToman) || '۰'}</span>
              <span className="text-xs font-normal text-slate-400">تومان</span>
            </span>
          }
          subtitle="تبلیغات گوگل ادز، متا، پیامک و کلیکی"
          change={{
            value: `${directAdSharePercent}٪ از کل`,
            type: 'neutral',
            label: 'سهم هزینه مدیا',
          }}
          icon={<Target className="w-5 h-5" />}
          color="text-indigo-400"
        />
      </div>

      {/* ۳. هزینه‌های در انتظار پرداخت */}
      <div
        onClick={() => onCardClick?.('pending')}
        className={onCardClick ? 'cursor-pointer' : ''}
      >
        <KpiCard
          title="در انتظار تسویه / پیش‌نویس"
          value={
            <span className="flex items-baseline gap-1 font-display">
              <span>{formatMoneyDisplay(pendingSpend) || '۰'}</span>
              <span className="text-xs font-normal text-slate-400">تومان</span>
            </span>
          }
          subtitle="فاکتورهای تاییدشده در صف تسویه مالی"
          change={
            pendingSpend > 0
              ? {
                  value: 'نیازمند اقدام',
                  type: 'negative',
                }
              : {
                  value: 'تسویه کامل',
                  type: 'positive',
                }
          }
          icon={<Clock className="w-5 h-5" />}
          color="text-amber-400"
        />
      </div>

      {/* ۴. تعداد کل تراکنش‌ها */}
      <div
        onClick={() => onCardClick?.('count')}
        className={onCardClick ? 'cursor-pointer' : ''}
      >
        <KpiCard
          title="تعداد اسناد و تراکنش‌ها"
          value={<span className="font-display">{totalCount.toLocaleString('fa-IR')} ردیف</span>}
          subtitle="کل اسناد مالی بازاریابی ثبت‌شده"
          icon={<Layers className="w-5 h-5" />}
          color="text-teal-400"
        />
      </div>
    </div>
  );
}
