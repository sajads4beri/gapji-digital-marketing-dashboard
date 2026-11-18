'use client';

import * as React from 'react';
import {
  Bell,
  Sparkles,
  Loader2,
  AlertTriangle,
  ShieldAlert,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { Drawer } from '@/components/common/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/common/toast-provider';
import { kpisApi } from '../kpis.api';
import { AlertRuleItem, CreateAlertRuleInput, UpdateAlertRuleInput, MetricDefinition, KpiItem } from '../types';

interface AlertRuleDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (rule: AlertRuleItem) => void;
  rule: AlertRuleItem | null;
  metrics: MetricDefinition[];
  kpis: KpiItem[];
}

const CONDITIONS = [
  { val: 'gt', label: 'بزرگتر از (>)' },
  { val: 'lt', label: 'کوچکتر از (<)' },
  { val: 'gte', label: 'بزرگتر یا مساوی (≥)' },
  { val: 'lte', label: 'کوچکتر یا مساوی (≤)' },
  { val: 'eq', label: 'دقیقاً مساوی (=)' },
];

const SEVERITIES = [
  { val: 'warning', label: 'هشدار (Warning)', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  { val: 'critical', label: 'بحرانی (Critical)', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
  { val: 'info', label: 'اطلاعیه (Info)', color: 'text-[#719BDF] bg-[#719BDF]/10 border-[#719BDF]/30' },
];

export function AlertRuleDrawer({
  isOpen,
  onClose,
  onSuccess,
  rule,
  metrics,
  kpis,
}: AlertRuleDrawerProps) {
  const { toast } = useToast();
  const isEditing = Boolean(rule);

  const [metricName, setMetricName] = React.useState('CPL');
  const [kpiMetricId, setKpiMetricId] = React.useState<string>('');
  const [condition, setCondition] = React.useState<'gt' | 'lt' | 'gte' | 'lte' | 'eq'>('gt');
  const [thresholdValue, setThresholdValue] = React.useState('70000');
  const [severity, setSeverity] = React.useState<'info' | 'warning' | 'critical'>('warning');
  const [message, setMessage] = React.useState('');
  const [suggestedAction, setSuggestedAction] = React.useState('');
  const [isActive, setIsActive] = React.useState(true);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (rule) {
      setMetricName(rule.metricName || 'CPL');
      setKpiMetricId(rule.kpiMetricId || '');
      setCondition(rule.condition || 'gt');
      setThresholdValue(String(rule.thresholdValue || ''));
      setSeverity(rule.severity || 'warning');
      setMessage(rule.message || '');
      setSuggestedAction(rule.suggestedAction || '');
      setIsActive(rule.isActive !== undefined ? rule.isActive : true);
      setErrors({});
    } else {
      const defaultMetric = metrics[0]?.name || 'CPL';
      setMetricName(defaultMetric);
      setKpiMetricId('');
      setCondition('gt');
      setThresholdValue('70000');
      setSeverity('warning');
      setMessage('افزایش نامتعارف هزینه جذب سرنخ');
      setSuggestedAction('کاهش بیدهای مزایده و بازبینی هدف‌گذاری کمپین');
      setIsActive(true);
      setErrors({});
    }
  }, [isOpen, rule, metrics]);

  // When metricName or threshold changes, auto-suggest message if empty
  const handleMetricSelect = (val: string) => {
    // If it is a KPI ID
    const foundKpi = kpis.find((k) => k.id === val);
    if (foundKpi) {
      setKpiMetricId(foundKpi.id);
      setMetricName(foundKpi.name);
      return;
    }

    setKpiMetricId('');
    setMetricName(val);
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

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!metricName.trim()) errs.metricName = 'انتخاب شاخص الزامی است.';
    if (!thresholdValue || isNaN(Number(thresholdValue))) {
      errs.thresholdValue = 'مقدار آستانه باید یک عدد معتبر باشد.';
    }
    if (!message.trim()) errs.message = 'متن پیام هشدار الزامی است.';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (isEditing && rule) {
        const payload: UpdateAlertRuleInput = {
          kpiMetricId: kpiMetricId || undefined,
          metricName: metricName.trim(),
          condition,
          thresholdValue: Number(thresholdValue),
          severity,
          message: message.trim(),
          suggestedAction: suggestedAction.trim() || undefined,
          isActive,
        };
        const updated = await kpisApi.updateAlertRule(rule.id, payload);
        toast.success('تنظیمات قاعده هشدار با موفقیت ذخیره گردید.', {
          title: 'قاعده هشدار به‌روزرسانی شد',
        });
        onSuccess(updated);
      } else {
        const payload: CreateAlertRuleInput = {
          kpiMetricId: kpiMetricId || undefined,
          metricName: metricName.trim(),
          condition,
          thresholdValue: Number(thresholdValue),
          severity,
          message: message.trim(),
          suggestedAction: suggestedAction.trim() || undefined,
          isActive,
        };
        const created = await kpisApi.createAlertRule(payload);
        toast.success('قاعده نظارتی جدید با موفقیت فعال شد.', {
          title: 'قاعده هشدار جدید ایجاد شد',
        });
        onSuccess(created);
      }
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'خطا در ثبت قاعده', {
        title: 'خطا در ذخیره قاعده هشدار',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5 text-white font-bold text-base">
          <div className="w-8 h-8 rounded-lg bg-[#719BDF]/10 border border-[#719BDF]/20 flex items-center justify-center text-[#719BDF]">
            <Bell className="w-4 h-4" />
          </div>
          <span>{isEditing ? 'ویرایش قاعده هشدار' : 'جمله‌ساز قاعده هشدار جدید'}</span>
        </div>
      }
      description="تعریف قواعد خودکار به صورت ساختار جمله‌ای بر مبنای سند رسمی محصول (PRD ص ۱۳)."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5 py-2">
        {/* Dynamic Sentence Builder Preview Box */}
        <div className="p-4 rounded-2xl border border-[#719BDF]/30 bg-[#719BDF]/10 space-y-2">
          <div className="text-[11px] font-bold text-[#719BDF] uppercase tracking-wide flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#719BDF]" />
            <span>پیش‌نمایش منطق جمله هشدار (PRD ص ۱۳):</span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed font-medium">
            اگر شاخص <span className="text-white font-bold underline decoration-[#719BDF]">{metricName || '...'}</span>{' '}
            <span className="text-[#719BDF] font-bold">{getConditionLabel(condition)}</span>{' '}
            <span className="font-mono font-bold text-white bg-[#0B1423] px-2 py-0.5 rounded-lg border border-[#1F2E45]">
              {Number(thresholdValue || 0).toLocaleString('fa-IR')}
            </span>{' '}
            باشد، آنگاه پیام{' '}
            <span className="text-rose-400 font-bold">«{message || '...'}»</span> نمایش داده شده و
            اقدام پیشنهادی{' '}
            <span className="text-white font-semibold underline decoration-slate-400">
              «{suggestedAction || 'ثبت نشده'}»
            </span>{' '}
            ارائه شود.
          </p>
        </div>

        {/* 1. Metric Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            شاخص مورد ارزیابی <span className="text-rose-400">*</span>
          </label>
          <select
            value={kpiMetricId || metricName}
            onChange={(e) => handleMetricSelect(e.target.value)}
            className="w-full text-xs border border-[#1F2E45] rounded-xl px-3 py-2.5 bg-[#0B1423] text-white focus:outline-none focus:border-[#719BDF]"
          >
            <optgroup label="شاخص‌های KPI تعریف‌شده (سازمان / کمپین)" className="bg-[#0B1423] text-slate-300">
              {kpis.map((k) => (
                <option key={k.id} value={k.id} className="bg-[#0B1423] text-white">
                  KPI: {k.name} ({k.scopeTitle})
                </option>
              ))}
            </optgroup>
            <optgroup label="کاتالوگ کلی شاخص‌ها" className="bg-[#0B1423] text-slate-300">
              {metrics.map((m) => (
                <option key={m.code} value={m.name} className="bg-[#0B1423] text-white">
                  {m.name} ({m.code})
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* 2. Condition & Threshold Value */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              شرط مقایسه <span className="text-rose-400">*</span>
            </label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value as any)}
              className="w-full text-xs border border-[#1F2E45] rounded-xl px-3 py-2.5 bg-[#0B1423] text-white focus:outline-none focus:border-[#719BDF]"
            >
              {CONDITIONS.map((c) => (
                <option key={c.val} value={c.val} className="bg-[#0B1423] text-white">
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              مقدار عددی آستانه <span className="text-rose-400">*</span>
            </label>
            <Input
              type="number"
              step="any"
              value={thresholdValue}
              onChange={(e) => {
                setThresholdValue(e.target.value);
                if (errors.thresholdValue) setErrors((prev) => ({ ...prev, thresholdValue: '' }));
              }}
              placeholder="مثال: 70000"
              className={`bg-[#0B1423] border-[#1F2E45] text-white placeholder:text-slate-500 rounded-xl focus:border-[#719BDF] focus:ring-[#719BDF]/20 ${
                errors.thresholdValue ? 'border-rose-500' : ''
              }`}
            />
            {errors.thresholdValue && (
              <p className="text-rose-400 text-[11px] mt-1">{errors.thresholdValue}</p>
            )}
          </div>
        </div>

        {/* 3. Severity Level */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            سطح اهمیت هشدار
          </label>
          <div className="grid grid-cols-3 gap-2">
            {SEVERITIES.map((s) => (
              <button
                key={s.val}
                type="button"
                onClick={() => setSeverity(s.val as any)}
                className={`py-2 px-2.5 rounded-xl border text-xs font-medium transition-all text-center ${
                  severity === s.val
                    ? `${s.color} ring-1 ring-current font-bold`
                    : 'border-[#1F2E45] bg-[#0B1423] text-slate-400 hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Alert Message Text */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            متن پیام هشدار <span className="text-rose-400">*</span>
          </label>
          <Input
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              if (errors.message) setErrors((prev) => ({ ...prev, message: '' }));
            }}
            placeholder="مثال: هزینه به ازای هر لید بیش از حد مجاز افزایش یافته است"
            className={`bg-[#0B1423] border-[#1F2E45] text-white placeholder:text-slate-500 rounded-xl focus:border-[#719BDF] focus:ring-[#719BDF]/20 ${
              errors.message ? 'border-rose-500' : ''
            }`}
          />
          {errors.message && <p className="text-rose-400 text-[11px] mt-1">{errors.message}</p>}
        </div>

        {/* 5. Suggested Action Text */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            اقدام پیشنهادی به مدیر (Suggested Action)
          </label>
          <Input
            value={suggestedAction}
            onChange={(e) => setSuggestedAction(e.target.value)}
            placeholder="مثال: کاهش بودجه روزانه کمپین یا بازبینی هدف‌گذاری مخاطبان"
            className="bg-[#0B1423] border-[#1F2E45] text-white placeholder:text-slate-500 rounded-xl focus:border-[#719BDF] focus:ring-[#719BDF]/20"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            راهکاری که در صورت تحریک هشدار جهت رفع مشکل به مدیر نمایش داده می‌شود.
          </p>
        </div>

        {/* 6. Active Toggle */}
        <div className="flex items-center gap-2.5 pt-2">
          <input
            type="checkbox"
            id="rule-active-chk"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 rounded text-[#719BDF] focus:ring-[#719BDF] bg-[#0B1423] border-[#1F2E45]"
          />
          <label htmlFor="rule-active-chk" className="text-xs font-medium text-slate-300 cursor-pointer">
            این قاعده هشدار هم‌اکنون فعال باشد و به صورت زنده رصد شود
          </label>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1F2E45]">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="border-[#1F2E45] bg-[#0B1423] text-slate-300 hover:bg-[#18263A] hover:text-white rounded-xl"
          >
            انصراف
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#719BDF] hover:bg-[#5A85C9] text-white min-w-28 gap-1.5 rounded-xl shadow-lg shadow-[#719BDF]/20 font-medium"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubmitting ? 'در حال ذخیره...' : isEditing ? 'ویرایش قاعده' : 'ثبت قاعده هشدار'}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
