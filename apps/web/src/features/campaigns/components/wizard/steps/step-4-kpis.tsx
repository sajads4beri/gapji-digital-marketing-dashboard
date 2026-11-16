'use client';

import React from 'react';
import { CampaignFormData, KpiTargetItem } from '../../../types';
import {
  Target,
  Trash2,
  TrendingUp,
  Percent,
  MousePointer,
  UserCheck,
  DollarSign,
  Eye,
  Check,
} from 'lucide-react';

const PREDEFINED_KPIS = [
  {
    id: 'kpi_cpa',
    name: 'هزینه هر تبدیل یا لید (CPA)',
    unit: 'تومان',
    defaultTarget: 45_000,
    icon: DollarSign,
    description: 'حداکثر مبلغ مجاز برای جذب هر سرنخ یا خریدار جدید',
  },
  {
    id: 'kpi_clicks',
    name: 'تعداد کلیک‌های هدف',
    unit: 'کلیک',
    defaultTarget: 12_500,
    icon: MousePointer,
    description: 'مجموع ترافیک هدفمند ورودی به وب‌سایت یا صفحه فرود',
  },
  {
    id: 'kpi_conversions',
    name: 'تعداد کل تبدیل‌ها و فروش',
    unit: 'تبدیل',
    defaultTarget: 450,
    icon: UserCheck,
    description: 'تعداد هدف تکمیل فرم، سفارش یا ثبت‌نام نهایی',
  },
  {
    id: 'kpi_ctr',
    name: 'نرخ کلیک به نمایش (CTR)',
    unit: 'درصد',
    defaultTarget: 3.8,
    icon: Percent,
    description: 'نسبت تعداد کلیک‌ها به کل دفعات نمایش بنر و آگهی',
  },
  {
    id: 'kpi_cpc',
    name: 'میانگین هزینه هر کلیک (CPC)',
    unit: 'تومان',
    defaultTarget: 2_400,
    icon: TrendingUp,
    description: 'میانگین هزینه‌ای که بابت هر کلیک یکتا پرداخت می‌شود',
  },
  {
    id: 'kpi_impressions',
    name: 'تعداد کل نمایش آگهی (Impression)',
    unit: 'نمایش',
    defaultTarget: 350_000,
    icon: Eye,
    description: 'تعداد دفعات دیده‌شدن تبلیغ در کانال‌ها و پلتفرم‌ها',
  },
];

interface Step4KpisProps {
  formData: CampaignFormData;
  onUpdateFormData: (partial: Partial<CampaignFormData>) => void;
  errors?: Record<string, string>;
}

export function Step4Kpis({
  formData,
  onUpdateFormData,
  errors = {},
}: Step4KpisProps) {
  const selectedItems: KpiTargetItem[] =
    formData.targetKpis.selectedKpiItems || [];

  // بررسی وضعیت انتخاب یک KPI
  const isSelected = (id: string) => selectedItems.some((k) => k.id === id);

  // تغییر مقدار عددی هدف یک KPI
  const handleUpdateTargetValue = (id: string, val: number) => {
    const validVal = Math.max(0, val || 0);
    const updated = selectedItems.map((item) =>
      item.id === id ? { ...item, targetValue: validVal } : item,
    );

    syncKpiState(updated);
  };

  // افزودن یا حذف یک KPI از لیست انتخاب‌شده‌ها
  const handleToggleKpi = (predefined: (typeof PREDEFINED_KPIS)[0]) => {
    let updated: KpiTargetItem[];
    if (isSelected(predefined.id)) {
      updated = selectedItems.filter((item) => item.id !== predefined.id);
    } else {
      updated = [
        ...selectedItems,
        {
          id: predefined.id,
          name: predefined.name,
          unit: predefined.unit,
          targetValue: predefined.defaultTarget,
          description: predefined.description,
        },
      ];
    }
    syncKpiState(updated);
  };

  const handleRemoveKpi = (id: string) => {
    const updated = selectedItems.filter((item) => item.id !== id);
    syncKpiState(updated);
  };

  // همگام‌سازی فیلدهای ریشه targetKpis با آیتم‌های انتخاب‌شده
  const syncKpiState = (items: KpiTargetItem[]) => {
    const cpa = items.find((k) => k.id === 'kpi_cpa')?.targetValue;
    const clicks = items.find((k) => k.id === 'kpi_clicks')?.targetValue;
    const conv = items.find((k) => k.id === 'kpi_conversions')?.targetValue;
    const ctr = items.find((k) => k.id === 'kpi_ctr')?.targetValue;

    onUpdateFormData({
      targetKpis: {
        ...formData.targetKpis,
        selectedKpiItems: items,
        targetCpa: cpa,
        targetClicks: clicks,
        targetConversions: conv,
        targetCtr: ctr,
      },
    });
  };

  return (
    <div className="bg-[#111D2E]/80 backdrop-blur-md rounded-2xl border border-[#1F2E45] p-6 sm:p-7 shadow-xl space-y-6">
      {/* هدر مرحله */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1F2E45]">
        <div>
          <div className="flex items-center gap-2 text-[#719BDF] mb-1">
            <Target size={20} />
            <h3 className="text-base font-bold text-slate-100 font-display">
              انتخاب KPI و تعیین اهداف عددی
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            شاخص‌های کلیدی عملکرد کمپین را برگزینید و تارگت‌های عددی واقع‌بینانه تعیین کنید.
          </p>
        </div>
        <span className="text-xs bg-[#18263A] text-slate-300 border border-[#1F2E45] font-medium px-2.5 py-1 rounded-full self-start sm:self-auto">
          مرحله ۴ از ۶
        </span>
      </div>

      {errors.targetKpis && (
        <div className="bg-[#D66B73]/10 border border-[#D66B73]/30 text-[#D66B73] text-xs p-3 rounded-xl font-medium">
          {errors.targetKpis}
        </div>
      )}

      {/* بخش ۱: کارت‌های شاخص‌های آماده جهت انتخاب سریع */}
      <div className="space-y-3">
        <label className="block text-xs font-semibold text-slate-300">
          شاخص‌های کلیدی عملکرد پیشنهادی (برای فعال‌سازی یا حذف کلیک کنید):
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {PREDEFINED_KPIS.map((kpi) => {
            const active = isSelected(kpi.id);
            const Icon = kpi.icon;

            return (
              <button
                key={kpi.id}
                type="button"
                onClick={() => handleToggleKpi(kpi)}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-right transition-all ${
                  active
                    ? 'bg-[#18263A] border-[#719BDF] text-[#719BDF] shadow-lg shadow-[#719BDF]/5 ring-1 ring-[#719BDF]/30'
                    : 'bg-[#111D2E]/60 hover:bg-[#18263A]/50 border-[#1F2E45] text-slate-300'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    active ? 'bg-gradient-to-r from-blue-600 to-[#719BDF] text-white' : 'bg-[#0B1423] text-slate-500 border border-[#1F2E45]'
                  }`}
                >
                  {active ? <Check size={14} /> : <Icon size={14} />}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[11px] font-bold truncate text-slate-100">{kpi.name}</h4>
                  <span className="text-[10px] text-slate-400">واحد: {kpi.unit}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* بخش ۲: جدول تنظیم مقادیر عددی KPIهای انتخاب‌شده */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-300">
            اهداف عددی شاخص‌های انتخاب‌شده ({selectedItems.length} شاخص فعال):
          </label>
        </div>

        {selectedItems.length === 0 ? (
          <div className="text-center py-10 bg-[#0B1423]/40 rounded-xl border border-dashed border-[#1F2E45] text-slate-500 text-xs">
            هنوز شاخصی انتخاب نشده است. از گزینه‌های بالا یک یا چند KPI را انتخاب کنید.
          </div>
        ) : (
          <div className="border border-[#1F2E45] rounded-xl overflow-hidden divide-y divide-[#1F2E45] shadow-xl bg-[#0B1423]/40">
            {selectedItems.map((kpi) => (
              <div
                key={kpi.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#111D2E]/60 hover:bg-[#18263A]/40 transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-100 font-display">{kpi.name}</span>
                    <span className="text-[10px] bg-[#0B1423] text-slate-400 border border-[#1F2E45] px-2 py-0.5 rounded-full font-medium">
                      واحد: {kpi.unit}
                    </span>
                  </div>
                  {kpi.description && (
                    <p className="text-[11px] text-slate-400">{kpi.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2.5 self-end sm:self-auto">
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min="0"
                      value={kpi.targetValue || ''}
                      onChange={(e) =>
                        handleUpdateTargetValue(kpi.id, Number(e.target.value) || 0)
                      }
                      placeholder="مقدار هدف..."
                      className="w-36 bg-[#0B1423] border border-[#1F2E45] rounded-lg px-3 py-1.5 text-xs font-bold text-slate-100 text-left focus:border-[#719BDF] focus:outline-none"
                      dir="ltr"
                    />
                    <span className="absolute left-2 text-[10px] text-slate-500 pointer-events-none">
                      {kpi.unit}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveKpi(kpi.id)}
                    className="p-1.5 text-slate-400 hover:text-[#D66B73] hover:bg-[#D66B73]/10 rounded-lg transition-colors"
                    title="حذف این KPI"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
