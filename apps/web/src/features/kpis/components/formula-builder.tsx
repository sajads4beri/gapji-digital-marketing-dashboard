'use client';

import * as React from 'react';
import {
  Calculator,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { kpisApi } from '../kpis.api';
import { PreviewFormulaResponse } from '../types';

interface FormulaBuilderProps {
  formula: string;
  onChange: (val: string) => void;
  campaigns?: Array<{ id: string; name: string }>;
  unit?: string;
}

const VARIABLES = [
  { key: 'cost', label: 'هزینه (cost)', desc: 'مجموع مبالغ هزینه شده' },
  { key: 'lead', label: 'لید (lead)', desc: 'تعداد کل سرنخ‌ها' },
  { key: 'customer', label: 'مشتری (customer)', desc: 'تعداد مشتریان تبدیل‌شده' },
  { key: 'revenue', label: 'درآمد (revenue)', desc: 'ارزش کل فروش بسته‌شده' },
  { key: 'clicks', label: 'کلیک (clicks)', desc: 'مجموع کلیک‌های ثبت شده' },
  { key: 'impressions', label: 'نمایش (impressions)', desc: 'مجموع نمایش‌های تبلیغات' },
  { key: 'conversions', label: 'تبدیل (conversions)', desc: 'تعداد کانورژن‌های انجام‌شده' },
  { key: 'budget', label: 'بودجه (budget)', desc: 'مجموع سقف بودجه تخصیصی' },
];

const OPERATORS = [
  { sym: '+', label: '+' },
  { sym: '-', label: '-' },
  { sym: '*', label: '×' },
  { sym: '/', label: '÷' },
  { sym: '(', label: '(' },
  { sym: ')', label: ')' },
];

export function FormulaBuilder({
  formula,
  onChange,
  campaigns = [],
  unit = 'تومان',
}: FormulaBuilderProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Validation state
  const [isValidating, setIsValidating] = React.useState(false);
  const [validationResult, setValidationResult] = React.useState<{
    isValid: boolean;
    error?: string;
    variables: string[];
    normalizedFormula?: string;
  } | null>(null);

  // Preview state
  const [selectedCampaignId, setSelectedCampaignId] = React.useState<string>('');
  const [isPreviewing, setIsPreviewing] = React.useState(false);
  const [previewResult, setPreviewResult] = React.useState<PreviewFormulaResponse | null>(null);
  const [previewError, setPreviewError] = React.useState<string | null>(null);

  // Insert token at cursor position
  const insertToken = (token: string) => {
    const el = textareaRef.current;
    if (!el) {
      onChange(formula ? `${formula} ${token}` : token);
      return;
    }

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const current = formula || '';
    const before = current.substring(0, start);
    const after = current.substring(end);

    // Add spaces around variables and operators for clarity
    const needsSpaceBefore = before.length > 0 && !before.endsWith(' ');
    const needsSpaceAfter = after.length > 0 && !after.startsWith(' ');
    const insertion = `${needsSpaceBefore ? ' ' : ''}${token}${needsSpaceAfter ? ' ' : ''}`;

    const newFormula = before + insertion + after;
    onChange(newFormula);

    setTimeout(() => {
      el.focus();
      const newPos = start + insertion.length;
      el.setSelectionRange(newPos, newPos);
    }, 0);
  };

  // Debounced live syntax validation
  React.useEffect(() => {
    if (!formula.trim()) {
      setValidationResult(null);
      setPreviewResult(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsValidating(true);
      try {
        const res = await kpisApi.validateFormula({ formula });
        setValidationResult(res);
      } catch (err: any) {
        setValidationResult({
          isValid: false,
          error: err.response?.data?.message || err.message || 'خطا در ارزیابی فرمول',
          variables: [],
        });
      } finally {
        setIsValidating(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [formula]);

  // Handle run preview
  const handlePreview = async () => {
    if (!formula.trim() || !validationResult?.isValid) return;

    setIsPreviewing(true);
    setPreviewError(null);
    try {
      const res = await kpisApi.previewFormula({
        formula,
        campaignId: selectedCampaignId || undefined,
      });
      setPreviewResult(res);
    } catch (err: any) {
      setPreviewError(err.response?.data?.message || err.message || 'خطا در محاسبه پیش‌نمایش');
    } finally {
      setIsPreviewing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Variable tokens */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
          متغیرهای قابل استفاده در فرمول (کلیک جهت درج)
        </label>
        <div className="flex flex-wrap gap-1.5">
          {VARIABLES.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => insertToken(v.key)}
              title={v.desc}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-[#0B1423] text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/10 hover:border-emerald-500/40 transition-colors"
            >
              <span className="font-mono text-[11px] text-emerald-300">{v.key}</span>
              <span>{v.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Operator buttons */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
          عملگرها و پرانتزها
        </label>
        <div className="flex items-center gap-2">
          {OPERATORS.map((op) => (
            <button
              key={op.sym}
              type="button"
              onClick={() => insertToken(op.sym)}
              className="w-9 h-8 inline-flex items-center justify-center text-sm font-bold rounded-lg bg-[#0B1423] text-white border border-[#1F2E45] hover:bg-[#18263A] hover:border-[#719BDF]/40 transition-colors"
            >
              {op.label}
            </button>
          ))}

          <button
            type="button"
            onClick={() => onChange('')}
            className="ms-auto inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            پاک کردن فرمول
          </button>
        </div>
      </div>

      {/* 3. Formula Textarea */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1">
          محیط نگارش فرمول
        </label>
        <div className="relative">
          <textarea
            ref={textareaRef}
            rows={3}
            dir="ltr"
            value={formula}
            onChange={(e) => onChange(e.target.value)}
            placeholder="مثال: (revenue - cost) / cost"
            className="w-full font-mono text-sm px-3.5 py-2.5 border rounded-xl focus:outline-none focus:border-[#719BDF] focus:ring-1 focus:ring-[#719BDF]/30 bg-[#0B1423] border-[#1F2E45] text-white placeholder:text-slate-500 resize-none"
          />
        </div>
      </div>

      {/* 4. Live Syntax Validation Feedback */}
      {validationResult && (
        <div
          className={`p-3.5 rounded-xl border text-xs transition-all ${
            validationResult.isValid
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {validationResult.isValid ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 space-y-1">
              <div className="font-semibold">
                {validationResult.isValid
                  ? 'فرمول معتبر است و ساختار نحوی صحیح دارد.'
                  : 'خطای نحوی در فرمول:'}
              </div>
              {!validationResult.isValid && (
                <div className="text-[11px] font-medium leading-relaxed text-rose-300/90">
                  {validationResult.error}
                </div>
              )}
              {validationResult.isValid && validationResult.normalizedFormula && (
                <div className="text-[11px] flex items-center gap-2 text-emerald-400 pt-1">
                  <span>فرمول استانداردسازی‌شده:</span>
                  <code className="font-mono bg-[#0B1423] px-2 py-0.5 rounded border border-emerald-500/30 text-emerald-300 font-semibold" dir="ltr">
                    {validationResult.normalizedFormula}
                  </code>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Campaign Live Preview */}
      <div className="pt-3 border-t border-[#1F2E45]">
        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
          پیش‌نمایش زنده محاسبه فرمول با داده‌های واقعی
        </label>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <select
            value={selectedCampaignId}
            onChange={(e) => setSelectedCampaignId(e.target.value)}
            className="flex-1 text-xs border border-[#1F2E45] rounded-xl px-3 py-2.5 bg-[#0B1423] text-white focus:outline-none focus:border-[#719BDF]"
          >
            <option value="" className="bg-[#0B1423] text-slate-300">داده‌های کل سازمان (همه کمپین‌ها)</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id} className="bg-[#0B1423] text-white">
                کمپین: {c.name}
              </option>
            ))}
          </select>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!formula.trim() || !validationResult?.isValid || isPreviewing}
            onClick={handlePreview}
            className="shrink-0 text-xs border-[#719BDF]/40 text-[#719BDF] bg-[#719BDF]/10 hover:bg-[#719BDF]/20 rounded-xl gap-1.5 h-9"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {isPreviewing ? 'در حال محاسبه...' : 'محاسبه پیش‌نمایش'}
          </Button>
        </div>

        {previewError && (
          <div className="mt-2.5 p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{previewError}</span>
          </div>
        )}

        {previewResult && (
          <div className="mt-3 p-3.5 bg-[#0B1423] rounded-xl border border-[#1F2E45] shadow-lg space-y-2">
            <div className="flex items-center justify-between border-b border-[#1F2E45] pb-2">
              <span className="text-xs font-semibold text-slate-300">
                نتیجه محاسبه ({previewResult.campaignName}):
              </span>
              <div className="text-base font-bold text-emerald-400 font-mono">
                {previewResult.value.toLocaleString('fa-IR')}{' '}
                <span className="text-xs font-normal text-slate-400">{unit}</span>
              </div>
            </div>

            {previewResult.divisionByZero && (
              <div className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>یکی از مخرج‌ها صفر بوده و حاصل آن برای جلوگیری از خطا صفر در نظر گرفته شد.</span>
              </div>
            )}

            <div className="text-[11px] text-slate-400 pt-1">
              <span className="font-semibold text-slate-300">مقادیر استفاده شده: </span>
              {Object.entries(previewResult.contextVariables || {}).map(([k, v]) => (
                <span key={k} className="inline-block ms-2 font-mono bg-[#18263A] text-slate-300 px-2 py-0.5 rounded-md border border-[#1F2E45]">
                  {k}: {Number(v).toLocaleString('fa-IR')}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
