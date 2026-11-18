'use client';

import React from 'react';
import { SmsRecipientItem, SmsDeliveryStatus } from '../types';
import { CheckCircle2, XCircle, Clock, MessageSquare, UserCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SmsRecipientsTableProps {
  items: SmsRecipientItem[];
  isLoading: boolean;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  searchTerm: string;
  onSearchChange: (search: string) => void;
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
}

export function SmsRecipientsTable({
  items,
  isLoading,
  activeFilter,
  onFilterChange,
  searchTerm,
  onSearchChange,
  page,
  totalPages,
  onPageChange,
}: SmsRecipientsTableProps) {
  const filterTabs = [
    { key: 'all', label: 'همه شماره‌ها' },
    { key: 'delivered', label: 'تحویل‌شده' },
    { key: 'failed', label: 'ناموفق' },
    { key: 'pending', label: 'در انتظار' },
    { key: 'replied', label: 'پاسخ‌داده‌شده' },
  ];

  const renderStatusBadge = (status: SmsDeliveryStatus) => {
    switch (status) {
      case 'delivered':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3 me-1" />
            تحویل شد
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-rose-500/10 text-rose-300 border-rose-500/20">
            <XCircle className="w-3 h-3 me-1" />
            ناموفق
          </Badge>
        );
      case 'pending':
      default:
        return (
          <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/20">
            <Clock className="w-3 h-3 me-1" />
            در انتظار
          </Badge>
        );
    }
  };

  return (
    <div className="bg-[#111D2E]/80 backdrop-blur-md rounded-2xl border border-[#1F2E45] shadow-xl shadow-black/20 overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-[#1F2E45] flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onFilterChange(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap border ${
                activeFilter === tab.key
                  ? 'bg-[#2563EB] text-white border-blue-500/40 shadow-sm'
                  : 'bg-[#18263A] text-slate-300 border-[#1F2E45] hover:bg-[#1F2E45] hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="w-full sm:w-64">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="جستجوی شماره یا پاسخ..."
            className="w-full h-9 px-3 bg-[#0B1423] border border-[#1F2E45] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#719BDF]"
          />
        </div>
      </div>

      {/* Table Content */}
      {isLoading ? (
        <div className="p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#719BDF]"></div>
          <p className="mt-2 text-xs text-slate-400">در حال بارگذاری شماره‌ها...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-xs">
          هیچ شماره‌ای با شرایط انتخابی یافت نشد.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#0B1423]/60 border-b border-[#1F2E45] text-slate-400 font-medium">
              <tr>
                <th className="py-3.5 px-4 font-semibold">شماره تلفن (ماسک‌شده)</th>
                <th className="py-3.5 px-4 text-center font-semibold">وضعیت ارسال</th>
                <th className="py-3.5 px-4 font-semibold">زمان تحویل</th>
                <th className="py-3.5 px-4 font-semibold">پاسخ دریافتی</th>
                <th className="py-3.5 px-4 font-semibold">زمان پاسخ</th>
                <th className="py-3.5 px-4 text-center font-semibold">تبدیل به لید</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2E45]/40 text-slate-300">
              {items.map((r) => {
                const deliveredDate = r.deliveredAt
                  ? new Date(r.deliveredAt).toLocaleString('fa-IR', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })
                  : '-';
                const repliedDate = r.repliedAt
                  ? new Date(r.repliedAt).toLocaleString('fa-IR', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })
                  : '-';

                return (
                  <tr key={r.id} className="hover:bg-[#18263A]/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-200 whitespace-nowrap">
                      {r.mobileMasked}
                    </td>
                    <td className="py-3.5 px-4 text-center">{renderStatusBadge(r.status)}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-400 whitespace-nowrap tabular-nums">
                      {deliveredDate}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      {r.replyText ? (
                        <div className="inline-flex items-center text-xs bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-1 rounded-lg font-medium">
                          <MessageSquare className="w-3 h-3 me-1.5 text-amber-400 flex-shrink-0" />
                          <span className="truncate">{r.replyText}</span>
                        </div>
                      ) : (
                        <span className="text-slate-600 text-xs">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400 whitespace-nowrap tabular-nums">
                      {repliedDate}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {r.convertedLeadId ? (
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                          <UserCheck className="w-3 h-3 me-1" />
                          لید شد
                        </Badge>
                      ) : (
                        <span className="text-slate-600 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-3 border-t border-[#1F2E45] flex items-center justify-between text-xs text-slate-400">
          <div className="tabular-nums">
            صفحه {page.toLocaleString('fa-IR')} از {totalPages.toLocaleString('fa-IR')}
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="px-2.5 py-1 border border-[#1F2E45] bg-[#18263A] rounded-lg hover:bg-[#1F2E45] hover:text-white disabled:opacity-40 transition-colors"
            >
              قبلی
            </button>
            <button
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="px-2.5 py-1 border border-[#1F2E45] bg-[#18263A] rounded-lg hover:bg-[#1F2E45] hover:text-white disabled:opacity-40 transition-colors"
            >
              بعدی
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
