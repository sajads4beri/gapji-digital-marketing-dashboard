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
  CheckSquare,
  Square,
  SlidersHorizontal,
  ToggleLeft,
  ToggleRight,
  Info,
} from 'lucide-react';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { PersianDatePicker, type DateRangeValue } from '@/components/ui/persian-date-picker';
import { useToast } from '@/components/common/toast-provider';
import {
  dashboardService,
  type DashboardDataPayload,
  type DashboardDatePreset,
  DashboardKpiGrid,
  SpendTrendChart,
  LeadTrendChart,
  ConversionFunnelWidget,
  PlatformShareWidget,
  DashboardCampaignsTable,
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

  const isAllSelected = options.length > 0 && selectedIds.length === options.length;

  return (
    <div className="relative inline-block text-right" ref={containerRef} dir="rtl">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
          selectedIds.length > 0
            ? 'bg-blue-50/80 text-blue-700 border-blue-200 shadow-2xs font-bold'
            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
        }`}
      >
        <span>{label}</span>
        {selectedIds.length > 0 ? (
          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-600 text-white rounded-md">
            {selectedIds.length}
          </span>
        ) : (
          <span className="text-[11px] text-slate-400 font-normal">(همه)</span>
        )}
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1.5 right-0 w-64 bg-white rounded-xl border border-slate-200 shadow-lg p-2 space-y-2 animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 px-1 text-[11px]">
            <span className="text-slate-500 font-medium">{label}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-blue-600 hover:underline font-semibold"
              >
                انتخاب همه
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-slate-400 hover:text-slate-700"
              >
                پاک کردن
              </button>
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1">
            {options.length === 0 ? (
              <div className="py-3 text-center text-xs text-slate-400">{emptyLabel}</div>
            ) : (
              options.map((opt) => {
                const isChecked = selectedIds.includes(opt.id);
                return (
                  <label
                    key={opt.id}
                    className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs hover:bg-slate-50 cursor-pointer select-none transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleOption(opt.id)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                    />
                    <span
                      className={`truncate flex-1 ${
                        isChecked ? 'font-bold text-slate-900' : 'text-slate-700'
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

  // خواندن پارامترهای فیلتر از URL
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

  // کمپین‌های موجود برای فیلتر چند انتخابی
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

  // پلتفرم‌های موجود استخراج شده از داده‌های واقعی داشبورد
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

  // واکشی داده‌ها از سرویس داشبورد با اعمال فیلترهای کامل سند محصول (صفحه ۸)
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

  // به‌روزرسانی پارامترهای URL
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

  // تغییر گزینه‌های سریع بازه زمانی
  const handlePresetChange = (preset: DashboardDatePreset) => {
    if (preset === presetParam && !fromParam && !toParam) return;
    updateUrlParams({
      preset: preset === '30d' ? null : preset,
      from: null,
      to: null,
    });
  };

  // تغییر بازه سفارشی تقویم
  const handleCustomDateChange = (range: DateRangeValue) => {
    updateUrlParams({
      preset: 'custom',
      from: range.from || null,
      to: range.to || null,
    });
  };

  // تغییر فیلتر چند انتخابی کمپین‌ها
  const handleCampaignsChange = (ids: string[]) => {
    updateUrlParams({
      campaigns: ids.length > 0 ? ids.join(',') : null,
    });
  };

  // تغییر فیلتر چند انتخابی پلتفرم‌ها
  const handlePlatformsChange = (ids: string[]) => {
    updateUrlParams({
      platforms: ids.length > 0 ? ids.join(',') : null,
    });
  };

  // تغییر وضعیت مقایسه با دوره قبل
  const handleCompareToggle = () => {
    updateUrlParams({
      compare: compareParam ? null : 'true',
    });
  };

  // پاک کردن تمام فیلترها و بازگشت به پیش‌فرض ۳۰ روزه
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
      {/* هدر صفحه و دکمه‌های اکشن */}
      <div className="space-y-4">
        <Breadcrumb
          items={[
            { label: 'فضای کاری ۱: عملکرد' },
            { label: 'داشبورد اجرایی عملکرد' },
          ]}
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                داشبورد اجرایی عملکرد
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                پایش کلان شاخص‌های مالی، هزینه، لیدها، بازگشت سرمایه تبلیغات و عملکرد کمپین‌ها
              </p>
            </div>
          </div>

          {/* اکشن‌های سریع */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={fetchDashboard}
              title="بارگذاری مجدد داده‌ها"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
              <span>تازه‌سازی</span>
            </button>

            <Link
              href="/campaigns"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors shadow-2xs"
            >
              <Layers className="w-4 h-4 text-slate-500" />
              <span>لیست کمپین‌ها</span>
            </Link>

            <Link
              href="/campaigns/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>کمپین جدید</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ردیف ۱: نوار جامع فیلترها (صفحه ۸ سند محصول) */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* پری‌ست‌های بازه زمانی */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-500 font-semibold ml-1">بازه زمانی:</span>

            <button
              type="button"
              onClick={() => handlePresetChange('today')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                presetParam === 'today'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              امروز
            </button>

            <button
              type="button"
              onClick={() => handlePresetChange('7d')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                presetParam === '7d'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              ۷ روز گذشته
            </button>

            <button
              type="button"
              onClick={() => handlePresetChange('30d')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                presetParam === '30d' && !fromParam && !toParam
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              ۳۰ روز گذشته
            </button>

            <button
              type="button"
              onClick={() => handlePresetChange('this_month')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                presetParam === 'this_month'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
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
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* فیلتر چند انتخابی کمپین */}
            <MultiSelectDropdown
              label="کمپین"
              options={availableCampaigns}
              selectedIds={selectedCampaignIds}
              onChange={handleCampaignsChange}
              emptyLabel="هیچ کمپینی ثبت نشده است"
            />

            {/* فیلتر چند انتخابی پلتفرم */}
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
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {compareParam ? (
                <ToggleRight className="w-4 h-4 text-emerald-600" />
              ) : (
                <ToggleLeft className="w-4 h-4 text-slate-400" />
              )}
              <span>مقایسه با دوره قبل</span>
            </button>
          </div>

          {/* دکمه بازنشانی تمام فیلترها */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors"
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
        <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
          <h3 className="text-sm font-bold text-rose-800">
            عدم موفقیت در بارگذاری اطلاعات داشبورد
          </h3>
          <p className="text-xs text-rose-600 max-w-md mx-auto leading-relaxed">
            {error}
          </p>
          <button
            type="button"
            onClick={fetchDashboard}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 rounded-xl hover:bg-rose-700 transition-colors shadow-xs"
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

          {/* ردیف ۲: ۶ کارت شاخص‌های کلیدی (صفحه ۸ سند محصول) */}
          <DashboardKpiGrid kpis={data.kpis} />

          {/* ردیف ۳: دو نمودار مستقل روند هزینه و روند لیدها */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* نمودار ۱: روند هزینه */}
            <SpendTrendChart trends={data.spendTrend} />

            {/* نمودار ۲: روند لیدها */}
            <LeadTrendChart trends={data.leadTrend} />
          </div>

          {/* ردیف ۴: قیف ۵ مرحله‌ای تبدیل و نمودار سهم پلتفرم‌ها */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* قیف ۵ مرحله‌ای تبدیل */}
            <ConversionFunnelWidget funnel={data.funnel} />

            {/* نمودار سهم پلتفرم‌ها */}
            <PlatformShareWidget platformShares={data.platformShares} />
          </div>

          {/* ردیف ۵: جدول عملکرد کمپین‌ها (صفحه ۸ سند محصول) */}
          <DashboardCampaignsTable campaigns={data.campaigns} />
        </div>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" dir="rtl">
      {/* اسکلتون ۶ کارت آماری */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-32 bg-slate-100 border border-slate-200 rounded-2xl"
          />
        ))}
      </div>

      {/* اسکلتون ۲ نمودار */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-72 bg-slate-100 border border-slate-200 rounded-2xl" />
        <div className="h-72 bg-slate-100 border border-slate-200 rounded-2xl" />
      </div>

      {/* اسکلتون قیف و پلتفرم */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-72 bg-slate-100 border border-slate-200 rounded-2xl" />
        <div className="h-72 bg-slate-100 border border-slate-200 rounded-2xl" />
      </div>

      {/* اسکلتون جدول کمپین‌ها */}
      <div className="h-64 bg-slate-100 border border-slate-200 rounded-2xl" />
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
