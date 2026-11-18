'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  RefreshCw,
  AlertTriangle,
  RotateCcw,
  Plus,
  Layers,
  ChevronDown,
  Check,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
} from 'lucide-react';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { PersianDatePicker, type DateRangeValue } from '@/components/ui/persian-date-picker';
import { useToast } from '@/components/common/toast-provider';
import {
  dashboardService,
  type DashboardDataPayload,
  type DashboardDatePreset,
  DashboardKpiGrid,
  SpendRevenueChart,
  LeadTrendChart,
  ConversionFunnelWidget,
  ChannelPerformanceTable,
  DashboardCampaignList,
  UrgentAlertsWidget,
} from '@/features/dashboard';
import { campaignApi, type ExtendedCampaign } from '@/features/campaigns';

interface MultiSelectDropdownProps {
  label: string;
  options: Array<{ id: string; name: string }>;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  emptyLabel?: string;
}

function MultiSelectDropdown({
  label,
  options,
  selectedIds,
  onChange,
  emptyLabel = 'موردی یافت نشد',
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleOption = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    onChange(options.map((o) => o.id));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  return (
    <div className="relative inline-block text-right" ref={containerRef} dir="rtl">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
          selectedIds.length > 0
            ? 'bg-[#18263A] text-[#719BDF] border-[#719BDF]/35 shadow-[0_0_10px_rgba(113,155,223,0.15)] font-bold'
            : 'bg-[#111D2E] text-slate-300 border-[#1F2E45] hover:bg-[#18263A] hover:border-[#719BDF]/30'
        }`}
      >
        <span>{label}</span>
        {selectedIds.length > 0 ? (
          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#719BDF] text-[#080F1C] rounded-md">
            {selectedIds.length}
          </span>
        ) : (
          <span className="text-[11px] text-slate-500 font-normal">(همه)</span>
        )}
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1.5 right-0 w-64 bg-[#111D2E] rounded-2xl border border-[#1F2E45] shadow-2xl p-2.5 space-y-2 animate-in fade-in zoom-in-95 duration-100 text-slate-200">
          <div className="flex items-center justify-between pb-2 border-b border-[#1F2E45] px-1 text-[11px]">
            <span className="text-slate-400 font-medium">{label}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[#719BDF] hover:underline font-bold"
              >
                انتخاب همه
              </button>
              <span className="text-slate-600">|</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-slate-400 hover:text-slate-200"
              >
                پاک کردن
              </button>
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1">
            {options.length === 0 ? (
              <div className="py-3 text-center text-xs text-slate-500">{emptyLabel}</div>
            ) : (
              options.map((opt) => {
                const isChecked = selectedIds.includes(opt.id);
                return (
                  <label
                    key={opt.id}
                    className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs hover:bg-[#18263A] cursor-pointer select-none transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleOption(opt.id)}
                      className="rounded border-[#1F2E45] bg-[#0E1726] text-[#719BDF] focus:ring-[#719BDF] w-3.5 h-3.5"
                    />
                    <span
                      className={`truncate flex-1 ${
                        isChecked ? 'font-bold text-slate-100' : 'text-slate-300'
                      }`}
                    >
                      {opt.name}
                    </span>
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ExecutiveDashboardContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const presetParam = (searchParams.get('preset') as DashboardDatePreset) || '30d';
  const fromParam = searchParams.get('from') || '';
  const toParam = searchParams.get('to') || '';
  const campaignsParam = searchParams.get('campaigns') || '';
  const platformsParam = searchParams.get('platforms') || '';
  const compareParam = searchParams.get('compare') === 'true';

  const selectedCampaignIds = React.useMemo(
    () => (campaignsParam ? campaignsParam.split(',').filter(Boolean) : []),
    [campaignsParam],
  );

  const selectedPlatformIds = React.useMemo(
    () => (platformsParam ? platformsParam.split(',').filter(Boolean) : []),
    [platformsParam],
  );

  const [data, setData] = React.useState<DashboardDataPayload | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [availableCampaigns, setAvailableCampaigns] = React.useState<
    Array<{ id: string; name: string }>
  >([]);

  React.useEffect(() => {
    campaignApi
      .getAll()
      .then((camps) => {
        setAvailableCampaigns(camps.map((c) => ({ id: c.id, name: c.name })));
      })
      .catch((err) => {
        console.warn('Could not load campaign list for dashboard filter:', err);
      });
  }, []);

  const availablePlatforms = React.useMemo(() => {
    if (data?.filters?.availablePlatforms && data.filters.availablePlatforms.length > 0) {
      return data.filters.availablePlatforms.map((p) => ({
        id: p.id,
        name: p.name,
      }));
    }
    if (!data?.platformShares) return [];
    return data.platformShares.map((p) => ({
      id: p.id,
      name: p.name,
    }));
  }, [data?.filters?.availablePlatforms, data?.platformShares]);

  const fetchDashboard = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const payload = await dashboardService.getDashboardData({
        preset: presetParam,
        from: fromParam || undefined,
        to: toParam || undefined,
        campaignIds: selectedCampaignIds.length > 0 ? selectedCampaignIds : undefined,
        platformIds: selectedPlatformIds.length > 0 ? selectedPlatformIds : undefined,
        comparePrevious: compareParam,
      });
      setData(payload);
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError(err?.message || 'خطا در بارگذاری داده‌های داشبورد اجرایی.');
    } finally {
      setLoading(false);
    }
  }, [presetParam, fromParam, toParam, selectedCampaignIds, selectedPlatformIds, compareParam]);

  React.useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const updateUrlParams = React.useCallback(
    (updates: Record<string, string | null>) => {
      const current = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '') {
          current.delete(key);
        } else {
          current.set(key, value);
        }
      });
      const qs = current.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const handlePresetChange = (preset: DashboardDatePreset) => {
    if (preset === presetParam && !fromParam && !toParam) return;
    updateUrlParams({
      preset: preset === '30d' ? null : preset,
      from: null,
      to: null,
    });
  };

  const handleCustomDateChange = (range: DateRangeValue) => {
    updateUrlParams({
      preset: 'custom',
      from: range.from || null,
      to: range.to || null,
    });
  };

  const handleCampaignsChange = (ids: string[]) => {
    updateUrlParams({
      campaigns: ids.length > 0 ? ids.join(',') : null,
    });
  };

  const handlePlatformsChange = (ids: string[]) => {
    updateUrlParams({
      platforms: ids.length > 0 ? ids.join(',') : null,
    });
  };

  const handleCompareToggle = () => {
    updateUrlParams({
      compare: compareParam ? null : 'true',
    });
  };

  const handleClearFilters = () => {
    updateUrlParams({
      preset: null,
      from: null,
      to: null,
      campaigns: null,
      platforms: null,
      compare: null,
    });
  };

  const hasActiveFilters = Boolean(
    presetParam !== '30d' ||
      fromParam ||
      toParam ||
      selectedCampaignIds.length > 0 ||
      selectedPlatformIds.length > 0 ||
      compareParam,
  );

  return (
    <div className="space-y-6 pb-12" dir="rtl">
      {/* هدر باشکوه با پس‌زمینه خطوط انتزاعی موجی (Wave Mesh Header) مطابق تصویر مرجع */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#0B1423] via-[#111D2E] to-[#0B1423] border border-[#1F2E45] p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* وکتور گرافیکی منحنی‌های انتزاعی نورانی در پس‌زمینه هدر */}
        <div className="absolute inset-0 pointer-events-none opacity-15">
          <svg
            className="w-full h-full"
            viewBox="0 0 1200 300"
            fill="none"
            preserveAspectRatio="none"
          >
            <path
              d="M0 120 C 300 40, 600 240, 1200 80"
              stroke="url(#headerWaveGlow)"
              strokeWidth="2"
            />
            <path
              d="M0 180 C 400 80, 800 280, 1200 140"
              stroke="url(#headerWaveGlow)"
              strokeWidth="1.5"
              strokeDasharray="4 6"
            />
            <path
              d="M0 240 C 350 160, 750 320, 1200 200"
              stroke="url(#headerWaveGlow)"
              strokeWidth="1"
            />
            <defs>
              <linearGradient id="headerWaveGlow" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#719BDF" stopOpacity="0.1" />
                <stop offset="50%" stopColor="#719BDF" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.1" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* محتوای هدر */}
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-[#719BDF] font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#719BDF] shadow-[0_0_8px_#719BDF]" />
              <span>پلتفرم بازاریابی دیجیتال • نمای کلان عملکرد</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight font-display">
              داشبورد اجرایی بازاریابی
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
              نمای کلی عملکرد کمپین‌ها، لیدها، هزینه‌ها و بازگشت سرمایه
            </p>
          </div>

          {/* اکشن‌های سریع و پیل بازه زمانی هدر */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            {/* پیل بازه زمانی ۳۰ روز گذشته مطابق مرجع بصری */}
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#18263A] border border-[#1F2E45] text-xs font-bold text-slate-200 shadow-xs">
              <Calendar className="w-4 h-4 text-[#719BDF]" />
              <span>۳۰ روز گذشته</span>
            </div>

            <button
              type="button"
              onClick={fetchDashboard}
              title="بارگذاری مجدد داده‌ها"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 bg-[#18263A] border border-[#1F2E45] hover:bg-[#20314A] hover:text-white rounded-xl transition-colors shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
              <span>تازه‌سازی</span>
            </button>

            <Link
              href="/campaigns"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-200 bg-[#18263A] border border-[#1F2E45] hover:bg-[#20314A] hover:text-white rounded-xl transition-colors shadow-xs"
            >
              <Layers className="w-4 h-4 text-slate-400" />
              <span>لیست کمپین‌ها</span>
            </Link>

            <Link
              href="/campaigns/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black text-[#080F1C] bg-[#719BDF] hover:bg-[#85ABEB] rounded-xl transition-colors shadow-[0_0_15px_rgba(113,155,223,0.3)] font-display"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>کمپین جدید</span>
            </Link>
          </div>
        </div>
      </div>

      {/* نوار جامع فیلترها با استایل Midnight Glass */}
      <div className="relative z-30 p-4 bg-[#111D2E]/80 backdrop-blur-md rounded-2xl border border-[#1F2E45] shadow-xl space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* پری‌ست‌های بازه زمانی */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-400 font-semibold me-1">بازه زمانی:</span>

            <button
              type="button"
              onClick={() => handlePresetChange('today')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                presetParam === 'today'
                  ? 'bg-[#18263A] text-[#719BDF] border border-[#719BDF]/30 font-bold shadow-[0_0_10px_rgba(113,155,223,0.15)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#18263A]/50'
              }`}
            >
              امروز
            </button>

            <button
              type="button"
              onClick={() => handlePresetChange('7d')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                presetParam === '7d'
                  ? 'bg-[#18263A] text-[#719BDF] border border-[#719BDF]/30 font-bold shadow-[0_0_10px_rgba(113,155,223,0.15)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#18263A]/50'
              }`}
            >
              ۷ روز گذشته
            </button>

            <button
              type="button"
              onClick={() => handlePresetChange('30d')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                presetParam === '30d' && !fromParam && !toParam
                  ? 'bg-[#18263A] text-[#719BDF] border border-[#719BDF]/30 font-bold shadow-[0_0_10px_rgba(113,155,223,0.15)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#18263A]/50'
              }`}
            >
              ۳۰ روز گذشته
            </button>

            <button
              type="button"
              onClick={() => handlePresetChange('this_month')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                presetParam === 'this_month'
                  ? 'bg-[#18263A] text-[#719BDF] border border-[#719BDF]/30 font-bold shadow-[0_0_10px_rgba(113,155,223,0.15)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#18263A]/50'
              }`}
            >
              ماه جاری
            </button>
          </div>

          {/* فیلتر تقویم بازه تاریخ دلخواه */}
          <div className="w-full sm:w-auto min-w-[240px]">
            <PersianDatePicker
              mode="range"
              value={{ from: fromParam, to: toParam }}
              onChange={handleCustomDateChange}
              placeholder="انتخاب بازه تاریخ دلخواه..."
            />
          </div>
        </div>

        {/* فیلترهای چند انتخابی و کلید مقایسه */}
        <div className="pt-3 border-t border-[#1F2E45]/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <MultiSelectDropdown
              label="کمپین"
              options={availableCampaigns}
              selectedIds={selectedCampaignIds}
              onChange={handleCampaignsChange}
              emptyLabel="هیچ کمپینی ثبت نشده است"
            />

            <MultiSelectDropdown
              label="پلتفرم"
              options={availablePlatforms}
              selectedIds={selectedPlatformIds}
              onChange={handlePlatformsChange}
              emptyLabel="پلتفرمی در پایگاه داده ثبت نشده است"
            />

            {/* سوییچ مقایسه با دوره قبل */}
            <button
              type="button"
              onClick={handleCompareToggle}
              className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                compareParam
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-bold shadow-xs'
                  : 'bg-[#111D2E] text-slate-400 border-[#1F2E45] hover:bg-[#18263A]'
              }`}
            >
              {compareParam ? (
                <ToggleRight className="w-4 h-4 text-emerald-400" />
              ) : (
                <ToggleLeft className="w-4 h-4 text-slate-500" />
              )}
              <span>مقایسه با دوره قبل</span>
            </button>
          </div>

          {/* دکمه بازنشانی فیلترها */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1.5 text-xs text-[#D66B73] hover:text-[#E07C84] font-medium px-2 py-1 rounded-lg hover:bg-[#D66B73]/10 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>بازنشانی فیلترها</span>
            </button>
          )}
        </div>
      </div>

      {/* وضعیت‌های بارگذاری، خطا یا محتوای اصلی */}
      {loading ? (
        <DashboardSkeleton />
      ) : error ? (
        <div className="p-8 bg-[#D66B73]/10 border border-[#D66B73]/30 rounded-2xl text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-[#D66B73] mx-auto" />
          <h3 className="text-sm font-bold text-slate-100 font-display">
            عدم موفقیت در بارگذاری اطلاعات داشبورد
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            {error}
          </p>
          <button
            type="button"
            onClick={fetchDashboard}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#D66B73] rounded-xl hover:bg-[#E07C84] transition-colors shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>تلاش دوباره</span>
          </button>
        </div>
      ) : !data ? null : (
        <div className="space-y-6">
          {/* هشدارهای فوری (در صورت وجود) */}
          {data.alerts && data.alerts.length > 0 && (
            <UrgentAlertsWidget alerts={data.alerts} />
          )}

          {/* ردیف ۲: کارت‌های شاخص‌های کلیدی عملکرد (Hero KPIs & Unit Economics) */}
          <DashboardKpiGrid
            kpis={data.kpis}
            campaignsCount={data.campaigns?.length}
            activeCampaignsCount={data.campaigns?.filter((c) => c.status === 'active').length}
          />

          {/* ردیف ۳: چارت روند جذب لید و چارت دونات سهم پلتفرم‌ها دقیقا مطابق مرجع بصری */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7">
              <LeadTrendChart trends={data.leadTrend} />
            </div>
            <div className="lg:col-span-5">
              <ChannelPerformanceTable
                platformShares={data.platformShares}
                totalLeads={data.kpis?.totalLeads}
              />
            </div>
          </div>

          {/* ردیف ۴: نمودار هزینه تبلیغات و قیف ۵ مرحله‌ای تبدیل */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <SpendRevenueChart trends={data.spendTrend} />
            <ConversionFunnelWidget funnel={data.funnel} />
          </div>

          {/* ردیف ۵: جدول تفصیلی عملکرد کمپین‌ها با طراحی تیره */}
          <DashboardCampaignList campaigns={data.campaigns} />
        </div>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" dir="rtl">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-32 bg-[#111D2E] border border-[#1F2E45] rounded-2xl"
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 h-72 bg-[#111D2E] border border-[#1F2E45] rounded-2xl" />
        <div className="lg:col-span-5 h-72 bg-[#111D2E] border border-[#1F2E45] rounded-2xl" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-72 bg-[#111D2E] border border-[#1F2E45] rounded-2xl" />
        <div className="h-72 bg-[#111D2E] border border-[#1F2E45] rounded-2xl" />
      </div>

      <div className="h-64 bg-[#111D2E] border border-[#1F2E45] rounded-2xl" />
    </div>
  );
}

export default function ExecutiveDashboardPage() {
  return (
    <React.Suspense fallback={<DashboardSkeleton />}>
      <ExecutiveDashboardContent />
    </React.Suspense>
  );
}
