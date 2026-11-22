'use client';

import * as React from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  Users,
  DollarSign,
  X,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImportDataType } from '../../types';
import { ClientCsvParser } from '../../utils/csv-parser';
import { importsApi } from '../../imports.api';
import { useToast } from '@/components/common/toast-provider';

interface Step1UploadProps {
  dataType: ImportDataType;
  onDataTypeChange: (type: ImportDataType) => void;
  fileName: string | null;
  fileSizeKb: number;
  rawCsvText: string;
  rowCount: number;
  onFileLoaded: (name: string, sizeKb: number, text: string, rowCount: number) => void;
  onClearFile: () => void;
  isInspecting: boolean;
  canAccessLeads: boolean;
  canAccessCosts: boolean;
}

export function Step1Upload({
  dataType,
  onDataTypeChange,
  fileName,
  fileSizeKb,
  rawCsvText,
  rowCount,
  onFileLoaded,
  onClearFile,
  isInspecting,
  canAccessLeads,
  canAccessCosts,
}: Step1UploadProps) {
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isDownloadingSample, setIsDownloadingSample] = React.useState(false);

  const handleDownloadSample = async () => {
    setIsDownloadingSample(true);
    try {
      const template = await importsApi.getSampleTemplate(dataType);
      ClientCsvParser.downloadCsv(template.fileName, template.content);
      toast.success('فایل نمونه با موفقیت دانلود شد');
    } catch {
      // الگوهای پشتیبان کلاینتی در صورت عدم دسترسی به سرور
      const fallbackHeaders =
        dataType === 'leads'
          ? ['نام و نام خانوادگی', 'شماره همراه', 'ایمیل', 'شهر', 'منبع جذب', 'وضعیت لید', 'کمپین', 'ارزش معامله', 'یادداشت پیگیری']
          : ['عنوان هزینه', 'دسته‌بندی', 'کانال', 'کمپین', 'مبلغ', 'ارز', 'نرخ تبدیل', 'تاریخ', 'فروشنده', 'شماره فاکتور', 'وضعیت', 'توضیحات'];
      const fallbackRows =
        dataType === 'leads'
          ? [
              ['امیررضا علوی', '09121112233', 'reza@example.com', 'تهران', 'اینستاگرام', 'جدید', 'کمپین پاییزه', '25000000', 'تماس اولیه'],
              ['سارا محمدی', '09354445566', 'sara@company.ir', 'اصفهان', 'گوگل ادز', 'واجد شرایط', 'کمپین سرچ', '40000000', 'ارسال پروپوزال'],
            ]
          : [
              ['شارژ دلاری گوگل ادز', 'ad_media', 'google_ads', 'کمپین سرچ', '500', 'USD', '70000', '2026-11-10', 'پارتنر تهران', 'INV-101', 'paid', 'شارژ ماهانه'],
              ['بسته پیامک جشنواره', 'ad_media', 'sms', 'کمپین یلدا', '15000000', 'TOMAN', '1', '2026-11-11', 'سامانه پیامک', 'INV-102', 'paid', 'ارسال انبوه'],
            ];
      const csv = ClientCsvParser.stringify(fallbackHeaders, fallbackRows);
      ClientCsvParser.downloadCsv(`sample_${dataType}_import.csv`, csv);
      toast.success('فایل نمونه با موفقیت ایجاد شد');
    } finally {
      setIsDownloadingSample(false);
    }
  };

  const processFile = (file: File) => {
    setErrorMessage(null);

    // بررسی فرمت فایل
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setErrorMessage('فرمت فایل نامعتبر است. تنها فایل‌های با پسوند CSV پشتیبانی می‌شوند.');
      return;
    }

    // سقف حجم فایل (حداکثر ۵ مگابایت)
    const sizeKb = Math.round(file.size / 1024);
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('حجم فایل انتخاب‌شده بیش از ۵ مگابایت است. لطفاً فایل کوچک‌تری انتخاب فرمایید.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text || text.trim().length === 0) {
        setErrorMessage('فایل انتخاب‌شده خالی است.');
        return;
      }

      try {
        const parsed = ClientCsvParser.parse(text);
        if (parsed.headers.length === 0) {
          setErrorMessage('فایل CSV فاقد سطر هدر مشخص است.');
          return;
        }
        if (parsed.rowCount === 0) {
          setErrorMessage('فایل CSV تنها شامل هدر است و سطری از داده‌ها در آن یافت نشد.');
          return;
        }
        if (parsed.rowCount > 5000) {
          setErrorMessage(`تعداد سطرهای فایل (${parsed.rowCount.toLocaleString('fa-IR')}) بیش از حد مجاز ۵,۰۰۰ سطر است.`);
          return;
        }

        onFileLoaded(file.name, sizeKb, text, parsed.rowCount);
      } catch (err: any) {
        setErrorMessage(err?.message || 'خطا در پردازش ساختار فایل CSV');
      }
    };
    reader.onerror = () => {
      setErrorMessage('خطا در خواندن فایل از دیسک');
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* انتخاب نوع داده */}
      <div>
        <label className="block text-xs font-bold text-slate-300 mb-2.5">
          انتخاب نوع موجودیت جهت ایمپورت:
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <button
            type="button"
            disabled={!canAccessLeads}
            onClick={() => {
              if (canAccessLeads && dataType !== 'leads') {
                onDataTypeChange('leads');
              }
            }}
            className={`flex items-start p-4 rounded-2xl border text-right transition-all ${
              dataType === 'leads'
                ? 'bg-[#18263A] border-[#719BDF] text-white shadow-lg ring-1 ring-[#719BDF]/30'
                : 'bg-[#0B1423] border-[#1F2E45] hover:border-slate-600 hover:bg-[#18263A]/40 text-slate-300'
            } ${!canAccessLeads ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div
              className={`p-2.5 rounded-xl me-3.5 shrink-0 ${
                dataType === 'leads'
                  ? 'bg-[#719BDF] text-white shadow-md shadow-[#719BDF]/25'
                  : 'bg-[#18263A] text-slate-400 border border-[#1F2E45]'
              }`}
            >
              <Users className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">ایمپورت سرنخ‌ها (Leads)</span>
                {dataType === 'leads' && <CheckCircle2 className="w-4 h-4 text-[#719BDF]" />}
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                ورود دسته‌ای سرنخ‌های بازاریابی، شماره‌های تماس، منبع جذب و انتساب به کارشناسان فروش
              </p>
              {!canAccessLeads && (
                <span className="inline-block mt-2 text-[10px] bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded border border-rose-500/20">
                  نقش شما مجوز دسترسی به لید ندارد (DEC-AUTH-11)
                </span>
              )}
            </div>
          </button>

          <button
            type="button"
            disabled={!canAccessCosts}
            onClick={() => {
              if (canAccessCosts && dataType !== 'costs') {
                onDataTypeChange('costs');
              }
            }}
            className={`flex items-start p-4 rounded-2xl border text-right transition-all ${
              dataType === 'costs'
                ? 'bg-[#18263A] border-emerald-500 text-white shadow-lg ring-1 ring-emerald-500/30'
                : 'bg-[#0B1423] border-[#1F2E45] hover:border-slate-600 hover:bg-[#18263A]/40 text-slate-300'
            } ${!canAccessCosts ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div
              className={`p-2.5 rounded-xl me-3.5 shrink-0 ${
                dataType === 'costs'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                  : 'bg-[#18263A] text-slate-400 border border-[#1F2E45]'
              }`}
            >
              <DollarSign className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">ایمپورت هزینه‌ها (Costs)</span>
                {dataType === 'costs' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                ثبت مصارف مالی تبلیغات، شماره فاکتورها، شارژ ادوردز و همگام‌سازی بودجه کمپین
              </p>
              {!canAccessCosts && (
                <span className="inline-block mt-2 text-[10px] bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded border border-rose-500/20">
                  نقش شما مجوز مدیریت یا ثبت هزینه ندارد
                </span>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* ناحیه آپلود فایل Drag & Drop */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-xs font-bold text-slate-300">
            بارگذاری فایل داده‌ها (فرمت CSV):
          </label>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadSample}
            disabled={isDownloadingSample}
            className="text-xs h-8 px-3 text-[#719BDF] bg-[#719BDF]/10 hover:bg-[#719BDF]/20 border-[#719BDF]/40 rounded-xl"
          >
            <Download className="w-3.5 h-3.5 me-1" />
            دانلود قالب نمونه {dataType === 'leads' ? 'لیدها' : 'هزینه‌ها'}
          </Button>
        </div>

        {!fileName ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-[#719BDF] bg-[#719BDF]/15 ring-2 ring-[#719BDF]/30 scale-[0.99]'
                : 'border-[#1F2E45] bg-[#0B1423]/70 hover:border-[#719BDF]/50 hover:bg-[#18263A]/40'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-[#719BDF]/10 border border-[#719BDF]/20 text-[#719BDF] flex items-center justify-center mx-auto mb-3 shadow-inner">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-white">
              فایل CSV را به اینجا بکشید یا برای انتخاب از سیستم کلیک کنید
            </p>
            <p className="text-xs text-slate-400 mt-1.5">
              فرمت مجاز: فایل CSV استاندارد با انکودینگ UTF-8 (حداکثر ۵ مگابایت، تا ۵,۰۰۰ سطر)
            </p>
          </div>
        ) : (
          <div className="p-4 sm:p-5 rounded-2xl border border-[#1F2E45] bg-[#0B1423] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#719BDF] text-white shrink-0 shadow-md shadow-[#719BDF]/25">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-white truncate">{fileName}</span>
                  <span className="text-[11px] bg-[#18263A] text-[#719BDF] border border-[#1F2E45] px-2.5 py-0.5 rounded-full font-medium">
                    {fileSizeKb.toLocaleString('fa-IR')} KB
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  شامل <strong className="text-[#719BDF] font-bold">{rowCount.toLocaleString('fa-IR')}</strong> سطر داده استخراج‌شده
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs border-[#1F2E45] bg-[#18263A] text-slate-300 hover:text-white rounded-xl"
              >
                تغییر فایل
              </Button>
              <button
                type="button"
                onClick={onClearFile}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="حذف فایل انتخاب‌شده"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )}

        {errorMessage && (
          <div className="mt-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start gap-2 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}
      </div>

      {/* راهنمای ساختار فایل */}
      <div className="p-4 rounded-2xl border border-[#1F2E45] bg-[#0B1423]/70 text-xs text-slate-400 space-y-2">
        <div className="flex items-center text-white font-bold">
          <FileText className="w-4 h-4 me-1.5 text-[#719BDF]" />
          <span>راهنمای استاندارد فایل ورودی:</span>
        </div>
        <ul className="list-disc list-inside space-y-1 ps-1 text-slate-400 leading-relaxed">
          <li>سطر نخست فایل باید حاوی عناوین ستون‌ها (Header) باشد.</li>
          <li>برای شماره‌های تماس در ایران، ارقام انگلیسی یا فارسی با پیش‌شماره ۰۹ یا ۹۸ پشتیبانی می‌شوند.</li>
          <li>در صورت وجود کاما یا سمی‌کولن داخل متن، ستون‌ها به طور خودکار هوشمندانه تشخیص داده خواهند شد.</li>
          <li>در مرحله بعد می‌توانید فیلدهای فایل را به فیلدهای سامانه نگاشت نموده یا ستون‌های نامربوط را نادیده بگیرید.</li>
        </ul>
      </div>
    </div>
  );
}