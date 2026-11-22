'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Filter,
  Users,
  Eye,
  TrendingDown,
  TrendingUp,
  Minus,
  RefreshCw,
  HelpCircle,
  Layers,
  ChevronDown,
  Sparkles,
  ArrowDown,
  Trophy,
  Target,
  ArrowLeft,
  CheckCircle2,
  Edit3,
  Gauge,
  X,
  Check,
} from 'lucide-react';
import { useToast } from '@/components/common/toast-provider';
import { campaignService } from '../api';
import type { CampaignFunnelResponse, CampaignFunnelStage } from '../types';
import { CampaignStageLeadsDrawer } from './campaign-stage-leads-drawer';
import { CampaignStageOkrPanel } from './campaign-stage-okr-panel';

export interface CampaignSalesFunnelProps {
  campaignId: string;
  campaignName?: string;
}

export interface FunnelTransitionKpi {
  title: string;
  code: string;
  description?: string;
  actualValue: number;
  targetValue: number;
  unit: string;
  direction: 'higher_is_better' | 'lower_is_better';
}

// تعریف شاخص‌های کلیدی استاندارد مارکتینگ سازگار با ماژول KPI داشبورد برای هر گذار
const DEFAULT_STAGE_KPIS: Record<
  number,
  {
    title: string;
    code: string;
    description: string;
    defaultTarget: number;
    unit: string;
    direction: 'higher_is_better' | 'lower_is_better';
  }
> = {
  1: {
    title: 'نرخ برقراری تماس (Connect Rate)',
    code: 'CR_CONNECT',
    description: 'درصد سرنخ‌های ورودی جدید که به تماس موفق اولیه منتهی شده‌اند.',
    defaultTarget: 80,
    unit: '٪',
    direction: 'higher_is_better',
  },
  2: {
    title: 'نرخ صلاحیت‌سنجی (SQL Rate)',
    code: 'CR_SQL',
    description: 'درصد لیدهای تماس‌گرفته‌شده که معیارهای اهلیت و خرید را احراز کرده‌اند.',
    defaultTarget: 60,
    unit: '٪',
    direction: 'higher_is_better',
  },
  3: {
    title: 'نرخ صدور پیش‌پیشنهاد (Proposal Rate)',
    code: 'CR_PROPOSAL',
    description: 'نسبت سرنخ‌های واجد شرایط که برایشان پیشنهاد یا پیش‌فاکتور ارسال شده است.',
    defaultTarget: 45,
    unit: '٪',
    direction: 'higher_is_better',
  },
  4: {
    title: 'نرخ نهایی‌سازی و خرید (Win Rate)',
    code: 'CR_WIN',
    description: 'نسبت پیش‌فاکتورهای ارائه‌شده که با موفقیت تبدیل به مشتری نهایی شده‌اند.',
    defaultTarget: 30,
    unit: '٪',
    direction: 'higher_is_better',
  },
  5: {
    title: 'نرخ حفظ و نگه‌داشت (Retention Rate)',
    code: 'CR_RETENTION',
    description: 'شاخص پایبندی و جلوگیری از ریزش مشتری پس از ورود به سیستم.',
    defaultTarget: 15,
    unit: '٪',
    direction: 'higher_is_better',
  },
};

/**
 * محاسبه وضعیت سلامت، انحراف عددی و درصد تحقق تارگت بر اساس استانداردهای ماژول KPI داشبورد
 */
export function computeKpiStatus(kpi: FunnelTransitionKpi) {
  const target = kpi.targetValue || 1;
  const actual = kpi.actualValue || 0;
  const diff = actual - target;
  const ratio = target > 0 ? actual / target : 1;

  let health: 'healthy' | 'warning' | 'critical' = 'healthy';
  if (kpi.direction === 'higher_is_better') {
    if (actual >= target) health = 'healthy';
    else if (ratio >= 0.8) health = 'warning';
    else health = 'critical';
  } else {
    if (actual <= target) health = 'healthy';
    else if (ratio <= 1.2) health = 'warning';
    else health = 'critical';
  }

  const sign = diff > 0 ? '+' : '';
  const diffFormatted = `${sign}${diff.toFixed(1)}${kpi.unit}`;

  return {
    health,
    diff: Number(diff.toFixed(1)),
    diffFormatted,
    ratioPercent: Math.round(ratio * 100),
  };
}

// پالت رنگ‌های زنده، پرانرژی و روشن متناسب با هویت قیف فروش
const STAGE_GRADIENTS = [
  {
    name: 'royal-blue',
    from: '#3B82F6',
    to: '#1D4ED8',
    stroke: '#93C5FD',
  }, // ۱. آگاهی / جدید (آبی روشن و گیرا)
  {
    name: 'cyan',
    from: '#06B6D4',
    to: '#0284C7',
    stroke: '#67E8F9',
  }, // ۲. علاقه‌مندی / تماس گرفته شد (فیروزه‌ای درخشان)
  {
    name: 'teal',
    from: '#14B8A6',
    to: '#0F766E',
    stroke: '#5EEAD4',
  }, // ۳. واجد شرایط / بررسی (سبزآبی باطراوت)
  {
    name: 'amber',
    from: '#F59E0B',
    to: '#D97706',
    stroke: '#FCD34D',
  }, // ۴. پیشنهاد / قصد خرید (کهربایی زرین روشن)
  {
    name: 'orange',
    from: '#FB923C',
    to: '#EA580C',
    stroke: '#FDBA74',
  }, // ۵. ارزیابی نهایی (نارنجی تابناک)
  {
    name: 'emerald',
    from: '#10B981',
    to: '#059669',
    stroke: '#6EE7B7',
  }, // ۶. مشتری / خرید موفق (زمردی درخشان)
];

export function CampaignSalesFunnel({
  campaignId,
  campaignName = '',
}: CampaignSalesFunnelProps) {
  const { toast } = useToast();
  const [funnelData, setFunnelData] = useState<CampaignFunnelResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // مرحله فعال برای پنل OKR سمت چپ (به صورت پیش‌فرض null یعنی نمایش خلاصه همه مراحل)
  const [activeOkrStage, setActiveOkrStage] = useState<CampaignFunnelStage | null>(null);

  // مرجع جهت جلوگیری از بازنشانی مکرر مرحله فعال پس از بارگذاری اولیه
  const isInitialStageSetRef = React.useRef(false);

  // مرحله انتخاب‌شده برای باز شدن کشوی لیست لیدها
  const [leadsDrawerStage, setLeadsDrawerStage] = useState<CampaignFunnelStage | null>(null);

  // شاخص‌های کلیدی عملکرد (KPI) تعریف‌شده بین مراحل قیف
  const [transitionKpis, setTransitionKpis] = useState<Record<number, FunnelTransitionKpi>>({});
  const [editingKpi, setEditingKpi] = useState<(FunnelTransitionKpi & {
    index: number;
    fromStage: CampaignFunnelStage;
    toStage: CampaignFunnelStage;
  }) | null>(null);

  // بازیابی شاخص‌های KPI ذخیره‌شده کمپین از حافظه محلی
  useEffect(() => {
    if (!campaignId) return;
    try {
      const saved = localStorage.getItem(`campaign-funnel-kpis-${campaignId}`);
      if (saved) {
        setTransitionKpis(JSON.parse(saved));
      }
    } catch (e) {}
  }, [campaignId]);

  const getStageKpi = useCallback(
    (index: number, stage: CampaignFunnelStage): FunnelTransitionKpi => {
      if (transitionKpis[index]) {
        return transitionKpis[index];
      }
      const defaultMeta = DEFAULT_STAGE_KPIS[index] || {
        title: 'نرخ گذار مرحله',
        code: `CR_STAGE_${index}`,
        description: 'شاخص سنجش اثربخشی گذار بین مراحل قیف.',
        defaultTarget: 50,
        unit: '٪',
        direction: 'higher_is_better',
      };
      return {
        title: defaultMeta.title,
        code: defaultMeta.code,
        description: defaultMeta.description,
        actualValue: stage.conversionRate,
        targetValue: defaultMeta.defaultTarget,
        unit: defaultMeta.unit,
        direction: defaultMeta.direction,
      };
    },
    [transitionKpis],
  );

  const handleSaveKpi = () => {
    if (!editingKpi) return;
    const updated: Record<number, FunnelTransitionKpi> = {
      ...transitionKpis,
      [editingKpi.index]: {
        title: editingKpi.title.trim() || 'شاخص گذار',
        code: editingKpi.code.trim() || `CR_STAGE_${editingKpi.index}`,
        description: editingKpi.description?.trim() || '',
        actualValue: Number(editingKpi.actualValue) || 0,
        targetValue: Number(editingKpi.targetValue) || 0,
        unit: editingKpi.unit || '٪',
        direction: editingKpi.direction || 'higher_is_better',
      },
    };
    setTransitionKpis(updated);
    try {
      localStorage.setItem(`campaign-funnel-kpis-${campaignId}`, JSON.stringify(updated));
    } catch (e) {}
    toast.success('شاخص KPI گذار با موفقیت ذخیره شد.');
    setEditingKpi(null);
  };

  const fetchFunnel = useCallback(async () => {
    if (!campaignId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await campaignService.getFunnel(campaignId);
      setFunnelData(data);
      // به درخواست کاربر: خلاصه همه مراحل به صورت پیش‌فرض فعال باشد
      if (data?.stages && data.stages.length > 0 && !isInitialStageSetRef.current) {
        isInitialStageSetRef.current = true;
        setActiveOkrStage(null);
      }
    } catch (err: any) {
      console.error('Error fetching campaign funnel:', err);
      setError(err?.message || 'خطا در بارگذاری قیف فروش کمپین.');
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    fetchFunnel();
  }, [fetchFunnel]);

  const stages = useMemo(() => funnelData?.stages || [], [funnelData]);
  const totalLeads = useMemo(() => funnelData?.totalLeads || 0, [funnelData]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* کشوی نمایش لیدهای مرحله */}
      <CampaignStageLeadsDrawer
        isOpen={Boolean(leadsDrawerStage)}
        onClose={() => setLeadsDrawerStage(null)}
        campaignId={campaignId}
        campaignName={campaignName || funnelData?.campaignName || 'کمپین'}
        stage={leadsDrawerStage}
      />

      {/* هدر کلی بخش قیف و OKR */}
      <div className="bg-[#111D2E] border border-[#1F2E45] rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-[#1F2E45] gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#2563EB] to-[#719BDF] p-0.5 shadow-lg shadow-blue-500/20">
              <div className="w-full h-full bg-[#0B1423] rounded-[14px] flex items-center justify-center text-[#719BDF]">
                <Filter size={24} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-100 font-display tracking-tight">
                  قیف فروش و مدیریت اهداف اجرایی (OKR)
                </h2>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/30 px-2.5 py-0.5 rounded-full">
                  <Sparkles size={11} />
                  <span>یکپارچه با تسک‌ها</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                قیف فروش در سمت راست و محیط مدیریت اهداف (O)، نتایج کلیدی (KR) و تسک‌ها در سمت چپ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#719BDF] bg-[#18263A] border border-[#1F2E45] px-3.5 py-2 rounded-xl shadow-xs">
              <Users size={14} />
              <span>مجموع لیدها: {totalLeads.toLocaleString('fa-IR')}</span>
            </span>

            <button
              type="button"
              onClick={fetchFunnel}
              disabled={loading}
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-[#18263A] border border-[#1F2E45] rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
              title="به‌روزرسانی قیف فروش"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* وضعیت لودینگ یا خطا یا گرید دو بخشی */}
        {loading && stages.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
            <RefreshCw size={28} className="animate-spin text-[#719BDF]" />
            <span className="text-xs">در حال بارگذاری قیف فروش و اهداف OKR...</span>
          </div>
        ) : error ? (
          <div className="my-6 py-8 px-4 text-center bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-xs">
            {error}
          </div>
        ) : stages.length === 0 ? (
          <div className="my-6 py-14 text-center space-y-2">
            <Layers className="w-12 h-12 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">
              هنوز هیچ داده‌ای برای قیف فروش این کمپین ثبت نشده است.
            </p>
            <p className="text-xs text-slate-500">
              به محض ورود لیدها، مراحل قیف به همراه نرخ‌های تبدیل و اهداف نمایش داده خواهند شد.
            </p>
          </div>
        ) : (
          /* ========================================================================= */
          /* گرید دو بخشی: ستون اول (سمت راست در RTL): قیف | ستون دوم (سمت چپ): OKR    */
          /* ========================================================================= */
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* ===================================================================== */}
            {/* ۱. ستون سمت راست: قیف فروش با رنگ‌های روشن، تمیز و بدون سایه سنگین   */}
            {/* در RTL، اولین آیتم گرید در سمت راست قرار می‌گیرد                      */}
            {/* ===================================================================== */}
            <div className="lg:col-span-5 bg-[#0B1423] border border-[#1F2E45] rounded-2xl p-4 sm:p-5 flex flex-col h-[740px] max-h-[740px] justify-between relative">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-[#1F2E45]/80">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-blue-400" />
                    <span className="text-xs sm:text-sm font-bold text-slate-200">
                      قیف فروش کمپین
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveOkrStage(null)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeOkrStage === null
                        ? 'bg-blue-600 text-white border-blue-400 font-bold shadow-xs'
                        : 'text-slate-400 hover:text-slate-200 bg-[#111D2E] hover:bg-[#18263A] border-[#1F2E45]'
                    }`}
                    title="مشاهده نمای جامع اهداف تمام مراحل قیف"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>خلاصه همه مراحل</span>
                  </button>
                </div>

                {/* کانتینر ردیف‌های قیف و دکمه‌های کناری */}
                <div className="space-y-2.5 pt-3">
                  {stages.map((stage, index) => {
                    const N = stages.length;
                    // محاسبه مختصات هندسی ذوزنقه: از ۹۸٪ در بالا تا ۴۲٪ در پایین با لبه‌های گرد
                    const topW = Math.round(98 - (index * 52) / N);
                    const bottomW = Math.round(98 - ((index + 1) * 52) / N);

                    const lt = Number(((100 - topW) / 2).toFixed(2));
                    const rt = Number(((100 + topW) / 2).toFixed(2));
                    const lb = Number(((100 - bottomW) / 2).toFixed(2));
                    const rb = Number(((100 + bottomW) / 2).toFixed(2));
                    const ty = 2;
                    const by = 62;
                    const H = by - ty;
                    const rx = 2.4;
                    const ry = 4.8;
                    const dx_l = Number(((lb - lt) * (ry / H)).toFixed(2));
                    const dx_r = Number(((rb - rt) * (ry / H)).toFixed(2));

                    // مسیر SVG برای ذوزنقه با ۴ گوشه کاملاً گرد
                    const trapezoidPath = `M ${lt + rx} ${ty} L ${rt - rx} ${ty} Q ${rt} ${ty} ${rt + dx_r} ${ty + ry} L ${rb - dx_r} ${by - ry} Q ${rb} ${by} ${rb - rx} ${by} L ${lb + rx} ${by} Q ${lb} ${by} ${lb - dx_l} ${by - ry} L ${lt + dx_l} ${ty + ry} Q ${lt} ${ty} ${lt + rx} ${ty} Z`;

                    const palette = STAGE_GRADIENTS[index % STAGE_GRADIENTS.length];
                    const isActive = activeOkrStage?.id === stage.id;
                    const kpi = index > 0 ? getStageKpi(index, stage) : null;
                    const kpiStatus = kpi ? computeKpiStatus(kpi) : null;

                    return (
                      <div key={stage.id} className="relative flex flex-col space-y-1">
                        {/* بخش شاخص کلیدی عملکرد (KPI) استاندارد و یکپارچه بین دو مرحله */}
                        {index > 0 && kpi && kpiStatus && (
                          <div className="flex items-center justify-center -my-1 relative z-20">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingKpi({
                                  ...kpi,
                                  index,
                                  fromStage: stages[index - 1],
                                  toStage: stage,
                                });
                              }}
                              className={`inline-flex items-center gap-1.5 text-[10px] px-3 py-1 rounded-full border shadow-xs transition-all cursor-pointer group ${
                                kpiStatus.health === 'healthy'
                                  ? 'bg-[#0B1E19] text-emerald-300 border-emerald-500/40 hover:bg-[#0E2822] hover:border-emerald-400'
                                  : kpiStatus.health === 'warning'
                                  ? 'bg-[#221A0A] text-amber-300 border-amber-500/40 hover:bg-[#2D220D] hover:border-amber-400'
                                  : 'bg-[#251014] text-rose-300 border-rose-500/40 hover:bg-[#32151B] hover:border-rose-400'
                              }`}
                              title="کلیک برای تنظیمات تخصصی شاخص KPI"
                            >
                              {kpiStatus.health === 'healthy' ? (
                                <TrendingUp size={11} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                              ) : kpiStatus.health === 'warning' ? (
                                <Minus size={11} className="text-amber-400 group-hover:scale-110 transition-transform" />
                              ) : (
                                <TrendingDown size={11} className="text-rose-400 group-hover:scale-110 transition-transform" />
                              )}

                              <span className="font-semibold text-slate-300">{kpi.title}:</span>
                              <span className="font-bold text-white font-mono">{kpi.actualValue}{kpi.unit}</span>
                              <span className="text-slate-400 text-[9px] font-mono">(تارگت: {kpi.targetValue}{kpi.unit})</span>

                              <span
                                className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                                  kpiStatus.health === 'healthy'
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : kpiStatus.health === 'warning'
                                    ? 'bg-amber-500/20 text-amber-300'
                                    : 'bg-rose-500/20 text-rose-300'
                                }`}
                              >
                                {kpiStatus.diffFormatted}
                              </span>

                              <Edit3 size={10} className="text-slate-400 group-hover:text-cyan-400 transition-colors mr-0.5" />
                            </button>
                          </div>
                        )}

                        {/* ردیف ذوزنقه قیف تمام‌عرض بدون ستون اضافی */}
                        <div
                          onClick={() => setActiveOkrStage(stage)}
                          className={`relative cursor-pointer transition-transform duration-200 select-none w-full ${
                            isActive ? 'scale-[1.01] z-20' : 'hover:scale-[1.005] opacity-95 hover:opacity-100'
                          }`}
                          title={`انتخاب مرحله ${stage.label} برای مدیریت OKR و تسک‌ها`}
                        >
                          <div className="relative w-full h-[68px] sm:h-[72px] flex items-center justify-center backdrop-blur-md">
                            {/* SVG ذوزنقه شیشه‌ای با لبه‌های گرد و افکت گلس‌مورفیسم */}
                            <svg
                              viewBox="0 0 100 64"
                              preserveAspectRatio="none"
                              className="w-full h-full absolute inset-0 overflow-visible pointer-events-none"
                              style={{
                                filter: isActive
                                  ? `drop-shadow(0 0 10px rgba(255, 255, 255, 0.45)) drop-shadow(0 4px 16px ${palette.from}70)`
                                  : 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.35))',
                              }}
                            >
                              <defs>
                                {/* گرادیان رنگی شیشه‌ای و نیمه‌شفاف */}
                                <linearGradient
                                  id={`funnel-grad-${stage.id}`}
                                  x1="0%"
                                  y1="0%"
                                  x2="100%"
                                  y2="100%"
                                >
                                  <stop offset="0%" stopColor={palette.from} stopOpacity="0.65" />
                                  <stop offset="50%" stopColor={palette.to} stopOpacity="0.45" />
                                  <stop offset="100%" stopColor={palette.from} stopOpacity="0.30" />
                                </linearGradient>

                                {/* گرادیان انعکاس نوری شیشه (Specular Sheen) */}
                                <linearGradient
                                  id={`funnel-sheen-${stage.id}`}
                                  x1="0%"
                                  y1="0%"
                                  x2="0%"
                                  y2="100%"
                                >
                                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.35" />
                                  <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.10" />
                                  <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
                                </linearGradient>
                              </defs>

                              {/* بدنه اصلی ذوزنقه با لبه‌های گرد و شیشه‌ای */}
                              <path
                                d={trapezoidPath}
                                fill={`url(#funnel-grad-${stage.id})`}
                                stroke={isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.40)'}
                                strokeWidth={isActive ? '2' : '1.2'}
                                strokeLinejoin="round"
                                vectorEffect="non-scaling-stroke"
                                style={{ vectorEffect: 'non-scaling-stroke' }}
                                className="transition-all duration-300"
                              />

                              {/* لایه بازتاب نور شیشه */}
                              <path
                                d={trapezoidPath}
                                fill={`url(#funnel-sheen-${stage.id})`}
                                pointerEvents="none"
                              />

                              {/* خط درخشش لبه بالایی شیشه */}
                              <path
                                d={`M ${lt + rx + 1} ${ty + 1.2} L ${rt - rx - 1} ${ty + 1.2}`}
                                stroke="rgba(255, 255, 255, 0.45)"
                                strokeWidth="1"
                                strokeLinecap="round"
                                vectorEffect="non-scaling-stroke"
                                style={{ vectorEffect: 'non-scaling-stroke' }}
                              />
                            </svg>

                            {/* محتوای مرکز: اسم بخش، تعداد لید و دکمه مینیاتوری نمایش لیدها در کنار هم */}
                            <div className="relative z-10 flex flex-col items-center text-center justify-center space-y-1 px-2">
                              {/* نام مرحله در مرکز */}
                              <div className="flex items-center gap-1.5">
                                <span className="w-4 h-4 rounded-full bg-black/40 border border-white/30 text-white font-black flex items-center justify-center text-[10px] shrink-0">
                                  {index + 1}
                                </span>
                                <span className="font-extrabold text-xs sm:text-sm font-display tracking-tight text-white drop-shadow-sm">
                                  {stage.label}
                                </span>
                                {isActive && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] bg-white text-blue-950 font-black shadow-xs">
                                    <CheckCircle2 size={9} />
                                    <span>فعال</span>
                                  </span>
                                )}
                              </div>

                              {/* تعداد لید و دکمه مینیاتوری نمایش لیدها در کنار آن بدون درصد */}
                              <div className="flex items-center gap-2">
                                <div className="text-[11px] text-white/95 font-mono font-bold flex items-center gap-1">
                                  <Users size={11} className="text-white/85" />
                                  <span>{stage.count.toLocaleString('fa-IR')} سرنخ</span>
                                </div>

                                {/* دکمه مینیاتوری شیک نمایش لیدها */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setLeadsDrawerStage(stage);
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-black/35 hover:bg-black/60 border border-white/25 hover:border-white/50 backdrop-blur-xs transition-all active:scale-95 cursor-pointer pointer-events-auto shadow-xs"
                                  title={`مشاهده لیدهای مرحله ${stage.label}`}
                                >
                                  <Eye size={10} className="text-blue-300" />
                                  <span>لیدها</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* انتهای قیف / خروجی خرید موفق */}
              <div className="pt-2 flex flex-col items-center relative z-10">
                <div className="w-16 h-4 bg-gradient-to-b from-[#475569]/50 to-[#1E293B] border-x border-[#1F2E45] flex items-center justify-center text-slate-400">
                  <ArrowDown size={11} className="animate-bounce text-blue-400" />
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold shadow-xs">
                  <Trophy size={13} className="text-emerald-400" />
                  <span>خروجی نهایی: مشتریان قطعی کمپین</span>
                </div>
              </div>
            </div>

            {/* دیالوگ حرفه‌ای و یکپارچه ویرایش شاخص KPI گذار */}
            {editingKpi && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                onClick={() => setEditingKpi(null)}
              >
                <div
                  className="bg-[#0B1423] border border-[#1F2E45] rounded-2xl p-5 max-w-md w-full space-y-4 shadow-2xl relative"
                  dir="rtl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-[#1F2E45]">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                        <Gauge size={16} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-100">
                          تنظیم شاخص کلیدی گذار (Transition KPI)
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          گذار مرحله «{editingKpi.fromStage.label}» به «{editingKpi.toStage.label}»
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingKpi(null)}
                      className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#18263A] transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    {/* انتخاب سریع از الگوهای استاندارد سیستم */}
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        الگوی شاخص استاندارد:
                      </label>
                      <select
                        onChange={(e) => {
                          const idx = Number(e.target.value);
                          const preset = DEFAULT_STAGE_KPIS[idx];
                          if (preset) {
                            setEditingKpi({
                              ...editingKpi,
                              title: preset.title,
                              code: preset.code,
                              description: preset.description,
                              targetValue: preset.defaultTarget,
                              unit: preset.unit,
                              direction: preset.direction,
                            });
                          }
                        }}
                        defaultValue={editingKpi.index}
                        className="w-full bg-[#111D2E] border border-[#1F2E45] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                      >
                        {Object.entries(DEFAULT_STAGE_KPIS).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v.title} (تارگت پیش‌فرض: {v.defaultTarget}{v.unit})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        عنوان شاخص: <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={editingKpi.title}
                        onChange={(e) =>
                          setEditingKpi({ ...editingKpi, title: e.target.value })
                        }
                        placeholder="مثال: نرخ برقراری تماس..."
                        className="w-full bg-[#111D2E] border border-[#1F2E45] rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          مقدار محقق‌شده (Actual)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={editingKpi.actualValue}
                          onChange={(e) =>
                            setEditingKpi({
                              ...editingKpi,
                              actualValue: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full bg-[#111D2E] border border-[#1F2E45] rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-mono text-center"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          مقدار هدف (Target)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={editingKpi.targetValue}
                          onChange={(e) =>
                            setEditingKpi({
                              ...editingKpi,
                              targetValue: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full bg-[#111D2E] border border-[#1F2E45] rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-mono text-center"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          واحد اندازه‌گیری
                        </label>
                        <select
                          value={editingKpi.unit}
                          onChange={(e) =>
                            setEditingKpi({ ...editingKpi, unit: e.target.value })
                          }
                          className="w-full bg-[#111D2E] border border-[#1F2E45] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                        >
                          <option value="٪">٪ (درصد)</option>
                          <option value="عدد">عدد (تعداد)</option>
                          <option value="تومان">تومان</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          جهت مطلوبیت
                        </label>
                        <select
                          value={editingKpi.direction}
                          onChange={(e) =>
                            setEditingKpi({
                              ...editingKpi,
                              direction: e.target.value as any,
                            })
                          }
                          className="w-full bg-[#111D2E] border border-[#1F2E45] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                        >
                          <option value="higher_is_better">هرچه بالاتر، بهتر (صعودی)</option>
                          <option value="lower_is_better">هرچه پایین‌تر، بهتر (نزولی)</option>
                        </select>
                      </div>
                    </div>

                    {/* پیش‌نمایش زنده وضعیت شاخص */}
                    {(() => {
                      const prevStatus = computeKpiStatus(editingKpi);
                      return (
                        <div className="p-3 rounded-xl bg-[#111D2E] border border-[#1F2E45] flex items-center justify-between">
                          <span className="text-slate-400">پیش‌نمایش وضعیت سلامت:</span>
                          <span
                            className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-lg text-[11px] border ${
                              prevStatus.health === 'healthy'
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                : prevStatus.health === 'warning'
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                            }`}
                          >
                            {prevStatus.health === 'healthy'
                              ? 'عالی / روی هدف'
                              : prevStatus.health === 'warning'
                              ? 'نزدیک به هدف'
                              : 'نیازمند اقدام'}
                            <span className="font-mono text-[10px]">({prevStatus.diffFormatted})</span>
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1F2E45]">
                    <button
                      type="button"
                      onClick={() => setEditingKpi(null)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-[#18263A] transition-colors"
                    >
                      انصراف
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveKpi}
                      className="px-4 py-1.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Check size={14} />
                      <span>ذخیره شاخص</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ===================================================================== */}
            {/* ۲. ستون سمت چپ: پنل مدیریت OKR و تسک‌های متصل                         */}
            {/* در RTL، دومین آیتم گرید در سمت چپ قرار می‌گیرد                        */}
            {/* ===================================================================== */}
            <div className="lg:col-span-7">
              <CampaignStageOkrPanel
                campaignId={campaignId}
                campaignName={campaignName || funnelData?.campaignName || 'کمپین'}
                selectedStage={activeOkrStage}
                allStages={stages}
                onSelectStage={(st) => setActiveOkrStage(st)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
