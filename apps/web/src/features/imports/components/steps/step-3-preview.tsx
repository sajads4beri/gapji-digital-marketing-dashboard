'use client';

import * as React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ValidateImportResult, ImportDataType } from '../../types';

interface Step3PreviewProps {
  dataType: ImportDataType;
  validationResult: ValidateImportResult | null;
  isValidating: boolean;
}

type FilterTab = 'all' | 'valid' | 'invalid' | 'duplicate';

export function Step3Preview({
  dataType,
  validationResult,
  isValidating,
}: Step3PreviewProps) {
  const [activeTab, setActiveTab] = React.useState<FilterTab>('all');
  const [currentPage, setCurrentPage] = React.useState(1);
  const PAGE_SIZE = 50;

  if (isValidating || !validationResult) {
    return (
      <div className="py-16 text-center space-y-4">
        <div className="w-10 h-10 border-2 border-[#719BDF] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-medium text-white">
          در حال اعتبارسنجی سطرها با پایگاه داده و قوانین کسب‌وکار...
        </p>
        <p className="text-xs text-slate-400">
          بررسی شماره‌های تکراری، صحت ساختار فیلدها و احراز دسترسی سازمانی
        </p>
      </div>
    );
  }

  const {
    totalRows,
    validRowsCount,
    invalidRowsCount,
    duplicateRowsCount,
    rows,
  } = validationResult;

  // فیلتر کردن سطرها بر اساس تب انتخابی
  const filteredRows = rows.filter((r) => {
    if (activeTab === 'valid') return r.status === 'valid';
    if (activeTab === 'invalid') return r.status === 'invalid';
    if (activeTab === 'duplicate') return r.status === 'duplicate';
    return true;
  });

  const totalPages = Math.ceil(filteredRows.length / PAGE_SIZE) || 1;
  const paginatedRows = filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* کارت‌های آمار تجمیعی اعتبارسنجی */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl border border-[#1F2E45] bg-[#0B1423] shadow-lg">
          <div className="text-xs text-slate-400 font-medium">کل ردیف‌ها</div>
          <div className="text-xl font-bold text-white mt-1 font-mono">
            {totalRows.toLocaleString('fa-IR')}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">کل سطرهای استخراج‌شده</div>
        </div>

        <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 shadow-lg">
          <div className="text-xs text-emerald-400 font-medium flex items-center">
            <CheckCircle2 className="w-3.5 h-3.5 me-1 text-emerald-400" />
            معتبر و آماده درج
          </div>
          <div className="text-xl font-bold text-emerald-400 mt-1 font-mono">
            {validRowsCount.toLocaleString('fa-IR')}
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-0.5">
            {Math.round((validRowsCount / (totalRows || 1)) * 100).toLocaleString('fa-IR')}٪ از کل
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 shadow-lg">
          <div className="text-xs text-rose-400 font-medium flex items-center">
            <AlertCircle className="w-3.5 h-3.5 me-1 text-rose-400" />
            دارای خطا
          </div>
          <div className="text-xl font-bold text-rose-400 mt-1 font-mono">
            {invalidRowsCount.toLocaleString('fa-IR')}
          </div>
          <div className="text-[11px] text-rose-400/80 mt-0.5">نیاز به اصلاح در فایل</div>
        </div>

        <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 shadow-lg">
          <div className="text-xs text-amber-400 font-medium flex items-center">
            <AlertTriangle className="w-3.5 h-3.5 me-1 text-amber-400" />
            تکراری شناسایی‌شده
          </div>
          <div className="text-xl font-bold text-amber-400 mt-1 font-mono">
            {duplicateRowsCount.toLocaleString('fa-IR')}
          </div>
          <div className="text-[11px] text-amber-400/80 mt-0.5">نادیده گرفته می‌شوند</div>
        </div>
      </div>

      {/* بنر خط‌مشی ایمن عدم بازنویسی داده‌ها */}
      <div className="p-4 rounded-2xl border border-[#719BDF]/30 bg-[#719BDF]/10 text-xs text-slate-200 flex items-start space-x-2 space-x-reverse shadow-md">
        <ShieldCheck className="w-4 h-4 me-1.5 mt-0.5 shrink-0 text-[#719BDF]" />
        <div>
          <span className="font-semibold text-white">خط‌مشی پیش‌فرض ایمن (Non-Destructive Safe Policy):</span>
          <p className="mt-0.5 text-slate-300 leading-relaxed">
            تنها سطرهای <strong className="text-emerald-400">معتبر و جدید</strong> در پایگاه داده PostgreSQL ثبت خواهند شد. سطرهای تکراری و دارای خطا بدون دستکاری در رکوردهای موجود صرف‌نظر شده و در گزارش نهایی قابل بررسی خواهند بود.
          </p>
        </div>
      </div>

      {/* تب‌های فیلتر پیش‌نمایش */}
      <div className="flex items-center justify-between border-b border-[#1F2E45] pb-2">
        <div className="flex items-center space-x-2 space-x-reverse">
          <button
            type="button"
            onClick={() => {
              setActiveTab('all');
              setCurrentPage(1);
            }}
            className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-all ${
              activeTab === 'all'
                ? 'bg-[#18263A] text-white border border-[#1F2E45] shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-[#18263A]/40'
            }`}
          >
            همه سطرها ({totalRows.toLocaleString('fa-IR')})
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('valid');
              setCurrentPage(1);
            }}
            className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-all ${
              activeTab === 'valid'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10'
            }`}
          >
            معتبر ({validRowsCount.toLocaleString('fa-IR')})
          </button>

          {invalidRowsCount > 0 && (
            <button
              type="button"
              onClick={() => {
                setActiveTab('invalid');
                setCurrentPage(1);
              }}
              className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-all ${
                activeTab === 'invalid'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-semibold'
                  : 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10'
              }`}
            >
              دارای خطا ({invalidRowsCount.toLocaleString('fa-IR')})
            </button>
          )}

          {duplicateRowsCount > 0 && (
            <button
              type="button"
              onClick={() => {
                setActiveTab('duplicate');
                setCurrentPage(1);
              }}
              className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-all ${
                activeTab === 'duplicate'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                  : 'text-slate-400 hover:text-amber-400 hover:bg-amber-500/10'
              }`}
            >
              تکراری‌ها ({duplicateRowsCount.toLocaleString('fa-IR')})
            </button>
          )}
        </div>

        <span className="text-[11px] text-slate-400 font-mono">
          نمایش {filteredRows.length.toLocaleString('fa-IR')} مورد
        </span>
      </div>

      {/* جدول پیش‌نمایش سطرها */}
      <div className="rounded-2xl border border-[#1F2E45] overflow-hidden bg-[#0B1423] shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-[#1F2E45] bg-[#080F1C] text-slate-400 font-semibold">
                <th className="py-3.5 px-3 w-16 text-center">سطر</th>
                <th className="py-3.5 px-3 w-28 text-center">وضعیت</th>
                {dataType === 'leads' ? (
                  <>
                    <th className="py-3.5 px-4">نام و نام خانوادگی</th>
                    <th className="py-3.5 px-4">شماره همراه</th>
                    <th className="py-3.5 px-4">وضعیت لید</th>
                    <th className="py-3.5 px-4">کمپین / منبع</th>
                  </>
                ) : (
                  <>
                    <th className="py-3.5 px-4">عنوان هزینه</th>
                    <th className="py-3.5 px-4">دسته‌بندی</th>
                    <th className="py-3.5 px-4">مبلغ (تومان)</th>
                    <th className="py-3.5 px-4">تاریخ / فاکتور</th>
                  </>
                )}
                <th className="py-3.5 px-4">توضیحات و خطاها</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2E45]/60">
              {paginatedRows.map((row) => {
                const { rowNumber, status, normalizedData, errors, warnings, duplicateReason } = row;

                return (
                  <tr
                    key={rowNumber}
                    className={`hover:bg-[#18263A]/40 transition-colors ${
                      status === 'invalid'
                        ? 'bg-rose-950/20 hover:bg-rose-950/30'
                        : status === 'duplicate'
                        ? 'bg-amber-950/20 hover:bg-amber-950/30'
                        : ''
                    }`}
                  >
                    <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">
                      {rowNumber}
                    </td>

                    <td className="py-3 px-3 text-center">
                      {status === 'valid' ? (
                        <span className="inline-block text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-medium">
                          معتبر ✓
                        </span>
                      ) : status === 'duplicate' ? (
                        <span className="inline-block text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-medium">
                          تکراری ✕
                        </span>
                      ) : (
                        <span className="inline-block text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-0.5 rounded-full font-medium">
                          خطا ✕
                        </span>
                      )}
                    </td>

                    {dataType === 'leads' ? (
                      <>
                        <td className="py-3 px-4 font-medium text-white">
                          {normalizedData?.fullName || <span className="text-rose-400 italic">خالی</span>}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300 text-xs">
                          {normalizedData?.mobile || <span className="text-rose-400 italic">خالی</span>}
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          <span className="bg-[#18263A] text-slate-300 border border-[#1F2E45] px-2 py-0.5 rounded-lg text-[11px]">
                            {normalizedData?.statusLabel || normalizedData?.statusKey || 'جدید'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          <div className="text-slate-200">{normalizedData?.campaignName || '—'}</div>
                          <div className="text-[10px] text-slate-400">{normalizedData?.source}</div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-3 px-4 font-medium text-white">
                          {normalizedData?.title || <span className="text-rose-400 italic">خالی</span>}
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          <span className="bg-[#18263A] text-slate-300 border border-[#1F2E45] px-2 py-0.5 rounded-lg text-[11px]">
                            {normalizedData?.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-emerald-400">
                          {normalizedData?.normalizedAmountToman
                            ? Number(normalizedData.normalizedAmountToman).toLocaleString('fa-IR')
                            : '۰'}
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          <div className="text-slate-200">{normalizedData?.date || '—'}</div>
                          {normalizedData?.invoiceNumber && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              فاکتور: {normalizedData.invoiceNumber}
                            </div>
                          )}
                        </td>
                      </>
                    )}

                    <td className="py-3 px-4 text-xs">
                      {errors.length > 0 && (
                        <div className="text-rose-400 text-[11px] space-y-0.5">
                          {errors.map((err, i) => (
                            <div key={i} className="flex items-center">
                              <AlertCircle className="w-3 h-3 me-1 shrink-0" />
                              <span>{err}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {duplicateReason && (
                        <div className="text-amber-400 text-[11px] flex items-center">
                          <AlertTriangle className="w-3 h-3 me-1 shrink-0" />
                          <span>{duplicateReason}</span>
                        </div>
                      )}

                      {warnings.length > 0 && (
                        <div className="text-[#719BDF] text-[10px] space-y-0.5 mt-0.5">
                          {warnings.map((warn, i) => (
                            <div key={i} className="flex items-center">
                              <Info className="w-2.5 h-2.5 me-1 shrink-0" />
                              <span>{warn}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {errors.length === 0 && !duplicateReason && warnings.length === 0 && (
                        <span className="text-emerald-400 text-[11px] font-medium">— آماده ثبت —</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* صفحه‌بندی پیش‌نمایش در صورت زیاد بودن سطرها */}
        {totalPages > 1 && (
          <div className="p-3.5 border-t border-[#1F2E45] bg-[#080F1C] flex items-center justify-between text-xs text-slate-400">
            <span>
              صفحه {currentPage.toLocaleString('fa-IR')} از {totalPages.toLocaleString('fa-IR')}
            </span>
            <div className="flex items-center space-x-1.5 space-x-reverse">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="text-xs h-7.5 px-3 border-[#1F2E45] bg-[#111D2E] text-slate-300 hover:text-white rounded-lg"
              >
                قبلی
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="text-xs h-7.5 px-3 border-[#1F2E45] bg-[#111D2E] text-slate-300 hover:text-white rounded-lg"
              >
                بعدی
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}