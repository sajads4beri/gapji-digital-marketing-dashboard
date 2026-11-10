'use client';

import * as React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  Layers,
  Inbox,
  CheckSquare,
  XCircle,
  DollarSign,
  Building2,
  Plus,
  RefreshCw,
  AlertTriangle,
  LayoutGrid,
  List,
  LucideIcon,
} from 'lucide-react';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/common/toast-provider';
import {
  organizationService,
  OrgListType,
  OrgListItem,
  OrgLeadStatusItem,
  OrganizationGeneralSettings,
  UpdateGeneralSettingsInput,
  LeadStatusGroup,
  ORG_LIST_TITLES,
  OrgListTable,
  OrgItemModal,
  OrgToggleStatusModal,
  LeadStatusGroupsView,
  GeneralSettingsForm,
} from '@/features/organization';

export type OrgTabKey = OrgListType | 'general';

interface TabDefinition {
  key: OrgTabKey;
  label: string;
  icon: LucideIcon;
  description: string;
  isList: boolean;
}

const ORG_TABS: TabDefinition[] = [
  {
    key: 'campaign_types',
    label: 'انواع کمپین',
    icon: Layers,
    description: 'مدیریت انواع کمپین‌های بازاریابی (گوگل ادز، متا، پیامک، ریتارگتینگ و ...)',
    isList: true,
  },
  {
    key: 'lead_sources',
    label: 'منابع لید',
    icon: Inbox,
    description: 'تعریف کانال‌های ورودی لیدها (وبسایت، اینستاگرام، تماس تلفنی، معرفی و ...)',
    isList: true,
  },
  {
    key: 'lead_statuses',
    label: 'وضعیت‌های لید',
    icon: CheckSquare,
    description: 'مراحل چرخه پیگیری فروش در سه گروه اصلی باز (Open)، برنده (Won) و بازنده (Lost)',
    isList: true,
  },
  {
    key: 'lost_reasons',
    label: 'دلایل ردشدن لید',
    icon: XCircle,
    description: 'دلایل استاندارد انصراف یا عدم موفقیت لیدها (قیمت بالا، خرید از رقبا و ...)',
    isList: true,
  },
  {
    key: 'cost_categories',
    label: 'دسته‌بندی هزینه',
    icon: DollarSign,
    description: 'سرفصل‌های هزینه‌کرد مارکتینگ (تبلیغات آنلاین، تولید محتوا، اینفلوئنسر و ...)',
    isList: true,
  },
  {
    key: 'general',
    label: 'تنظیمات عمومی',
    icon: Building2,
    description: 'نام رسمی سازمان، لوگو، واحد پول اصلی کل سامانه و منطقه زمانی',
    isList: false,
  },
];

const VALID_TAB_KEYS: OrgTabKey[] = ORG_TABS.map((t) => t.key);

function OrganizationSettingsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // خواندن تب فعال از پارامترهای آدرس با مقدار پیش‌فرض 'campaign_types'
  const tabParam = searchParams.get('tab') as OrgTabKey | null;
  const activeTab: OrgTabKey =
    tabParam && VALID_TAB_KEYS.includes(tabParam) ? tabParam : 'campaign_types';

  // State داده‌ها
  const [listItems, setListItems] = React.useState<OrgListItem[]>([]);
  const [generalSettings, setGeneralSettings] =
    React.useState<OrganizationGeneralSettings | null>(null);
  const [counts, setCounts] = React.useState<Record<OrgListType, number>>({
    campaign_types: 0,
    lead_sources: 0,
    lead_statuses: 0,
    lost_reasons: 0,
    cost_categories: 0,
  });

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isSavingGeneral, setIsSavingGeneral] = React.useState(false);

  // حالت نمایش برای تب وضعیت‌های لید (جدول یا نمای گروه‌ها)
  const [leadStatusViewMode, setLeadStatusViewMode] = React.useState<'table' | 'groups'>('table');

  // کنترل وضعیت مودال‌ها
  const [isItemModalOpen, setIsItemModalOpen] = React.useState(false);
  const [itemModalMode, setItemModalMode] = React.useState<'create' | 'edit'>('create');
  const [selectedItem, setSelectedItem] = React.useState<OrgListItem | null>(null);

  const [isToggleModalOpen, setIsToggleModalOpen] = React.useState(false);
  const [itemToToggle, setItemToToggle] = React.useState<OrgListItem | null>(null);
  const [isActionLoading, setIsActionLoading] = React.useState(false);

  // به‌روزرسانی شمارنده تمامی تب‌ها
  const refreshCounts = React.useCallback(async () => {
    try {
      const listTypes: OrgListType[] = [
        'campaign_types',
        'lead_sources',
        'lead_statuses',
        'lost_reasons',
        'cost_categories',
      ];
      const results = await Promise.all(
        listTypes.map((type) => organizationService.getListItems(type))
      );
      const newCounts: Record<OrgListType, number> = {
        campaign_types: results[0].length,
        lead_sources: results[1].length,
        lead_statuses: results[2].length,
        lost_reasons: results[3].length,
        cost_categories: results[4].length,
      };
      setCounts(newCounts);
    } catch (err) {
      console.error('Failed to load counts:', err);
    }
  }, []);

  // واکشی داده‌های تب فعال
  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (activeTab === 'general') {
        const generalData = await organizationService.getGeneralSettings();
        setGeneralSettings(generalData);
      } else {
        const items = await organizationService.getListItems(activeTab);
        setListItems(items);
        setCounts((prev) => ({ ...prev, [activeTab]: items.length }));
      }
    } catch (err: any) {
      console.error('Error fetching organization data:', err);
      const msg = err?.message || 'خطا در بارگذاری اطلاعات تنظیمات سازمان.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [activeTab, toast]);

  // بارگذاری داده‌ها با تغییر تب فعال
  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // بارگذاری اولیه شمارنده‌ها
  React.useEffect(() => {
    refreshCounts();
  }, [refreshCounts]);

  // اصلاح امن پارامتر نامعتبر URL بدون افزودن به تاریخچه (با استفاده از router.replace)
  React.useEffect(() => {
    if (tabParam && !VALID_TAB_KEYS.includes(tabParam)) {
      const current = new URLSearchParams(searchParams.toString());
      current.delete('tab');
      const qs = current.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
    }
  }, [tabParam, pathname, router, searchParams]);

  // تغییر تب توسط کاربر و ثبت در تاریخچه مرورگر (router.push) جهت پشتیبانی از دکمه‌های Back و Forward
  const handleTabChange = (tab: OrgTabKey) => {
    if (tab === activeTab) return; // جلوگیری از ثبت تاریخچه تکراری برای تب در حال نمایش

    const current = new URLSearchParams(searchParams.toString());
    if (tab === 'campaign_types') {
      current.delete('tab');
    } else {
      current.set('tab', tab);
    }
    const qs = current.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
  };

  // باز کردن مودال ایجاد گزینه جدید
  const handleOpenCreateModal = () => {
    setItemModalMode('create');
    setSelectedItem(null);
    setIsItemModalOpen(true);
  };

  // باز کردن مودال ویرایش گزینه
  const handleOpenEditModal = (item: OrgListItem) => {
    setItemModalMode('edit');
    setSelectedItem(item);
    setIsItemModalOpen(true);
  };

  // ارسال فرم ایجاد یا ویرایش گزینه
  const handleItemSubmit = async (data: {
    label: string;
    key?: string;
    group?: LeadStatusGroup;
    isActive?: boolean;
  }) => {
    if (activeTab === 'general') return;

    try {
      setIsActionLoading(true);
      if (itemModalMode === 'create') {
        await organizationService.createListItem(activeTab, data);
        toast.success(`گزینه «${data.label}» با موفقیت افزوده شد.`);
      } else if (itemModalMode === 'edit' && selectedItem) {
        await organizationService.updateListItem(activeTab, selectedItem.id, data);
        toast.success(`تغییرات گزینه «${data.label}» با موفقیت ذخیره شد.`);
      }
      setIsItemModalOpen(false);
      setSelectedItem(null);
      await fetchData();
      await refreshCounts();
    } catch (err: any) {
      toast.error(err?.message || 'خطا در ثبت اطلاعات گزینه.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // باز کردن مودال فعال / غیرفعال‌سازی
  const handleOpenToggleModal = (item: OrgListItem) => {
    setItemToToggle(item);
    setIsToggleModalOpen(true);
  };

  // تأیید فعال / غیرفعال‌سازی
  const handleConfirmToggleStatus = async (item: OrgListItem) => {
    if (activeTab === 'general') return;

    try {
      setIsActionLoading(true);
      const updated = await organizationService.toggleListItemStatus(activeTab, item.id);
      const actionText = updated.isActive ? 'فعال' : 'غیرفعال';
      toast.success(`گزینه «${item.label}» با موفقیت ${actionText} شد.`);
      setIsToggleModalOpen(false);
      setItemToToggle(null);
      await fetchData();
    } catch (err: any) {
      toast.error(err?.message || 'خطا در تغییر وضعیت گزینه.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // تغییر ترتیب گزینه‌ها (Drag & Drop)
  const handleReorder = async (orderedIds: string[]) => {
    if (activeTab === 'general') return;

    try {
      const updated = await organizationService.reorderListItems(activeTab, orderedIds);
      setListItems(updated);
      toast.success('ترتیب نمایش گزینه‌ها با موفقیت به‌روزرسانی شد.');
    } catch (err: any) {
      toast.error(err?.message || 'خطا در ذخیره‌سازی ترتیب گزینه‌ها.');
      await fetchData();
    }
  };

  // ذخیره تنظیمات عمومی سازمان
  const handleSaveGeneralSettings = async (data: UpdateGeneralSettingsInput) => {
    try {
      setIsSavingGeneral(true);
      const saved = await organizationService.updateGeneralSettings(data);
      setGeneralSettings(saved);
      toast.success('تنظیمات عمومی سازمان با موفقیت به‌روزرسانی شد.');
    } catch (err: any) {
      toast.error(err?.message || 'خطا در ذخیره تنظیمات عمومی.');
    } finally {
      setIsSavingGeneral(false);
    }
  };

  const currentTabDef = ORG_TABS.find((t) => t.key === activeTab) || ORG_TABS[0];
  const isListTab = currentTabDef.isList;

  return (
    <div className="space-y-6 pb-12" dir="rtl">
      {/* ۱. مسیر راهنما (Breadcrumb) */}
      <Breadcrumb
        items={[
          { label: 'تنظیمات سامانه', href: '#' },
          { label: 'تنظیمات سازمان' },
        ]}
      />

      {/* ۲. سربرگ اصلی صفحه */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span className="w-2.5 h-6 bg-purple-600 rounded-full inline-block" />
            تنظیمات سازمان
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
            مدیریت فهرست‌های پایه (انواع کمپین، منابع لید، وضعیت‌ها، دلایل رد شدن، دسته‌بندی هزینه‌ها) و تنظیمات عمومی سازمان
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="text-xs"
            title="به‌روزرسانی داده‌ها"
          >
            <RefreshCw size={14} className={`ml-1.5 ${loading ? 'animate-spin' : ''}`} />
            به‌روزرسانی
          </Button>

          {isListTab && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreateModal}
              className="text-xs bg-purple-600 hover:bg-purple-700 text-white shadow-2xs hover:shadow-xs"
            >
              <Plus size={14} className="ml-1.5" />
              افزودن گزینه جدید
            </Button>
          )}
        </div>
      </div>

      {/* ۳. نوار ۶ تب اصلی صفحه */}
      <div className="flex border-b border-slate-200 overflow-x-auto scrollbar-none">
        {ORG_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          const count = tab.isList ? counts[tab.key as OrgListType] : null;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabChange(tab.key)}
              className={`flex items-center gap-2 py-3 px-4 sm:px-5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'border-purple-600 text-purple-700 bg-purple-50/40 rounded-t-xl'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {count !== null && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                    isActive
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {count.toLocaleString('fa-IR')}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ۴. خطای بارگذاری */}
      {error && (
        <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} className="text-xs">
            تلاش دوباره
          </Button>
        </div>
      )}

      {/* ۵. محتوای تب فعال */}
      {isListTab ? (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* برای تب وضعیت‌های لید: سوئیچ بین نمای جدول و نمای تفکیک گروه‌ها */}
          {activeTab === 'lead_statuses' && (
            <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-xs font-bold text-slate-700">
                شیوه نمایش وضعیت‌های لید:
              </span>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setLeadStatusViewMode('table')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    leadStatusViewMode === 'table'
                      ? 'bg-white text-purple-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <List size={13} />
                  <span>جدول و ترتیب (Drag & Drop)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLeadStatusViewMode('groups')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    leadStatusViewMode === 'groups'
                      ? 'bg-white text-purple-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LayoutGrid size={13} />
                  <span>تفکیک ۳ گروه اصلی (Open/Won/Lost)</span>
                </button>
              </div>
            </div>
          )}

          {/* رندر جدول یا نمای گروه‌ها */}
          {activeTab === 'lead_statuses' && leadStatusViewMode === 'groups' ? (
            <LeadStatusGroupsView
              statuses={listItems as OrgLeadStatusItem[]}
              onEditStatus={(st) => handleOpenEditModal(st)}
              onToggleStatus={(st) => handleOpenToggleModal(st)}
            />
          ) : (
            <OrgListTable
              listType={activeTab as OrgListType}
              items={listItems}
              isLoading={loading}
              error={error}
              onRetry={fetchData}
              onAddNew={handleOpenCreateModal}
              onEdit={handleOpenEditModal}
              onToggleStatus={handleOpenToggleModal}
              onReorder={handleReorder}
            />
          )}
        </div>
      ) : (
        /* تب تنظیمات عمومی */
        <div className="animate-in fade-in duration-200">
          <GeneralSettingsForm
            initialData={generalSettings || undefined}
            isLoading={loading}
            isSaving={isSavingGeneral}
            onSave={handleSaveGeneralSettings}
          />
        </div>
      )}

      {/* ۶. مودال ایجاد یا ویرایش گزینه */}
      {isListTab && (
        <OrgItemModal
          isOpen={isItemModalOpen}
          mode={itemModalMode}
          listType={activeTab as OrgListType}
          item={selectedItem}
          isLoading={isActionLoading}
          onClose={() => {
            setIsItemModalOpen(false);
            setSelectedItem(null);
          }}
          onSubmit={handleItemSubmit}
        />
      )}

      {/* ۷. مودال تأیید فعال / غیرفعال‌سازی */}
      {isListTab && (
        <OrgToggleStatusModal
          isOpen={isToggleModalOpen}
          item={itemToToggle}
          listType={activeTab as OrgListType}
          isLoading={isActionLoading}
          onClose={() => {
            setIsToggleModalOpen(false);
            setItemToToggle(null);
          }}
          onConfirm={handleConfirmToggleStatus}
        />
      )}
    </div>
  );
}

export default function OrganizationSettingsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="space-y-6 p-6" dir="rtl">
          <div className="h-6 w-48 bg-slate-100 rounded-md animate-pulse" />
          <div className="h-10 w-full bg-slate-100 rounded-xl animate-pulse" />
          <div className="h-64 w-full bg-slate-100 rounded-2xl animate-pulse" />
        </div>
      }
    >
      <OrganizationSettingsContent />
    </React.Suspense>
  );
}
