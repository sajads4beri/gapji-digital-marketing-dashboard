'use client';

import * as React from 'react';
import {
  Users,
  Plus,
  RefreshCw,
  Search,
  LayoutGrid,
  Table as TableIcon,
  ShieldAlert,
} from 'lucide-react';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/common/empty-state';
import { useToast } from '@/components/common/toast-provider';
import { useAuth } from '@/features/auth';
import {
  Audience,
  AudienceGender,
  AudienceQueryFilter,
  audiencesApi,
  AudienceCard,
  AudiencesTable,
  AudienceDrawer,
  AudienceDeleteDialog,
} from '@/features/audiences';

export default function PerformanceAudiencesPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const userRole = user?.role || 'campaign_manager';
  // Admin & Marketing Manager have full CRUD; Campaign Manager has read access
  const canManage = ['admin', 'marketing_manager'].includes(userRole);
  const canView = ['admin', 'marketing_manager', 'campaign_manager'].includes(userRole);

  const [audiences, setAudiences] = React.useState<Audience[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [genderFilter, setGenderFilter] = React.useState<string>('all');
  const [channelFilter, setChannelFilter] = React.useState<string>('');
  const [viewMode, setViewMode] = React.useState<'grid' | 'table'>('grid');

  // Drawer & Dialog states
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [editingAudience, setEditingAudience] = React.useState<Audience | null>(null);

  const [deletingAudience, setDeletingAudience] = React.useState<Audience | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Fetch audiences list
  const fetchAudiences = React.useCallback(async () => {
    if (!canView) return;

    setIsLoading(true);
    try {
      const filter: AudienceQueryFilter = {
        search: searchTerm.trim() || undefined,
        gender: genderFilter !== 'all' ? (genderFilter as AudienceGender) : undefined,
        channel: channelFilter.trim() || undefined,
      };

      const res = await audiencesApi.getAll(filter);
      setAudiences(res.items || []);
    } catch (err: any) {
      console.error('Failed to load audiences:', err);
      toast.error('خطا در واکشی فهرست مخاطبان هدف رخ داد.', {
        title: 'خطا در بارگذاری',
      });
    } finally {
      setIsLoading(false);
    }
  }, [canView, searchTerm, genderFilter, channelFilter, toast]);

  React.useEffect(() => {
    fetchAudiences();
  }, [fetchAudiences]);

  const handleOpenAddDrawer = () => {
    setEditingAudience(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEditDrawer = (aud: Audience) => {
    setEditingAudience(aud);
    setIsDrawerOpen(true);
  };

  const handleDuplicate = async (aud: Audience) => {
    try {
      const dup = await audiencesApi.duplicate(aud.id);
      toast.success(`مخاطب «${dup.name}» با موفقیت کپی شد.`, {
        title: 'کپی موفق',
      });
      fetchAudiences();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'امکان کپی کردن مخاطب وجود ندارد.', {
        title: 'خطا در کپی',
      });
    }
  };

  const handleOpenDelete = (aud: Audience) => {
    setDeletingAudience(aud);
  };

  const handleConfirmDelete = async () => {
    if (!deletingAudience) return;

    setIsDeleting(true);
    try {
      await audiencesApi.delete(deletingAudience.id);
      toast.success(`مخاطب «${deletingAudience.name}» با موفقیت حذف گردید.`, {
        title: 'حذف موفق',
      });
      setDeletingAudience(null);
      fetchAudiences();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'خطا در حذف مخاطب.', {
        title: 'عدم امکان حذف',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!canView) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-rose-500/30 bg-[#18263A] p-8 text-center text-rose-300">
          <ShieldAlert className="mx-auto h-12 w-12 text-rose-400 mb-3" />
          <h2 className="text-lg font-bold text-white">عدم دسترسی به ماژول مخاطبان</h2>
          <p className="mt-2 text-xs text-rose-300/80 max-w-md mx-auto">
            بر اساس سند رسمی محصول (REQ-23)، تنها نقش‌های مدیر ارشد (Admin)، مدیر بازاریابی و مدیر کمپین مجوز دسترسی به این بخش را دارند.
          </p>
        </div>
      </div>
    );
  }

  const isFiltered = Boolean(searchTerm || genderFilter !== 'all' || channelFilter);

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'فضای کاری ۱: عملکرد', href: '/performance/dashboard' },
          { label: 'مخاطبان', href: '/performance/audiences' },
        ]}
      />

      {/* هدر صفحه: عنوان، راهنما و دکمه اقدام اصلی */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#18263A] border border-[#1F2E45] text-[#719BDF] shadow-lg shadow-black/20">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">مخاطبان (Audiences)</h1>
              <span className="rounded-full bg-[#719BDF]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[#719BDF] border border-[#719BDF]/30">
                مخاطب = گروه هدف کمپین
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              تعریف پرسونا، رده‌های سنی، موقعیت مکانی و کانال مناسب جهت اتصال به کمپین‌های بازاریابی
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* دکمه سوییچ نمای کارتی و جدولی */}
          <div className="flex items-center rounded-xl border border-[#1F2E45] bg-[#0B1423] p-1">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              title="نمای کارتی"
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-[#18263A] text-[#719BDF] shadow-sm font-bold border border-[#1F2E45]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              title="نمای جدولی"
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table'
                  ? 'bg-[#18263A] text-[#719BDF] shadow-sm font-bold border border-[#1F2E45]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TableIcon className="h-4 w-4" />
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchAudiences}
            disabled={isLoading}
            className="text-xs gap-1.5 bg-[#18263A] border-[#1F2E45] text-slate-300 hover:text-white hover:bg-[#1F2E45]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            بروزرسانی
          </Button>

          {canManage && (
            <Button
              onClick={handleOpenAddDrawer}
              size="sm"
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs gap-1.5 shadow-md shadow-blue-900/30 font-medium"
            >
              <Plus className="h-4 w-4" />
              مخاطب جدید
            </Button>
          )}
        </div>
      </div>

      {/* نوار جستجو و فیلترها */}
      <div className="rounded-2xl border border-[#1F2E45] bg-[#111D2E]/80 backdrop-blur-md p-4 shadow-xl shadow-black/20">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* فیلد جستجو */}
          <div className="sm:col-span-6 relative">
            <Search className="absolute right-3.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجو در نام مخاطب، علایق، شهرها..."
              className="ps-10 text-xs bg-[#0B1423] border-[#1F2E45] text-white placeholder-slate-500 focus:border-[#719BDF]"
            />
          </div>

          {/* فیلتر جنسیت */}
          <div className="sm:col-span-3">
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="w-full rounded-xl border border-[#1F2E45] bg-[#0B1423] px-3 py-2 text-xs text-slate-200 focus:border-[#719BDF] focus:outline-none focus:ring-1 focus:ring-[#719BDF]"
            >
              <option value="all">همه جنسیت‌ها</option>
              <option value="male">فقط آقایان</option>
              <option value="female">فقط خانم‌ها</option>
            </select>
          </div>

          {/* فیلتر کانال مناسب */}
          <div className="sm:col-span-3">
            <Input
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              placeholder="فیلتر کانال (مثلا: اینستاگرام)"
              className="text-xs bg-[#0B1423] border-[#1F2E45] text-white placeholder-slate-500 focus:border-[#719BDF]"
            />
          </div>
        </div>
      </div>

      {/* بخش نمایش محتوا */}
      {isLoading && audiences.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-56 rounded-2xl border border-[#1F2E45] bg-[#111D2E]/80 backdrop-blur-md p-5 animate-pulse space-y-3">
              <div className="h-5 w-3/4 bg-[#18263A] rounded" />
              <div className="h-3 w-1/2 bg-[#18263A]/60 rounded" />
              <div className="h-16 bg-[#18263A]/40 rounded-xl" />
              <div className="h-8 bg-[#18263A]/60 rounded" />
            </div>
          ))}
        </div>
      ) : audiences.length === 0 ? (
        <div className="rounded-2xl border border-[#1F2E45] bg-[#111D2E]/80 backdrop-blur-md p-8">
          <EmptyState
            title={isFiltered ? 'مخاطبی مطابق با فیلترها یافت نشد' : 'مخاطب = گروه هدف کمپین'}
            description={
              isFiltered
                ? 'با تغییر عبارات جستجو یا پاکسازی فیلترها، مجدداً تلاش فرمایید.'
                : 'هنوز هیچ گروه مخاطبی تعریف نشده است. با تعریف مخاطبان هدف، می‌توانید آن‌ها را در مرحله ۲ ویزارد کمپین‌ها متصل کرده و نرخ تبدیل و عملکرد کمپین‌ها را تحلیل کنید.'
            }
            action={
              canManage && !isFiltered
                ? {
                    label: 'تعریف اولین مخاطب',
                    onClick: handleOpenAddDrawer,
                  }
                : undefined
            }
          />
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {audiences.map((aud) => (
            <AudienceCard
              key={aud.id}
              audience={aud}
              onEdit={handleOpenEditDrawer}
              onDuplicate={handleDuplicate}
              onDelete={handleOpenDelete}
            />
          ))}
        </div>
      ) : (
        <AudiencesTable
          audiences={audiences}
          isLoading={isLoading}
          onEdit={handleOpenEditDrawer}
          onDuplicate={handleDuplicate}
          onDelete={handleOpenDelete}
        />
      )}

      {/* دراور افزودن و ویرایش مخاطب */}
      <AudienceDrawer
        isOpen={isDrawerOpen}
        audience={editingAudience}
        onClose={() => setIsDrawerOpen(false)}
        onSuccess={() => fetchAudiences()}
      />

      {/* دیالوگ حذف مخاطب */}
      <AudienceDeleteDialog
        isOpen={Boolean(deletingAudience)}
        audience={deletingAudience}
        isDeleting={isDeleting}
        onClose={() => setDeletingAudience(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
