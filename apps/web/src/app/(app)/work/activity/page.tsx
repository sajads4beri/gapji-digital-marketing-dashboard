'use client';

import * as React from 'react';
import { useToast } from '@/components/common/toast-provider';
import {
  activityApi,
  ActivityLogItem,
  TeamSummaryResponse,
} from '@/features/activity';
import {
  Activity,
  Download,
  Search,
  Filter,
  Calendar,
  User,
  Users,
  Target,
  UserCheck,
  CheckSquare,
  FileText,
  Wrench,
  BookOpen,
  Lightbulb,
  Shield,
  Layers,
  Clock,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  TrendingUp,
  Award,
} from 'lucide-react';

const ENTITY_CONFIG: Record<
  string,
  { label: string; icon: any; color: string; bg: string; border: string }
> = {
  lead: {
    label: 'لیدها',
    icon: UserCheck,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
  },
  campaign: {
    label: 'کمپین‌ها',
    icon: Target,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
  },
  task: {
    label: 'وظایف',
    icon: CheckSquare,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
  },
  meeting: {
    label: 'صورتجلسات',
    icon: Users,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
  },
  equipment: {
    label: 'تجهیزات',
    icon: Wrench,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
  },
  sop: {
    label: 'دستورالعمل‌ها',
    icon: BookOpen,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
  },
  idea: {
    label: 'ایده‌ها',
    icon: Lightbulb,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
  },
  auth: {
    label: 'امنیت و نشست‌ها',
    icon: Shield,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
  },
  system: {
    label: 'سیستم',
    icon: Activity,
    color: 'text-slate-400',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/30',
  },
};

const MODULE_OPTIONS = [
  { value: 'all', label: 'همه بخش‌ها' },
  { value: 'lead', label: 'لیدها و مشتریان' },
  { value: 'campaign', label: 'کمپین‌ها و عملکرد' },
  { value: 'task', label: 'وظایف و پیگیری‌ها' },
  { value: 'meeting', label: 'صورتجلسات' },
  { value: 'equipment', label: 'تجهیزات و تدارکات' },
  { value: 'sop', label: 'دستورالعمل‌های SOP' },
  { value: 'idea', label: 'ایده‌ها و نوآوری' },
  { value: 'auth', label: 'احراز هویت و دسترسی' },
];

export default function ActivityReportPage() {
  const { toast } = useToast();

  const [activities, setActivities] = React.useState<ActivityLogItem[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [summary, setSummary] = React.useState<TeamSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isExporting, setIsExporting] = React.useState(false);

  // فیلترها
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedModule, setSelectedModule] = React.useState('all');
  const [datePreset, setDatePreset] = React.useState<'all' | 'today' | '7d' | '30d'>('all');

  // واکشی گزارش‌ها
  const loadActivities = React.useCallback(async () => {
    setIsLoading(true);

    let startDate: string | undefined;
    let endDate: string | undefined;

    const now = new Date();
    if (datePreset === 'today') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      startDate = today.toISOString();
    } else if (datePreset === '7d') {
      const past7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      startDate = past7.toISOString();
    } else if (datePreset === '30d') {
      const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      startDate = past30.toISOString();
    }

    try {
      const res = await activityApi.getActivities({
        entityType: selectedModule === 'all' ? undefined : selectedModule,
        search: searchQuery,
        startDate,
        endDate,
        page: currentPage,
        limit: 25,
      });

      setActivities(res.items);
      setTotalCount(res.total);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      toast.error('خطا در بارگذاری گزارش فعالیت‌ها');
    } finally {
      setIsLoading(false);
    }
  }, [selectedModule, searchQuery, datePreset, currentPage, toast]);

  // واکشی خلاصه عملکرد تیم
  const loadSummary = React.useCallback(async () => {
    try {
      const res = await activityApi.getTeamSummary();
      setSummary(res);
    } catch {
      // چشم‌پوشی اختیاری
    }
  }, []);

  React.useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  React.useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  // دانلود خروجی CSV/Excel
  const handleExport = async () => {
    setIsExporting(true);
    try {
      await activityApi.exportCsv({
        entityType: selectedModule === 'all' ? undefined : selectedModule,
      });
      toast.success('فایل خروجی فعالیت‌ها با موفقیت ایجاد و دانلود شد.');
    } catch (err) {
      toast.error('خطا در دریافت خروجی اکسل');
    } finally {
      setIsExporting(false);
    }
  };

  // فرمت زمان نسبی شمسی
  const formatRelativeTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const diffMs = Date.now() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 2) return 'چند لحظه پیش';
      if (diffMins < 60) return `${diffMins} دقیقه پیش`;
      if (diffHours < 24) return `${diffHours} ساعت پیش`;
      if (diffDays === 1) return 'دیروز';
      if (diffDays < 7) return `${diffDays} روز پیش`;

      return new Intl.DateTimeFormat('fa-IR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* سربرگ صفحه */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-100 font-display flex items-center gap-2.5">
            <Activity className="text-[#719BDF]" size={26} />
            <span>گزارش فعالیت و رهگیری رویدادها (Activity Stream)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            لاگ جامع و متمرکز کلیه اقدامات کاربران در لیدها، کمپین‌ها، جلسات، وظایف و مستندات
          </p>
        </div>

        <button
          type="button"
          disabled={isExporting}
          onClick={handleExport}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#18263A] hover:bg-[#1F2E45] text-slate-200 border border-[#1F2E45] transition-colors cursor-pointer disabled:opacity-50"
        >
          <Download size={17} className="text-[#719BDF]" />
          <span>{isExporting ? 'در حال آماده‌سازی...' : 'خروجی اکسل (CSV)'}</span>
        </button>
      </div>

      {/* کارت‌های آماری KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#111D2E] p-4 rounded-2xl border border-[#1F2E45] space-y-1">
          <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
            <Activity size={14} className="text-[#719BDF]" />
            <span>کل رویدادهای ثبت‌شده</span>
          </div>
          <div className="text-xl font-black text-slate-100">
            {summary?.total || totalCount} رویداد
          </div>
          <div className="text-[10px] text-slate-500">تاریخچه ثبت عملیات</div>
        </div>

        <div className="bg-[#111D2E] p-4 rounded-2xl border border-[#1F2E45] space-y-1">
          <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
            <Award size={14} className="text-amber-400" />
            <span>فعال‌ترین عضو تیم</span>
          </div>
          <div className="text-sm sm:text-base font-black text-amber-400 line-clamp-1">
            {summary?.topUsers && summary.topUsers.length > 0
              ? summary.topUsers[0].user.fullName
              : '—'}
          </div>
          <div className="text-[10px] text-slate-500">
            {summary?.topUsers && summary.topUsers.length > 0
              ? `${summary.topUsers[0].count} اقدام ثبت‌شده`
              : 'در دوره اخیر'}
          </div>
        </div>

        <div className="bg-[#111D2E] p-4 rounded-2xl border border-[#1F2E45] space-y-1">
          <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
            <Layers size={14} className="text-purple-400" />
            <span>بیشترین بخش تغییریافته</span>
          </div>
          <div className="text-base font-black text-purple-400">
            {summary?.byEntityType && summary.byEntityType.length > 0
              ? (ENTITY_CONFIG[summary.byEntityType[0].entityType]?.label || summary.byEntityType[0].entityType)
              : '—'}
          </div>
          <div className="text-[10px] text-slate-500">کانون اصلی فعالیت تیم</div>
        </div>

        <div className="bg-[#111D2E] p-4 rounded-2xl border border-[#1F2E45] space-y-1">
          <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
            <Clock size={14} className="text-emerald-400" />
            <span>نتایج فیلتر جاری</span>
          </div>
          <div className="text-xl font-black text-emerald-400">{totalCount} مورد</div>
          <div className="text-[10px] text-slate-500">صفحه {currentPage} از {totalPages}</div>
        </div>
      </div>

      {/* نوار فیلتر و جستجو */}
      <div className="bg-[#111D2E] p-4 rounded-2xl border border-[#1F2E45] space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="جستجو در شرح اقدام، کاربر یا جزئیات رویداد..."
              className="w-full bg-[#18263A] border border-[#1F2E45] rounded-xl pr-10 pl-4 py-2 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#719BDF]"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedModule}
              onChange={(e) => {
                setSelectedModule(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-[#18263A] border border-[#1F2E45] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#719BDF]"
            >
              {MODULE_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* فیلتر زمانی شبیه به FilterBar با بازه‌های پرکاربرد */}
        <div className="flex items-center gap-2 pt-1 border-t border-[#1F2E45]/80">
          <span className="text-xs text-slate-400 shrink-0 flex items-center gap-1">
            <Calendar size={13} />
            <span>بازه زمانی:</span>
          </span>
          {[
            { id: 'all', label: 'همه زمان‌ها' },
            { id: 'today', label: 'امروز' },
            { id: '7d', label: '۷ روز اخیر' },
            { id: '30d', label: '۳۰ روز اخیر' },
          ].map((preset) => {
            const isSelected = datePreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setDatePreset(preset.id as any);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-[#719BDF] text-slate-950 font-bold'
                    : 'bg-[#18263A] text-slate-400 hover:text-white hover:bg-[#1F2E45]'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* چیدمان ستونی: لیست رویدادها (Timeline) + پنل رتبه‌بندی اعضای تیم */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ستون اصلی رویدادها (تایم‌لاین) */}
        <div className="lg:col-span-8 space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="bg-[#111D2E] p-4 rounded-xl border border-[#1F2E45] animate-pulse space-y-2">
                  <div className="h-4 bg-[#18263A] rounded w-1/3" />
                  <div className="h-3 bg-[#18263A] rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="bg-[#111D2E] p-12 rounded-2xl border border-[#1F2E45] text-center space-y-3">
              <Activity className="mx-auto text-slate-600" size={40} />
              <p className="text-sm font-bold text-slate-300">هیچ رویدادی با این شرایط یافت نشد.</p>
              <p className="text-xs text-slate-500">فیلترهای جستجو یا بازه زمانی را تغییر دهید.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {activities.map((item) => {
                const entityMeta = ENTITY_CONFIG[item.entityType] || ENTITY_CONFIG.system;
                const IconComponent = entityMeta.icon;

                return (
                  <div
                    key={item.id}
                    className="bg-[#111D2E] rounded-xl border border-[#1F2E45] p-4 hover:border-slate-700 transition-colors flex items-start gap-3.5"
                  >
                    {/* آیکون بخش */}
                    <div
                      className={`p-2.5 rounded-xl shrink-0 ${entityMeta.bg} ${entityMeta.color} border ${entityMeta.border}`}
                    >
                      <IconComponent size={18} />
                    </div>

                    {/* جزئیات رویداد */}
                    <div className="flex-1 space-y-1.5 text-right">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-slate-100">
                            {item.user?.fullName || 'کاربر سیستم'}
                          </span>
                          <span className="text-[10px] text-slate-400 bg-[#18263A] px-2 py-0.5 rounded border border-[#1F2E45]">
                            {item.action}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${entityMeta.bg} ${entityMeta.color} ${entityMeta.border}`}
                          >
                            {entityMeta.label}
                          </span>
                        </div>

                        <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                          <Clock size={12} />
                          <span>{formatRelativeTime(item.createdAt)}</span>
                        </span>
                      </div>

                      {item.details && (
                        <p className="text-xs text-slate-300 leading-relaxed bg-[#142235]/60 p-2.5 rounded-lg border border-[#1F2E45]/80">
                          {item.details}
                        </p>
                      )}

                      {(item.ipAddress || item.userAgent) && (
                        <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                          {item.ipAddress && <span>IP: {item.ipAddress}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* صفحه‌بندی */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between bg-[#111D2E] p-3 rounded-xl border border-[#1F2E45] text-xs text-slate-400">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#18263A] hover:bg-[#1F2E45] text-slate-200 disabled:opacity-40"
                  >
                    <ChevronRight size={14} />
                    <span>صفحه قبلی</span>
                  </button>

                  <span>
                    صفحه <strong>{currentPage}</strong> از <strong>{totalPages}</strong>
                  </span>

                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#18263A] hover:bg-[#1F2E45] text-slate-200 disabled:opacity-40"
                  >
                    <span>صفحه بعدی</span>
                    <ChevronLeft size={14} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ستون کناری: آمار تجمیعی تیم */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#111D2E] rounded-2xl border border-[#1F2E45] p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2 border-b border-[#1F2E45] pb-3">
              <TrendingUp size={16} className="text-[#719BDF]" />
              <span>تفکیک رویدادها بر اساس بخش</span>
            </h3>

            {summary?.byEntityType ? (
              <div className="space-y-2.5">
                {summary.byEntityType.map((item) => {
                  const meta = ENTITY_CONFIG[item.entityType] || ENTITY_CONFIG.system;
                  const percent = summary.total > 0 ? Math.round((item.count / summary.total) * 100) : 0;

                  return (
                    <div key={item.entityType} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-slate-300">
                          <meta.icon size={13} className={meta.color} />
                          <span>{meta.label}</span>
                        </span>
                        <span className="font-mono text-slate-400">{item.count} مورد ({percent}٪)</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#18263A] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#719BDF] rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-500">اطلاعاتی در دسترس نیست.</p>
            )}
          </div>

          {/* اعضای فعال */}
          {summary?.topUsers && summary.topUsers.length > 0 && (
            <div className="bg-[#111D2E] rounded-2xl border border-[#1F2E45] p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2 border-b border-[#1F2E45] pb-3">
                <Users size={16} className="text-emerald-400" />
                <span>برترین کاربران از نظر تعداد ثبت اقدام</span>
              </h3>

              <div className="space-y-3">
                {summary.topUsers.map((u, idx) => (
                  <div key={u.user.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#18263A] text-slate-400 flex items-center justify-center font-mono text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-200">{u.user.fullName}</span>
                    </div>

                    <span className="font-mono text-[#719BDF] font-bold">
                      {u.count} رویداد
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
