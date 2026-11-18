'use client';

import * as React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ExecuteImportResult, ImportDataType, ValidateImportResult } from '../../types';
import { ClientCsvParser } from '../../utils/csv-parser';

interface Step4ResultsProps {
  dataType: ImportDataType;
  result: ExecuteImportResult;
  validationResult: ValidateImportResult | null;
  onReset: () => void;
}

export function Step4Results({
  dataType,
  result,
  validationResult,
  onReset,
}: Step4ResultsProps) {
  const isLeads = dataType === 'leads';
  const skippedDuplicates = validationResult ? validationResult.duplicateRowsCount : 0;
  const isSuccess = result.status === 'completed' && result.failedCount === 0;
  const isPartial = result.status === 'partial' || (result.importedCount > 0 && result.failedCount > 0);

  // امکان دانلود خطاهای گزارش شده به صورت فایل CSV
  const handleDownloadErrorReport = () => {
    if (!result.errors || result.errors.length === 0) return;

    const headers = ['شماره سطر', 'علت خطا'];
    const rows = result.errors.map((err) => [String(err.row), err.reason]);
    const csvContent = ClientCsvParser.stringify(headers, rows);
    ClientCsvParser.downloadCsv(`import_errors_${dataType}_${result.importJobId.slice(0, 8)}.csv`, csvContent);
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      {/* بنر وضعیت اصلی */}
      <div
        className={`p-6 sm:p-8 rounded-2xl border text-center relative overflow-hidden shadow-xl ${
          isSuccess
            ? 'bg-emerald-500/10 border-emerald-500/30'
            : isPartial
            ? 'bg-amber-500/10 border-amber-500/30'
            : 'bg-rose-500/10 border-rose-500/30'
        }`}
      >
        <div className="flex flex-col items-center justify-center space-y-3">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-md ${
              isSuccess
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : isPartial
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}
          >
            {isSuccess ? (
              <CheckCircle2 className="w-8 h-8" />
            ) : isPartial ? (
              <AlertTriangle className="w-8 h-8" />
            ) : (
              <XCircle className="w-8 h-8" />
            )}
          </div>

          <h2 className="text-xl font-bold text-white">
            {isSuccess
              ? `ایمپورت ${isLeads ? 'لیدها' : 'هزینه‌ها'} با موفقیت کامل انجام شد`
              : isPartial
              ? `ایمپورت با موفقیت نسبی انجام شد (${result.importedCount.toLocaleString('fa-IR')} مورد ذخیره شد)`
              : 'عملیات ایمپورت با خطا مواجه شد'}
          </h2>

          <p className="text-sm text-slate-300 max-w-lg leading-relaxed">
            {isSuccess
              ? `تمامی سطرهای معتبر در پایگاه داده PostgreSQL ذخیره شدند و داده‌های سازمانی به‌روزرسانی گردید.`
              : isPartial
              ? `بخشی از سطرها در پایگاه داده ذخیره شدند و سطرهای دارای خطای اعتبارسنجی رد شدند.`
              : 'هیچ رکوردی در پایگاه داده ذخیره نشد. لطفاً گزارش خطاها را بررسی کنید.'}
          </p>

          <div className="inline-flex items-center space-x-2 space-x-reverse px-3 py-1 rounded-xl bg-[#0B1423] border border-[#1F2E45] text-xs text-slate-300 font-mono mt-2 shadow-sm">
            <span>شناسه رهگیری عملیات:</span>
            <span className="text-[#719BDF] font-medium select-all">{result.importJobId}</span>
          </div>
        </div>
      </div>

      {/* کارت‌های آماری */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* کل سطرها */}
        <div className="p-4 rounded-2xl border border-[#1F2E45] bg-[#0B1423] shadow-lg">
          <div className="text-xs font-medium text-slate-400">کل سطرهای پردازش‌شده</div>
          <div className="text-2xl font-bold text-white mt-2 font-mono">
            {result.totalRows.toLocaleString('fa-IR')}
          </div>
          <div className="text-xs text-slate-500 mt-1">محتوای فایل ارسالی</div>
        </div>

        {/* ذخیره‌شده موفق */}
        <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 shadow-lg">
          <div className="text-xs font-medium text-emerald-400 flex items-center justify-between">
            <span>ذخیره‌شده در پایگاه داده</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2 font-mono">
            {result.importedCount.toLocaleString('fa-IR')}
          </div>
          <div className="text-xs text-emerald-400/80 mt-1">
            {isLeads ? 'رکورد لید فعال' : 'سند هزینه معتبر'}
          </div>
        </div>

        {/* موارد تکراری رد شده (سیاست امن) */}
        <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 shadow-lg">
          <div className="text-xs font-medium text-amber-400 flex items-center justify-between">
            <span>تکراری رد شده (امن)</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2 font-mono">
            {skippedDuplicates.toLocaleString('fa-IR')}
          </div>
          <div className="text-xs text-amber-400/80 mt-1">جهت جلوگیری از بازنویسی</div>
        </div>

        {/* ناموفق / دارای خطا */}
        <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 shadow-lg">
          <div className="text-xs font-medium text-rose-400 flex items-center justify-between">
            <span>دارای خطای ساختاری</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 mt-2 font-mono">
            {result.failedCount.toLocaleString('fa-IR')}
          </div>
          <div className="text-xs text-rose-400/80 mt-1">عدم انطباق با قوانین کسب‌وکار</div>
        </div>
      </div>

      {/* بخش نمایش خطاهای سطرها در صورت وجود */}
      {result.errors && result.errors.length > 0 && (
        <div className="space-y-3 p-5 rounded-2xl border border-rose-500/20 bg-rose-500/10 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 space-x-reverse">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <h3 className="text-sm font-semibold text-rose-300">
                گزارش خطاهای ثبت‌شده ({result.errors.length.toLocaleString('fa-IR')} سطر)
              </h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadErrorReport}
              className="text-xs border-rose-500/30 text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl"
            >
              <Download className="w-3.5 h-3.5 me-1.5" />
              دانلود گزارش خطاها (CSV)
            </Button>
          </div>

          <div className="max-h-56 overflow-y-auto rounded-xl border border-[#1F2E45] bg-[#0B1423] divide-y divide-[#1F2E45]">
            {result.errors.slice(0, 100).map((err, idx) => (
              <div key={idx} className="p-2.5 text-xs flex items-center justify-between">
                <span className="font-mono text-slate-400">سطر {err.row.toLocaleString('fa-IR')}</span>
                <span className="text-rose-400 font-medium">{err.reason}</span>
              </div>
            ))}
            {result.errors.length > 100 && (
              <div className="p-2.5 text-center text-xs text-slate-400">
                و {(result.errors.length - 100).toLocaleString('fa-IR')} مورد خطای دیگر (برای مشاهده کامل فایل خطا را دانلود کنید)
              </div>
            )}
          </div>
        </div>
      )}

      {/* کلیدهای اقدام نهایی */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#1F2E45]">
        <Button
          variant="outline"
          onClick={onReset}
          className="w-full sm:w-auto text-slate-300 hover:text-white border-[#1F2E45] bg-[#0B1423] hover:bg-[#18263A] rounded-xl"
        >
          <RotateCcw className="w-4 h-4 me-2" />
          ایمپورت فایل جدید
        </Button>

        <div className="flex items-center space-x-3 space-x-reverse w-full sm:w-auto">
          {isLeads ? (
            <Link href="/leads" className="w-full sm:w-auto">
              <Button className="w-full bg-[#719BDF] hover:bg-[#5A85C9] text-white font-medium shadow-lg shadow-[#719BDF]/20 rounded-xl">
                <span>مشاهده لیدها در کانبان و اینباکس</span>
                <ExternalLink className="w-4 h-4 ms-2" />
              </Button>
            </Link>
          ) : (
            <Link href="/performance/costs" className="w-full sm:w-auto">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-lg shadow-emerald-500/20 rounded-xl">
                <span>مشاهده جدول هزینه‌ها</span>
                <ExternalLink className="w-4 h-4 ms-2" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}