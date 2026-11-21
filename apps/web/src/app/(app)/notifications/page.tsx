'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/common/toast-provider';
import {
  notificationsApi,
  NotificationItem,
  NotificationPreferenceItem,
  NotificationType,
} from '@/features/notifications';
import {
  Bell,
  CheckCheck,
  Check,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
  ExternalLink,
  Sliders,
  RefreshCw,
  Mail,
  Smartphone,
  Shield,
  Layers,
  Calendar,
  Users,
} from 'lucide-react';

export default function NotificationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = React.useState<'list' | 'preferences'>(
    tabParam === 'preferences' ? 'preferences' : 'list',
  );

  // وضعیت اعلان‌ها
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [totalCount, setTotalCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [filterRead, setFilterRead] = React.useState<'all' | 'unread'>('all');
  const [filterType, setFilterType] = React.useState<string>('all');

  // وضعیت تنظیمات
  const [preferences, setPreferences] = React.useState<NotificationPreferenceItem[]>([]);
  const [isPreferencesLoading, setIsPreferencesLoading] = React.useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = React.useState(false);

  // بارگذاری اعلان‌ها
  const loadNotifications = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const filter: any = { limit: 50 };
      if (filterRead === 'unread') filter.isRead = false;
      if (filterType !== 'all') filter.type = filterType as NotificationType;

      const data = await notificationsApi.getNotifications(filter);
      setNotifications(data.items);
      setUnreadCount(data.unreadCount);
      setTotalCount(data.total);
    } catch (err: any) {
      toast.error('خطا در بارگذاری فهرست اعلان‌ها');
    } finally {
      setIsLoading(false);
    }
  }, [filterRead, filterType, toast]);

  // بارگذاری تنظیمات
  const loadPreferences = React.useCallback(async () => {
    setIsPreferencesLoading(true);
    try {
      const data = await notificationsApi.getPreferences();
      setPreferences(data);
    } catch (err) {
      toast.error('خطا در بارگذاری تنظیمات اعلان‌ها');
    } finally {
      setIsPreferencesLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    if (activeTab === 'list') {
      loadNotifications();
    } else {
      loadPreferences();
    }
  }, [activeTab, loadNotifications, loadPreferences]);

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('تمامی اعلان‌ها به عنوان خوانده‌شده علامت‌گذاری شدند.');
    } catch (err) {
      toast.error('خطا در علامت‌گذاری اعلان‌ها');
    }
  };

  const handleMarkItemRead = async (id: string, linkUrl?: string | null) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      if (linkUrl) {
        router.push(linkUrl);
      }
    } catch (err) {
      toast.error('خطا در ثبت وضعیت اعلان');
    }
  };

  const handleTogglePreference = async (
    eventType: string,
    channel: 'inApp' | 'email',
    currentVal: boolean,
  ) => {
    const updated = preferences.map((p) => {
      if (p.eventType === eventType) {
        return {
          ...p,
          inAppEnabled: channel === 'inApp' ? !currentVal : p.inAppEnabled,
          emailEnabled: channel === 'email' ? !currentVal : p.emailEnabled,
        };
      }
      return p;
    });
    setPreferences(updated);

    try {
      const target = updated.find((p) => p.eventType === eventType);
      if (target) {
        await notificationsApi.updatePreferences([
          {
            eventType: target.eventType,
            inAppEnabled: target.inAppEnabled,
            emailEnabled: target.emailEnabled,
          },
        ]);
        toast.success(`تنظیمات رویداد «${target.title}» ذخیره شد.`);
      }
    } catch (err) {
      toast.error('خطا در ذخیره تنظیمات');
      loadPreferences();
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'alert':
        return <AlertTriangle size={18} className="text-rose-400" />;
      case 'warning':
        return <AlertCircle size={18} className="text-amber-400" />;
      case 'success':
        return <CheckCircle2 size={18} className="text-emerald-400" />;
      case 'info':
      default:
        return <Info size={18} className="text-[#719BDF]" />;
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffMinutes < 1) return 'چند لحظه پیش';
    if (diffMinutes < 60) return `${diffMinutes} دقیقه پیش`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} ساعت پیش`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} روز پیش`;
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* سربرگ صفحه */}
      <div className="bg-[#111D2E] p-5 rounded-2xl border border-[#1F2E45] shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#719BDF]/15 text-[#719BDF] border border-[#719BDF]/30">
              <Bell size={22} />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-100 font-display">
                مرکز اعلان‌ها و هشدارها
              </h1>
              <p className="text-xs text-slate-400">
                مشاهده رویدادها، تغییر وضعیت‌ها و شخصی‌سازی نحوه دریافت پیام‌ها
              </p>
            </div>
          </div>
        </div>

        {activeTab === 'list' && (
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={loadNotifications}
              disabled={isLoading}
              title="بارگذاری مجدد"
              className="p-2 rounded-xl bg-[#18263A] hover:bg-[#1F2E45] text-slate-300 border border-[#1F2E45] transition-colors"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                unreadCount > 0
                  ? 'bg-[#719BDF] text-white hover:bg-[#5A85C9] shadow-md shadow-[#719BDF]/20'
                  : 'bg-[#18263A] text-slate-500 border border-[#1F2E45] cursor-not-allowed'
              }`}
            >
              <CheckCheck size={16} />
              <span>علامت‌گذاری همه به عنوان خوانده‌شده</span>
            </button>
          </div>
        )}
      </div>

      {/* تب‌های صفحه */}
      <div className="flex items-center gap-2 border-b border-[#1F2E45] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('list')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'list'
              ? 'bg-[#18263A] text-[#719BDF] border border-[#1F2E45]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#111D2E]'
          }`}
        >
          <Bell size={16} />
          <span>فهرست اعلان‌ها</span>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#D66B73] text-white">
              {unreadCount > 99 ? '+99' : unreadCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('preferences')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'preferences'
              ? 'bg-[#18263A] text-[#719BDF] border border-[#1F2E45]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#111D2E]'
          }`}
        >
          <Sliders size={16} />
          <span>تنظیمات دریافت رویدادها</span>
        </button>
      </div>

      {/* محتوای تب ۱: فهرست اعلان‌ها */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* نوار فیلترها */}
          <div className="bg-[#111D2E] p-3 rounded-xl border border-[#1F2E45] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">وضعیت:</span>
              <button
                type="button"
                onClick={() => setFilterRead('all')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  filterRead === 'all'
                    ? 'bg-[#719BDF]/20 text-[#719BDF] border border-[#719BDF]/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                همه ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterRead('unread')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  filterRead === 'unread'
                    ? 'bg-[#719BDF]/20 text-[#719BDF] border border-[#719BDF]/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                خوانده‌نشده ({unreadCount})
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">دسته‌بندی:</span>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-[#18263A] border border-[#1F2E45] rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none"
              >
                <option value="all">همه انواع</option>
                <option value="alert">اخطارهای مهم (Alert)</option>
                <option value="warning">هشدارها (Warning)</option>
                <option value="success">موفقیت‌ها (Success)</option>
                <option value="info">اطلاعات (Info)</option>
              </select>
            </div>
          </div>

          {/* لیست اعلان‌ها */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-20 bg-[#111D2E] rounded-xl border border-[#1F2E45] animate-pulse"
                />
              ))}
            </div>
          ) : notifications.length > 0 ? (
            <div className="space-y-2.5">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                    n.isRead
                      ? 'bg-[#111D2E]/60 border-[#1F2E45]/60 hover:bg-[#111D2E]'
                      : 'bg-[#111D2E] border-[#719BDF]/40 shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-[#18263A] border border-[#1F2E45] mt-0.5">
                      {getNotificationIcon(n.type)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-slate-100">
                          {n.title}
                        </span>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-[#719BDF]" title="خوانده‌نشده" />
                        )}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                        {n.message}
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        {formatRelativeTime(n.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {n.linkUrl && (
                      <button
                        type="button"
                        onClick={() => handleMarkItemRead(n.id, n.linkUrl)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18263A] hover:bg-[#1F2E45] text-xs font-semibold text-[#719BDF] border border-[#1F2E45] transition-colors"
                      >
                        <span>پیگیری</span>
                        <ExternalLink size={12} />
                      </button>
                    )}
                    {!n.isRead && (
                      <button
                        type="button"
                        onClick={() => handleMarkItemRead(n.id)}
                        title="علامت‌گذاری به عنوان خوانده‌شده"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                      >
                        <Check size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center bg-[#111D2E] rounded-2xl border border-[#1F2E45] space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#18263A] flex items-center justify-center text-slate-500">
                <Bell size={24} />
              </div>
              <h3 className="text-sm font-bold text-slate-200">اعلانی وجود ندارد</h3>
              <p className="text-xs text-slate-400">
                {filterRead === 'unread'
                  ? 'تمام پیام‌ها خوانده شده‌اند.'
                  : 'در حال حاضر پیامی در این دسته‌بندی ثبت نشده است.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* محتوای تب ۲: تنظیمات دریافت رویدادها */}
      {activeTab === 'preferences' && (
        <div className="space-y-4">
          <div className="bg-[#111D2E] p-4 rounded-xl border border-[#1F2E45] text-xs text-slate-300 leading-relaxed">
            کانال‌های دریافت اعلان را متناسب با نیاز خود فعال یا غیرفعال نمایید. تغییرات بلافاصله ذخیره می‌گردند.
          </div>

          {isPreferencesLoading ? (
            <div className="h-64 bg-[#111D2E] rounded-xl border border-[#1F2E45] animate-pulse" />
          ) : (
            <div className="bg-[#111D2E] rounded-2xl border border-[#1F2E45] overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-[#18263A] border-b border-[#1F2E45] text-slate-400 font-bold">
                    <tr>
                      <th className="p-4">عنوان و شرح رویداد</th>
                      <th className="p-4">حوزه</th>
                      <th className="p-4 text-center">اعلان درون‌برنامه‌ای</th>
                      <th className="p-4 text-center">ارسال ایمیل</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F2E45]/60 text-slate-200">
                    {preferences.map((pref) => (
                      <tr key={pref.eventType} className="hover:bg-[#18263A]/40 transition-colors">
                        <td className="p-4 space-y-1">
                          <div className="font-bold text-slate-100">{pref.title}</div>
                          <div className="text-[11px] text-slate-400">{pref.description}</div>
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#18263A] text-slate-300 border border-[#1F2E45]">
                            {pref.category}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              handleTogglePreference(pref.eventType, 'inApp', pref.inAppEnabled)
                            }
                            className={`w-11 h-6 inline-flex items-center rounded-full transition-colors p-1 ${
                              pref.inAppEnabled ? 'bg-[#719BDF]' : 'bg-[#18263A] border border-[#1F2E45]'
                            }`}
                          >
                            <span
                              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                                pref.inAppEnabled ? '-translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              handleTogglePreference(pref.eventType, 'email', pref.emailEnabled)
                            }
                            className={`w-11 h-6 inline-flex items-center rounded-full transition-colors p-1 ${
                              pref.emailEnabled ? 'bg-emerald-500' : 'bg-[#18263A] border border-[#1F2E45]'
                            }`}
                          >
                            <span
                              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                                pref.emailEnabled ? '-translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
