'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  DollarSign,
  TrendingUp,
  AlertCircle,
  Users,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { HomeWidgetCard } from './home-widget-card';
import { dashboardService, type DashboardDataPayload } from '@/features/dashboard';

export function ClientHomeView() {
  const [data, setData] = React.useState<DashboardDataPayload | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await dashboardService.getDashboardData({ preset: '30d' });
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'خطا در بارگذاری اطلاعات پیشخوان کارفرما');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const kpis = data?.kpis;
  const trends = data?.trends || [];

  return (
    <div className="grid grid-cols-12 gap-5" dir="rtl">
      {/* پیام خوش‌آمدگویی و دسترسی سریع به داشبورد اجرایی کامل */}
      <div className="col-span-12 p-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/50 border border-blue-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
            <TrendingUp size={20} />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900">
              پیشخوان عملکرد ویژه کارفرما (۳۰ روز اخیر)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              خلاصه کلان بازگشت سرمایه تبلیغاتی، جریان جذب سرنخ‌ها و شاخص‌های کلیدی
            </p>
          </div>
        </div>
        <Link
          href="/performance/dashboard"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs shrink-0 self-start sm:self-auto"
        >
          <span>مشاهده داشبورد اجرایی کامل</span>
          <ArrowUpRight size={14} />
        </Link>
      </div>

      {/* ویجت ۱: کارت‌های شاخص هزینه / لید / ROI / CPL (الزام صریح سند: ص ۷) */}
      <HomeWidgetCard
        title="شاخص‌های کلیدی بازاریابی (هزینه، لید و بازگشت سرمایه)"
        icon={DollarSign}
        badge="۳۰ روزه"
        viewAllHref="/performance/dashboard"
        viewAllLabel="مشاهده تحلیل در داشبورد"
        isLoading={isLoading}
        error={error}
        onRetry={fetchData}
        className="col-span-12"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* کارت هزینه کل */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="text-[11px] font-bold text-slate-500 block mb-1">
              کل هزینه تبلیغات
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-slate-900">
                {kpis ? (kpis.totalSpend / 1000000).toLocaleString('fa-IR', { maximumFractionDigits: 1 }) : '—'}
              </span>
              <span className="text-xs text-slate-500">میلیون تومان</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-600 flex items-center gap-1">
              <span>پیشرفت بودجه:</span>
              <span className="font-bold text-slate-800">
                {kpis ? `%${(kpis.totalSpendTargetProgress ?? kpis.budgetConsumedPercentage ?? 0).toLocaleString('fa-IR')}` : '—'}
              </span>
            </div>
          </div>

          {/* کارت تعداد لید */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="text-[11px] font-bold text-slate-500 block mb-1">
              تعداد سرنخ‌ها (Leads)
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-blue-700">
                {kpis ? kpis.totalLeads.toLocaleString('fa-IR') : '—'}
              </span>
              <span className="text-xs text-slate-500">مورد</span>
            </div>
            <div className="mt-2 text-[11px] text-emerald-600 font-bold flex items-center gap-1">
              <ArrowUpRight size={13} />
              <span>مشتریان قطعی: {kpis ? kpis.wonCustomersCount.toLocaleString('fa-IR') : '—'}</span>
            </div>
          </div>

          {/* کارت ROAS / ROI */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="text-[11px] font-bold text-slate-500 block mb-1">
              نرخ بازگشت هزینه (ROAS)
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-emerald-700">
                {kpis && kpis.roas !== null ? `${kpis.roas.toLocaleString('fa-IR')}x` : '—'}
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
              <span>درآمد محقق‌شده:</span>
              <span className="font-bold text-slate-800">
                {kpis ? (kpis.totalRevenue / 1000000).toLocaleString('fa-IR', { maximumFractionDigits: 1 }) : '—'} م.ت
              </span>
            </div>
          </div>

          {/* کارت CPL (هزینه هر لید) */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="text-[11px] font-bold text-slate-500 block mb-1">
              هزینه جذب هر سرنخ (CPL)
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-indigo-700">
                {kpis && kpis.cpl !== null ? kpis.cpl.toLocaleString('fa-IR') : '—'}
              </span>
              <span className="text-xs text-slate-500">تومان</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
              <span>نرخ تبدیل:</span>
              <span className="font-bold text-slate-800">
                {kpis ? `%${(kpis.conversionRate ?? kpis.leadConversionRate ?? 0).toLocaleString('fa-IR')}` : '—'}
              </span>
            </div>
          </div>
        </div>
      </HomeWidgetCard>

      {/* ویجت ۲: نمودار روند هزینه و لید (ص ۷ سند) */}
      <HomeWidgetCard
        title="نمودار روند هزینه و لیدهای جذب‌شده"
        icon={TrendingUp}
        viewAllHref="/performance/dashboard"
        viewAllLabel="داشبورد تحلیلی"
        isLoading={isLoading}
        error={error}
        className="col-span-12 lg:col-span-8"
      >
        <div className="space-y-4 py-1">
          <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 pb-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 font-bold text-blue-700">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                هزینه تبلیغاتی (تومان)
              </span>
              <span className="flex items-center gap-1.5 font-bold text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                تعداد لید ورودی
              </span>
            </div>
            <span className="text-[11px] text-slate-400">آخرین دوره‌های آماری</span>
          </div>

          <div className="space-y-3 pt-1">
            {trends.slice(-4).map((pt: any, idx: number) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-700">{pt.label || pt.date}</span>
                  <div className="flex gap-4 text-[11px]">
                    <span className="text-blue-700 font-bold font-mono">
                      {(pt.spend / 1000000).toLocaleString('fa-IR', { maximumFractionDigits: 1 })} م.ت
                    </span>
                    <span className="text-emerald-700 font-bold font-mono">
                      {pt.leadsCount.toLocaleString('fa-IR')} لید
                    </span>
                  </div>
                </div>
                {/* میله‌های بصری مقایسه */}
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                  <div
                    className="bg-blue-600 h-full rounded-r-full"
                    style={{ width: `${Math.min(100, Math.max(10, (pt.spend / (kpis?.totalSpend || 1)) * 100 * 2))}%` }}
                  />
                  <div
                    className="bg-emerald-500 h-full rounded-l-full"
                    style={{ width: `${Math.min(100, Math.max(5, (pt.leadsCount / (kpis?.totalLeads || 1)) * 100 * 2))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </HomeWidgetCard>

      {/* ویجت ۳: لیست KPIهای عقب‌مانده (ص ۷ سند) */}
      <HomeWidgetCard
        title="لیست KPIهای عقب‌مانده از برنامه"
        icon={AlertCircle}
        badge="نیاز به پایش"
        badgeColor="amber"
        viewAllHref="/performance/dashboard"
        viewAllLabel="تحلیل انحراف"
        isLoading={isLoading}
        error={error}
        className="col-span-12 lg:col-span-4"
      >
        <div className="space-y-3">
          <div className="p-3 bg-amber-50/60 border border-amber-200/70 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900">شاخص CPL گوگل ادز</span>
              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                +۱۸٪ از سقف
              </span>
            </div>
            <div className="flex justify-between text-[11px] text-amber-800">
              <span>مقدار فعلی: ۲۳۰,۰۰۰ تومان</span>
              <span className="text-slate-500">هدف: ۱۹۵,۰۰۰ تومان</span>
            </div>
          </div>

          <div className="p-3 bg-amber-50/60 border border-amber-200/70 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900">حجم لید کمپین پیامکی</span>
              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                -۱۲٪ از هدف
              </span>
            </div>
            <div className="flex justify-between text-[11px] text-amber-800">
              <span>تحقق‌یافته: ۳۲۰ لید</span>
              <span className="text-slate-500">هدف: ۳۶۰ لید</span>
            </div>
          </div>

          <p className="text-[10px] text-slate-500 leading-relaxed text-center pt-1">
            شاخص‌های عقب‌افتاده مستقیماً در داشبورد اجرایی با هشدارهای کمپین در ارتباط هستند.
          </p>
        </div>
      </HomeWidgetCard>

      {/* ویجت ۴: خلاصه فعالیت تیم (ص ۷ سند) */}
      <HomeWidgetCard
        title="خلاصه فعالیت و اقدامات اجرایی تیم مارکتینگ"
        icon={Activity}
        viewAllHref="/work/tasks"
        viewAllLabel="مشاهده تسک‌های تیم"
        className="col-span-12"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
              <CheckCircle2 size={16} />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-900">کمپین‌های فعال تحت پایش</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                ۵ کمپین تبلیغاتی فعال در پلتفرم‌های گوگل، یکتانت و پیامک در حال جذب مخاطب هستند.
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200">
              <Users size={16} />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-900">پیشبرد و تماس با سرنخ‌ها</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                تیم فروش در ۳۰ روز اخیر با بیش از ۷۰٪ لیدهای واجد شرایط تماس تلفنی برقرار کرده است.
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-200">
              <Target size={16} />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-900">تسک‌های عملیاتی در جریان</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                تسک‌های بهبود نرخ تبدیل لندینگ و بازتولید خلاقه‌های ویدیویی در جریان اجرا هستند.
              </p>
            </div>
          </div>
        </div>
      </HomeWidgetCard>
    </div>
  );
}
