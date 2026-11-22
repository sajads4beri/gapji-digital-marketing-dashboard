'use client';

import * as React from 'react';
import {
  Target,
  Sparkles,
  Loader2,
  TrendingUp,
  TrendingDown,
  Layers,
  Calendar,
} from 'lucide-react';
import { Drawer } from '@/components/common/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/common/toast-provider';
import { kpisApi } from '../kpis.api';
import { KpiItem, MetricDefinition, MetricDirection, CreateKpiInput, UpdateKpiInput } from '../types';

interface KpiDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (kpi: KpiItem) => void;
  kpi: KpiItem | null;
  metrics: MetricDefinition[];
  campaigns?: Array<{ id: string; name: string }>;
}

const PERIOD_OPTIONS = [
  'ماهانه',
  'فصلی',
  'سالانه',
  'هفتگی',
  'طول کمپین',
];

export function KpiDrawer({
  isOpen,
  onClose,
  onSuccess,
  kpi,
  metrics,
  campaigns = [],
}: KpiDrawerProps) {
  const { toast } = useToast();
  const isEditing = Boolean(kpi);

  const [name, setName] = React.useState('');
  const [metricCode, setMetricCode] = React.useState('');
  const [scopeType, setScopeType] = React.useState<'organization' | 'campaign'>('organization');
  const [campaignId, setCampaignId] = React.useState('');
  const [targetValue, setTargetValue] = React.useState('');
  const [direction, setDirection] = React.useState<MetricDirection>('higher_is_better');
  const [unit, setUnit] = React.useState('تومان');
  const [period, setPeriod] = React.useState('ماهانه');
  const [formula, setFormula] = React.useState('');

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Reset or populate on open
  React.useEffect(() => {
    if (kpi) {
      setName(kpi.name || '');
      setMetricCode(kpi.code || '');
      setScopeType(kpi.scope || 'organization');
      setCampaignId(kpi.campaign?.id || '');
      setTargetValue(String(kpi.targetValue || ''));
      setDirection(kpi.direction || 'higher_is_better');
      setUnit(kpi.unit || 'تومان');
      setPeriod(kpi.period || 'ماهانه');
      setFormula(kpi.formula || '');
      setErrors({});
    } else {
      setName('');
      // Default to first metric if available
      const firstMetric = metrics[0];
      setMetricCode(firstMetric ? firstMetric.code : 'cpl');
      setScopeType('organization');
      setCampaignId('');
      setTargetValue('50000');
      setDirection(firstMetric ? firstMetric.direction : 'lower_is_better');
      setUnit(firstMetric ? firstMetric.unit : 'تومان');
      setPeriod('ماهانه');
      setFormula(firstMetric ? firstMetric.formula : 'cost / lead');
      setErrors({});
    }
  }, [isOpen, kpi, metrics]);

  // When metricCode changes in creation mode, update default unit, direction, formula
  const handleMetricCodeChange = (code: string) => {
    setMetricCode(code);
    const m = metrics.find((x) => x.code === code);
    if (m) {
      setDirection(m.direction);
      setUnit(m.unit);
      setFormula(m.formula);
      if (!name || metrics.some((x) => x.name === name)) {
        setName(`${m.name} هدف`);
      }
    }
  };

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'نام شاخص KPI الزامی است.';
    if (!metricCode) errs.metricCode = 'انتخاب شاخص پایه الزامی است.';
    if (!targetValue || isNaN(Number(targetValue)) || Number(targetValue) <= 0) {
      errs.targetValue = 'مقدار هدف باید عددی مثبت باشد.';
    }
    if (scopeType === 'campaign' && !campaignId) {
      errs.campaignId = 'انتخاب کمپین در دامنه کمپین الزامی است.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (isEditing && kpi) {
        const payload: UpdateKpiInput = {
          name: name.trim(),
          code: metricCode,
          campaignId: scopeType === 'campaign' ? campaignId : undefined,
          targetValue: Number(targetValue),
          direction,
          unit: unit.trim(),
          period: period.trim(),
          formula: formula.trim() || undefined,
        };
        const updated = await kpisApi.updateKpi(kpi.id, payload);
        toast.success(`شاخص «${updated.name}» با موفقیت ویرایش شد.`, {
          title: 'KPI به‌روزرسانی شد',
        });
        onSuccess(updated);
      } else {
        const payload: CreateKpiInput = {
          name: name.trim(),
          code: metricCode,
          campaignId: scopeType === 'campaign' ? campaignId : undefined,
          targetValue: Number(targetValue),
          direction,
          unit: unit.trim(),
          period: period.trim(),
          formula: formula.trim() || undefined,
        };
        const created = await kpisApi.createKpi(payload);
        toast.success(`شاخص هدف «${created.name}» با موفقیت ایجاد گردید.`, {
          title: 'KPI جدید ثبت شد',
        });
        onSuccess(created);
      }
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'خطا در ثبت شاخص KPI', {
        title: 'خطا در ذخیره KPI',
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
            <Target className="w-4 h-4" />
          </div>
          <span>{isEditing ? 'ویرایش شاخص هدف KPI' : 'تعریف شاخص هدف KPI جدید'}</span>
        </div>
      }
      description="تعیین هدف عددی برای شاخص‌های عملکردی در سطح کل سازمان یا یک کمپین اختصاصی."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        {/* Metric Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            شاخص مورد نظر <span className="text-rose-400">*</span>
          </label>
          <select
            value={metricCode}
            onChange={(e) => handleMetricCodeChange(e.target.value)}
            className="w-full text-xs border border-[#1F2E45] rounded-xl px-3 py-2.5 bg-[#0B1423] text-white focus:outline-none focus:border-[#719BDF] focus:ring-1 focus:ring-[#719BDF]/30"
          >
            <optgroup label="شاخص‌های استاندارد سیستم" className="bg-[#0B1423] text-slate-300">
              {metrics
                .filter((m) => m.isDefault)
                .map((m) => (
                  <option key={m.code} value={m.code}>
                    {m.name} ({m.code})
                  </option>
                ))}
            </optgroup>
            {metrics.filter((m) => !m.isDefault).length > 0 && (
              <optgroup label="شاخص‌های سفارشی سازمان" className="bg-[#0B1423] text-slate-300">
                {metrics
                  .filter((m) => !m.isDefault)
                  .map((m) => (
                    <option key={m.code} value={m.code}>
                      {m.name} ({m.code})
                    </option>
                  ))}
              </optgroup>
            )}
          </select>
        </div>

        {/* KPI Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            عنوان نمایش KPI <span className="text-rose-400">*</span>
          </label>
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
            }}
            placeholder="مثال: CPL هدف کمپین نوروز"
            className={`bg-[#0B1423] border-[#1F2E45] text-white placeholder:text-slate-500 rounded-xl focus:border-[#719BDF] focus:ring-[#719BDF]/20 ${
              errors.name ? 'border-rose-500' : ''
            }`}
          />
          {errors.name && <p className="text-rose-400 text-[11px] mt-1">{errors.name}</p>}
        </div>

        {/* Scope (Organization vs Campaign) */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            دامنه اعمال KPI (Scope)
          </label>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button
              type="button"
              onClick={() => setScopeType('organization')}
              className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                scopeType === 'organization'
                  ? 'border-[#719BDF] bg-[#18263A] text-white shadow-sm ring-1 ring-[#719BDF]/30'
                  : 'border-[#1F2E45] bg-[#0B1423] text-slate-400 hover:text-white'
              }`}
            >
              کل سازمان (تمام کمپین‌ها)
            </button>
            <button
              type="button"
              onClick={() => setScopeType('campaign')}
              className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                scopeType === 'campaign'
                  ? 'border-[#719BDF] bg-[#18263A] text-white shadow-sm ring-1 ring-[#719BDF]/30'
                  : 'border-[#1F2E45] bg-[#0B1423] text-slate-400 hover:text-white'
              }`}
            >
              کمپین خاص
            </button>
          </div>

          {scopeType === 'campaign' && (
            <div>
              <Select
                value={campaignId}
                onChange={(e) => {
                  setCampaignId(e.target.value);
                  if (errors.campaignId) setErrors((prev) => ({ ...prev, campaignId: '' }));
                }}
                error={errors.campaignId}
                placeholder="انتخاب کمپین هدف..."
                options={campaigns.map((c) => ({
                  value: c.id,
                  label: c.name,
                }))}
              />
            </div>
          )}
        </div>

        {/* Target Value and Unit */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              مقدار هدف عددی <span className="text-rose-400">*</span>
            </label>
            <Input
              type="number"
              min="0"
              step="any"
              value={targetValue}
              onChange={(e) => {
                setTargetValue(e.target.value);
                if (errors.targetValue) setErrors((prev) => ({ ...prev, targetValue: '' }));
              }}
              placeholder="مثال: 50000"
              className={`bg-[#0B1423] border-[#1F2E45] text-white placeholder:text-slate-500 rounded-xl focus:border-[#719BDF] focus:ring-[#719BDF]/20 ${
                errors.targetValue ? 'border-rose-500' : ''
              }`}
            />
            {errors.targetValue && (
              <p className="text-rose-400 text-[11px] mt-1">{errors.targetValue}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              واحد اندازه‌گیری
            </label>
            <Input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="تومان، درصد، نسبت..."
              className="bg-[#0B1423] border-[#1F2E45] text-white placeholder:text-slate-500 rounded-xl focus:border-[#719BDF] focus:ring-[#719BDF]/20"
            />
          </div>
        </div>

        {/* Direction & Period */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              جهت مطلوب بهینه‌سازی
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDirection('higher_is_better')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border text-[11px] font-medium transition-all ${
                  direction === 'higher_is_better'
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30'
                    : 'border-[#1F2E45] bg-[#0B1423] text-slate-400 hover:text-white'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>بالاتر بهتر</span>
              </button>
              <button
                type="button"
                onClick={() => setDirection('lower_is_better')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border text-[11px] font-medium transition-all ${
                  direction === 'lower_is_better'
                    ? 'border-[#719BDF]/40 bg-[#719BDF]/10 text-[#719BDF] ring-1 ring-[#719BDF]/30'
                    : 'border-[#1F2E45] bg-[#0B1423] text-slate-400 hover:text-white'
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5 text-[#719BDF]" />
                <span>کمتر بهتر</span>
              </button>
            </div>
          </div>

          <div>
            <Select
              label="بازه زمانی سنجش"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              options={PERIOD_OPTIONS.map((p) => ({ value: p, label: p }))}
            />
          </div>
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
            {isSubmitting ? 'در حال ذخیره...' : isEditing ? 'ویرایش KPI' : 'ثبت KPI'}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
