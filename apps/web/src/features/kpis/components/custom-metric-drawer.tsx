'use client';

import * as React from 'react';
import {
  Sparkles,
  Calculator,
  Loader2,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { Drawer } from '@/components/common/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/common/toast-provider';
import { kpisApi } from '../kpis.api';
import { MetricDefinition, MetricDirection } from '../types';
import { FormulaBuilder } from './formula-builder';

interface CustomMetricDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (metric: MetricDefinition) => void;
  campaigns?: Array<{ id: string; name: string }>;
}

export function CustomMetricDrawer({
  isOpen,
  onClose,
  onSuccess,
  campaigns = [],
}: CustomMetricDrawerProps) {
  const { toast } = useToast();

  const [name, setName] = React.useState('');
  const [code, setCode] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [formula, setFormula] = React.useState('');
  const [direction, setDirection] = React.useState<MetricDirection>('higher_is_better');
  const [unit, setUnit] = React.useState('تومان');

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (isOpen) {
      setName('');
      setCode('');
      setDescription('');
      setFormula('');
      setDirection('higher_is_better');
      setUnit('تومان');
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'نام شاخص الزامی است.';
    if (!code.trim()) {
      errs.code = 'کد لاتین شاخص الزامی است.';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(code.trim())) {
      errs.code = 'کد شاخص تنها می‌تواند شامل حروف انگلیسی، عدد و زیرخط باشد.';
    }
    if (!formula.trim()) errs.formula = 'فرمول محاسباتی الزامی است.';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const created = await kpisApi.createCustomMetric({
        name: name.trim(),
        code: code.trim().toLowerCase(),
        description: description.trim() || undefined,
        formula: formula.trim(),
        direction,
        unit: unit.trim() || 'تومان',
      });

      toast.success(`شاخص «${created.name}» با موفقیت به سیستم اضافه گردید.`, {
        title: 'شاخص سفارشی ایجاد شد',
      });
      onSuccess(created);
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'خطا در ایجاد شاخص اختصاصی';
      toast.error(msg, {
        title: 'خطا در ثبت شاخص',
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
            <Calculator className="w-4 h-4" />
          </div>
          <span>تعریف شاخص سفارشی جدید (فرمول‌ساز)</span>
        </div>
      }
      description="با استفاده از متغیرها و عملگرهای مجاز، فرمول دلخواه خود را بسازید و مستقیماً روی کمپین‌ها تست کنید."
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 py-2">
        {/* Name and Code */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              نام فارسی شاخص <span className="text-rose-400">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
              }}
              placeholder="مثال: درآمد به ازای کلیک"
              className={`bg-[#0B1423] border-[#1F2E45] text-white placeholder:text-slate-500 rounded-xl focus:border-[#719BDF] focus:ring-[#719BDF]/20 ${
                errors.name ? 'border-rose-500' : ''
              }`}
            />
            {errors.name && <p className="text-rose-400 text-[11px] mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              کد لاتین شاخص <span className="text-rose-400">*</span>
            </label>
            <Input
              value={code}
              dir="ltr"
              onChange={(e) => {
                setCode(e.target.value);
                if (errors.code) setErrors((prev) => ({ ...prev, code: '' }));
              }}
              placeholder="مثال: revenue_per_click"
              className={`bg-[#0B1423] border-[#1F2E45] text-white placeholder:text-slate-500 rounded-xl focus:border-[#719BDF] focus:ring-[#719BDF]/20 font-mono text-xs ${
                errors.code ? 'border-rose-500' : ''
              }`}
            />
            {errors.code && <p className="text-rose-400 text-[11px] mt-1">{errors.code}</p>}
          </div>
        </div>

        {/* Direction & Unit */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              جهت مطلوب بهینه‌سازی
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDirection('higher_is_better')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                  direction === 'higher_is_better'
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30'
                    : 'border-[#1F2E45] bg-[#0B1423] text-slate-400 hover:text-white'
                }`}
              >
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>بالاتر بهتر (افزایشی)</span>
              </button>
              <button
                type="button"
                onClick={() => setDirection('lower_is_better')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                  direction === 'lower_is_better'
                    ? 'border-[#719BDF]/40 bg-[#719BDF]/10 text-[#719BDF] ring-1 ring-[#719BDF]/30'
                    : 'border-[#1F2E45] bg-[#0B1423] text-slate-400 hover:text-white'
                }`}
              >
                <TrendingDown className="w-4 h-4 text-[#719BDF]" />
                <span>کمتر بهتر (CPL, CAC)</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              واحد اندازه‌گیری
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full text-xs border border-[#1F2E45] rounded-xl px-3 py-2.5 bg-[#0B1423] text-white focus:outline-none focus:border-[#719BDF]"
            >
              <option value="تومان" className="bg-[#0B1423] text-white">تومان</option>
              <option value="درصد" className="bg-[#0B1423] text-white">درصد (%)</option>
              <option value="نسبت" className="bg-[#0B1423] text-white">نسبت</option>
              <option value="عدد" className="bg-[#0B1423] text-white">تعداد / عدد</option>
              <option value="ریال" className="bg-[#0B1423] text-white">ریال</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            توضیحات تکمیلی (اختیاری)
          </label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="توضیح کوتاه در مورد هدف یا نحوه استفاده از این شاخص..."
            className="bg-[#0B1423] border-[#1F2E45] text-white placeholder:text-slate-500 rounded-xl focus:border-[#719BDF] focus:ring-[#719BDF]/20"
          />
        </div>

        {/* Interactive Formula Builder */}
        <div className="p-4 rounded-2xl border border-[#1F2E45] bg-[#0B1423]/70">
          <FormulaBuilder
            formula={formula}
            onChange={(val) => {
              setFormula(val);
              if (errors.formula) setErrors((prev) => ({ ...prev, formula: '' }));
            }}
            campaigns={campaigns}
            unit={unit}
          />
          {errors.formula && (
            <p className="text-rose-400 text-[11px] mt-2 font-medium">{errors.formula}</p>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1F2E45]">
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
            disabled={isSubmitting || !formula.trim()}
            className="bg-[#719BDF] hover:bg-[#5A85C9] text-white min-w-28 gap-1.5 rounded-xl shadow-lg shadow-[#719BDF]/20 font-medium"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubmitting ? 'در حال ذخیره...' : 'ذخیره شاخص'}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
