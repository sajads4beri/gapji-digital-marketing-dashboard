'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Video,
  CheckSquare,
  Calendar,
  Box,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Plus,
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

  const [equipmentList, setEquipmentList] = React.useState<EquipmentCheckItem[]>([
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
      <div className="col-span-12 p-4 bg-gradient-to-r from-purple-50/80 to-indigo-50/50 border border-purple-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-xs">
            <Video size={20} />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900">
              پیشخوان تولید محتوا و وبینار (Content & Webinar Creator)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              مدیریت وظایف تولید محتوا، تقویم زمان‌بندی انتشارات و چک‌لیست تجهیزات استودیو
            </p>
          </div>
        </div>

        <Link
          href="/work/tasks"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors shadow-xs shrink-0 self-start sm:self-auto"
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
                className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3 group hover:border-purple-200 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <input
                    type="checkbox"
                    checked={isCompleted}
                    onChange={() => handleToggleTask(t)}
                    aria-label={`تغییر وضعیت تسک ${t.title}`}
                    className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                  <div className="space-y-0.5 min-w-0">
                    <span
                      className={`text-xs font-bold block truncate ${
                        isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
                      }`}
                    >
                      {t.title}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      سررسید: {t.dueDate || 'تعیین‌نشده'} • اولویت: {t.priority}
                    </span>
                  </div>
                </div>

                <Link
                  href="/work/tasks"
                  className="text-[11px] font-bold text-purple-700 hover:text-purple-800 shrink-0"
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
          <div className="p-3 bg-blue-50/50 border border-blue-200/70 rounded-xl flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-extrabold text-blue-950 block">
                انتشار ویدیوی معرفی فیچرهای نسخه فاز ۱
              </span>
              <span className="text-[11px] text-blue-800">
                پلتفرم: آپارات، یوتیوب و کانال‌های ویدیویی
              </span>
            </div>
            <span className="text-[10px] font-bold bg-white text-blue-700 px-2 py-0.5 rounded border border-blue-200 shrink-0">
              دوشنبه
            </span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-900 block">
                تولید محتوای پست متنی و گرافیکی برای کمپین تخفیف
              </span>
              <span className="text-[11px] text-slate-500">
                فرمت: اسلایدر و کاروسل لینکدین
              </span>
            </div>
            <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded shrink-0">
              چهارشنبه
            </span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-900 block">
                وبینار بررسی شاخص‌های عملکرد بازاریابی
              </span>
              <span className="text-[11px] text-slate-500">
                ارائه زنده با اسلایدهای تعاملی
              </span>
            </div>
            <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded shrink-0">
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
                className={`p-3.5 rounded-xl border space-y-2 ${
                  isMissing
                    ? 'bg-rose-50/60 border-rose-200/80'
                    : isInProgress
                    ? 'bg-amber-50/60 border-amber-200/80'
                    : 'bg-slate-50 border-slate-200/80'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-slate-500">
                    {eq.category}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isMissing
                        ? 'bg-rose-100 text-rose-800'
                        : isInProgress
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {isMissing ? 'ناقص / ناموجود' : isInProgress ? 'در دست اقدام' : 'آماده'}
                  </span>
                </div>

                <h4 className="text-xs font-extrabold text-slate-900 leading-snug">
                  {eq.name}
                </h4>

                <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 space-y-0.5">
                  <p className="truncate">رویداد: {eq.relatedEvent}</p>
                  <p className="text-[10px] text-slate-400">مسئول: {eq.responsibleName}</p>
                </div>
              </div>
            );
          })}
        </div>
      </HomeWidgetCard>
    </div>
  );
}
