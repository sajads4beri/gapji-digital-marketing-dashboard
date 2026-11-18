'use client';

import * as React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  Plus,
  UploadCloud,
  FileSpreadsheet,
  RefreshCw,
  AlertCircle,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Layers,
  Building,
  RotateCcw,
} from 'lucide-react';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { FilterBar, FilterConfig } from '@/components/common/filter-bar';
import { EmptyState } from '@/components/common/empty-state';
import { ConfirmModal } from '@/components/common/confirm-modal';
import { useToast } from '@/components/common/toast-provider';
import { useAuth } from '@/features/auth';
import { Button } from '@/components/ui/button';
import { formatMoneyDisplay } from '@/components/ui/money-input';
import { DateRangeValue } from '@/components/ui/persian-date-picker';
import { formatPersianDate } from '@/lib/persian-date';
import {
  DataTable,
  ColumnDef,
  SortingState,
  PaginationState,
} from '@/components/common/data-table';
import { campaignService } from '@/features/campaigns';
import {
  costService,
  CostItem,
  CostStatsSummary,
  CostCategory,
  CostChannel,
  CostStatus,
  CostFilter,
  COST_CATEGORIES,
  COST_CATEGORY_LABELS,
  COST_CHANNELS,
  COST_CHANNEL_LABELS,
  COST_STATUS_LABELS,
  COST_CURRENCY_LABELS,
  CostSummaryBar,
  CostFormModal,
  CostDetailDrawer,
  CostImportModal,
} from '@/features/costs';

function CostsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { can } = useAuth();

  const canCreate = can('costs.create');
  const canEdit = can('costs.edit');
  const canDelete = can('costs.delete');
  const canImport = can('costs.import');

  // ۱. فیلترها از پارامترهای آدرس URL
  const urlSearch = searchParams.get('search') || '';
  const urlCategory = (searchParams.get('category') as CostCategory | 'all') || 'all';
  const urlChannel = (searchParams.get('channel') as CostChannel | 'all' | 'none') || 'all';
  const urlCampaignId = searchParams.get('campaignId') || 'all';
  const urlStatus = (searchParams.get('status') as CostStatus | 'all') || 'all';
  const urlFrom = searchParams.get('from') || '';
  const urlTo = searchParams.get('to') || '';

  const dateRange: DateRangeValue = React.useMemo(() => {
    return { from: urlFrom, to: urlTo };
  }, [urlFrom, urlTo]);

  // ۲. وضعیت داده‌ها
  const [costs, setCosts] = React.useState<CostItem[]>([]);
  const [stats, setStats] = React.useState<CostStatsSummary | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadingStats, setLoadingStats] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [campaignOptions, setCampaignOptions] = React.useState<Array<{ label: string; value: string }>>([
    { label: 'همه کمپین‌ها', value: 'all' },
    { label: 'هزینه عمومی (بدون کمپین)', value: 'unlinked' },
  ]);

  React.useEffect(() => {
    campaignService
      .getAll()
      .then((list: any[]) => {
        if (list && Array.isArray(list)) {
          setCampaignOptions([
            { label: 'همه کمپین‌ها', value: 'all' },
            { label: 'هزینه عمومی (بدون کمپین)', value: 'unlinked' },
            ...list.map((c) => ({
              label: `${c.name} (${c.id.slice(0, 8)})`,
              value: c.id,
            })),
          ]);
        }
      })
      .catch(() => {});
  }, []);

  const filterConfigs: FilterConfig[] = React.useMemo(() => [
    {
      id: 'category',
      label: 'دسته‌بندی',
      type: 'select',
      placeholder: 'همه دسته‌ها',
      options: [
        { label: 'همه دسته‌ها', value: 'all' },
        ...COST_CATEGORIES.map((cat) => ({
          label: COST_CATEGORY_LABELS[cat],
          value: cat,
        })),
      ],
    },
    {
      id: 'channel',
      label: 'کانال / پلتفرم',
      type: 'select',
      placeholder: 'همه کانال‌ها',
      options: [
        { label: 'همه کانال‌ها', value: 'all' },
        { label: 'عمومی (بدون کانال)', value: 'none' },
        ...COST_CHANNELS.map((ch) => ({
          label: COST_CHANNEL_LABELS[ch],
          value: ch,
        })),
      ],
    },
    {
      id: 'campaignId',
      label: 'کمپین مرتبط',
      type: 'select',
      placeholder: 'همه کمپین‌ها',
      options: campaignOptions,
    },
    {
      id: 'status',
      label: 'وضعیت پرداخت',
      type: 'select',
      placeholder: 'همه وضعیت‌ها',
      options: [
        { label: 'همه وضعیت‌ها', value: 'all' },
        { label: 'پرداخت‌شده', value: 'paid' },
        { label: 'در انتظار پرداخت', value: 'pending' },
        { label: 'پیش‌نویس', value: 'draft' },
      ],
    },
  ], [campaignOptions]);

  // جستجوی ورودی جهت هندلینگ بهینه
  const [searchInput, setSearchInput] = React.useState(urlSearch);

  // ۳. وضعیت صفحه‌بندی و مرتب‌سازی
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 1,
    pageSize: 10,
  });

  const [sorting, setSorting] = React.useState<SortingState | null>({
    columnId: 'date',
    direction: 'desc',
  });

  // ۴. وضعیت مودال‌ها و کشو
  const [isFormModalOpen, setIsFormModalOpen] = React.useState(false);
  const [costToEdit, setCostToEdit] = React.useState<CostItem | null>(null);
  const [selectedCost, setSelectedCost] = React.useState<CostItem | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = React.useState(false);
  const [costToDelete, setCostToDelete] = React.useState<CostItem | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // همگام‌سازی ورودی جستجو هنگام تغییر URL
  React.useEffect(() => {
    setSearchInput(urlSearch);
  }, [urlSearch]);

  // تابع به‌روزرسانی پارامترهای آدرس URL
  const updateUrlParams = React.useCallback(
    (updates: {
      search?: string;
      category?: string;
      channel?: string;
      campaignId?: string;
      status?: string;
      from?: string;
      to?: string;
    }) => {
      const current = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, val]) => {
        if (val === undefined) return;
        if (val === '' || val === 'all') {
          current.delete(key);
        } else {
          current.set(key, val);
        }
      });

      const qs = current.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [router, pathname, searchParams]
  );

  // دریافت داده‌ها از CostService
  const loadCosts = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filter: CostFilter = {
        search: urlSearch.trim() || undefined,
        category: urlCategory,
        channel: urlChannel,
        campaignId: urlCampaignId,
        status: urlStatus,
        dateRange: urlFrom || urlTo ? { from: urlFrom, to: urlTo } : undefined,
        sortBy: (sorting?.columnId as CostFilter['sortBy']) || 'date',
        sortOrder: sorting?.direction || 'desc',
      };

      const result = await costService.getAll(filter);
      setCosts(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'خطا در بارگذاری لیست هزینه‌ها';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [
    urlSearch,
    urlCategory,
    urlChannel,
    urlCampaignId,
    urlStatus,
    urlFrom,
    urlTo,
    sorting,
    toast,
  ]);

  // دریافت آمار از CostService (متناسب با بازه زمانی انتخابی)
  const loadStats = React.useCallback(async () => {
    try {
      setLoadingStats(true);
      const statsFilter =
        urlFrom || urlTo
          ? { dateRange: { from: urlFrom, to: urlTo } }
          : undefined;
      const res = await costService.getStats(statsFilter);
      setStats(res);
    } catch (err) {
      console.warn('[CostsPage] Error fetching stats:', err);
    } finally {
      setLoadingStats(false);
    }
  }, [urlFrom, urlTo]);

  // بارگذاری داده‌ها هنگام تغییر فیلترها یا مرتب‌سازی
  React.useEffect(() => {
    loadCosts();
  }, [loadCosts]);

  React.useEffect(() => {
    loadStats();
  }, [loadStats]);

  // مدیریت رویدادهای فیلتربار
  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    updateUrlParams({ search: val });
  };

  const handleDateRangeChange = (range: DateRangeValue) => {
    updateUrlParams({
      from: range.from || '',
      to: range.to || '',
    });
  };

  const handleFilterChange = (filterId: string, value: string | string[]) => {
    const stringVal = Array.isArray(value) ? value[0] : value;
    updateUrlParams({ [filterId]: stringVal });
  };

  const handleClearAllFilters = () => {
    setSearchInput('');
    router.push(pathname);
  };

  const hasActiveFilters = Boolean(
    urlSearch ||
      (urlCategory && urlCategory !== 'all') ||
      (urlChannel && urlChannel !== 'all') ||
      (urlCampaignId && urlCampaignId !== 'all') ||
      (urlStatus && urlStatus !== 'all') ||
      urlFrom ||
      urlTo
  );

  // کلیک روی کارت‌های آماری جهت فیلتر سریع
  const handleSummaryCardClick = (key: 'total' | 'direct' | 'pending' | 'count') => {
    if (key === 'pending') {
      updateUrlParams({ status: 'pending' });
    } else if (key === 'direct') {
      updateUrlParams({ category: 'ad_media' });
    } else {
      handleClearAllFilters();
    }
  };

  // عملیات حذف با تاییدیه
  const handleConfirmDelete = async () => {
    if (!costToDelete) return;

    if (!canDelete) {
      toast.error('خطای دسترسی: شما مجوز حذف ردیف‌های هزینه را ندارید.');
      setCostToDelete(null);
      return;
    }

    try {
      setIsDeleting(true);
      const success = await costService.delete(costToDelete.id);
      if (success) {
        toast.success(`هزینه «${costToDelete.title}» با موفقیت حذف شد.`);
        setCostToDelete(null);
        await Promise.all([loadCosts(), loadStats()]);
      } else {
        toast.error('هزینه موردنظر یافت نشد.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'خطا در حذف هزینه';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // خروجی اکسل / CSV
  const handleExportCsv = async () => {
    try {
      const filter: CostFilter = {
        search: urlSearch.trim() || undefined,
        category: urlCategory,
        channel: urlChannel,
        campaignId: urlCampaignId,
        status: urlStatus,
        dateRange: urlFrom || urlTo ? { from: urlFrom, to: urlTo } : undefined,
      };

      const csvContent = await costService.exportToCsv(filter);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `marketing_costs_${new Date().toISOString().split('T')[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('فایل گزارش هزینه‌ها با موفقیت دانلود شد.');
    } catch {
      toast.error('خطا در تولید خروجی CSV.');
    }
  };

  // ستون‌های جدول داده
  const columns: ColumnDef<CostItem, unknown>[] = React.useMemo(
    () => [
      {
        id: 'title',
        header: 'عنوان و شرح هزینه',
        sortable: true,
        accessorFn: (row) => row.title,
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <span className="font-bold text-slate-100 font-display block truncate max-w-xs sm:max-w-md">
              {row.title}
            </span>
            {row.vendor && (
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Building className="w-3 h-3 text-slate-500" />
                {row.vendor}
                {row.invoiceNumber && <span>(فاکتور: {row.invoiceNumber})</span>}
              </span>
            )}
          </div>
        ),
      },
      {
        id: 'category',
        header: 'دسته‌بندی',
        sortable: true,
        accessorFn: (row) => row.category,
        cell: ({ row }) => (
          <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-[#18263A] text-slate-300 border border-[#1F2E45]">
            {COST_CATEGORY_LABELS[row.category] || row.category}
          </span>
        ),
      },
      {
        id: 'channel',
        header: 'پلتفرم / کانال',
        sortable: true,
        accessorFn: (row) => row.channel || '',
        cell: ({ row }) =>
          row.channel ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-blue-500/10 text-[#719BDF] border border-blue-500/20">
              {COST_CHANNEL_LABELS[row.channel] || row.channel}
            </span>
          ) : (
            <span className="text-xs text-slate-500">عمومی</span>
          ),
      },
      {
        id: 'campaign',
        header: 'کمپین مرتبط',
        sortable: true,
        accessorFn: (row) => row.campaignName || '',
        cell: ({ row }) =>
          row.campaignId ? (
            <div className="space-y-0.5 max-w-[150px] truncate">
              <span className="text-xs font-semibold text-slate-200 block truncate">
                {row.campaignName || row.campaignId}
              </span>
              <span className="text-[10px] text-slate-500 font-mono block">
                {row.campaignId}
              </span>
            </div>
          ) : (
            <span className="text-xs text-slate-500">هزینه عمومی مارکتینگ</span>
          ),
      },
      {
        id: 'amount',
        header: 'مبلغ اولیه',
        align: 'left',
        accessorFn: (row) => row.amount,
        cell: ({ row }) => (
          <div className="text-xs font-mono text-slate-400">
            <span>{row.amount.toLocaleString()}</span>{' '}
            <span className="text-[11px] text-slate-500">
              {COST_CURRENCY_LABELS[row.currency]}
            </span>
          </div>
        ),
      },
      {
        id: 'normalizedAmountToman',
        header: 'معادل تومانی',
        sortable: true,
        align: 'left',
        accessorFn: (row) => row.normalizedAmountToman,
        cell: ({ row }) => (
          <div className="flex items-baseline gap-1 justify-end font-display">
            <span className="font-bold text-slate-100 text-sm">
              {formatMoneyDisplay(row.normalizedAmountToman) || '۰'}
            </span>
            <span className="text-[11px] text-slate-400 font-normal">تومان</span>
          </div>
        ),
      },
      {
        id: 'date',
        header: 'تاریخ',
        sortable: true,
        accessorFn: (row) => row.date,
        cell: ({ row }) => (
          <span className="text-xs text-slate-300 font-medium">
            {formatPersianDate(row.date)}
          </span>
        ),
      },
      {
        id: 'status',
        header: 'وضعیت پرداخت',
        sortable: true,
        accessorFn: (row) => row.status,
        cell: ({ row }) => {
          if (row.status === 'paid') {
            return (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3" />
                {COST_STATUS_LABELS.paid}
              </span>
            );
          }
          if (row.status === 'pending') {
            return (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <Clock className="w-3 h-3" />
                {COST_STATUS_LABELS.pending}
              </span>
            );
          }
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/30">
              <AlertCircle className="w-3 h-3" />
              {COST_STATUS_LABELS.draft}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'عملیات',
        align: 'center',
        cell: ({ row }) => (
          <div
            className="flex items-center justify-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-7 w-7 text-slate-400 hover:text-[#719BDF] hover:bg-[#18263A]"
              onClick={() => setSelectedCost(row)}
              title="مشاهده جزئیات"
            >
              <Eye className="w-3.5 h-3.5" />
            </Button>

            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-7 w-7 text-slate-400 hover:text-amber-400 hover:bg-[#18263A]"
                onClick={() => {
                  setCostToEdit(row);
                  setIsFormModalOpen(true);
                }}
                title="ویرایش هزینه"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </Button>
            )}

            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-7 w-7 text-slate-400 hover:text-[#D66B73] hover:bg-[#D66B73]/10"
                onClick={() => setCostToDelete(row)}
                title="حذف هزینه"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6" dir="rtl">
      {/* مسیر راهنما */}
      <Breadcrumb
        items={[
          { label: 'عملکرد و کمپین‌ها' },
          { label: 'مدیریت هزینه‌ها' },
        ]}
      />

      {/* سربرگ صفحه و دکمه‌های اقدام */}
      <div className="relative overflow-hidden rounded-2xl border border-[#1F2E45] bg-[#111D2E]/80 backdrop-blur-md p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 -ms-16 -mt-16 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight font-display flex items-center gap-2">
            <span className="w-2.5 h-6 bg-gradient-to-b from-[#719BDF] to-blue-600 rounded-full inline-block" />
            مدیریت هزینه‌های بازاریابی
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            رهگیری، تفکیک و ثبت مصارف مالی کمپین‌ها، پلتفرم‌های تبلیغاتی و هزینه‌های بازاریابی
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={costs.length === 0}
            className="text-xs bg-[#18263A] border-[#1F2E45] text-slate-300 hover:text-white hover:bg-[#1F2E45]"
          >
            <FileSpreadsheet className="w-4 h-4 me-1.5 text-emerald-400" />
            خروجی CSV
          </Button>

          {canImport && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/performance/imports?type=costs')}
              className="text-xs bg-[#18263A] border-[#1F2E45] text-slate-300 hover:text-white hover:bg-[#1F2E45]"
              title="ورود گروهی هزینه‌ها از طریق مرکز جامع ایمپورت"
            >
              <UploadCloud className="w-4 h-4 me-1.5 text-[#719BDF]" />
              ورود دسته‌ای (ایمپورت)
            </Button>
          )}

          {canCreate && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setCostToEdit(null);
                setIsFormModalOpen(true);
              }}
              className="text-xs bg-gradient-to-r from-blue-600 to-[#719BDF] text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-[#719BDF]/90"
            >
              <Plus className="w-4 h-4 me-1.5" />
              ثبت هزینه جدید
            </Button>
          )}
        </div>
      </div>

      {/* نوار خلاصه پلتفرم‌ها و شاخص‌های مالی */}
      <CostSummaryBar
        stats={stats}
        isLoading={loadingStats}
        onCardClick={handleSummaryCardClick}
      />

      {/* نوار فیلتر و جستجو */}
      <div className="bg-[#111D2E]/80 backdrop-blur-md p-4 rounded-2xl border border-[#1F2E45] shadow-xl space-y-3">
        <FilterBar
          showSearch={true}
          searchPlaceholder="جستجو در عنوان، فروشنده، فاکتور..."
          searchValue={searchInput}
          onSearchChange={handleSearchChange}
          showDateRange={true}
          dateRange={dateRange}
          onDateRangeChange={handleDateRangeChange}
          filtersConfig={filterConfigs}
          selectedFilters={{
            category: urlCategory,
            channel: urlChannel,
            campaignId: urlCampaignId,
            status: urlStatus,
          }}
          onFilterChange={handleFilterChange}
          hasActiveFilters={hasActiveFilters}
          onClearAll={handleClearAllFilters}
          actions={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                loadCosts();
                loadStats();
              }}
              disabled={loading}
              title="بارگذاری مجدد داده‌ها"
              className="text-slate-400 hover:text-white"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 me-1.5 ${loading ? 'animate-spin' : ''}`}
              />
              به‌روزرسانی
            </Button>
          }
        />
      </div>

      {/* خطای بارگذاری همراه با دکمه تلاش مجدد */}
      {error && (
        <div
          className="p-4 bg-[#D66B73]/10 border border-[#D66B73]/30 rounded-xl text-[#D66B73] text-xs flex items-center justify-between"
          role="alert"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#D66B73] shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              loadCosts();
              loadStats();
            }}
            className="text-xs text-[#D66B73] border-[#D66B73]/30 hover:bg-[#D66B73]/20"
          >
            تلاش مجدد
          </Button>
        </div>
      )}

      {/* جدول داده هزینه‌ها */}
      <div className="bg-[#111D2E]/80 backdrop-blur-md rounded-2xl border border-[#1F2E45] shadow-xl overflow-hidden">
        <DataTable
          data={costs}
          columns={columns}
          keyExtractor={(row) => row.id}
          loading={loading}
          sorting={sorting}
          onSortingChange={setSorting}
          pagination={pagination}
          onPaginationChange={setPagination}
          pageSizeOptions={[10, 25, 50]}
          onRowClick={(row) => setSelectedCost(row)}
          emptyState={
            hasActiveFilters
              ? {
                  icon: <RotateCcw className="w-10 h-10 text-gray-400" />,
                  title: 'نتیجه‌ای مطابق فیلترها یافت نشد',
                  description:
                    'می‌توانید عبارت جستجو یا فیلترهای پلتفرم و بازه زمانی را تغییر دهید.',
                  action: (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearAllFilters}
                    >
                      پاک کردن فیلترها
                    </Button>
                  ),
                }
              : {
                  icon: <Layers className="w-10 h-10 text-gray-400" />,
                  title: 'هنوز هزینه‌ای ثبت نشده است',
                  description:
                    'اولین ردیف هزینه بازاریابی خود را ثبت کنید یا فاکتورها را به صورت دسته‌ای وارد نمایید.',
                  action: (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setCostToEdit(null);
                        setIsFormModalOpen(true);
                      }}
                    >
                      <Plus className="w-4 h-4 me-1.5" />
                      ثبت اولین هزینه
                    </Button>
                  ),
                }
          }
        />
      </div>

      {/* مودال ثبت و ویرایش هزینه */}
      <CostFormModal
        isOpen={isFormModalOpen}
        cost={costToEdit}
        onClose={() => {
          setIsFormModalOpen(false);
          setCostToEdit(null);
        }}
        onSuccess={async () => {
          await Promise.all([loadCosts(), loadStats()]);
        }}
      />

      {/* کشوی مشاهده جزئیات هزینه */}
      <CostDetailDrawer
        isOpen={Boolean(selectedCost)}
        cost={selectedCost}
        onClose={() => setSelectedCost(null)}
        onEdit={(cost) => {
          setSelectedCost(null);
          setCostToEdit(cost);
          setIsFormModalOpen(true);
        }}
        onDelete={async () => {
          setSelectedCost(null);
          await Promise.all([loadCosts(), loadStats()]);
        }}
      />

      {/* مودال ورود دسته‌ای اکسل / CSV */}
      <CostImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={async () => {
          await Promise.all([loadCosts(), loadStats()]);
        }}
      />

      {/* مودال تأیید حذف مستقیم از سطر جدول */}
      <ConfirmModal
        isOpen={Boolean(costToDelete)}
        onClose={() => !isDeleting && setCostToDelete(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        variant="danger"
        title="حذف ردیف هزینه"
        message={`آیا از حذف هزینه «${costToDelete?.title}» به مبلغ ${formatMoneyDisplay(costToDelete?.normalizedAmountToman)} تومان اطمینان دارید؟`}
        confirmText="بله، حذف شود"
        cancelText="انصراف"
      />
    </div>
  );
}

export default function CostsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="space-y-6" dir="rtl">
          <div className="h-6 w-48 bg-[#18263A] rounded animate-pulse" />
          <div className="h-20 w-full bg-[#111D2E] border border-[#1F2E45] rounded-2xl animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-28 bg-[#111D2E] border border-[#1F2E45] rounded-2xl animate-pulse"
              />
            ))}
          </div>
          <div className="h-96 bg-[#111D2E] border border-[#1F2E45] rounded-2xl animate-pulse" />
        </div>
      }
    >
      <CostsPageContent />
    </React.Suspense>
  );
}
