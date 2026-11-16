'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Video,
  CheckSquare,
  Calendar,
  Box,
} from 'lucide-react';
import { HomeWidgetCard } from './home-widget-card';
import { taskService, type Task } from '@/features/tasks';
import { useAuth } from '@/features/auth';
import type { EquipmentCheckItem } from '../types';

export function ContentCreatorHomeView() {
  const { user } = useAuth();
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [equipmentList] = React.useState<EquipmentCheckItem[]>([
    {
      id: 'eq-1',
      name: 'میکروفون بویا بی‌سیم استودیو',
      category: 'صدا و ضبط',
      status: 'ready',
      relatedEvent: 'وبینار لیدجنریشن فاز ۱',
      responsibleName: 'تیم تولید محتوا',
    },
    {
      id: 'eq-2',
      name: 'رینگ‌لایت و نورپردازی پرتابل',
      category: 'نورپردازی',
      status: 'missing',
      relatedEvent: 'ضبط ویدیوی دموی محصول',
      responsibleName: 'پشتیبانی استودیو',
    },
    {
      id: 'eq-3',
      name: 'لایسنس نرم‌افزار استریم OBS / وبینار',
      category: 'نرم‌افزار',
      status: 'in_progress',
      relatedEvent: 'وبینار هفتگی مشتریان',
      responsibleName: 'مدیر فنی مارکتینگ',
    },
    {
      id: 'eq-4',
      name: 'دوربین وب‌کم 4K لاجیتک',
      category: 'تصویربرداری',
      status: 'ready',
      relatedEvent: 'جلسه ارائه استراتژی محتوا',
      responsibleName: 'تولید محتوا',
    },
  ]);

  const fetchData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const allTasks = await taskService.getAll();
      setTasks(allTasks);
    } catch (err: any) {
      setError(err?.message || 'خطا در بارگذاری تسک‌های تولید محتوا');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // تسک‌های من (تخصیص‌یافته به کاربر یا وظایف محتوایی)
  const myTasks = React.useMemo(() => {
    return tasks.filter(
      (t) =>
        t.assignee?.name === user?.fullName ||
        t.title.includes('محتوا') ||
        t.title.includes('ویدیو') ||
        t.title.includes('وبینار') ||
        t.title.includes('لندینگ'),
    );
  }, [tasks, user]);

  const handleToggleTask = async (task: Task) => {
    try {
      const newStatus = task.status === 'done' ? 'in_progress' : 'done';
      await taskService.updateStatus(task.id, newStatus);
      fetchData();
    } catch (err: any) {
      console.error('Error toggling task:', err);
    }
  };

  const missingEquipmentCount = equipmentList.filter((e) => e.status !== 'ready').length;

  return (
    <div className="grid grid-cols-12 gap-5" dir="rtl">
      {/* هدر پیشخوان تولید محتوا و وبینار */}
      <div className="col-span-12 p-4 sm:p-5 bg-gradient-to-r from-[#111D2E] to-[#18263A] border border-[#1F2E45] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.15)] shrink-0">
            <Video size={20} />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-white font-display">
              پیشخوان تولید محتوا و وبینار (Content & Webinar Creator)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              مدیریت وظایف تولید محتوا، تقویم زمان‌بندی انتشارات و چک‌لیست تجهیزات استودیو
            </p>
          </div>
        </div>

        <Link
          href="/work/tasks"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors shadow-md shadow-purple-900/30 shrink-0 self-start sm:self-auto"
        >
          <CheckSquare size={14} />
          <span>مشاهده و مدیریت تسک‌ها</span>
        </Link>
      </div>

      {/* ویجت ۱: تسک‌های من (الزام صریح سند: ص ۷) */}
      <HomeWidgetCard
        title="تسک‌های من (My Tasks)"
        icon={CheckSquare}
        badge={myTasks.length > 0 ? `${myTasks.length} تسک فعال` : undefined}
        badgeColor="purple"
        viewAllHref="/work/tasks"
        viewAllLabel="مشاهده در ماژول تسک‌ها"
        isLoading={isLoading}
        error={error}
        onRetry={fetchData}
        isEmpty={myTasks.length === 0}
        emptyMessage="تسک فعالی برای شما ثبت نشده است."
        className="col-span-12 lg:col-span-6"
      >
        <div className="space-y-2.5">
          {myTasks.slice(0, 5).map((t) => {
            const isCompleted = t.status === 'done';
            return (
              <div
                key={t.id}
                className="p-3.5 bg-[#0B1423] border border-[#1F2E45] rounded-xl flex items-center justify-between gap-3 group hover:border-purple-500/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <input
                    type="checkbox"
                    checked={isCompleted}
                    onChange={() => handleToggleTask(t)}
                    aria-label={`تغییر وضعیت تسک ${t.title}`}
                    className="w-4 h-4 rounded border-[#1F2E45] bg-[#0E1726] text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                  <div className="space-y-0.5 min-w-0">
                    <span
                      className={`text-xs font-bold block truncate ${
                        isCompleted ? 'line-through text-slate-500' : 'text-slate-100'
                      }`}
                    >
                      {t.title}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-display">
                      سررسید: {t.dueDate || 'تعیین‌نشده'} • اولویت: {t.priority}
                    </span>
                  </div>
                </div>

                <Link
                  href="/work/tasks"
                  className="text-[11px] font-bold text-purple-400 hover:text-purple-300 shrink-0"
                >
                  ویرایش
                </Link>
              </div>
            );
          })}
        </div>
      </HomeWidgetCard>

      {/* ویجت ۲: تقویم هفته (الزام صریح سند: ص ۷) */}
      <HomeWidgetCard
        title="تقویم هفته و جدول انتشار محتوا"
        icon={Calendar}
        badge="هفته جاری"
        badgeColor="blue"
        viewAllHref="/work/tasks"
        viewAllLabel="تقویم وظایف"
        className="col-span-12 lg:col-span-6"
      >
        <div className="space-y-2.5">
          <div className="p-3.5 bg-[#0B1423] border border-[#719BDF]/30 rounded-xl flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-extrabold text-white block">
                انتشار ویدیوی معرفی فیچرهای نسخه فاز ۱
              </span>
              <span className="text-[11px] text-slate-400">
                پلتفرم: آپارات، یوتیوب و کانال‌های ویدیویی
              </span>
            </div>
            <span className="text-[10px] font-bold bg-[#719BDF]/10 text-[#719BDF] px-2 py-0.5 rounded border border-[#719BDF]/25 shrink-0 font-display">
              دوشنبه
            </span>
          </div>

          <div className="p-3.5 bg-[#0B1423] border border-[#1F2E45] rounded-xl flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-200 block">
                تولید محتوای پست متنی و گرافیکی برای کمپین تخفیف
              </span>
              <span className="text-[11px] text-slate-400">
                فرمت: اسلایدر و کاروسل لینکدین
              </span>
            </div>
            <span className="text-[10px] font-bold bg-[#18263A] text-slate-300 px-2 py-0.5 rounded border border-[#1F2E45] shrink-0 font-display">
              چهارشنبه
            </span>
          </div>

          <div className="p-3.5 bg-[#0B1423] border border-[#1F2E45] rounded-xl flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-200 block">
                وبینار بررسی شاخص‌های عملکرد بازاریابی
              </span>
              <span className="text-[11px] text-slate-400">
                ارائه زنده با اسلایدهای تعاملی
              </span>
            </div>
            <span className="text-[10px] font-bold bg-[#18263A] text-slate-300 px-2 py-0.5 rounded border border-[#1F2E45] shrink-0 font-display">
              جمعه
            </span>
          </div>
        </div>
      </HomeWidgetCard>

      {/* ویجت ۳: تجهیزات ناقص و چک‌لیست وبینار (الزام صریح سند: ص ۷) */}
      <HomeWidgetCard
        title="تجهیزات ناقص و چک‌لیست تجهیزات استودیو/وبینار"
        icon={Box}
        badge={
          missingEquipmentCount > 0 ? `${missingEquipmentCount} مورد نیازمند پیگیری` : 'همه آماده'
        }
        badgeColor={missingEquipmentCount > 0 ? 'amber' : 'emerald'}
        viewAllHref="/work/tasks"
        viewAllLabel="مشاهده چک‌لیست تجهیزات"
        className="col-span-12"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {equipmentList.map((eq) => {
            const isMissing = eq.status === 'missing';
            const isInProgress = eq.status === 'in_progress';

            return (
              <div
                key={eq.id}
                className={`p-3.5 rounded-xl border space-y-2 bg-[#0B1423] ${
                  isMissing
                    ? 'border-rose-500/25'
                    : isInProgress
                    ? 'border-amber-500/25'
                    : 'border-[#1F2E45]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-slate-400">
                    {eq.category}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isMissing
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        : isInProgress
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}
                  >
                    {isMissing ? 'ناقص / ناموجود' : isInProgress ? 'در دست اقدام' : 'آماده'}
                  </span>
                </div>

                <h4 className="text-xs font-extrabold text-white leading-snug">
                  {eq.name}
                </h4>

                <div className="text-[11px] text-slate-400 pt-1.5 border-t border-[#1F2E45] space-y-0.5">
                  <p className="truncate">رویداد: {eq.relatedEvent}</p>
                  <p className="text-[10px] text-slate-500">مسئول: {eq.responsibleName}</p>
                </div>
              </div>
            );
          })}
        </div>
      </HomeWidgetCard>
    </div>
  );
}
