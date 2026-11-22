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
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/common/toast-provider';
import { useAuth } from '@/features/auth/auth-context';
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
  const { activeRole, user } = useAuth();
  const isAdmin = activeRole === 'admin' || user?.role === 'admin';

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

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  React.useEffect(() => {
    refreshCounts();
  }, [refreshCounts]);

  React.useEffect(() => {
    if (tabParam && !VALID_TAB_KEYS.includes(tabParam)) {
      const current = new URLSearchParams(searchParams.toString());
      current.delete('tab');
      const qs = current.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
    }
  }, [tabParam, pathname, router, searchParams]);

  const handleTabChange = (tab: OrgTabKey) => {
    if (tab === activeTab) return;

    const current = new URLSearchParams(searchParams.toString());
    if (tab === 'campaign_types') {
      current.delete('tab');
    } else {
      current.set('tab', tab);
    }
    const qs = current.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
  };

  const handleOpenCreateModal = () => {
    setItemModalMode('create');
    setSelectedItem(null);
    setIsItemModalOpen(true);
  };

  const handleOpenEditModal = (item: OrgListItem) => {
    setItemModalMode('edit');
    setSelectedItem(item);
    setIsItemModalOpen(true);
  };

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

  const handleOpenToggleModal = (item: OrgListItem) => {
    setItemToToggle(item);
    setIsToggleModalOpen(true);
  };

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
    <div className="space-y-6 pb-12 text-slate-100" dir="rtl">
      {/* ۱. مسیر راهنما (Breadcrumb) */}
      <Breadcrumb
        items={[
          { label: 'تنظیمات سامانه', href: '#' },
          { label: 'تنظیمات سازمان' },
        ]}
      />

      {/* ۲. سربرگ اصلی صفحه با استایل لوکس Midnight Executive */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2.5 font-display">
            <span className="w-2.5 h-6 bg-[#719BDF] rounded-full inline-block shadow-[0_0_12px_rgba(113,155,223,0.4)]" />
            <span>تنظیمات سازمان</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
            مدیریت فهرست‌های پایه (انواع کمپین، منابع لید، وضعیت‌ها، دلایل رد شدن، دسته‌بندی هزینه‌ها) و تنظیمات عمومی سازمان
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="text-xs border-[#1F2E45] bg-[#111D2E] text-slate-200 hover:bg-[#18263A] hover:border-[#719BDF]/40 transition-all"
            title="به‌روزرسانی داده‌ها"
          >
            <RefreshCw size={14} className={`me-1.5 ${loading ? 'animate-spin' : ''}`} />
            به‌روزرسانی
          </Button>

          {isListTab && isAdmin && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreateModal}
              className="text-xs bg-gradient-to-r from-[#719BDF] to-[#3B82F6] hover:from-[#5e8bd8] hover:to-[#2563eb] text-white shadow-[0_0_15px_rgba(113,155,223,0.25)] border-0 transition-all"
            >
              <Plus size={14} className="me-1.5" />
              افزودن گزینه جدید
            </Button>
          )}
        </div>
      </div>

      {/* بنر اطلاع‌رسانی دسترسی فقط‌خواندنی برای کاربران غیر ادمین */}
      {!isAdmin && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-2xl flex items-center gap-2.5 text-xs text-amber-200 animate-in fade-in">
          <ShieldAlert size={16} className="text-amber-400 shrink-0" />
          <span>
            <strong>حالت فقط‌خواندنی:</strong> شما با نقش «{activeRole || 'کاربر'}» وارد شده‌اید. مشاهده تنظیمات سازمان مجاز بوده، اما افزودن، ویرایش و فعال/غیرفعال‌سازی گزینه‌ها منحصراً در اختیارات ادمین (Admin) سازمان می‌باشد.
          </span>
        </div>
      )}

      {/* ۳. نوار ۶ تب اصلی صفحه */}
      <div className="flex border-b border-[#1F2E45] overflow-x-auto scrollbar-none">
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
                  ? 'border-[#719BDF] text-[#719BDF] bg-[#111D2E] rounded-t-xl shadow-xs'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-[#1F2E45]'
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {count !== null && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold tabular-nums ${
                    isActive
                      ? 'bg-[#719BDF]/15 text-[#719BDF] border border-[#719BDF]/30'
                      : 'bg-[#18263A] text-slate-400 border border-[#1F2E45]'
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
        <div className="bg-[#D66B73]/15 p-4 rounded-2xl border border-[#D66B73]/30 text-xs text-[#D66B73] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-[#D66B73] shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            className="border-[#D66B73]/30 text-[#D66B73] hover:bg-[#D66B73]/10 text-xs"
          >
            تلاش دوباره
          </Button>
        </div>
      )}

      {/* ۵. محتوای تب فعال */}
      {isListTab ? (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* برای تب وضعیت‌های لید: سوئیچ بین نمای جدول و نمای تفکیک گروه‌ها */}
          {activeTab === 'lead_statuses' && (
            <div className="flex items-center justify-between gap-3 bg-[#111D2E] p-3 rounded-2xl border border-[#1F2E45] shadow-lg">
              <span className="text-xs font-bold text-slate-300">
                شیوه نمایش وضعیت‌های لید:
              </span>

              <div className="flex items-center gap-1 bg-[#0B1423] p-1 rounded-xl border border-[#1F2E45]">
                <button
                  type="button"
                  onClick={() => setLeadStatusViewMode('table')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    leadStatusViewMode === 'table'
                      ? 'bg-[#18263A] text-[#719BDF] shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
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
                      ? 'bg-[#18263A] text-[#719BDF] shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
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
              onEditStatus={isAdmin ? (st) => handleOpenEditModal(st) : undefined}
              onToggleStatus={isAdmin ? (st) => handleOpenToggleModal(st) : undefined}
            />
          ) : (
            <OrgListTable
              listType={activeTab as OrgListType}
              items={listItems}
              isLoading={loading}
              error={error}
              onRetry={fetchData}
              onAddNew={isAdmin ? handleOpenCreateModal : undefined}
              onEdit={isAdmin ? handleOpenEditModal : undefined}
              onToggleStatus={isAdmin ? handleOpenToggleModal : undefined}
              onReorder={isAdmin ? handleReorder : undefined}
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
            readOnly={!isAdmin}
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
          <div className="h-6 w-48 bg-[#18263A] rounded-md animate-pulse" />
          <div className="h-10 w-full bg-[#18263A] rounded-xl animate-pulse" />
          <div className="h-64 w-full bg-[#18263A] rounded-2xl animate-pulse" />
        </div>
      }
    >
      <OrganizationSettingsContent />
    </React.Suspense>
  );
}
