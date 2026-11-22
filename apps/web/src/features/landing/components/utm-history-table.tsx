'use client';

import * as React from 'react';
import {
  Search,
  Copy,
  Check,
  ExternalLink,
  History,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/common/toast-provider';
import { UtmLinkItem } from '../types';

interface UtmHistoryTableProps {
  links: UtmLinkItem[];
  isLoading: boolean;
  onScrollToBuilder?: () => void;
}

export function UtmHistoryTable({
  links,
  isLoading,
  onScrollToBuilder,
}: UtmHistoryTableProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedPlatform, setSelectedPlatform] = React.useState<string>('all');
  const [selectedCampaign, setSelectedCampaign] = React.useState<string>('all');
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  // Copy handler
  const handleCopy = async (id: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      toast.success('لینک UTM با موفقیت در حافظه کپی شد', {
        title: 'کپی شد',
      });
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      toast.error('خطا در کپی کردن آدرس لینک', {
        title: 'خطا',
      });
    }
  };

  // Format Persian Date
  const formatPersianDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return dateString;
    }
  };

  // Extract unique campaigns and platforms for filter
  const platformOptions = React.useMemo(() => {
    const map = new Map<string, string>();
    links.forEach((link) => {
      const name = link.platformName || link.utmSource;
      if (name) map.set(name, name);
    });
    return Array.from(map.values());
  }, [links]);

  const campaignOptions = React.useMemo(() => {
    const map = new Map<string, string>();
    links.forEach((link) => {
      const name = link.campaignName || link.utmCampaign;
      if (name) map.set(name, name);
    });
    return Array.from(map.values());
  }, [links]);

  // Filter links
  const filteredLinks = React.useMemo(() => {
    return links.filter((link) => {
      const matchesSearch =
        searchTerm === '' ||
        link.finalUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
        link.utmSource.toLowerCase().includes(searchTerm.toLowerCase()) ||
        link.utmMedium.toLowerCase().includes(searchTerm.toLowerCase()) ||
        link.utmCampaign.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (link.landingPageTitle &&
          link.landingPageTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (link.utmTerm &&
          link.utmTerm.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (link.utmContent &&
          link.utmContent.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesPlatform =
        selectedPlatform === 'all' ||
        (link.platformName && link.platformName === selectedPlatform) ||
        link.utmSource === selectedPlatform;

      const matchesCampaign =
        selectedCampaign === 'all' ||
        (link.campaignName && link.campaignName === selectedCampaign) ||
        link.utmCampaign === selectedCampaign;

      return matchesSearch && matchesPlatform && matchesCampaign;
    });
  }, [links, searchTerm, selectedPlatform, selectedCampaign]);

  return (
    <div className="space-y-4">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111D2E]/80 backdrop-blur-md p-4 rounded-2xl border border-[#1F2E45] shadow-xl shadow-black/20">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#18263A] border border-[#1F2E45] text-[#719BDF] flex items-center justify-center font-bold text-sm shadow-md shadow-black/20">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">
              تاریخچه لینک‌های ساخته‌شده
            </h3>
            <p className="text-xs text-slate-400">
              {links.length} لینک فعال با داده‌های انتساب لید
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Platform Filter */}
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="text-xs border border-[#1F2E45] rounded-xl px-3 py-1.5 bg-[#0B1423] text-slate-200 focus:outline-none focus:border-[#719BDF]"
          >
            <option value="all">همه پلتفرم‌ها</option>
            {platformOptions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          {/* Campaign Filter */}
          <select
            value={selectedCampaign}
            onChange={(e) => setSelectedCampaign(e.target.value)}
            className="text-xs border border-[#1F2E45] rounded-xl px-3 py-1.5 bg-[#0B1423] text-slate-200 focus:outline-none focus:border-[#719BDF]"
          >
            <option value="all">همه کمپین‌ها</option>
            {campaignOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجو در لینک‌ها..."
              className="ps-8 text-xs h-8 w-44 bg-[#0B1423] border-[#1F2E45] text-white placeholder-slate-500 focus:border-[#719BDF]"
            />
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-hidden rounded-2xl border border-[#1F2E45] bg-[#111D2E]/80 backdrop-blur-md shadow-xl shadow-black/20">
        {isLoading && links.length === 0 ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-[#18263A]/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredLinks.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <p className="text-xs">هیچ لینکی مطابق فیلترهای انتخابی یافت نشد.</p>
            {onScrollToBuilder && (
              <Button
                variant="outline"
                size="sm"
                onClick={onScrollToBuilder}
                className="mt-3 text-xs bg-[#18263A] border-[#1F2E45] text-slate-200 hover:text-white"
              >
                ساخت اولین لینک UTM
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-[#1F2E45] bg-[#0B1423]/60 text-slate-400 font-medium">
                  <th className="py-3.5 px-4 min-w-[280px] font-semibold">آدرس نهایی و پارامترها</th>
                  <th className="py-3.5 px-4 font-semibold">کمپین</th>
                  <th className="py-3.5 px-4 font-semibold">پلتفرم</th>
                  <th className="py-3.5 px-4 font-semibold">مدیوم</th>
                  <th className="py-3.5 px-4 font-semibold">تاریخ ساخت</th>
                  <th className="py-3.5 px-4 min-w-[120px] text-center font-semibold">تعداد کلیک</th>
                  <th className="py-3.5 px-4 min-w-[100px] text-center font-semibold">کل لید</th>
                  <th className="py-3.5 px-4 w-20 text-center font-semibold">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2E45]/40 text-slate-300">
                {filteredLinks.map((link) => (
                  <tr key={link.id} className="hover:bg-[#18263A]/50 transition-colors">
                    {/* Link & Destination */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          {link.landingPageTitle ? (
                            <span className="font-semibold text-white text-xs">
                              {link.landingPageTitle}
                            </span>
                          ) : (
                            <span className="font-medium text-slate-300 text-xs">
                              لینک مستقیم
                            </span>
                          )}
                        </div>
                        <div
                          dir="ltr"
                          className="font-mono text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md cursor-pointer hover:text-[#719BDF] select-all"
                          title={link.finalUrl}
                          onClick={() => handleCopy(link.id, link.finalUrl)}
                        >
                          {link.finalUrl}
                        </div>
                        {(link.utmTerm || link.utmContent) && (
                          <div className="flex items-center gap-2 pt-0.5 text-[10px] text-slate-500">
                            {link.utmTerm && (
                              <span className="bg-[#18263A] border border-[#1F2E45] px-1.5 py-0.5 rounded text-slate-400">
                                عبارت: {link.utmTerm}
                              </span>
                            )}
                            {link.utmContent && (
                              <span className="bg-[#18263A] border border-[#1F2E45] px-1.5 py-0.5 rounded text-slate-400">
                                محتوا: {link.utmContent}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Campaign */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-medium bg-[#18263A] text-slate-300 border border-[#1F2E45]">
                        {link.campaignName || link.utmCampaign}
                      </span>
                    </td>

                    {/* Platform */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-medium bg-[#719BDF]/15 text-[#719BDF] border border-[#719BDF]/30">
                        {link.platformName || link.utmSource}
                      </span>
                    </td>

                    {/* Medium */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-medium bg-[#18263A] text-slate-300 font-mono border border-[#1F2E45]">
                        {link.utmMedium}
                      </span>
                    </td>

                    {/* Created Date */}
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {formatPersianDate(link.createdAt)}
                    </td>

                    {/* Click Tracking - Truthful Disclosure */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20"
                          title="ردیابی کلیک سایت نیازمند نصب اسکریپت ردیابی گپجی در سایت مقصد است"
                        >
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                          نیاز به اسکریپت
                        </span>
                      </div>
                    </td>

                    {/* Attributed Leads */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center justify-center min-w-[28px] px-2.5 py-0.5 rounded-full font-bold text-xs ${
                          link.attributedLeadsCount > 0
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-[#18263A] text-slate-400 border border-[#1F2E45]'
                        }`}
                      >
                        {link.attributedLeadsCount}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-slate-400 hover:text-white hover:bg-[#18263A]"
                          onClick={() => handleCopy(link.id, link.finalUrl)}
                          title="کپی لینک"
                        >
                          {copiedId === link.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </Button>

                        <a
                          href={link.finalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center h-7 w-7 rounded text-slate-400 hover:text-[#719BDF] hover:bg-[#18263A] transition-colors"
                          title="باز کردن لینک در پنجره جدید"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
