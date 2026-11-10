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
            className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm animate-pulse space-y-4"
          >
            <div className="flex justify-between items-center">
              <div className="h-4 bg-gray-200 rounded w-24" />
              <div className="w-10 h-10 bg-gray-100 rounded-xl" />
            </div>
            <div className="h-8 bg-gray-200 rounded w-36" />
            <div className="h-4 bg-gray-100 rounded w-28" />
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
            <span className="flex items-baseline gap-1">
              <span>{formatMoneyDisplay(stats.totalSpendToman) || '۰'}</span>
              <span className="text-xs font-normal text-gray-500">تومان</span>
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
          color="text-blue-600"
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
            <span className="flex items-baseline gap-1">
              <span>{formatMoneyDisplay(stats.directAdSpendToman) || '۰'}</span>
              <span className="text-xs font-normal text-gray-500">تومان</span>
            </span>
          }
          subtitle="تبلیغات گوگل ادز، متا، پیامک و کلیکی"
          change={{
            value: `${directAdSharePercent}٪`,
            type: 'neutral',
            label: 'سهم از کل بودجه',
          }}
          icon={<Target className="w-5 h-5" />}
          color="text-indigo-600"
        />
      </div>

      {/* ۳. هزینه‌های در انتظار پرداخت */}
      <div
        onClick={() => onCardClick?.('pending')}
        className={onCardClick ? 'cursor-pointer' : ''}
      >
        <KpiCard
          title="فاکتورهای در انتظار پرداخت"
          value={
            <span className="flex items-baseline gap-1">
              <span>{formatMoneyDisplay(stats.pendingInvoicesAmountToman) || '۰'}</span>
              <span className="text-xs font-normal text-gray-500">تومان</span>
            </span>
          }
          subtitle="مبالغ معوق و تسویه‌نشده مجریان"
          change={
            stats.pendingInvoicesAmountToman > 0
              ? {
                  value: 'نیازمند تسویه',
                  type: 'negative',
                }
              : {
                  value: 'تسویه کامل',
                  type: 'positive',
                }
          }
          icon={<Clock className="w-5 h-5" />}
          color="text-amber-600"
        />
      </div>

      {/* ۴. تعداد کل رکوردهای هزینه */}
      <div
        onClick={() => onCardClick?.('count')}
        className={onCardClick ? 'cursor-pointer' : ''}
      >
        <KpiCard
          title="تعداد رکوردهای هزینه"
          value={
            <span className="flex items-baseline gap-1">
              <span>{stats.totalItemsCount.toLocaleString('fa-IR')}</span>
              <span className="text-xs font-normal text-gray-500">ردیف</span>
            </span>
          }
          subtitle="کل اسناد مالی و پیش‌نویس‌ها"
          change={
            stats.draftSpendToman > 0
              ? {
                  value: `${formatMoneyDisplay(stats.draftSpendToman)} ت`,
                  type: 'neutral',
                  label: 'پیش‌نویس‌ها',
                }
              : undefined
          }
          icon={<Layers className="w-5 h-5" />}
          color="text-emerald-600"
        />
      </div>
    </div>
  );
}
