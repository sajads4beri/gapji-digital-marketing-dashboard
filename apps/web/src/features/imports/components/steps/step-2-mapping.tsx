'use client';

import * as React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TargetFieldDef, ImportDataType } from '../../types';

interface Step2MappingProps {
  dataType: ImportDataType;
  headers: string[];
  previewRows: Record<string, string>[];
  targetFields: TargetFieldDef[];
  mapping: Record<string, string>;
  onMappingChange: (header: string, targetKey: string) => void;
  onAutoMatch: () => void;
}

export function Step2Mapping({
  dataType,
  headers,
  previewRows,
  targetFields,
  mapping,
  onMappingChange,
  onAutoMatch,
}: Step2MappingProps) {
  // شناسایی فیلدهای اجباری
  const requiredFields = targetFields.filter((f) => f.required);
  const mappedTargetKeys = new Set(
    Object.values(mapping).filter((k) => k && k !== '__ignore__'),
  );

  const missingRequired = requiredFields.filter((f) => !mappedTargetKeys.has(f.key));
  const isAllRequiredMapped = missingRequired.length === 0;

  // بررسی نگاشت‌های تکراری به یک فیلد هدف واحد
  const countsByTarget: Record<string, number> = {};
  Object.values(mapping).forEach((t) => {
    if (t && t !== '__ignore__') {
      countsByTarget[t] = (countsByTarget[t] || 0) + 1;
    }
  });
  const duplicateTargetKeys = Object.keys(countsByTarget).filter((t) => countsByTarget[t] > 1);

  return (
    <div className="space-y-6">
      {/* نوار وضعیت بالای صفحه */}
      <div className="p-4 sm:p-5 rounded-2xl border border-[#1F2E45] bg-[#0B1423] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-sm font-bold text-white">
              نگاشت ستون‌های فایل ورودی به فیلدهای {dataType === 'leads' ? 'سرنخ (Lead)' : 'هزینه (Cost)'}
            </h3>
            {isAllRequiredMapped ? (
              <span className="inline-flex items-center text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5 me-1" />
                همه فیلدهای اجباری متصل شدند
              </span>
            ) : (
              <span className="inline-flex items-center text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                <AlertTriangle className="w-3.5 h-3.5 me-1" />
                {missingRequired.length.toLocaleString('fa-IR')} فیلد اجباری باقیمانده
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            سیستم بر اساس تشابه نام ستون‌ها نگاشت اولیه را پیشنهاد داده است. می‌توانید مقاصد فیلدها را تغییر دهید.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAutoMatch}
          className="text-xs text-[#719BDF] bg-[#719BDF]/10 hover:bg-[#719BDF]/20 border-[#719BDF]/40 rounded-xl shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 me-1.5" />
          تطبیق هوشمند خودکار
        </Button>
      </div>

      {/* هشدار فیلدهای اجباری نگاشت‌نشده */}
      {!isAllRequiredMapped && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
          <div>
            <span className="font-bold text-white">فیلدهای اجباری زیر هنوز به هیچ ستونی متصل نشده‌اند:</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {missingRequired.map((f) => (
                <span
                  key={f.key}
                  className="bg-amber-500/20 text-amber-200 px-2.5 py-1 rounded-lg border border-amber-500/30 font-bold"
                >
                  {f.labelFa} ({f.key})
                </span>
              ))}
            </div>
            <p className="text-[11px] text-amber-300/80 mt-1.5">
              جهت فعال شدن دکمه مرحله بعد، اتصال این فیلدها الزامی است.
            </p>
          </div>
        </div>
      )}

      {/* هشدار فیلدهای هدف تکراری */}
      {duplicateTargetKeys.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
          <div>
            <span className="font-bold text-white">خطای نگاشت تکراری ستون‌ها:</span>
            <p className="mt-1 text-rose-300/90 leading-relaxed">
              چند ستون مجزا به یک فیلد سامانه متصل شده‌اند. لطفاً ستون‌های تکراری را روی «نادیده گرفتن» قرار دهید.
            </p>
          </div>
        </div>
      )}

      {/* جدول نگاشت ستون‌ها */}
      <div className="rounded-2xl border border-[#1F2E45] overflow-hidden bg-[#0B1423] shadow-lg">
        <table className="w-full text-right text-xs">
          <thead>
            <tr className="border-b border-[#1F2E45] bg-[#080F1C] text-slate-400 font-semibold">
              <th className="py-3.5 px-4">ستون فایل ورودی</th>
              <th className="py-3.5 px-4">نمونه مقادیر در فایل</th>
              <th className="py-3.5 px-4">فیلد هدف در سامانه</th>
              <th className="py-3.5 px-4 text-center">وضعیت نگاشت</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1F2E45]/60">
            {headers.map((header) => {
              const currentTarget = mapping[header] || '__ignore__';
              const targetDef = targetFields.find((f) => f.key === currentTarget);
              const isIgnored = currentTarget === '__ignore__';
              const isRequired = targetDef?.required;
              const isDuplicate = !isIgnored && duplicateTargetKeys.includes(currentTarget);

              // نمونه مقادیر برای این ستون
              const samples = previewRows
                .map((row) => row[header])
                .filter(Boolean)
                .slice(0, 2);

              return (
                <tr key={header} className="hover:bg-[#18263A]/40 transition-colors">
                  <td className="py-3 px-4 font-medium">
                    <span className="inline-block bg-[#18263A] text-white px-2.5 py-1 rounded-lg text-xs font-bold border border-[#1F2E45]">
                      {header}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-slate-400">
                    {samples.length > 0 ? (
                      <div className="space-y-0.5 max-w-[240px] truncate text-[11px]">
                        {samples.map((s, idx) => (
                          <div key={idx} className="truncate text-slate-300" title={s}>
                            • {s}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-500 italic text-[11px]">— خالی —</span>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    <div className="relative max-w-xs">
                      <select
                        value={currentTarget}
                        onChange={(e) => onMappingChange(header, e.target.value)}
                        className={`w-full text-xs rounded-xl ps-3 pe-8 py-2.5 border transition-all appearance-none cursor-pointer focus:outline-none ${
                          isDuplicate
                            ? 'border-rose-500/50 text-rose-300 bg-rose-500/10 focus:border-rose-500'
                            : isRequired
                            ? 'border-emerald-500/50 text-emerald-300 bg-emerald-500/10 focus:border-emerald-500'
                            : isIgnored
                            ? 'border-[#1F2E45] text-slate-400 bg-[#111D2E] focus:border-slate-500'
                            : 'border-[#719BDF]/50 text-[#719BDF] bg-[#719BDF]/10 focus:border-[#719BDF]'
                        }`}
                      >
                        <option value="__ignore__" className="bg-[#0B1423] text-slate-400">-- نادیده گرفتن این ستون --</option>
                        <optgroup label="فیلدهای اجباری سامانه" className="bg-[#0B1423] text-slate-300">
                          {requiredFields.map((f) => (
                            <option key={f.key} value={f.key} className="bg-[#0B1423] text-white">
                              ★ {f.labelFa} ({f.key})
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="فیلدهای اختیاری" className="bg-[#0B1423] text-slate-300">
                          {targetFields
                            .filter((f) => !f.required)
                            .map((f) => (
                              <option key={f.key} value={f.key} className="bg-[#0B1423] text-white">
                                {f.labelFa} ({f.key})
                              </option>
                            ))}
                        </optgroup>
                      </select>
                      <div className="absolute inset-y-0 left-0 flex items-center pe-2.5 pointer-events-none text-slate-400">
                        <ChevronDown size={14} />
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-center">
                    {isDuplicate ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        تکراری
                      </span>
                    ) : isIgnored ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#111D2E] text-slate-400 border border-[#1F2E45]">
                        نادیده گرفتن
                      </span>
                    ) : isRequired ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        اجباری ✓
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#719BDF]/10 text-[#719BDF] border border-[#719BDF]/20">
                        اختیاری ✓
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}