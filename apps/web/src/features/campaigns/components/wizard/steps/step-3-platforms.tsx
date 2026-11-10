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
  HelpCircle,
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
    <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-7 shadow-sm space-y-6">
      {/* هدر مرحله */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <Layers size={20} />
            <h3 className="text-base font-bold text-gray-900">
              تخصیص بودجه و پلتفرم‌ها
            </h3>
          </div>
          <p className="text-xs text-gray-500">
            کانال‌های تبلیغاتی را تعیین و سهم بودجه هرکدام را بر مبنای بودجه کل کمپین تخصیص دهید.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddPlatform}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>افزودن پلتفرم جدید</span>
        </button>
      </div>

      {/* کارت خلاصه بودجه مرحله ۳ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100 text-xs">
        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <span className="text-gray-500 block mb-1">بودجه کل کمپین:</span>
          <span className="text-sm font-bold text-gray-900">
            {totalCampaignBudget.toLocaleString('fa-IR')} تومان
          </span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <span className="text-gray-500 block mb-1">مجموع بودجه تخصیص‌یافته:</span>
          <span className="text-sm font-bold text-blue-700">
            {totalAllocated.toLocaleString('fa-IR')} تومان
          </span>
        </div>

        <div
          className={`p-3 rounded-lg border ${
            isBudgetExceeded
              ? 'bg-red-50 border-red-200 text-red-700'
              : isBudgetMatched
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-white border-gray-200 text-gray-800'
          }`}
        >
          <span className="block mb-1 text-gray-500">
            {isBudgetExceeded ? 'مازاد بودجه پلتفرم‌ها:' : 'بودجه تخصیص‌نیافته:'}
          </span>
          <span className="text-sm font-bold">
            {Math.abs(remainingBudget).toLocaleString('fa-IR')} تومان
          </span>
        </div>
      </div>

      {/* هشدار مازاد بودجه پلتفرم‌ها (طبق سند، فقط هشدار است و مانع ادامه کار نمی‌شود) */}
      {isBudgetExceeded && (
        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 text-amber-800 p-3.5 rounded-xl text-xs">
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">توجه: مجموع بودجه پلتفرم‌ها فراتر از بودجه کل کمپین است!</span>
            <p className="text-amber-700 text-[11px] mt-0.5">
              مجموع سهم‌بندی پلتفرم‌ها {totalAllocated.toLocaleString('fa-IR')} تومان است که {Math.abs(remainingBudget).toLocaleString('fa-IR')} تومان بیشتر از سقف کل کمپین است. این مورد مانع ذخیره پیش‌نویس یا پیشروی شما نمی‌شود اما توصیه می‌گردد پیش از انتشار اصلاح شود.
            </p>
          </div>
        </div>
      )}

      {isBudgetMatched && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-xl text-xs">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span className="font-semibold">
            عالی! کل بودجه کمپین دقیقاً به پلتفرم‌های مدنظر شما تخصیص یافت (۱۰۰٪).
          </span>
        </div>
      )}

      {/* جدول تعاملی پلتفرم‌ها */}
      <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-bold">
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
            <tbody className="divide-y divide-gray-100 bg-white">
              {platforms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-400">
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
                      className={`hover:bg-gray-50/60 transition-colors ${
                        !platform.enabled ? 'opacity-50 bg-gray-50/30' : ''
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
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
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
                          className="w-full bg-gray-50 border border-gray-200 text-xs rounded-lg px-2.5 py-1.5 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                          {AVAILABLE_PLATFORMS.map((p) => (
                            <option key={p.id} value={p.name}>
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
                        <span className="inline-block bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded text-[11px]">
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
                          className="w-full bg-gray-50 border border-gray-200 text-xs rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                          className="w-full bg-gray-50 border border-gray-200 text-xs rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </td>

                      {/* دکمه حذف سطر */}
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemovePlatform(idx)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
