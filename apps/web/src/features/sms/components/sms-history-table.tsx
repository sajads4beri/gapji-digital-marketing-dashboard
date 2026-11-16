'use client';

import React from 'react';
import Link from 'next/link';
import { SmsCampaignListItem } from '../types';
import { ArrowLeft, MessageSquare, Send, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface SmsHistoryTableProps {
  items: SmsCampaignListItem[];
  isLoading: boolean;
  onOpenCreate: () => void;
}

export function SmsHistoryTable({ items, isLoading, onOpenCreate }: SmsHistoryTableProps) {
  if (isLoading) {
    return (
      <div className="w-full bg-[#111D2E]/80 backdrop-blur-md rounded-2xl border border-[#1F2E45] p-8 text-center shadow-xl shadow-black/20">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#719BDF]"></div>
        <p className="mt-2 text-sm text-slate-400">در حال بارگذاری تاریخچه ارسال پیامک...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="w-full bg-[#111D2E]/80 backdrop-blur-md rounded-2xl border border-[#1F2E45] p-12 text-center shadow-xl shadow-black/20">
        <div className="w-16 h-16 mx-auto mb-4 bg-[#18263A] border border-[#1F2E45] text-[#719BDF] rounded-2xl flex items-center justify-center shadow-lg shadow-black/20">
          <MessageSquare className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-white mb-1">هیچ پیامکی ارسال نشده است</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
          شما می‌توانید از طریق ایجاد کمپین پیامکی جدید یا ایمپورت نتایج ارسال‌های قبلی، گزارش و آمار تحویل را مشاهده نمایید.
        </p>
        <Button onClick={onOpenCreate} className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-md shadow-blue-900/30">
          <Send className="w-4 h-4 me-2" />
          ارسال یا ثبت پیامک جدید
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#1F2E45] bg-[#111D2E]/80 backdrop-blur-md shadow-xl shadow-black/20">
      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead className="bg-[#0B1423]/60 border-b border-[#1F2E45] text-slate-400 font-medium">
            <tr>
              <th className="py-3.5 px-4 font-semibold">تاریخ ارسال</th>
              <th className="py-3.5 px-4 font-semibold">عنوان و خط</th>
              <th className="py-3.5 px-4 font-semibold">کمپین مرتبط</th>
              <th className="py-3.5 px-4 font-semibold">متن پیامک</th>
              <th className="py-3.5 px-4 text-center font-semibold">تعداد ارسال</th>
              <th className="py-3.5 px-4 text-center font-semibold">تحویل‌شده</th>
              <th className="py-3.5 px-4 text-left font-semibold">هزینه (تومان)</th>
              <th className="py-3.5 px-4 text-center font-semibold">اقدامات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1F2E45]/40 text-slate-300">
            {items.map((item) => {
              const dateStr = item.sentAt || item.createdAt;
              const formattedDate = new Date(dateStr).toLocaleDateString('fa-IR');

              return (
                <tr key={item.id} className="hover:bg-[#18263A]/50 transition-colors">
                  <td className="py-3.5 px-4 font-medium text-slate-300 whitespace-nowrap tabular-nums">
                    {formattedDate}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-white">{item.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5" dir="ltr">
                      سرشماره: {item.senderNumber}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    {item.campaignName ? (
                      <Badge variant="outline" className="bg-[#18263A] text-slate-300 border-[#1F2E45]">
                        {item.campaignName}
                      </Badge>
                    ) : (
                      <span className="text-[11px] text-slate-500">بدون کمپین</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 max-w-xs truncate text-slate-400" title={item.messageText}>
                    {item.messagePreview}
                  </td>
                  <td className="py-3.5 px-4 text-center tabular-nums font-bold text-white">
                    {item.recipientCount.toLocaleString('fa-IR')}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center text-emerald-400 tabular-nums font-bold">
                      <CheckCircle className="w-3.5 h-3.5 me-1 inline text-emerald-400" />
                      {item.deliveredCount.toLocaleString('fa-IR')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-left tabular-nums font-medium text-slate-200">
                    {item.costAmount.toLocaleString('fa-IR')}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <Link
                      href={`/leads/sms/${item.id}`}
                      className="inline-flex items-center justify-center text-xs font-medium text-[#719BDF] hover:text-[#93B5F5] hover:bg-[#18263A] px-2.5 py-1.5 rounded-lg transition-colors border border-transparent hover:border-[#1F2E45]"
                    >
                      جزئیات و خروجی
                      <ArrowLeft className="w-3.5 h-3.5 ms-1" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
