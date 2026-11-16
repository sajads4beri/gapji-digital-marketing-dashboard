'use client';

import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  Suspense,
} from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useToast, FilterBar, FilterConfig } from '@/components/common';
import { DateRangeValue } from '@/components/ui/persian-date-picker';
import { StatRow } from '@/components/stats-row';
import { CampaignsTable } from '@/components/campaigns-table';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { campaignService, mockCampaignDevTools } from '@/features/campaigns/api';
import {
  ExtendedCampaign,
  CampaignStats,
  CampaignStatusType,
} from '@/features/campaigns/types';
import { RefreshCw, AlertTriangle, Bug, Plus, Loader2, Layers } from 'lucide-react';

const STATUS_FILTER_CONFIGS: FilterConfig[] = [
  {
    id: 'status',
    label: 'وضعیت',
    type: 'multi-select',
    placeholder: 'انتخاب وضعیت...',
    options: [
      { label: 'فعال', value: 'active' },
      { label: 'متوقف', value: 'paused' },
      { label: 'تکمیل شده', value: 'completed' },
      { label: 'پیش‌نویس', value: 'draft' },
      { label: 'بایگانی', value: 'archived' },
    ],
  },
];

function CampaignsListPageContent() {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // داده‌های کمپین‌ها و آمار
  const [stats, setStats] = useState<CampaignStats>({
    total: 0,
    active: 0,
    totalSpend: 0,
    totalImpressions: 0,
    totalClicks: 0,
    totalConversions: 0,
  });
  const [campaigns, setCampaigns] = useState<ExtendedCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSimulatingError, setIsSimulatingError] = useState(false);

  // استخراج فیلترها از پارامترهای URL
  const urlSearch = searchParams.get('search') || '';
  const urlStatusRaw = searchParams.get('status') || '';
  const urlFrom = searchParams.get('from') || '';
  const urlTo = searchParams.get('to') || '';

  const selectedStatuses = useMemo(() => {
    return urlStatusRaw ? urlStatusRaw.split(',').filter(Boolean) : [];
  }, [urlStatusRaw]);

  const dateRange: DateRangeValue = useMemo(() => {
    return { from: urlFrom, to: urlTo };
  }, [urlFrom, urlTo]);

  // وضعیت ورودی جستجو (جهت debounce)
  const [searchInput, setSearchInput] = useState(urlSearch);
  const lastPushedSearchRef = useRef<string>(urlSearch);

  // همگام‌سازی ورودی جستجو در صورت تغییر URL توسط کاربر یا کلیدهای مرورگر
  useEffect(() => {
    if (urlSearch !== lastPushedSearchRef.current) {
      setSearchInput(urlSearch);
      lastPushedSearchRef.current = urlSearch;
    }
  }, [urlSearch]);

  // تابع به‌روزرسانی پارامترهای URL با حفظ سایر query paramها
  const updateUrlParams = useCallback(
    (updates: {
      search?: string;
      status?: string[];
      from?: string;
      to?: string;
    }) => {
      const current = new URLSearchParams(searchParams.toString());

      if ('search' in updates) {
        const val = updates.search?.trim();
        if (val) {
          current.set('search', val);
        } else {
          current.delete('search');
        }
      }

      if ('status' in updates) {
        const statuses = updates.status || [];
        if (statuses.length > 0) {
          current.set('status', statuses.join(','));
        } else {
          current.delete('status');
        }
      }

      if ('from' in updates) {
        if (updates.from) {
          current.set('from', updates.from);
        } else {
          current.delete('from');
        }
      }

      if ('to' in updates) {
        if (updates.to) {
          current.set('to', updates.to);
        } else {
          current.delete('to');
        }
      }

      const queryString = current.toString();
      const targetUrl = queryString ? `${pathname}?${queryString}` : pathname;
      router.replace(targetUrl, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  // واکشی داده‌های فیلترشده از سرویس Mock
  const fetchFilteredData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = {
        search: urlSearch || undefined,
        status:
          selectedStatuses.length > 0
            ? (selectedStatuses as CampaignStatusType[])
            : undefined,
        dateFrom: urlFrom || undefined,
        dateTo: urlTo || undefined,
      };

      const [campaignsResult, statsResult] = await Promise.all([
        campaignService.getAll(filters),
        campaignService.getStats(filters),
      ]);

      setCampaigns(campaignsResult);
      setStats(statsResult);
    } catch (err: any) {
      console.error('Error fetching campaigns list:', err);
      setError(
        err?.message ||
          'خطایی در واکشی اطلاعات کمپین‌ها رخ داده است. لطفاً دوباره تلاش نمایید.',
      );
    } finally {
      setLoading(false);
    }
  }, [urlSearch, selectedStatuses, urlFrom, urlTo]);

  // واکنش به تغییر فیلترها در URL
  useEffect(() => {
    fetchFilteredData();
  }, [fetchFilteredData]);

  // اعمال تغییرات جستجو با Debounce ۳۰۰ میلی‌ثانیه
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput.trim() !== urlSearch) {
        lastPushedSearchRef.current = searchInput.trim();
        updateUrlParams({ search: searchInput });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, urlSearch, updateUrlParams]);

  // کنترلر تغییر فیلتر وضعیت
  const handleFilterChange = (filterId: string, value: any) => {
    if (filterId === 'status') {
      const arrValue = Array.isArray(value) ? value : value ? [value] : [];
      updateUrlParams({ status: arrValue });
    }
  };

  // کنترلر تغییر بازه تاریخ
  const handleDateRangeChange = (range: DateRangeValue) => {
    updateUrlParams({
      from: range.from,
      to: range.to,
    });
  };

  // کنترلر پاک کردن همه فیلترها (Clear All)
  const handleClearAll = () => {
    setSearchInput('');
    lastPushedSearchRef.current = '';
    const current = new URLSearchParams(searchParams.toString());
    current.delete('search');
    current.delete('status');
    current.delete('from');
    current.delete('to');

    const queryString = current.toString();
    const targetUrl = queryString ? `${pathname}?${queryString}` : pathname;
    router.replace(targetUrl, { scroll: false });
  };

  const hasActiveFilters = Boolean(
    urlSearch || selectedStatuses.length > 0 || urlFrom || urlTo,
  );

  // تلاش مجدد (Retry)
  const handleRetry = () => {
    fetchFilteredData();
  };

  // سوئیچ وضعیت شبیه‌ساز خطای سرور
  const handleToggleSimulateError = () => {
    const nextState = !isSimulatingError;
    mockCampaignDevTools.setSimulateError(nextState);
    setIsSimulatingError(nextState);
    toast.info(
      nextState
        ? 'شبیه‌ساز خطا فعال شد. تلاش بعدی برای بارگذاری با خطا مواجه خواهد شد.'
        : 'شبیه‌ساز خطا غیرفعال شد.',
    );
  };

  // کنترلر حذف کمپین از جدول
  const handleDeleteCampaign = async (id: string) => {
    try {
      await campaignService.delete(id);
      handleRetry();
      toast.success('کمپین با موفقیت حذف شد.');
    } catch (err: any) {
      console.error('Error deleting campaign:', err);
      toast.error(err?.message || 'خطا در حذف کمپین.');
    }
  };

  // کنترلر به‌روزرسانی سریع وضعیت کمپین
  const handleUpdateStatus = async (
    id: string,
    newStatus: CampaignStatusType,
  ) => {
    try {
      await campaignService.updateStatus(id, newStatus);
      handleRetry();
      toast.success('وضعیت کمپین با موفقیت به‌روزرسانی شد.');
    } catch (err: any) {
      console.error('Error updating status:', err);
      toast.error(err?.message || 'خطا در به‌روزرسانی وضعیت کمپین.');
    }
  };

  const extendedStats = useMemo(() => {
    const paused = campaigns.filter((c) => c.status === 'paused').length;
    const completed = campaigns.filter((c) => c.status === 'completed').length;
    return {
      ...stats,
      paused,
      completed,
    };
  }, [stats, campaigns]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* هدر باشکوه با سبک Midnight Executive */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#0B1423] via-[#111D2E] to-[#0B1423] border border-[#1F2E45] p-6 sm:p-8 shadow-2xl overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-15">
          <svg className="w-full h-full" viewBox="0 0 1200 300" fill="none" preserveAspectRatio="none">
            <path d="M0 120 C 300 40, 600 240, 1200 80" stroke="url(#campWaveGlow)" strokeWidth="2" />
            <defs>
              <linearGradient id="campWaveGlow" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#719BDF" stopOpacity="0.1" />
                <stop offset="50%" stopColor="#719BDF" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.1" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-[#719BDF] font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#719BDF] shadow-[0_0_8px_#719BDF]" />
              <span>مدیریت کمپین‌های بازاریابی</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-100 font-display tracking-tight">
              مدیریت کمپین‌ها
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
              فهرست، پایش کارایی، بودجه‌بندی و مدیریت چرخه عمر کمپین‌های تبلیغاتی
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={handleToggleSimulateError}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                isSimulatingError
                  ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                  : 'bg-[#18263A] text-slate-300 border-[#1F2E45] hover:bg-[#20314A]'
              }`}
              title="تغییر وضعیت شبیه‌ساز خطای سرور جهت تست دکمه تلاش دوباره"
            >
              <Bug size={14} />
              <span>
                {isSimulatingError ? 'خطای آزمایشی: روشن' : 'شبیه‌سازی خطا (تست)'}
              </span>
            </button>

            <Link
              href="/campaigns/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#719BDF] to-[#3B82F6] hover:brightness-110 shadow-[0_0_20px_rgba(113,155,223,0.3)] transition-all"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>کمپین جدید</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ردیف ۱: نوار جامع فیلترها (FilterBar) */}
      <FilterBar
        showSearch
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="جستجو در عنوان، کانال یا توضیحات..."
        showDateRange
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        dateRangePlaceholder="بازه تاریخ اجرای کمپین..."
        filtersConfig={STATUS_FILTER_CONFIGS}
        selectedFilters={{ status: selectedStatuses }}
        onFilterChange={handleFilterChange}
        hasActiveFilters={hasActiveFilters}
        onClearAll={handleClearAll}
      />

      {/* نمایش وضعیت خطا و دکمه تلاش دوباره (Retry) */}
      {error ? (
        <div className="bg-[#D66B73]/10 border border-[#D66B73]/30 rounded-2xl p-8 text-center my-8 shadow-xl">
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 bg-[#D66B73]/20 text-[#D66B73] rounded-2xl">
              <AlertTriangle size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-100 font-display">
              عدم موفقیت در دریافت داده‌های کمپین‌ها
            </h3>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed">{error}</p>
            <button
              type="button"
              onClick={handleRetry}
              disabled={loading}
              className="mt-2 flex items-center gap-2 bg-[#D66B73] hover:bg-[#E07C84] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={loading ? 'animate-spin' : ''}
              />
              <span>تلاش دوباره</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* ردیف ۲: کارت‌های آماری متصل به مقادیر فیلترشده (StatRow) */}
          <StatRow stats={extendedStats} />

          {/* ردیف ۳: جدول نمایش کمپین‌های فیلترشده (CampaignsTable) */}
          <CampaignsTable
            campaigns={campaigns}
            loading={loading}
            onDeleteCampaign={handleDeleteCampaign}
            onUpdateStatus={handleUpdateStatus}
            onRefresh={handleRetry}
          />
        </>
      )}
    </div>
  );
}

export default function CampaignsListPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[400px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <CampaignsListPageContent />
    </Suspense>
  );
}
