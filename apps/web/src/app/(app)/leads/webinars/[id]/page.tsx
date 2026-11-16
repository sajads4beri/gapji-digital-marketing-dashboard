'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowRight,
  Info,
  Users,
  Wrench,
  CheckSquare,
  RefreshCw,
  ShieldAlert,
  Video,
  Building,
} from 'lucide-react';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/common/toast-provider';
import { useAuth } from '@/features/auth';
import {
  webinarsApi,
  WebinarDetail,
  WebinarInfoTab,
  WebinarAttendeesTab,
  WebinarEquipmentTab,
  WebinarTasksTab,
} from '@/features/webinars';

export default function WebinarDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const { user } = useAuth();
  const { toast } = useToast();

  const userRole = user?.role || 'marketing_manager';
  const canAccess = ['admin', 'marketing_manager', 'content_creator'].includes(userRole);

  const [activeTab, setActiveTab] = React.useState<'info' | 'attendees' | 'equipment' | 'tasks'>(
    'info',
  );
  const [isLoading, setIsLoading] = React.useState(true);
  const [webinar, setWebinar] = React.useState<WebinarDetail | null>(null);

  const fetchWebinar = React.useCallback(async () => {
    if (!id || !canAccess) return;
    try {
      setIsLoading(true);
      const data = await webinarsApi.getWebinarDetail(id);
      setWebinar(data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'وبینار مورد نظر یافت نشد');
    } finally {
      setIsLoading(false);
    }
  }, [id, canAccess, toast]);

  React.useEffect(() => {
    fetchWebinar();
  }, [fetchWebinar]);

  if (!canAccess) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center mt-12 bg-[#18263A] rounded-2xl border border-rose-500/30 shadow-xl">
        <div className="w-14 h-14 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-white mb-2">عدم دسترسی به جزئیات وبینار</h2>
        <p className="text-sm text-rose-300/80 mb-4">
          دسترسی به این بخش صرفاً برای نقش‌های تولید محتوا و مسئول وبینار (Content Creator) و مدیر بازاریابی مجاز است.
        </p>
      </div>
    );
  }

  if (isLoading && !webinar) {
    return (
      <div className="p-16 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#719BDF]"></div>
        <p className="mt-3 text-sm text-slate-400">در حال بارگذاری اطلاعات ۴ تب وبینار...</p>
      </div>
    );
  }

  if (!webinar) {
    return (
      <div className="p-16 text-center bg-[#111D2E]/80 backdrop-blur-md rounded-2xl border border-[#1F2E45] shadow-xl mt-6">
        <h3 className="text-base font-bold text-white">وبینار مورد نظر یافت نشد</h3>
        <Link
          href="/leads/webinars"
          className="mt-4 inline-flex items-center text-sm font-medium text-[#719BDF] hover:underline"
        >
          <ArrowRight className="w-4 h-4 me-1" />
          بازگشت به فهرست وبینارها
        </Link>
      </div>
    );
  }

  const renderStatusBadge = () => {
    switch (webinar.status) {
      case 'draft':
        return (
          <Badge variant="outline" className="bg-[#18263A] text-slate-300 border-[#1F2E45]">
            پیش‌نویس
          </Badge>
        );
      case 'scheduled':
        return <Badge className="bg-[#719BDF]/15 text-[#719BDF] border-[#719BDF]/30">زمان‌بندی‌شده</Badge>;
      case 'live':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 animate-pulse">
            در حال برگزاری (Live)
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-purple-500/10 text-purple-300 border-purple-500/20">پایان‌یافته</Badge>
        );
      case 'cancelled':
        return <Badge className="bg-rose-500/10 text-rose-300 border-rose-500/20">لغوشده</Badge>;
      default:
        return <Badge variant="outline">{webinar.status}</Badge>;
    }
  };

  const tabs = [
    { key: 'info', label: 'اطلاعات و تنظیمات', icon: Info, count: null },
    {
      key: 'attendees',
      label: 'شرکت‌کنندگان و فانل',
      icon: Users,
      count: webinar.funnel.registeredCount,
    },
    {
      key: 'equipment',
      label: 'تجهیزات و آمادگی',
      icon: Wrench,
      count: webinar.equipmentSummary.total,
    },
    {
      key: 'tasks',
      label: 'تسک‌های هماهنگی',
      icon: CheckSquare,
      count: webinar.tasks.length,
    },
  ];

  return (
    <div className="space-y-6 pb-12 p-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'فضای کاری ۱: عملکرد', href: '/performance/dashboard' },
          { label: 'وبینارها', href: '/leads/webinars' },
          { label: webinar.title },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#111D2E]/80 backdrop-blur-md p-5 rounded-2xl border border-[#1F2E45] shadow-xl shadow-black/20">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Link
              href="/leads/webinars"
              className="p-1.5 rounded-xl border border-[#1F2E45] bg-[#18263A] text-slate-300 hover:text-white hover:bg-[#1F2E45] transition-colors"
              title="بازگشت به لیست وبینارها"
            >
              <ArrowRight className="w-4 h-4" />
            </Link>
            <h1 className="text-xl font-black text-white tracking-tight">{webinar.title}</h1>
            {renderStatusBadge()}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 ms-8">
            <div className="flex items-center gap-1">
              <Video className="w-3.5 h-3.5 text-slate-500" />
              <span>مدرس: {webinar.presenterName} ({webinar.platform})</span>
            </div>
            {webinar.campaignName && (
              <div className="flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-slate-500" />
                <span>کمپین: {webinar.campaignName}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchWebinar}
            disabled={isLoading}
            className="text-xs bg-[#18263A] border-[#1F2E45] text-slate-300 hover:text-white hover:bg-[#1F2E45]"
          >
            <RefreshCw className={`w-3.5 h-3.5 me-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            بروزرسانی داده‌ها
          </Button>
        </div>
      </div>

      {/* 4 Tabs Navigation (ص ۱۸ سند محصول) */}
      <div className="border-b border-[#1F2E45]">
        <nav className="flex space-x-6 space-x-reverse" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-3 px-1 border-b-2 font-medium text-xs flex items-center gap-2 transition-colors ${
                  isActive
                    ? 'border-[#719BDF] text-[#719BDF] font-bold'
                    : 'border-transparent text-slate-400 hover:text-white hover:border-[#1F2E45]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#719BDF]' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full tabular-nums ${
                      isActive
                        ? 'bg-[#719BDF]/20 text-[#719BDF] font-bold border border-[#719BDF]/30'
                        : 'bg-[#18263A] text-slate-400 border border-[#1F2E45]'
                    }`}
                  >
                    {tab.count.toLocaleString('fa-IR')}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Contents */}
      {activeTab === 'info' && <WebinarInfoTab webinar={webinar} onRefresh={fetchWebinar} />}
      {activeTab === 'attendees' && (
        <WebinarAttendeesTab webinar={webinar} onRefresh={fetchWebinar} />
      )}
      {activeTab === 'equipment' && (
        <WebinarEquipmentTab webinar={webinar} onRefresh={fetchWebinar} />
      )}
      {activeTab === 'tasks' && <WebinarTasksTab webinar={webinar} onRefresh={fetchWebinar} />}
    </div>
  );
}
