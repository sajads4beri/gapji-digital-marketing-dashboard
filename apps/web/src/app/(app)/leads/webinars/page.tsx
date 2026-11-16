'use client';

import * as React from 'react';
import { Plus, RefreshCw, ShieldAlert } from 'lucide-react';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/common/toast-provider';
import { useAuth } from '@/features/auth';
import {
  webinarsApi,
  WebinarListItem,
  WebinarListTable,
  CreateWebinarDrawer,
} from '@/features/webinars';

export default function WebinarsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const userRole = user?.role || 'marketing_manager';
  // PRD Page 17 & 18: Authorized roles: Content Creator (مسئول وبینار), Marketing Manager (+ Admin)
  const canAccess = ['admin', 'marketing_manager', 'content_creator'].includes(userRole);

  const [isLoading, setIsLoading] = React.useState(true);
  const [items, setItems] = React.useState<WebinarListItem[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    if (!canAccess) return;
    try {
      setIsLoading(true);
      const res = await webinarsApi.getWebinars({
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setItems(res.items);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'مشکل در برقراری ارتباط با سرور');
    } finally {
      setIsLoading(false);
    }
  }, [canAccess, searchTerm, statusFilter, toast]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!canAccess) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center mt-12 bg-[#18263A] rounded-2xl border border-rose-500/30 shadow-xl">
        <div className="w-14 h-14 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-white mb-2">عدم دسترسی به ماژول وبینار</h2>
        <p className="text-sm text-rose-300/80 mb-4">
          بر اساس سند رسمی محصول گپجی (ص ۱۷ و ۱۸)، دسترسی به این بخش صرفاً برای نقش‌های تولید محتوا و
          مسئول وبینار (Content Creator) و مدیر بازاریابی (Marketing Manager) مجاز است.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 p-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'فضای کاری ۱: عملکرد', href: '/performance/dashboard' },
          { label: 'سرنخ‌ها و ارتباطات', href: '/leads' },
          { label: 'وبینارها' },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight">وبینارها</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#719BDF]/15 text-[#719BDF] border border-[#719BDF]/30">
              بخش ۱۸ سند محصول
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            برنامه‌ریزی، پیگیری ثبت‌نام و حضور، مدیریت تجهیزات، تسک‌ها و تبدیل حاضران به لید
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={isLoading}
            className="text-xs bg-[#18263A] border-[#1F2E45] text-slate-300 hover:text-white hover:bg-[#1F2E45]"
          >
            <RefreshCw className={`w-3.5 h-3.5 me-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            بروزرسانی
          </Button>

          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs shadow-md shadow-blue-900/30 font-medium"
          >
            <Plus className="w-4 h-4 me-1.5" />
            تعریف وبینار جدید
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#111D2E]/80 backdrop-blur-md p-3.5 rounded-2xl border border-[#1F2E45] shadow-xl shadow-black/20">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجوی عنوان، مدرس، پلتفرم..."
            className="w-full sm:w-72 h-9 px-3 bg-[#0B1423] border border-[#1F2E45] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#719BDF]"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 bg-[#0B1423] border border-[#1F2E45] rounded-xl text-xs text-white focus:outline-none focus:border-[#719BDF]"
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="draft">پیش‌نویس</option>
            <option value="scheduled">زمان‌بندی‌شده</option>
            <option value="live">در حال برگزاری</option>
            <option value="completed">پایان‌یافته</option>
            <option value="cancelled">لغوشده</option>
          </select>
        </div>
      </div>

      {/* Webinar List Table */}
      <WebinarListTable
        items={items}
        isLoading={isLoading}
        onOpenCreate={() => setIsCreateOpen(true)}
      />

      {/* Create Webinar Drawer */}
      <CreateWebinarDrawer
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          fetchData();
          toast.success('وبینار جدید در وضعیت پیش‌نویس با موفقیت ثبت شد.');
        }}
      />
    </div>
  );
}
