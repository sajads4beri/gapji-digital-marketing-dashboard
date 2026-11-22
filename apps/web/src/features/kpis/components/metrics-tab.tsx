'use client';

import * as React from 'react';
import {
  Calculator,
  Plus,
  Trash2,
  Lock,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Info,
  CheckCircle2,
  Code,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/common/toast-provider';
import { MetricDefinition } from '../types';
import { kpisApi } from '../kpis.api';
import { CustomMetricDrawer } from './custom-metric-drawer';

interface MetricsTabProps {
  defaultMetrics: MetricDefinition[];
  customMetrics: MetricDefinition[];
  isLoading: boolean;
  onRefresh: () => void;
  campaigns?: Array<{ id: string; name: string }>;
  canWrite?: boolean;
}

export function MetricsTab({
  defaultMetrics,
  customMetrics,
  isLoading,
  onRefresh,
  campaigns = [],
  canWrite = true,
}: MetricsTabProps) {
  const { toast } = useToast();
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const handleDeleteCustom = async (metric: MetricDefinition) => {
    if (!metric.id) return;
    if (!confirm(`آیا از حذف شاخص سفارشی «${metric.name}» اطمینان دارید؟`)) return;

    setDeletingId(metric.id);
    try {
      await kpisApi.deleteCustomMetric(metric.id);
      toast.success(`شاخص «${metric.name}» با موفقیت حذف گردید.`, {
        title: 'شاخص حذف شد',
      });
      onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'خطا در حذف شاخص', {
        title: 'خطا در حذف شاخص',
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111D2E]/80 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-[#1F2E45] shadow-lg">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Calculator className="w-4 h-4 text-[#719BDF]" />
            <span>کاتالوگ شاخص‌ها و فرمول‌ساز اختصاصی</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            مشاهده شاخص‌های از پیش تعریف شده سیستم و ایجاد فرمول‌های ریاضی سفارشی برای سنجش دقیق عملکرد.
          </p>
        </div>

        {canWrite && (
          <Button
            onClick={() => setIsDrawerOpen(true)}
            className="bg-[#719BDF] hover:bg-[#5A85C9] text-white gap-1.5 text-xs shadow-lg shadow-[#719BDF]/20 rounded-xl font-medium shrink-0 h-9"
          >
            <Plus className="w-4 h-4" />
            افزودن شاخص سفارشی
          </Button>
        )}
      </div>

      {/* Section 1: Default Predefined Metrics */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              شاخص‌های استاندارد سیستم
            </h3>
            <span className="text-[11px] bg-[#0B1423] text-slate-400 border border-[#1F2E45] px-2.5 py-0.5 rounded-full font-medium">
              {defaultMetrics.length} شاخص (غیرقابل ویرایش)
            </span>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#1F2E45] bg-[#111D2E]/80 backdrop-blur-md shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-[#1F2E45] bg-[#0B1423]/60 text-slate-400 font-medium">
                  <th className="py-3.5 px-4 font-semibold">شاخص و شناسه</th>
                  <th className="py-3.5 px-4 font-semibold">فرمول محاسباتی</th>
                  <th className="py-3.5 px-4 font-semibold">جهت مطلوب</th>
                  <th className="py-3.5 px-4 font-semibold">واحد</th>
                  <th className="py-3.5 px-4 font-semibold">توضیحات و کاربرد</th>
                  <th className="py-3.5 px-4 font-semibold text-center">نوع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2E45]/60 text-slate-300">
                {defaultMetrics.map((m) => (
                  <tr key={m.code} className="hover:bg-[#18263A]/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{m.name}</div>
                      <div className="font-mono text-[11px] text-slate-400 uppercase tracking-wide">
                        {m.code}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <code
                        dir="ltr"
                        className="inline-block font-mono text-[11px] bg-[#0B1423] text-[#719BDF] px-2.5 py-1 rounded-lg border border-[#1F2E45] font-semibold"
                      >
                        {m.formula}
                      </code>
                    </td>
                    <td className="py-3.5 px-4">
                      {m.direction === 'higher_is_better' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                          <TrendingUp className="w-3 h-3 text-emerald-400" />
                          بالاتر بهتر
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#719BDF] bg-[#719BDF]/10 border border-[#719BDF]/20 px-2 py-0.5 rounded-full font-medium">
                          <TrendingDown className="w-3 h-3 text-[#719BDF]" />
                          کمتر بهتر
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-400">{m.unit}</td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px] max-w-xs leading-relaxed">
                      {m.description}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-[#0B1423] px-2 py-0.5 rounded border border-[#1F2E45]">
                        <Lock className="w-2.5 h-2.5 text-slate-500" />
                        پیش‌فرض
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Section 2: Custom Metrics Defined by User */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              شاخص‌های اختصاصی سازمان
            </h3>
            <span className="text-[11px] bg-[#719BDF]/10 text-[#719BDF] border border-[#719BDF]/20 px-2.5 py-0.5 rounded-full font-medium">
              {customMetrics.length} شاخص تعریف‌شده
            </span>
          </div>
        </div>

        {customMetrics.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#1F2E45] bg-[#111D2E]/50 backdrop-blur-md p-10 text-center shadow-lg">
            <div className="w-12 h-12 rounded-2xl bg-[#719BDF]/10 border border-[#719BDF]/20 text-[#719BDF] flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Calculator className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-white">
              هنوز شاخص سفارشی تعریف نکرده‌اید
            </h4>
            <p className="text-[11px] text-slate-400 max-w-md mx-auto mt-1 mb-4 leading-relaxed">
              اگر به فرمول‌های اختصاصی مثل نسبت هزینه به کلیک‌های یکتانت یا درآمد نهایی نیاز دارید، می‌توانید فرمول خود را بسازید.
            </p>
            {canWrite && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDrawerOpen(true)}
                className="text-xs border-[#719BDF]/40 text-[#719BDF] bg-[#719BDF]/10 hover:bg-[#719BDF]/20 gap-1.5 rounded-xl h-9"
              >
                <Plus className="w-3.5 h-3.5" />
                تعریف اولین شاخص سفارشی
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[#1F2E45] bg-[#111D2E]/80 backdrop-blur-md shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-[#1F2E45] bg-[#0B1423]/60 text-slate-400 font-medium">
                    <th className="py-3.5 px-4 font-semibold">شاخص و شناسه</th>
                    <th className="py-3.5 px-4 font-semibold">فرمول محاسباتی</th>
                    <th className="py-3.5 px-4 font-semibold">جهت مطلوب</th>
                    <th className="py-3.5 px-4 font-semibold">واحد</th>
                    <th className="py-3.5 px-4 font-semibold">توضیحات</th>
                    <th className="py-3.5 px-4 font-semibold text-left">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F2E45]/60 text-slate-300">
                  {customMetrics.map((m) => (
                    <tr key={m.code} className="hover:bg-[#18263A]/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{m.name}</div>
                        <div className="font-mono text-[11px] text-slate-400 lowercase tracking-wide">
                          {m.code}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <code
                          dir="ltr"
                          className="inline-block font-mono text-[11px] bg-[#0B1423] text-emerald-400 px-2.5 py-1 rounded-lg border border-[#1F2E45] font-semibold"
                        >
                          {m.formula}
                        </code>
                      </td>
                      <td className="py-3.5 px-4">
                        {m.direction === 'higher_is_better' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                            <TrendingUp className="w-3 h-3 text-emerald-400" />
                            بالاتر بهتر
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#719BDF] bg-[#719BDF]/10 border border-[#719BDF]/20 px-2 py-0.5 rounded-full font-medium">
                            <TrendingDown className="w-3 h-3 text-[#719BDF]" />
                            کمتر بهتر
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-400">{m.unit}</td>
                      <td className="py-3.5 px-4 text-slate-400 text-[11px] max-w-xs leading-relaxed">
                        {m.description || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-left">
                        {canWrite && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCustom(m)}
                            disabled={deletingId === m.id}
                            title="حذف شاخص سفارشی"
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Custom Metric Drawer */}
      <CustomMetricDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSuccess={() => {
          onRefresh();
        }}
        campaigns={campaigns}
      />
    </div>
  );
}
