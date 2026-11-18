'use client';

import * as React from 'react';
import { MessageSquare, Plus, RefreshCw, ShieldAlert, Info } from 'lucide-react';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/common/toast-provider';
import { useAuth } from '@/features/auth';
import {
  smsApi,
  SmsCampaignListItem,
  SmsHistoryTable,
  CreateSmsDrawer,
} from '@/features/sms';

export default function SmsHistoryPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const userRole = user?.role || 'marketing_manager';
  // PRD Page 17: Authorized roles: Marketing Manager & Campaign Manager (+ Admin)
  const canAccess = ['admin', 'marketing_manager', 'campaign_manager'].includes(userRole);

  const [isLoading, setIsLoading] = React.useState(true);
  const [items, setItems] = React.useState<SmsCampaignListItem[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    if (!canAccess) return;
    try {
      setIsLoading(true);
      const res = await smsApi.getCampaigns({ search: searchTerm || undefined });
      setItems(res.items);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'مشکل در برقراری ارتباط با سرور');
    } finally {
      setIsLoading(false);
    }
  }, [canAccess, searchTerm, toast]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!canAccess) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center mt-12 bg-[#18263A] rounded-2xl border border-rose-500/30 shadow-xl">
        <div className="w-14 h-14 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-white mb-2">عدم دسترسی به ماژول پیامک</h2>
        <p className="text-sm text-rose-300/80 mb-4">
          بر اساس سند رسمی محصول گپجی (ص ۱۷)، دسترسی به این بخش صرفاً برای نقش‌های مدیر بازاریابی
          (Marketing Manager) و مدیر کمپین (Campaign Manager) مجاز است.
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
          { label: 'پیامک' },
        ]}
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight">پیامک</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#719BDF]/15 text-[#719BDF] border border-[#719BDF]/30">
              بخش ۱۷ سند محصول
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            مدیریت تاریخچه ارسال پیامک، ایمپورت نتایج تحویل و تبدیل پاسخ‌دهندگان به لید
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
            ارسال یا ثبت پیامک جدید
          </Button>
        </div>
      </div>

      {/* Provider Boundary Notice */}
      <div className="p-4 bg-[#111D2E]/80 backdrop-blur-md border border-[#1F2E45] rounded-2xl shadow-xl shadow-black/20 flex items-start gap-3">
        <Info className="w-5 h-5 text-[#719BDF] flex-shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 leading-relaxed">
          <strong className="text-white">نحوه اتصال به پنل پیامکی:</strong> ارسال پیامک و ثبت آمارهای تحویل از طریق وب‌سرویس
          ارائه‌دهندگان پیامکی و همچنین امکان <strong className="text-white">ایمپورت مستقیم فایل اکسل/CSV نتایج ارسال</strong>{' '}
          (اکشن ۱ سند محصول) انجام می‌پذیرد. همچنین شماره‌های همراه مخاطبان به دلایل امنیتی در تمام
          جداول به‌صورت ماسک‌شده نمایش داده می‌شوند.
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="flex items-center justify-between gap-4 bg-[#111D2E]/80 backdrop-blur-md p-3.5 rounded-2xl border border-[#1F2E45] shadow-xl shadow-black/20">
        <div className="flex items-center gap-2 w-full sm:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجوی عنوان کمپین، متن پیامک..."
            className="w-full h-9 px-3 bg-[#0B1423] border border-[#1F2E45] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#719BDF]"
          />
        </div>
      </div>

      {/* SMS History Table */}
      <SmsHistoryTable
        items={items}
        isLoading={isLoading}
        onOpenCreate={() => setIsCreateOpen(true)}
      />

      {/* Create SMS Drawer/Modal */}
      <CreateSmsDrawer
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          fetchData();
          toast.success('ارسال پیامکی جدید با موفقیت ثبت شد.');
        }}
      />
    </div>
  );
}
