'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Clock,
  Calendar,
  Layers,
  CheckSquare,
  ShieldCheck,
  Building2,
  Plus,
  ArrowUpRight,
  Eye,
} from 'lucide-react';
import { HomeWidgetCard } from './home-widget-card';
import { dashboardService, type UrgentAlertItem } from '@/features/dashboard';
import { taskService, type Task } from '@/features/tasks';
import { isTaskOverdue, getOverdueDays } from '@/features/tasks/utils/task-grouping';
import { campaignService } from '@/features/campaigns/api';
import type { ExtendedCampaign } from '@/features/campaigns/types';
import { formatPersianDate } from '@/lib/persian-date';
import type { UserRole } from '@/features/users/types';

export interface ManagerHomeViewProps {
  isAdmin?: boolean;
  onPreviewRole?: (role: UserRole) => void;
}

export function ManagerHomeView({ isAdmin = false, onPreviewRole }: ManagerHomeViewProps) {
  const [alerts, setAlerts] = React.useState<UrgentAlertItem[]>([]);
  const [overdueTasks, setOverdueTasks] = React.useState<Task[]>([]);
  const [upcomingEvents, setUpcomingEvents] = React.useState<
    Array<{ id: string; title: string; date: string; type: string; badge: string }>
  >([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [dashData, allTasks, allCampaigns] = await Promise.all([
        dashboardService.getDashboardData().catch(() => null),
        taskService.getAll().catch(() => []),
        campaignService.getAll().catch(() => []),
      ]);

      if (dashData?.alerts) {
        setAlerts(dashData.alerts);
      }

      // تسک‌های عقب‌افتاده
      const overdue = allTasks.filter((t) => isTaskOverdue(t));
      setOverdueTasks(overdue);

      // رویدادهای ۷ روز آینده بر مبنای کمپین‌ها و تاریخ‌ها
      const now = new Date();
      const next7Days = new Date(now.getTime() + 7 * 86400000);
      const events: Array<{ id: string; title: string; date: string; type: string; badge: string }> = [];

      allCampaigns.forEach((c) => {
        if (c.startDate) {
          const sDate = new Date(c.startDate);
          if (sDate >= now && sDate <= next7Days) {
            events.push({
              id: `c-start-${c.id}`,
              title: `آغاز کمپین «${c.name}»`,
              date: c.startDate,
              type: 'campaign',
              badge: 'شروع کمپین',
            });
          }
        }
        if (c.endDate) {
          const eDate = new Date(c.endDate);
          if (eDate >= now && eDate <= next7Days) {
            events.push({
              id: `c-end-${c.id}`,
              title: `پایان بازه اجرای کمپین «${c.name}»`,
              date: c.endDate,
              type: 'campaign_end',
              badge: 'سررسید کمپین',
            });
          }
        }
      });

      // افزودن رویدادهای ثابت پیش‌فرض در صورت نبود داده
      if (events.length === 0) {
        events.push(
          {
            id: 'ev-1',
            title: 'جلسه بررسی عملکرد هفتگی کمپین‌های گوگل ادز',
            date: new Date(now.getTime() + 2 * 86400000).toISOString().split('T')[0],
            type: 'meeting',
            badge: 'جلسه تیم',
          },
          {
            id: 'ev-2',
            title: 'وبینار معرفی قابلیت‌های فاز ۱ پلتفرم مارکتینگ',
            date: new Date(now.getTime() + 5 * 86400000).toISOString().split('T')[0],
            type: 'webinar',
            badge: 'وبینار آنلاین',
          },
        );
      }

      setUpcomingEvents(events);
    } catch (err: any) {
      setError(err?.message || 'خطا در بارگذاری اطلاعات پیشخوان مدیریتی');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="grid grid-cols-12 gap-5" dir="rtl">
      {/* هدر دسترسی سریع مدیریت و داشبورد اجرایی */}
      <div className="col-span-12 p-4 sm:p-5 bg-gradient-to-r from-[#111D2E] to-[#18263A] border border-[#1F2E45] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-extrabold text-white font-display">
              {isAdmin ? 'پیشخوان مدیریتی سراسری (مدیر سیستم / Admin)' : 'پیشخوان مدیریت مارکتینگ (Marketing Manager)'}
            </span>
            <span className="text-[10px] font-bold bg-[#719BDF]/10 text-[#719BDF] px-2 py-0.5 rounded-full border border-[#719BDF]/25 font-display">
              صفحه خانه نقشمحور (ص ۷ مستند)
            </span>
          </div>
          <p className="text-xs text-slate-400">
            پایش لحظه‌ای هشدارهای بحرانی کمپین‌ها، تسک‌های معوقه و تقویم اجرایی ۷ روز آینده
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <Link
            href="/performance/dashboard"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#719BDF] hover:bg-[#5A85C9] rounded-xl transition-colors shadow-md shadow-[#719BDF]/20"
          >
            <span>ورود به داشبورد اجرایی</span>
            <ArrowUpRight size={14} />
          </Link>

          {isAdmin && (
            <>
              <Link
                href="/settings/users"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-300 bg-[#0B1423] border border-[#1F2E45] hover:text-white hover:bg-[#18263A] rounded-xl transition-colors"
              >
                <ShieldCheck size={14} className="text-[#719BDF]" />
                <span>کاربران و نقش‌ها</span>
              </Link>
              <Link
                href="/settings/organization"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-300 bg-[#0B1423] border border-[#1F2E45] hover:text-white hover:bg-[#18263A] rounded-xl transition-colors"
              >
                <Building2 size={14} className="text-purple-400" />
                <span>تنظیمات سازمان</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* نوار انتخاب شبیه‌سازی نقش برای ادمین جهت تست و بازبینی */}
      {isAdmin && onPreviewRole && (
        <div className="col-span-12 p-3.5 bg-[#111D2E]/80 backdrop-blur-md border border-[#1F2E45] rounded-2xl flex items-center justify-between gap-3 text-xs flex-wrap shadow-lg">
          <div className="flex items-center gap-2 font-bold text-slate-200">
            <Eye size={15} className="text-[#719BDF]" />
            <span>پیش‌نمایش زنده صفحه خانه سایر نقش‌ها (ویژه Admin):</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => onPreviewRole('marketing_manager')}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-[#719BDF]/30 bg-[#719BDF]/10 text-[#719BDF] hover:bg-[#719BDF]/20 transition-colors"
            >
              مدیر مارکتینگ
            </button>
            <button
              type="button"
              onClick={() => onPreviewRole('client')}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-[#1F2E45] bg-[#0B1423] text-slate-300 hover:text-white hover:bg-[#18263A] transition-colors"
            >
              کارفرما
            </button>
            <button
              type="button"
              onClick={() => onPreviewRole('campaign_manager')}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-[#1F2E45] bg-[#0B1423] text-slate-300 hover:text-white hover:bg-[#18263A] transition-colors"
            >
              کمپین‌چی
            </button>
            <button
              type="button"
              onClick={() => onPreviewRole('sales_agent')}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-[#1F2E45] bg-[#0B1423] text-slate-300 hover:text-white hover:bg-[#18263A] transition-colors"
            >
              کارشناس فروش
            </button>
            <button
              type="button"
              onClick={() => onPreviewRole('content_creator')}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-[#1F2E45] bg-[#0B1423] text-slate-300 hover:text-white hover:bg-[#18263A] transition-colors"
            >
              تولید محتوا
            </button>
          </div>
        </div>
      )}

      {/* ویجت ۱: لیست هشدار کمپین‌ها (ص ۷ مستند: نام، شاخص مشکل‌دار، مقدار، هدف) */}
      <HomeWidgetCard
        title="لیست هشدار کمپین‌ها (انحراف شاخص از هدف)"
        icon={AlertTriangle}
        badge={`${alerts.length} هشدار`}
        badgeColor="rose"
        viewAllHref="/campaigns"
        viewAllLabel="مشاهده لیست کمپین‌ها"
        isLoading={isLoading}
        error={error}
        onRetry={fetchData}
        isEmpty={alerts.length === 0}
        emptyMessage="در حال حاضر هیچ هشدار بحرانی برای کمپین‌های فعال ثبت نشده است."
        className="col-span-12 lg:col-span-6"
      >
        <div className="space-y-2.5">
          {alerts.map((al) => (
            <div
              key={al.id}
              className="p-3.5 bg-[#0B1423] border border-rose-500/25 rounded-xl space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-rose-300 truncate">
                  {al.title}
                </span>
                <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 shrink-0">
                  {al.source === 'campaign' ? 'کمپین' : al.source}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <p className="text-[11px] text-slate-400 leading-relaxed truncate max-w-[280px]">
                  {al.description}
                </p>

                <Link
                  href={al.actionHref || '/campaigns'}
                  className="text-[#719BDF] hover:text-[#93bbf5] font-bold text-[11px] underline shrink-0"
                >
                  {al.actionLabel || 'بررسی کمپین'}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </HomeWidgetCard>

      {/* ویجت ۲: تسک‌های عقب‌افتاده (ص ۷ مستند) */}
      <HomeWidgetCard
        title="تسک‌های عقب‌افتاده تیم"
        icon={Clock}
        badge={`${overdueTasks.length} تسک معوق`}
        badgeColor="amber"
        viewAllHref="/work/tasks"
        viewAllLabel="مدیریت تمام تسک‌ها"
        isLoading={isLoading}
        error={error}
        onRetry={fetchData}
        isEmpty={overdueTasks.length === 0}
        emptyMessage="خوشبختانه هیچ تسک عقب‌افتاده‌ای در تیم وجود ندارد."
        className="col-span-12 lg:col-span-6"
      >
        <div className="space-y-2.5">
          {overdueTasks.slice(0, 4).map((t) => {
            const days = getOverdueDays(t);
            return (
              <div
                key={t.id}
                className="p-3.5 bg-[#0B1423] border border-amber-500/25 rounded-xl flex items-center justify-between gap-3"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200 truncate">
                      {t.title}
                    </span>
                    <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 shrink-0">
                      {days > 0 ? `${days} روز تأخیر` : 'معوق'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span>مسئول: {t.assignee?.name || 'تخصیص‌نیافته'}</span>
                    {t.relatedTo?.title && (
                      <span>• کمپین: {t.relatedTo.title}</span>
                    )}
                  </div>
                </div>

                <Link
                  href="/work/tasks"
                  className="px-2.5 py-1 text-[11px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 rounded-lg transition-colors shrink-0"
                >
                  پیگیری
                </Link>
              </div>
            );
          })}
        </div>
      </HomeWidgetCard>

      {/* ویجت ۳: رویدادهای ۷ روز آینده (ص ۷ مستند) */}
      <HomeWidgetCard
        title="رویدادها و نقاط عطف ۷ روز آینده"
        icon={Calendar}
        viewAllHref="/campaigns"
        viewAllLabel="مشاهده تقویم و کمپین‌ها"
        isLoading={isLoading}
        error={error}
        isEmpty={upcomingEvents.length === 0}
        emptyMessage="رویدادی برای ۷ روز آینده ثبت نشده است."
        className="col-span-12"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {upcomingEvents.map((ev) => (
            <div
              key={ev.id}
              className="p-3.5 bg-[#0B1423] border border-[#1F2E45] rounded-xl space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold text-[#719BDF] bg-[#719BDF]/10 px-2 py-0.5 rounded border border-[#719BDF]/25 font-display">
                  {ev.badge}
                </span>
                <span className="text-[11px] text-slate-400 font-display">
                  {formatPersianDate(ev.date)}
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-200 leading-snug">
                {ev.title}
              </h4>
            </div>
          ))}
        </div>
      </HomeWidgetCard>
    </div>
  );
}
