'use client';

import * as React from 'react';
import {
  Globe,
  ExternalLink,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Link2,
  Layers,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LandingPageItem } from '../types';

interface LandingPagesTableProps {
  landingPages: LandingPageItem[];
  isLoading: boolean;
  onAdd: () => void;
  onOpenWordPressModal: () => void;
  onDelete: (item: LandingPageItem) => void;
  onSelectForUtm: (item: LandingPageItem) => void;
}

export function LandingPagesTable({
  landingPages,
  isLoading,
  onAdd,
  onOpenWordPressModal,
  onDelete,
  onSelectForUtm,
}: LandingPagesTableProps) {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredLandings = React.useMemo(() => {
    return landingPages.filter((l) => {
      const q = searchTerm.toLowerCase();
      return (
        l.title.toLowerCase().includes(q) ||
        l.url.toLowerCase().includes(q) ||
        (l.campaignName && l.campaignName.toLowerCase().includes(q))
      );
    });
  }, [landingPages, searchTerm]);

  if (isLoading && landingPages.length === 0) {
    return (
      <div className="rounded-2xl border border-[#1F2E45] bg-[#111D2E]/80 backdrop-blur-md p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1F2E45]">
          <div className="h-4 w-32 bg-[#18263A] rounded animate-pulse" />
          <div className="h-4 w-20 bg-[#18263A] rounded animate-pulse" />
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 bg-[#18263A]/50 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Banner and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111D2E]/80 backdrop-blur-md p-4 rounded-2xl border border-[#1F2E45] shadow-xl shadow-black/20">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#719BDF]" />
            <h2 className="text-sm font-bold text-white">صفحات فرود و لندینگ‌ها (Landing Pages)</h2>
            <span className="text-[11px] bg-[#719BDF]/15 text-[#719BDF] border border-[#719BDF]/30 font-mono px-2.5 py-0.5 rounded-full font-bold">
              {landingPages.length} صفحه
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            فهرست صفحات فرود متصل به سامانه همراه با وضعیت دریافت لید و پایش عدم فعالیت ۳۰ روزه
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenWordPressModal}
            className="text-xs bg-[#18263A] border-[#1F2E45] text-slate-300 hover:text-white hover:bg-[#1F2E45] gap-1.5 h-9"
          >
            <Building2 className="w-4 h-4 text-[#719BDF]" />
            اتصال به وردپرس
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={onAdd}
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs gap-1.5 h-9 shadow-md shadow-blue-900/30 font-medium"
          >
            <Plus className="w-4 h-4" />
            افزودن لندینگ پیج
          </Button>
        </div>
      </div>

      {/* Search Filter */}
      {landingPages.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجو در نام لندینگ، آدرس اینترنتی یا کمپین..."
            className="ps-10 text-xs h-9 bg-[#0B1423] border-[#1F2E45] text-white placeholder-slate-500 focus:border-[#719BDF]"
          />
        </div>
      )}

      {/* Table or Empty State */}
      {filteredLandings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#1F2E45] bg-[#111D2E]/80 backdrop-blur-md p-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#18263A] border border-[#1F2E45] text-[#719BDF] flex items-center justify-center mx-auto mb-3 shadow-lg shadow-black/20">
            <Globe className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">
            {searchTerm ? 'هیچ صفحه‌ای مطابق با جستجو یافت نشد' : 'هنوز هیچ صفحه فرودی ثبت نشده است'}
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4 leading-relaxed">
            صفحات فرود کمپین‌های خود را جهت پایش عملکرد و ساخت خودکار آدرس‌های رهگیری UTM ثبت نمایید.
          </p>
          <Button
            size="sm"
            onClick={onAdd}
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs gap-1.5 shadow-md shadow-blue-900/30"
          >
            <Plus className="w-4 h-4" />
            ثبت اولین صفحه فرود
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#1F2E45] bg-[#111D2E]/80 backdrop-blur-md shadow-xl shadow-black/20">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-[#1F2E45] bg-[#0B1423]/60 text-slate-400 font-medium">
                  <th className="py-3.5 px-4 font-semibold">عنوان لندینگ</th>
                  <th className="py-3.5 px-4 font-semibold">آدرس اینترنتی (HTTPS)</th>
                  <th className="py-3.5 px-4 font-semibold">وضعیت اتصال</th>
                  <th className="py-3.5 px-4 font-semibold text-center">لید ۷ روز اخیر</th>
                  <th className="py-3.5 px-4 font-semibold text-center">کل لید</th>
                  <th className="py-3.5 px-4 font-semibold text-center">هشدار فعالیت</th>
                  <th className="py-3.5 px-4 font-semibold text-left">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2E45]/40 text-slate-300">
                {filteredLandings.map((landing) => {
                  return (
                    <tr key={landing.id} className="hover:bg-[#18263A]/50 transition-colors">
                      {/* Title & Campaign */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white text-xs">{landing.title}</div>
                        {landing.campaignName && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                            <Layers className="w-3 h-3 text-[#719BDF] shrink-0" />
                            <span>کمپین: {landing.campaignName}</span>
                          </div>
                        )}
                      </td>

                      {/* URL with HTTPS link */}
                      <td className="py-3.5 px-4">
                        <a
                          href={landing.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-[11px] text-[#719BDF] hover:text-[#93B5F5] hover:underline inline-flex items-center gap-1.5 max-w-xs truncate"
                          dir="ltr"
                          title={landing.url}
                        >
                          <span className="truncate">{landing.url}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </td>

                      {/* Connection Status */}
                      <td className="py-3.5 px-4">
                        {landing.connectionStatus ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full font-medium border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{landing.connectionStatusText}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 bg-[#18263A] px-2.5 py-0.5 rounded-full font-medium border border-[#1F2E45]">
                            <XCircle className="w-3.5 h-3.5 text-slate-500" />
                            <span>{landing.connectionStatusText}</span>
                          </span>
                        )}
                      </td>

                      {/* Leads 7 Days */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="tabular-nums font-bold text-white text-xs">
                          {landing.recent7DaysLeads.toLocaleString('fa-IR')}
                        </span>
                      </td>

                      {/* Total Leads */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="tabular-nums font-bold text-white text-xs">
                          {landing.totalLeads.toLocaleString('fa-IR')}
                        </span>
                      </td>

                      {/* 30-Day Inactivity Warning Badge */}
                      <td className="py-3.5 px-4 text-center">
                        {landing.has30DayNoLeadWarning ? (
                          <span
                            title="بیش از ۳۰ روز است که هیچ لیدی از این لندینگ ثبت نشده است"
                            className="inline-flex items-center gap-1 text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-medium animate-pulse"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>عدم دریافت لید (۳۰ روز)</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-600">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-left">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onSelectForUtm(landing)}
                            title="ساخت لینک UTM برای این صفحه"
                            className="p-1.5 text-[#719BDF] hover:bg-[#18263A] rounded-lg transition-colors inline-flex items-center gap-1 text-[11px] font-medium border border-transparent hover:border-[#1F2E45]"
                          >
                            <Link2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">ساخت UTM</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onDelete(landing)}
                            title="حذف صفحه لندینگ"
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-[#18263A] rounded-lg transition-colors border border-transparent hover:border-[#1F2E45]"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
