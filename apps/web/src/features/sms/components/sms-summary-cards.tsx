'use client';

import React from 'react';
import { SmsSummaryMetrics } from '../types';
import { Send, CheckCircle2, XCircle, MessageSquare, Coins, Calculator } from 'lucide-react';

interface SmsSummaryCardsProps {
  summary: SmsSummaryMetrics;
}

export function SmsSummaryCards({ summary }: SmsSummaryCardsProps) {
  const deliveryRate =
    summary.totalCount > 0 ? Math.round((summary.deliveredCount / summary.totalCount) * 100) : 0;
  const failureRate =
    summary.totalCount > 0 ? Math.round((summary.failedCount / summary.totalCount) * 100) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
      {/* 1. کل ارسال */}
      <div className="bg-[#111D2E]/80 backdrop-blur-md p-4 rounded-2xl border border-[#1F2E45] shadow-xl shadow-black/20">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium">تعداد کل</span>
          <Send className="w-4 h-4 text-[#719BDF]" />
        </div>
        <div className="text-xl font-bold tabular-nums text-white">
          {summary.totalCount.toLocaleString('fa-IR')}
        </div>
        <div className="text-[11px] text-slate-500 mt-1">شماره مخاطب</div>
      </div>

      {/* 2. تحویل‌شده */}
      <div className="bg-[#111D2E]/80 backdrop-blur-md p-4 rounded-2xl border border-[#1F2E45] shadow-xl shadow-black/20">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium">تحویل‌شده</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="text-xl font-bold tabular-nums text-emerald-400">
          {summary.deliveredCount.toLocaleString('fa-IR')}
        </div>
        <div className="text-[11px] text-emerald-400/80 mt-1 tabular-nums">
          {deliveryRate.toLocaleString('fa-IR')}٪ نرخ تحویل
        </div>
      </div>

      {/* 3. ناموفق */}
      <div className="bg-[#111D2E]/80 backdrop-blur-md p-4 rounded-2xl border border-[#1F2E45] shadow-xl shadow-black/20">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium">ناموفق</span>
          <XCircle className="w-4 h-4 text-rose-400" />
        </div>
        <div className="text-xl font-bold tabular-nums text-rose-400">
          {summary.failedCount.toLocaleString('fa-IR')}
        </div>
        <div className="text-[11px] text-rose-400/80 mt-1 tabular-nums">
          {failureRate.toLocaleString('fa-IR')}٪ خطا در تحویل
        </div>
      </div>

      {/* 4. پاسخ‌ها */}
      <div className="bg-[#111D2E]/80 backdrop-blur-md p-4 rounded-2xl border border-[#1F2E45] shadow-xl shadow-black/20">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium">پاسخ دریافتی</span>
          <MessageSquare className="w-4 h-4 text-amber-400" />
        </div>
        <div className="text-xl font-bold tabular-nums text-amber-400">
          {summary.repliesCount.toLocaleString('fa-IR')}
        </div>
        <div className="text-[11px] text-slate-500 mt-1">
          {summary.convertedLeadsCount > 0 ? (
            <span className="text-emerald-400 font-medium tabular-nums">
              {summary.convertedLeadsCount.toLocaleString('fa-IR')} لید ساخته‌شده
            </span>
          ) : (
            'آماده تبدیل به لید'
          )}
        </div>
      </div>

      {/* 5. هزینه کل */}
      <div className="bg-[#111D2E]/80 backdrop-blur-md p-4 rounded-2xl border border-[#1F2E45] shadow-xl shadow-black/20">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium">هزینه کل</span>
          <Coins className="w-4 h-4 text-indigo-400" />
        </div>
        <div className="text-lg font-bold tabular-nums text-white">
          {summary.costAmount.toLocaleString('fa-IR')}
        </div>
        <div className="text-[11px] text-slate-500 mt-1">تومان</div>
      </div>

      {/* 6. هزینه هر پیامک */}
      <div className="bg-[#111D2E]/80 backdrop-blur-md p-4 rounded-2xl border border-[#1F2E45] shadow-xl shadow-black/20">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium">هزینه هر پیامک</span>
          <Calculator className="w-4 h-4 text-purple-400" />
        </div>
        <div className="text-lg font-bold tabular-nums text-purple-300">
          {summary.unitCost.toLocaleString('fa-IR')}
        </div>
        <div className="text-[11px] text-slate-500 mt-1">تومان / پیامک</div>
      </div>
    </div>
  );
}
