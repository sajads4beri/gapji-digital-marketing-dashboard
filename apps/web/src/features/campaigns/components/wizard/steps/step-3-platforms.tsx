'use client';

import React, { useMemo } from 'react';
import { CampaignFormData, PlatformAllocation } from '../../../types';
import { MoneyInput } from '@/components/ui/money-input';
import {
  Layers,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

const AVAILABLE_PLATFORMS = [
  { id: 'google_ads', name: 'گوگل ادز (Google Ads)' },
  { id: 'instagram', name: 'اینستاگرام و شبکه‌های اجتماعی' },
  { id: 'yektanet', name: 'یکتانت (تبلیغات همسان و کلیکی)' },
  { id: 'telegram', name: 'کانال‌های تلگرام' },
  { id: 'divar', name: 'دیوار (تبلیغات نردبان و بنر)' },
  { id: 'sms_smart', name: 'ارسال پیامک انبوه هوشمند' },
  { id: 'email_direct', name: 'ایمیل مارکتینگ اختصاصی' },
  { id: 'other', name: 'سایر کانال‌های تبلیغاتی' },
];

interface Step3PlatformsProps {
  formData: CampaignFormData;
  onUpdateFormData: (partial: Partial<CampaignFormData>) => void;
  errors?: Record<string, string>;
}

export function Step3Platforms({
  formData,
  onUpdateFormData,
  errors = {},
}: Step3PlatformsProps) {
  const totalCampaignBudget = Number(formData.budget) || 0;
  const platforms = formData.platforms || [];

  // محاسبه مجموع بودجه تخصیص‌یافته به پلتفرم‌های فعال
  const totalAllocated = useMemo(() => {
    return platforms
      .filter((p) => p.enabled)
      .reduce((sum, p) => sum + (Number(p.allocatedBudget) || 0), 0);
  }, [platforms]);

  const remainingBudget = totalCampaignBudget - totalAllocated;
  const isBudgetExceeded = remainingBudget < 0;
  const isBudgetMatched = totalCampaignBudget > 0 && remainingBudget === 0;

  // به‌روزرسانی فیلد یک پلتفرم در آرایه
  const handleUpdatePlatform = (
    index: number,
    field: keyof PlatformAllocation,
    val: any,
  ) => {
    const updated = [...platforms];
    const item = { ...updated[index], [field]: val };

    // محاسبه مجدد درصد سهم از بودجه کل
    if (field === 'allocatedBudget') {
      const budgetNum = Math.max(0, Number(val) || 0);
      item.allocatedBudget = budgetNum;
      item.percentage =
        totalCampaignBudget > 0
          ? Number(((budgetNum / totalCampaignBudget) * 100).toFixed(1))
          : 0;
    }

    updated[index] = item;
    onUpdateFormData({ platforms: updated });
  };

  // افزودن سطر پلتفرم جدید
  const handleAddPlatform = () => {
    const newPlatform: PlatformAllocation = {
      platformId: `platform_${Date.now()}`,
      name: 'گوگل ادز (Google Ads)',
      allocatedBudget: 0,
      percentage: 0,
      enabled: true,
      count: 1000,
      description: 'کمپین کلیکی یا بنری',
    };
    onUpdateFormData({ platforms: [...platforms, newPlatform] });
  };

  // حذف سطر پلتفرم
  const handleRemovePlatform = (index: number) => {
    const updated = platforms.filter((_, i) => i !== index);
    onUpdateFormData({ platforms: updated });
  };

  return (
    <div className="bg-[#111D2E]/80 backdrop-blur-md rounded-2xl border border-[#1F2E45] p-6 sm:p-7 shadow-xl space-y-6">
      {/* هدر مرحله */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1F2E45]">
        <div>
          <div className="flex items-center gap-2 text-[#719BDF] mb-1">
            <Layers size={20} />
            <h3 className="text-base font-bold text-slate-100 font-display">
              تخصیص بودجه و پلتفرم‌ها
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            کانال‌های تبلیغاتی را تعیین و سهم بودجه هرکدام را بر مبنای بودجه کل کمپین تخصیص دهید.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddPlatform}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-[#719BDF] hover:from-blue-500 hover:to-[#719BDF]/90 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-500/20 self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>افزودن پلتفرم جدید</span>
        </button>
      </div>

      {/* کارت خلاصه بودجه مرحله ۳ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#0B1423]/60 p-4 rounded-xl border border-[#1F2E45] text-xs">
        <div className="bg-[#111D2E] p-3 rounded-lg border border-[#1F2E45]">
          <span className="text-slate-400 block mb-1">بودجه کل کمپین:</span>
          <span className="text-sm font-bold text-slate-100 font-display">
            {totalCampaignBudget.toLocaleString('fa-IR')} تومان
          </span>
        </div>

        <div className="bg-[#111D2E] p-3 rounded-lg border border-[#1F2E45]">
          <span className="text-slate-400 block mb-1">مجموع بودجه تخصیص‌یافته:</span>
          <span className="text-sm font-bold text-[#719BDF] font-display">
            {totalAllocated.toLocaleString('fa-IR')} تومان
          </span>
        </div>

        <div
          className={`p-3 rounded-lg border ${
            isBudgetExceeded
              ? 'bg-[#D66B73]/10 border-[#D66B73]/30 text-[#D66B73]'
              : isBudgetMatched
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-[#111D2E] border-[#1F2E45] text-slate-300'
          }`}
        >
          <span className="block mb-1 text-slate-400">
            {isBudgetExceeded ? 'مازاد بودجه پلتفرم‌ها:' : 'بودجه تخصیص‌نیافته:'}
          </span>
          <span className="text-sm font-bold font-display">
            {Math.abs(remainingBudget).toLocaleString('fa-IR')} تومان
          </span>
        </div>
      </div>

      {/* هشدار مازاد بودجه پلتفرم‌ها */}
      {isBudgetExceeded && (
        <div className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 p-3.5 rounded-xl text-xs">
          <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">توجه: مجموع بودجه پلتفرم‌ها فراتر از بودجه کل کمپین است!</span>
            <p className="text-amber-300/80 text-[11px] mt-0.5">
              مجموع سهم‌بندی پلتفرم‌ها {totalAllocated.toLocaleString('fa-IR')} تومان است که {Math.abs(remainingBudget).toLocaleString('fa-IR')} تومان بیشتر از سقف کل کمپین است. این مورد مانع ذخیره پیش‌نویس یا پیشروی شما نمی‌شود اما توصیه می‌گردد پیش از انتشار اصلاح شود.
            </p>
          </div>
        </div>
      )}

      {isBudgetMatched && (
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-xl text-xs">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span className="font-semibold">
            عالی! کل بودجه کمپین دقیقاً به پلتفرم‌های مدنظر شما تخصیص یافت (۱۰۰٪).
          </span>
        </div>
      )}

      {/* جدول تعاملی پلتفرم‌ها */}
      <div className="border border-[#1F2E45] rounded-xl overflow-hidden shadow-xl bg-[#0B1423]/40">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#0B1423]/90 border-b border-[#1F2E45] text-slate-300 font-bold">
              <tr>
                <th className="px-4 py-3.5">وضعیت</th>
                <th className="px-4 py-3.5">پلتفرم تبلیغاتی</th>
                <th className="px-4 py-3.5">بودجه تخصیص‌یافته (تومان)</th>
                <th className="px-4 py-3.5">سهم از کل</th>
                <th className="px-4 py-3.5">تعداد / تارگت</th>
                <th className="px-4 py-3.5">توضیحات و استراتژی</th>
                <th className="px-4 py-3.5 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2E45] bg-[#111D2E]/60">
              {platforms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    هیچ پلتفرمی تعریف نشده است. با دکمه «افزودن پلتفرم جدید» یک کانال اضافه کنید.
                  </td>
                </tr>
              ) : (
                platforms.map((platform, idx) => {
                  const sharePercentage =
                    totalCampaignBudget > 0
                      ? Math.round(
                          ((platform.allocatedBudget || 0) /
                            totalCampaignBudget) *
                            100,
                        )
                      : 0;

                  return (
                    <tr
                      key={platform.platformId || idx}
                      className={`hover:bg-[#18263A]/50 transition-colors ${
                        !platform.enabled ? 'opacity-40 bg-[#0B1423]/40' : ''
                      }`}
                    >
                      {/* چک‌باکس فعال بودن */}
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={platform.enabled}
                          onChange={(e) =>
                            handleUpdatePlatform(idx, 'enabled', e.target.checked)
                          }
                          className="w-4 h-4 rounded border-[#1F2E45] bg-[#0B1423] text-blue-600 focus:ring-[#719BDF]"
                          title="فعال یا غیرفعال کردن این پلتفرم"
                        />
                      </td>

                      {/* پلتفرم */}
                      <td className="px-4 py-3 min-w-[180px]">
                        <select
                          value={platform.name}
                          disabled={!platform.enabled}
                          onChange={(e) =>
                            handleUpdatePlatform(idx, 'name', e.target.value)
                          }
                          className="w-full bg-[#0B1423] border border-[#1F2E45] text-xs rounded-lg px-2.5 py-1.5 font-medium text-slate-200 focus:border-[#719BDF] focus:outline-none"
                        >
                          {AVAILABLE_PLATFORMS.map((p) => (
                            <option key={p.id} value={p.name} className="bg-[#0B1423] text-slate-200">
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* بودجه تخصیص‌یافته */}
                      <td className="px-4 py-3 min-w-[160px]">
                        <MoneyInput
                          disabled={!platform.enabled}
                          value={platform.allocatedBudget || 0}
                          onChange={(val) =>
                            handleUpdatePlatform(
                              idx,
                              'allocatedBudget',
                              val,
                            )
                          }
                          placeholder="۰"
                          className="py-1.5 text-xs rounded-lg"
                        />
                      </td>

                      {/* سهم درصدی */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-block bg-[#18263A] text-[#719BDF] border border-[#1F2E45] font-bold px-2 py-0.5 rounded text-[11px] font-display">
                          {sharePercentage.toLocaleString('fa-IR')}٪
                        </span>
                      </td>

                      {/* تعداد / تارگت */}
                      <td className="px-4 py-3 min-w-[120px]">
                        <input
                          type="number"
                          min="0"
                          disabled={!platform.enabled}
                          value={platform.count || ''}
                          onChange={(e) =>
                            handleUpdatePlatform(
                              idx,
                              'count',
                              Number(e.target.value) || 0,
                            )
                          }
                          placeholder="مثال: ۱۰۰۰"
                          className="w-full bg-[#0B1423] border border-[#1F2E45] text-xs text-slate-100 rounded-lg px-2.5 py-1.5 focus:border-[#719BDF] focus:outline-none"
                        />
                      </td>

                      {/* توضیحات */}
                      <td className="px-4 py-3 min-w-[200px]">
                        <input
                          type="text"
                          disabled={!platform.enabled}
                          value={platform.description || ''}
                          onChange={(e) =>
                            handleUpdatePlatform(
                              idx,
                              'description',
                              e.target.value,
                            )
                          }
                          placeholder="نوع بنر، استراتژی یا تارگت..."
                          className="w-full bg-[#0B1423] border border-[#1F2E45] text-xs text-slate-100 placeholder:text-slate-500 rounded-lg px-2.5 py-1.5 focus:border-[#719BDF] focus:outline-none"
                        />
                      </td>

                      {/* دکمه حذف سطر */}
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemovePlatform(idx)}
                          className="p-1.5 text-slate-400 hover:text-[#D66B73] hover:bg-[#D66B73]/10 rounded-lg transition-colors"
                          title="حذف این ردیف"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
