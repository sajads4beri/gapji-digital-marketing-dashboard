'use client';

import * as React from 'react';
import {
  Bell,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Info,
  Power,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/common/toast-provider';
import { AlertRuleItem, MetricDefinition, KpiItem } from '../types';
import { kpisApi } from '../kpis.api';
import { AlertRuleDrawer } from './alert-rule-drawer';

interface AlertRulesTabProps {
  rules: AlertRuleItem[];
  metrics: MetricDefinition[];
  kpis: KpiItem[];
  isLoading: boolean;
  onRefresh: () => void;
  canWrite?: boolean;
}

export function AlertRulesTab({
  rules,
  metrics,
  kpis,
  isLoading,
  onRefresh,
  canWrite = true,
}: AlertRulesTabProps) {
  const { toast } = useToast();
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [selectedRule, setSelectedRule] = React.useState<AlertRuleItem | null>(null);
  const [togglingId, setTogglingId] = React.useState<string | null>(null);

  const handleToggle = async (rule: AlertRuleItem) => {
    setTogglingId(rule.id);
    try {
      const updated = await kpisApi.toggleAlertRule(rule.id);
      toast.success(`قاعده «${rule.metricName}» اکنون ${updated.isActive ? 'فعال' : 'غیرفعال'} است.`, {
        title: updated.isActive ? 'قاعده فعال شد' : 'قاعده غیرفعال شد',
      });
      onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'خطا در تغییر وضعیت', {
        title: 'خطا در تغییر وضعیت قاعده',
      });
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (rule: AlertRuleItem) => {
    if (!confirm(`آیا از حذف این قاعده هشدار برای شاخص «${rule.metricName}» مطمئن هستید؟`)) return;

    try {
      await kpisApi.deleteAlertRule(rule.id);
      toast.success('قاعده با موفقیت حذف گردید.', {
        title: 'قاعده هشدار حذف شد',
      });
      onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'خطا در حذف', {
        title: 'خطا در حذف قاعده',
      });
    }
  };

  const getConditionLabel = (c: string) => {
    switch (c) {
      case 'gt':
        return 'بزرگتر از';
      case 'lt':
        return 'کوچکتر از';
      case 'gte':
        return 'بزرگتر یا مساوی';
      case 'lte':
        return 'کوچکتر یا مساوی';
      case 'eq':
        return 'مساوی با';
      default:
        return c;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111D2E]/80 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-[#1F2E45] shadow-lg">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" />
            <span>تنظیم قواعد هشدار (جمله‌ساز هوشمند)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            تعریف شرایط انحراف شاخص‌ها و کمپین‌ها بر مبنای ساختار جمله‌ای: «اگر [شاخص] [شرط] [مقدار] باشد، آنگاه...»
          </p>
        </div>

        {canWrite && (
          <Button
            onClick={() => {
              setSelectedRule(null);
              setIsDrawerOpen(true);
            }}
            className="bg-[#719BDF] hover:bg-[#5A85C9] text-white gap-1.5 text-xs shadow-lg shadow-[#719BDF]/20 rounded-xl font-medium shrink-0 h-9"
          >
            <Plus className="w-4 h-4" />
            قاعده هشدار جدید
          </Button>
        )}
      </div>

      {/* Rules List or Empty State */}
      {rules.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#1F2E45] bg-[#111D2E]/50 backdrop-blur-md p-10 text-center shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">
            هنوز قاعده هشداری تعریف نشده است
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-5 leading-relaxed">
            با تعریف قواعد هشدار، سیستم به محض عبور شاخص‌ها از سقف مجاز، پیام هشدار و اقدام پیشنهادی به مدیر نمایش می‌دهد.
          </p>
          {canWrite && (
            <Button
              onClick={() => {
                setSelectedRule(null);
                setIsDrawerOpen(true);
              }}
              size="sm"
              className="bg-[#719BDF] hover:bg-[#5A85C9] text-white text-xs gap-1.5 shadow-lg shadow-[#719BDF]/20 rounded-xl font-medium"
            >
              <Plus className="w-4 h-4" />
              تعریف اولین قاعده هشدار
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {rules.map((rule) => {
            const isWarning = rule.severity === 'warning';
            const isCritical = rule.severity === 'critical';

            return (
              <div
                key={rule.id}
                className={`p-4 sm:p-5 rounded-2xl border bg-[#111D2E]/80 backdrop-blur-md shadow-xl transition-all ${
                  rule.isTriggered
                    ? 'border-rose-500/40 ring-1 ring-rose-500/30 bg-rose-950/20'
                    : 'border-[#1F2E45] hover:border-slate-600'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  {/* Rule Sentence and Details */}
                  <div className="space-y-3 flex-1">
                    {/* Severity and Status Pills */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                          isCritical
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : isWarning
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-[#719BDF]/10 text-[#719BDF] border-[#719BDF]/20'
                        }`}
                      >
                        {isCritical ? (
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                        ) : isWarning ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <Info className="w-3.5 h-3.5 text-[#719BDF]" />
                        )}
                        <span>{rule.severity.toUpperCase()}</span>
                      </span>

                      {rule.isTriggered ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-300 bg-rose-500/20 border border-rose-500/40 px-2.5 py-0.5 rounded-full animate-pulse">
                          <AlertTriangle className="w-3 h-3 text-rose-400" />
                          شرط برقرار است (تحریک شده)
                        </span>
                      ) : rule.isActive ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          فعال و عادی
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 bg-[#0B1423] border border-[#1F2E45] px-2.5 py-0.5 rounded-full font-medium">
                          غیرفعال
                        </span>
                      )}

                      {rule.kpiMetricName && (
                        <span className="text-[11px] text-slate-400 bg-[#0B1423] px-2.5 py-0.5 rounded-lg border border-[#1F2E45] font-medium">
                          متصل به KPI: {rule.kpiMetricName}
                        </span>
                      )}
                    </div>

                    {/* Sentence structure */}
                    <div className="text-xs sm:text-sm font-semibold text-white leading-relaxed">
                      <span className="text-slate-400 font-normal">اگر </span>
                      <span className="text-white font-bold underline decoration-[#719BDF]">
                        {rule.metricName}
                      </span>{' '}
                      <span className="text-[#719BDF] font-bold">
                        {getConditionLabel(rule.condition)}
                      </span>{' '}
                      <span className="font-mono text-white bg-[#0B1423] px-2 py-0.5 rounded-lg border border-[#1F2E45]">
                        {Number(rule.thresholdValue).toLocaleString('fa-IR')}
                      </span>{' '}
                      <span className="text-slate-400 font-normal">باشد:</span>
                    </div>

                    {/* Message and Suggested Action */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1 text-xs">
                      <div className="bg-[#0B1423] p-3 rounded-xl border border-[#1F2E45]">
                        <span className="text-slate-400 block text-[11px] mb-1 font-medium">
                          پیام هشدار:
                        </span>
                        <span className="text-white font-semibold">{rule.message}</span>
                      </div>

                      {rule.suggestedAction && (
                        <div className="bg-[#18263A]/80 p-3 rounded-xl border border-[#1F2E45]">
                          <span className="text-[#719BDF] block text-[11px] mb-1 font-medium">
                            اقدام پیشنهادی به مدیر:
                          </span>
                          <span className="text-slate-200 font-medium">
                            {rule.suggestedAction}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions & Toggle */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {canWrite && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleToggle(rule)}
                          disabled={togglingId === rule.id}
                          title={rule.isActive ? 'غیرفعال‌سازی قاعده' : 'فعال‌سازی قاعده'}
                          className={`p-2 rounded-xl border transition-all text-xs flex items-center gap-1.5 font-medium ${
                            rule.isActive
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                              : 'bg-[#0B1423] border-[#1F2E45] text-slate-400 hover:bg-[#18263A] hover:text-white'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                          <span>{rule.isActive ? 'فعال' : 'غیرفعال'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRule(rule);
                            setIsDrawerOpen(true);
                          }}
                          title="ویرایش قاعده"
                          className="p-2 text-slate-400 hover:text-[#719BDF] hover:bg-[#719BDF]/10 rounded-xl transition-colors border border-[#1F2E45]"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(rule)}
                          title="حذف قاعده"
                          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors border border-[#1F2E45]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Alert Rule Drawer */}
      <AlertRuleDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSuccess={() => {
          onRefresh();
        }}
        rule={selectedRule}
        metrics={metrics}
        kpis={kpis}
      />
    </div>
  );
}
