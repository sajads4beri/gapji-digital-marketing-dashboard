'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  X,
  Search,
  Download,
  Users,
  ExternalLink,
  Phone,
  User,
  Calendar,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { campaignService } from '../api';
import type { CampaignFunnelStage, CampaignStageLead } from '../types';
import { formatPersianDate } from '../utils/persian-date';
import { useToast } from '@/components/common/toast-provider';

export interface CampaignStageLeadsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string;
  campaignName: string;
  stage: CampaignFunnelStage | null;
}

export function CampaignStageLeadsDrawer({
  isOpen,
  onClose,
  campaignId,
  campaignName,
  stage,
}: CampaignStageLeadsDrawerProps) {
  const { toast } = useToast();
  const [leads, setLeads] = useState<CampaignStageLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // واکشی لیدهای این مرحله از سرور
  const fetchLeads = useCallback(async () => {
    if (!isOpen || !campaignId || !stage) return;
    setLoading(true);
    setError(null);
    try {
      const data = await campaignService.getLeadsByStage(campaignId, {
        statusConfigId: stage.id,
        statusKey: stage.key,
        search: searchQuery.trim() || undefined,
      });
      setLeads(data || []);
    } catch (err: any) {
      console.error('Error fetching stage leads:', err);
      setError(err?.message || 'خطا در بارگذاری سرنخ‌های این مرحله.');
    } finally {
      setLoading(false);
    }
  }, [isOpen, campaignId, stage, searchQuery]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // ریست کردن جستجو هنگام باز و بسته شدن
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setLeads([]);
    }
  }, [isOpen]);

  // بستن با کلید Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // خروجی اکسل با انکودینگ UTF-8 BOM جهت پشتیبانی کامل از کاراکترهای فارسی
  const handleExportCsv = () => {
    if (leads.length === 0) {
      toast.warning('سرنخی برای خروجی اکسل وجود ندارد.');
      return;
    }

    const headers = ['نام و نام خانوادگی', 'شماره موبایل', 'ایمیل', 'وضعیت', 'کارشناس مسئول', 'تاریخ ثبت'];
    const rows = leads.map((l) => [
      `"${l.fullName || ''}"`,
      `"${l.mobile || ''}"`,
      `"${l.email || ''}"`,
      `"${l.statusLabel || stage?.label || ''}"`,
      `"${l.assignedTo?.fullName || 'تخصیص‌نیافته'}"`,
      `"${formatPersianDate(l.createdAt)}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const sanitizedTitle = (campaignName || 'campaign').replace(/[/\\?%*:|"<>]/g, '-');
    const stageTitle = (stage?.label || 'stage').replace(/[/\\?%*:|"<>]/g, '-');
    link.download = `leads-${sanitizedTitle}-${stageTitle}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('فایل خروجی اکسل با موفقیت دانلود شد.');
  };

  if (!isOpen || !stage) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" dir="rtl">
      {/* بک‌دراپ تاریک */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* پنل کشویی از سمت راست */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 pointer-events-auto">
        <div className="w-screen max-w-2xl bg-[#0B1423] border-l border-[#1F2E45] shadow-2xl flex flex-col text-slate-100 animate-in slide-in-from-right duration-300">
          
          {/* هدر کشو */}
          <div className="p-6 border-b border-[#1F2E45] bg-[#111D2E]/90 flex items-center justify-between shrink-0">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-3.5 h-3.5 rounded-full ring-2 ring-white/10 shrink-0"
                  style={{ backgroundColor: stage.color || '#3B82F6' }}
                />
                <h2 className="text-lg font-bold text-slate-100 font-display">
                  سرنخ‌های مرحله: {stage.label}
                </h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#18263A] text-[#719BDF] border border-[#1F2E45]">
                  {leads.length.toLocaleString('fa-IR')} سرنخ
                </span>
              </div>
              <p className="text-xs text-slate-400">
                کمپین: <span className="text-slate-300 font-medium">{campaignName}</span>
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-[#18263A] rounded-xl transition-colors cursor-pointer"
              title="بستن پنل (Esc)"
            >
              <X size={18} />
            </button>
          </div>

          {/* نوار ابزار جستجو و خروجی */}
          <div className="p-4 border-b border-[#1F2E45]/60 bg-[#0E1828] flex items-center gap-3 shrink-0">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در نام، نام خانوادگی یا شماره موبایل..."
                className="w-full pr-9 pl-4 py-2 bg-[#18263A] border border-[#1F2E45] rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-[#719BDF] transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleExportCsv}
              disabled={leads.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#18263A] hover:bg-[#20314A] border border-[#1F2E45] text-slate-200 rounded-xl text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs shrink-0 cursor-pointer"
              title="دانلود فایل CSV با فرمت استاندارد اکسل"
            >
              <Download size={14} className="text-[#719BDF]" />
              <span>خروجی اکسل</span>
            </button>
          </div>

          {/* محتوای جدول سرنخ‌ها */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-[#719BDF]" />
                <span className="text-xs">در حال بارگذاری سرنخ‌های مرحله...</span>
              </div>
            ) : error ? (
              <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-center space-y-2">
                <AlertCircle className="w-6 h-6 text-rose-400 mx-auto" />
                <p className="text-xs text-rose-300">{error}</p>
              </div>
            ) : leads.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#18263A] text-slate-500 flex items-center justify-center mx-auto border border-[#1F2E45]">
                  <Users size={24} />
                </div>
                <h4 className="text-sm font-bold text-slate-300">
                  {searchQuery ? 'هیچ سرنخی با این مشخصات یافت نشد' : 'در این مرحله سرنخی ثبت نشده است'}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {searchQuery ? 'لطفاً عبارت دیگری را جستجو فرمایید.' : 'با پیشرفت چرخه فروش و انتقال سرنخ‌ها، لیدهای این مرحله در اینجا نمایش می‌یابند.'}
                </p>
              </div>
            ) : (
              <div className="border border-[#1F2E45] rounded-2xl overflow-hidden bg-[#111D2E]/80 shadow-md">
                <table className="w-full text-right text-xs">
                  <thead className="bg-[#18263A]/80 border-b border-[#1F2E45] text-slate-400 font-semibold">
                    <tr>
                      <th className="py-3 px-4">نام سرنخ</th>
                      <th className="py-3 px-4">شماره تماس</th>
                      <th className="py-3 px-4">کارشناس مسئول</th>
                      <th className="py-3 px-4">تاریخ ثبت</th>
                      <th className="py-3 px-3 text-center">پرونده</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F2E45]/50">
                    {leads.map((lead) => (
                      <tr
                        key={lead.id}
                        className="hover:bg-[#18263A]/50 transition-colors group"
                      >
                        <td className="py-3.5 px-4 font-bold text-slate-200">
                          {lead.fullName}
                        </td>
                        <td className="py-3.5 px-4 font-display text-slate-300 tabular-nums font-mono" dir="ltr">
                          {lead.mobile}
                        </td>
                        <td className="py-3.5 px-4">
                          {lead.assignedTo ? (
                            <div className="flex items-center gap-1.5 text-slate-300">
                              <span className="w-5 h-5 rounded-full bg-[#719BDF]/20 text-[#719BDF] flex items-center justify-center text-[10px] font-bold">
                                {lead.assignedTo.fullName.charAt(0)}
                              </span>
                              <span className="truncate max-w-[110px] text-xs">
                                {lead.assignedTo.fullName}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-[11px]">تعیین‌نشده</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 font-display text-[11px] tabular-nums">
                          {formatPersianDate(lead.createdAt)}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <Link
                            href={`/leads/${lead.id}`}
                            className="inline-flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-[#719BDF] hover:bg-[#719BDF]/15 transition-colors"
                            title={`مشاهده پرونده کامل ${lead.fullName}`}
                          >
                            <ExternalLink size={14} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* فوتر کشو */}
          <div className="p-4 border-t border-[#1F2E45] bg-[#111D2E]/90 flex items-center justify-between text-xs text-slate-400 shrink-0">
            <span>
              نمایش {leads.length.toLocaleString('fa-IR')} از {stage.count.toLocaleString('fa-IR')} سرنخ کل مرحله
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-[#18263A] hover:bg-[#20314A] text-slate-200 font-bold transition-colors cursor-pointer"
            >
              بستن
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
