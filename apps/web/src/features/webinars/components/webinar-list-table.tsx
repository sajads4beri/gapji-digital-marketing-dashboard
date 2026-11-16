'use client';

import React from 'react';
import Link from 'next/link';
import { WebinarListItem, WebinarStatus } from '../types';
import { Video, ArrowLeft, Calendar, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface WebinarListTableProps {
  items: WebinarListItem[];
  isLoading: boolean;
  onOpenCreate: () => void;
}

export function WebinarListTable({ items, isLoading, onOpenCreate }: WebinarListTableProps) {
  const renderStatusBadge = (status: WebinarStatus) => {
    switch (status) {
      case 'draft':
        return (
          <Badge variant="outline" className="bg-[#18263A] text-slate-300 border-[#1F2E45]">
            پیش‌نویس
          </Badge>
        );
      case 'scheduled':
        return (
          <Badge className="bg-[#719BDF]/15 text-[#719BDF] border border-[#719BDF]/30">
            زمان‌بندی‌شده
          </Badge>
        );
      case 'live':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse">
            در حال برگزاری (Live)
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-purple-500/10 text-purple-300 border border-purple-500/20">
            پایان‌یافته
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-rose-500/10 text-rose-300 border border-rose-500/20">
            لغوشده
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="w-full bg-[#111D2E]/80 backdrop-blur-md rounded-2xl border border-[#1F2E45] p-8 text-center shadow-xl shadow-black/20">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#719BDF]"></div>
        <p className="mt-2 text-sm text-slate-400">در حال بارگذاری فهرست وبینارها...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="w-full bg-[#111D2E]/80 backdrop-blur-md rounded-2xl border border-[#1F2E45] p-12 text-center shadow-xl shadow-black/20">
        <div className="w-16 h-16 mx-auto mb-4 bg-[#18263A] border border-[#1F2E45] text-[#719BDF] rounded-2xl flex items-center justify-center shadow-lg shadow-black/20">
          <Video className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-white mb-1">هیچ وبیناری تعریف نشده است</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
          با تعریف وبینار جدید، می‌توانید مراحل ثبت‌نام، پیگیری حضور، اتصال تجهیزات و تسک‌ها و در نهایت تبدیل حاضران به لید را مدیریت نمایید.
        </p>
        <Button onClick={onOpenCreate} className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-md shadow-blue-900/30">
          <Sparkles className="w-4 h-4 me-2" />
          تعریف وبینار جدید
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
              <th className="py-3.5 px-4 font-semibold">عنوان و مدرس</th>
              <th className="py-3.5 px-4 font-semibold">تاریخ برگزاری</th>
              <th className="py-3.5 px-4 text-center font-semibold">وضعیت</th>
              <th className="py-3.5 px-4 text-center font-semibold">ثبت‌نام</th>
              <th className="py-3.5 px-4 text-center font-semibold">حاضر</th>
              <th className="py-3.5 px-4 font-semibold">کمپین مرتبط</th>
              <th className="py-3.5 px-4 text-center font-semibold">اقدامات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1F2E45]/40 text-slate-300">
            {items.map((w) => {
              const dateStr = new Date(w.webinarDate).toLocaleDateString('fa-IR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              });

              return (
                <tr key={w.id} className="hover:bg-[#18263A]/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-white text-xs">{w.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      مدرس: {w.presenterName} | پلتفرم: {w.platform}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 tabular-nums">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{dateStr}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 tabular-nums">{w.durationMinutes} دقیقه</div>
                  </td>
                  <td className="py-3.5 px-4 text-center">{renderStatusBadge(w.status)}</td>
                  <td className="py-3.5 px-4 text-center font-bold tabular-nums text-white">
                    {w.registeredCount.toLocaleString('fa-IR')}
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold tabular-nums text-emerald-400">
                    {w.attendedCount.toLocaleString('fa-IR')}
                  </td>
                  <td className="py-3.5 px-4">
                    {w.campaignName ? (
                      <Badge variant="outline" className="bg-[#18263A] text-slate-300 border-[#1F2E45]">
                        {w.campaignName}
                      </Badge>
                    ) : (
                      <span className="text-[11px] text-slate-500">بدون کمپین</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <Link
                      href={`/leads/webinars/${w.id}`}
                      className="inline-flex items-center justify-center text-xs font-medium text-[#719BDF] hover:text-[#93B5F5] hover:bg-[#18263A] px-2.5 py-1.5 rounded-lg transition-colors border border-transparent hover:border-[#1F2E45]"
                    >
                      مدیریت و ۴ تب
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
