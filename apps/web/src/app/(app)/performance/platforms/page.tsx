'use client';

import * as React from 'react';
import {
  Layers,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
} from 'lucide-react';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/common/toast-provider';
import { useAuth } from '@/features/auth';
import { canAccessRoute } from '@/lib/permissions';
import {
  Platform,
  PlatformTemplate,
  PlatformQueryFilter,
  platformsApi,
  PlatformsTable,
  PlatformDrawer,
  PlatformDeactivateDialog,
} from '@/features/platforms';

export default function PerformancePlatformsPage() {
  const { activeRole } = useAuth();
  const { toast } = useToast();

  // کنترل دسترسی مرکزی بر مبنای سند محصول (REQ-19): تنها admin و marketing_manager
  const isAuthorized = canAccessRoute('/performance/platforms', activeRole);

  const [platforms, setPlatforms] = React.useState<Platform[]>([]);
  const [templates, setTemplates] = React.useState<PlatformTemplate[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'active' | 'inactive'>('all');

  // وضعیت دراور افزودن و ویرایش
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [editingPlatform, setEditingPlatform] = React.useState<Platform | null>(null);

  // وضعیت دیالوگ غیرفعال‌سازی
  const [deactivatingPlatform, setDeactivatingPlatform] = React.useState<Platform | null>(null);

  // واکشی پلتفرم‌ها و قالب‌های آماده
  const fetchPlatforms = React.useCallback(async () => {
    if (!isAuthorized) return;

    setIsLoading(true);
    try {
      const filter: PlatformQueryFilter = {
        search: searchTerm || undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        status: statusFilter,
      };

      const [plats, tpls] = await Promise.all([
        platformsApi.getPlatforms(filter),
        platformsApi.getTemplates(),
      ]);

      setPlatforms(plats);
      setTemplates(tpls);
    } catch (err: any) {
      console.error('Failed to load platforms:', err);
      toast.error('خطا در بارگذاری فهرست پلتفرم‌ها.');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthorized, searchTerm, selectedCategory, statusFilter, toast]);

  React.useEffect(() => {
    fetchPlatforms();
  }, [fetchPlatforms]);

  // باز کردن دراور در حالت افزودن پلتفرم
  const handleOpenAddDrawer = () => {
    setEditingPlatform(null);
    setIsDrawerOpen(true);
  };

  // باز کردن دراور در حالت ویرایش پلتفرم
  const handleOpenEditDrawer = (platform: Platform) => {
    setEditingPlatform(platform);
    setIsDrawerOpen(true);
  };

  // فعال‌سازی مجدد پلتفرم غیرفعال‌شده
  const handleActivatePlatform = async (platform: Platform) => {
    try {
      const updated = await platformsApi.activatePlatform(platform.id);
      toast.success(`پلتفرم «${updated.name}» با موفقیت فعال شد.`);
      setPlatforms((prev) => prev.map((p) => (p.id === updated.id ? { ...p, isActive: true } : p)));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'خطا در فعال‌سازی پلتفرم.');
    }
  };

  // پس از ذخیره موفق در دراور
  const handleSavedSuccess = () => {
    fetchPlatforms();
  };

  // پس از غیرفعال‌سازی موفق
  const handleDeactivateSuccess = (updated: Platform) => {
    setPlatforms((prev) => prev.map((p) => (p.id === updated.id ? { ...p, isActive: false } : p)));
  };

  // در صورت عدم دسترسی نقشی طبق قانون REQ-19
  if (!isAuthorized) {
    return (
      <div className="space-y-6" dir="rtl">
        <Breadcrumb
          items={[
            { label: 'فضای کاری ۱: عملکرد', href: '/performance/dashboard' },
            { label: 'پلتفرم‌ها' },
          ]}
        />

        <div className="rounded-2xl border border-rose-500/25 bg-[#111D2E]/80 backdrop-blur-md p-8 text-center space-y-3 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 mx-auto flex items-center justify-center border border-rose-500/25">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-white">
            عدم دسترسی به ماژول پلتفرم‌ها (۴۰۳ Forbidden)
          </h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            بر اساس سند مشخصات فنی و نقش‌های سامانه مارکتینگ گپ‌جی (REQ-19)، تنها نقش‌های <strong className="text-slate-200">مدیر ارشد (Admin)</strong> و <strong className="text-slate-200">مدیر مارکتینگ (Marketing Manager)</strong> مجاز به مشاهده و مدیریت پلتفرم‌ها هستند.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* مسیر ناوبری (Breadcrumb) استاندارد پروژه */}
      <Breadcrumb
        items={[
          { label: 'فضای کاری ۱: عملکرد', href: '/performance/dashboard' },
          { label: 'پلتفرم‌ها' },
        ]}
      />

      {/* سربرگ استاندارد هماهنگ با طراحی Midnight Executive */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#1F2E45]/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#719BDF]/10 text-[#719BDF] flex items-center justify-center border border-[#719BDF]/20 shrink-0 shadow-[0_0_15px_rgba(113,155,223,0.15)]">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight font-display">
              پلتفرم‌ها (Platforms)
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              مدیریت کانال‌های تبلیغاتی، روش‌های دریافت داده، پیکربندی ورودی‌ها و ستون‌های قالب گزارش (REQ-19)
            </p>
          </div>
        </div>

        {/* دکمه‌های اقدام اصلی */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPlatforms}
            disabled={isLoading}
            className="text-xs bg-[#111D2E]/80 border-[#1F2E45] text-slate-300 hover:text-white hover:bg-[#18263A] backdrop-blur-md"
          >
            <RefreshCw className={`w-3.5 h-3.5 me-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            به‌روزرسانی
          </Button>

          <Button
            onClick={handleOpenAddDrawer}
            variant="primary"
            size="sm"
            className="text-xs font-semibold bg-[#719BDF] hover:bg-[#5A85C9] text-white shadow-md shadow-[#719BDF]/20"
          >
            <Plus className="w-4 h-4 me-1.5" />
            افزودن پلتفرم
          </Button>
        </div>
      </div>

      {/* نوار جستجو و فیلترهای استاندارد */}
      <div className="p-3.5 rounded-2xl border border-[#1F2E45] bg-[#111D2E]/80 backdrop-blur-md shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* جستجوی متنی */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجو در نام یا کد پلتفرم..."
            className="ps-9 text-xs h-9 bg-[#0B1423] border-[#1F2E45] text-white placeholder:text-slate-500 rounded-xl"
          />
        </div>

        {/* فیلترها و تب‌های وضعیت */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* فیلتر دسته‌بندی */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs h-9 rounded-xl border border-[#1F2E45] bg-[#0B1423] px-3 text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-[#719BDF]/40 cursor-pointer"
          >
            <option value="all" className="bg-[#0B1423] text-white">همه دسته‌بندی‌ها</option>
            <option value="digital" className="bg-[#0B1423] text-white">تبلیغات دیجیتال</option>
            <option value="social" className="bg-[#0B1423] text-white">شبکه‌های اجتماعی</option>
            <option value="sms" className="bg-[#0B1423] text-white">پیامک</option>
            <option value="ad_network" className="bg-[#0B1423] text-white">شبکه تبلیغاتی</option>
          </select>

          {/* تب‌های وضعیت فعال/غیرفعال */}
          <div className="flex items-center p-1 rounded-xl bg-[#0B1423] border border-[#1F2E45] text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                statusFilter === 'all'
                  ? 'bg-[#18263A] text-white shadow-sm font-bold border border-[#1F2E45]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              همه ({platforms.length.toLocaleString('fa-IR')})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                statusFilter === 'active'
                  ? 'bg-[#18263A] text-white shadow-sm font-bold border border-[#1F2E45]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              فعال ({platforms.filter((p) => p.isActive).length.toLocaleString('fa-IR')})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                statusFilter === 'inactive'
                  ? 'bg-[#18263A] text-white shadow-sm font-bold border border-[#1F2E45]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              غیرفعال ({platforms.filter((p) => !p.isActive).length.toLocaleString('fa-IR')})
            </button>
          </div>
        </div>
      </div>

      {/* جدول داده‌های پلتفرم‌ها (مطابق الزامات ستون‌های REQ-19) */}
      <PlatformsTable
        platforms={platforms}
        isLoading={isLoading}
        onEdit={handleOpenEditDrawer}
        onDeactivate={(p) => setDeactivatingPlatform(p)}
        onActivate={handleActivatePlatform}
        onAddNew={handleOpenAddDrawer}
      />

      {/* کشوی افزودن و ویرایش پلتفرم (Platform Drawer) */}
      <PlatformDrawer
        isOpen={isDrawerOpen}
        platform={editingPlatform}
        templates={templates}
        onClose={() => setIsDrawerOpen(false)}
        onSuccess={handleSavedSuccess}
      />

      {/* دیالوگ تأیید غیرفعال‌سازی با نمایش تعداد واقعی کمپین‌های در حال استفاده */}
      <PlatformDeactivateDialog
        isOpen={!!deactivatingPlatform}
        platform={deactivatingPlatform}
        onClose={() => setDeactivatingPlatform(null)}
        onSuccess={handleDeactivateSuccess}
      />
    </div>
  );
}
