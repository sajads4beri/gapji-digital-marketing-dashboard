'use client';

import * as React from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Download,
  X,
  AlertTriangle,
} from 'lucide-react';
import { Modal } from '@/components/common/modal';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/common/toast-provider';
import { formatMoneyDisplay } from '@/components/ui/money-input';
import {
  CostCategory,
  CostChannel,
  CostCurrency,
  CostStatus,
  CreateCostInput,
  BatchImportResult,
  COST_CATEGORIES,
  COST_CHANNELS,
  COST_CURRENCIES,
  COST_STATUSES,
  COST_CATEGORY_LABELS,
  COST_CHANNEL_LABELS,
  validateCostData,
} from '../types';
import { costService } from '../index';
import { VALID_MOCK_CAMPAIGNS } from '../costs.mock';

export interface CostImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (result: BatchImportResult) => void;
}

interface ParsedRow {
  rowNumber: number;
  data: CreateCostInput;
  isValid: boolean;
  errors: string[];
}

export function CostImportModal({
  isOpen,
  onClose,
  onSuccess,
}: CostImportModalProps) {
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const [fileName, setFileName] = React.useState<string | null>(null);
  const [fileSizeKb, setFileSizeKb] = React.useState<number>(0);
  const [parsedRows, setParsedRows] = React.useState<ParsedRow[]>([]);
  const [isParsing, setIsParsing] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);
  const [parseError, setParseError] = React.useState<string | null>(null);

  // ریست هنگام باز/بسته شدن
  React.useEffect(() => {
    if (!isOpen) {
      setFileName(null);
      setFileSizeKb(0);
      setParsedRows([]);
      setParseError(null);
      setIsImporting(false);
    }
  }, [isOpen]);

  // دانلود نمونه فایل CSV
  const handleDownloadSampleCsv = () => {
    const headers = [
      'عنوان هزینه',
      'دسته‌بندی',
      'کانال',
      'شناسه کمپین',
      'مبلغ',
      'ارز',
      'نرخ تبدیل',
      'تاریخ',
      'فروشنده',
      'شماره فاکتور',
      'وضعیت',
      'توضیحات',
    ];

    const sampleRows = [
      [
        'شارژ دلاری کلمات کلیدی گوگل ادز',
        'ad_media',
        'google_ads',
        'cmp_mock_2',
        '500',
        'USD',
        '70000',
        new Date().toISOString().split('T')[0],
        'پارتنر گوگل ادز تهران',
        'INV-GGL-101',
        'paid',
        'شارژ ماهانه کمپین سرچ',
      ],
      [
        'بسته پیامک جشنواره پاییزه',
        'ad_media',
        'sms',
        'cmp_mock_3',
        '15000000',
        'TOMAN',
        '1',
        new Date().toISOString().split('T')[0],
        'سامانه کاوه‌نگار',
        'KN-9921',
        'paid',
        'ارسال به مخاطبان علاقه‌مند',
      ],
      [
        'تولید محتوا و موشن‌گرافیک',
        'content_production',
        'instagram',
        'cmp_mock_1',
        '18000000',
        'TOMAN',
        '1',
        new Date().toISOString().split('T')[0],
        'استودیو پویا',
        'STU-402',
        'pending',
        'فاکتور مرحله اول ادیت',
      ],
    ];

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...sampleRows.map((r) => r.map((c) => `"${c}"`).join(','))].join(
        '\r\n'
      );

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'marketing_costs_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // پارسر داخلی CSV بدون نیاز به پکیج خارجی
  const parseCsvText = (text: string) => {
    // حذف BOM احتمالی
    const cleanText = text.replace(/^\uFEFF/, '').trim();
    if (!cleanText) {
      throw new Error('فایل انتخاب‌شده خالی است.');
    }

    const lines = cleanText.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length < 2) {
      throw new Error('فایل CSV باید شامل حداقل یک سطر هدر و یک سطر داده باشد.');
    }

    // جداکننده فیلدها: ویرگول یا سمی‌کولن
    const delimiter = lines[0].includes(';') ? ';' : ',';

    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === delimiter && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const rawHeaders = parseLine(lines[0]).map((h) => h.replace(/^"|"$/g, '').trim());

    // نگاشت ستون‌ها
    const headerMap: Record<string, number> = {};
    rawHeaders.forEach((h, idx) => {
      const lower = h.toLowerCase();
      if (lower.includes('عنوان') || lower.includes('title') || lower.includes('شرح')) {
        headerMap.title = idx;
      } else if (lower.includes('دسته') || lower.includes('category')) {
        headerMap.category = idx;
      } else if (lower.includes('کانال') || lower.includes('channel') || lower.includes('پلتفرم')) {
        headerMap.channel = idx;
      } else if (lower.includes('کمپین') || lower.includes('campaign')) {
        headerMap.campaignId = idx;
      } else if (lower.includes('مبلغ') || lower.includes('amount')) {
        headerMap.amount = idx;
      } else if (lower.includes('ارز') || lower.includes('currency')) {
        headerMap.currency = idx;
      } else if (lower.includes('نرخ') || lower.includes('rate')) {
        headerMap.exchangeRate = idx;
      } else if (lower.includes('تاریخ') || lower.includes('date')) {
        headerMap.date = idx;
      } else if (lower.includes('فروشنده') || lower.includes('vendor') || lower.includes('مجری')) {
        headerMap.vendor = idx;
      } else if (lower.includes('فاکتور') || lower.includes('invoice')) {
        headerMap.invoiceNumber = idx;
      } else if (lower.includes('وضعیت') || lower.includes('status')) {
        headerMap.status = idx;
      } else if (lower.includes('توضیح') || lower.includes('note')) {
        headerMap.notes = idx;
      }
    });

    if (headerMap.title === undefined || headerMap.amount === undefined) {
      throw new Error(
        'ستون‌های اجباری شامل «عنوان هزینه» و «مبلغ» در هدر فایل CSV شناسایی نشدند.'
      );
    }

    const rows: ParsedRow[] = [];
    const todayIso = new Date().toISOString().split('T')[0];

    for (let r = 1; r < lines.length; r++) {
      const cols = parseLine(lines[r]).map((c) => c.replace(/^"|"$/g, '').trim());
      if (cols.length === 0 || cols.every((c) => !c)) continue;

      const getCol = (idx?: number) => (idx !== undefined && idx < cols.length ? cols[idx] : '');

      const title = getCol(headerMap.title);
      let category = getCol(headerMap.category) as CostCategory;
      if (!COST_CATEGORIES.includes(category)) {
        category = 'other';
      }

      let channel = getCol(headerMap.channel) as CostChannel;
      if (!COST_CHANNELS.includes(channel)) {
        channel = '' as CostChannel;
      }

      const campaignId = getCol(headerMap.campaignId);
      const rawAmount = getCol(headerMap.amount).replace(/[,_]/g, '');
      const amount = parseFloat(rawAmount) || 0;

      let currency = (getCol(headerMap.currency).toUpperCase() || 'TOMAN') as CostCurrency;
      if (currency === ('تومان' as any)) currency = 'TOMAN';
      if (currency === ('ریال' as any)) currency = 'IRR';
      if (currency === ('دلار' as any)) currency = 'USD';
      if (currency === ('درهم' as any)) currency = 'AED';
      if (!COST_CURRENCIES.includes(currency)) {
        currency = 'TOMAN';
      }

      const rawRate = getCol(headerMap.exchangeRate).replace(/[,_]/g, '');
      const exchangeRate = parseFloat(rawRate) || undefined;

      let date = getCol(headerMap.date) || todayIso;
      if (isNaN(Date.parse(date))) {
        date = todayIso;
      }

      const vendor = getCol(headerMap.vendor);
      const invoiceNumber = getCol(headerMap.invoiceNumber);

      let status = (getCol(headerMap.status).toLowerCase() || 'paid') as CostStatus;
      if (status === ('پرداخت شده' as any) || status === ('پرداخت' as any)) status = 'paid';
      if (status === ('در انتظار' as any) || status === ('معوق' as any)) status = 'pending';
      if (status === ('پیش نویس' as any) || status === ('پیش‌نویس' as any)) status = 'draft';
      if (!COST_STATUSES.includes(status)) {
        status = 'paid';
      }

      const notes = getCol(headerMap.notes);

      const dataObj: CreateCostInput = {
        title,
        category,
        channel: channel || null,
        campaignId: campaignId || null,
        amount,
        currency,
        exchangeRate,
        date,
        vendor: vendor || null,
        invoiceNumber: invoiceNumber || null,
        status,
        notes: notes || null,
      };

      const val = validateCostData(dataObj, false);
      const errors = [...val.errors];

      if (campaignId && !(campaignId in VALID_MOCK_CAMPAIGNS) && !/^[0-9a-f-]{36}$/i.test(campaignId)) {
        errors.push(`شناسه کمپین «${campaignId}» نامعتبر است.`);
      }

      rows.push({
        rowNumber: r + 1,
        data: dataObj,
        isValid: errors.length === 0,
        errors,
      });
    }

    return rows;
  };

  // بارگذاری فایل
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setParseError('فرمت فایل نامعتبر است. لطفاً یک فایل با پسوند .csv انتخاب کنید.');
      return;
    }

    setFileName(file.name);
    setFileSizeKb(Math.round(file.size / 1024));
    setIsParsing(true);
    setParseError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const rows = parseCsvText(text);
        setParsedRows(rows);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'خطا در خواندن فایل CSV';
        setParseError(msg);
        setParsedRows([]);
      } finally {
        setIsParsing(false);
      }
    };

    reader.onerror = () => {
      setParseError('خطا در خواندن محتوای فایل.');
      setIsParsing(false);
    };

    reader.readAsText(file, 'utf-8');
  };

  // ثبت ردیف‌های معتبر
  const handleImportValidRows = async () => {
    const validItems = parsedRows.filter((r) => r.isValid).map((r) => r.data);
    if (validItems.length === 0) {
      toast.error('هیچ سطر معتبری برای ثبت وجود ندارد.');
      return;
    }

    try {
      setIsImporting(true);
      const result = await costService.importBatch(validItems);

      if (result.importedCount > 0) {
        toast.success(`${result.importedCount.toLocaleString('fa-IR')} هزینه با موفقیت ثبت شد.`);
      }

      const invalidCount = parsedRows.length - validItems.length;
      if (invalidCount > 0) {
        toast.warning(
          `${invalidCount.toLocaleString('fa-IR')} ردیف به دلیل خطای اعتبارسنجی ثبت نشدند.`
        );
      }

      onSuccess?.(result);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'خطا در ثبت دسته‌ای هزینه‌ها';
      toast.error(msg);
    } finally {
      setIsImporting(false);
    }
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.filter((r) => !r.isValid).length;
  const previewRows = parsedRows.slice(0, 5);

  return (
    <Modal
      isOpen={isOpen}
      onClose={isImporting ? () => {} : onClose}
      title="ورود دسته‌ای هزینه‌ها از فایل CSV"
      description="آپلود فایل اکسل/CSV فاکتورها، پیش‌نمایش سطور و اعتبارسنجی پیش از ثبت نهایی"
      size="xl"
      closeOnBackdropClick={!isImporting}
      closeOnEscape={!isImporting}
      showCloseButton={!isImporting}
    >
      <div className="space-y-5" dir="rtl">
        {/* ۱. جعبه انتخاب فایل و دانلود نمونه */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
              <UploadCloud className="w-5 h-5 text-blue-600" />
              <span>انتخاب فایل اکسل یا CSV</span>
            </div>
            <p className="text-xs text-gray-500">
              فرمت استاندارد CSV با ستون‌های عنوان، مبلغ، ارز، پلتفرم و دسته‌بندی
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadSampleCsv}
              className="text-xs"
            >
              <Download className="w-3.5 h-3.5 me-1.5" />
              دانلود فایل نمونه
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isParsing || isImporting}
              className="text-xs"
            >
              انتخاب فایل CSV
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        {/* نمایش خطای کلی پارس */}
        {parseError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{parseError}</span>
          </div>
        )}

        {/* ۲. وضعیت فایل و خلاصه اعتبارسنجی */}
        {fileName && (
          <div className="p-3 bg-white border border-gray-200 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-gray-800">{fileName}</span>
              <span className="text-gray-400">({fileSizeKb} کیلوبایت)</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                {validCount.toLocaleString('fa-IR')} معتبر
              </span>

              {invalidCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold bg-red-50 text-red-700 border border-red-200">
                  <AlertTriangle className="w-3 h-3" />
                  {invalidCount.toLocaleString('fa-IR')} نامعتبر
                </span>
              )}
            </div>
          </div>
        )}

        {/* ۳. جدول پیش‌نمایش ۵ سطر اول */}
        {previewRows.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="font-semibold text-gray-700">
                پیش‌نمایش {previewRows.length.toLocaleString('fa-IR')} سطر اول فایل:
              </span>
              <span>کل سطور شناسایی‌شده: {parsedRows.length.toLocaleString('fa-IR')}</span>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <table className="w-full text-xs text-right divide-y divide-gray-200">
                <thead className="bg-gray-50 text-gray-600 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">ردیف</th>
                    <th className="py-2.5 px-3">عنوان هزینه</th>
                    <th className="py-2.5 px-3">دسته‌بندی</th>
                    <th className="py-2.5 px-3">مبلغ و ارز</th>
                    <th className="py-2.5 px-3">کمپین</th>
                    <th className="py-2.5 px-3">وضعیت اعتبارسنجی</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {previewRows.map((r) => (
                    <tr
                      key={r.rowNumber}
                      className={!r.isValid ? 'bg-red-50/40' : 'hover:bg-gray-50/50'}
                    >
                      <td className="py-2 px-3 font-mono text-gray-400">#{r.rowNumber}</td>
                      <td className="py-2 px-3 font-medium text-gray-900 truncate max-w-[160px]">
                        {r.data.title || '—'}
                      </td>
                      <td className="py-2 px-3 text-gray-600">
                        {COST_CATEGORY_LABELS[r.data.category] || r.data.category}
                      </td>
                      <td className="py-2 px-3 text-gray-900 font-mono">
                        {r.data.amount.toLocaleString()} {r.data.currency}
                      </td>
                      <td className="py-2 px-3 text-gray-600 truncate max-w-[120px]">
                        {r.data.campaignId || 'عمومی'}
                      </td>
                      <td className="py-2 px-3">
                        {r.isValid ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px] font-semibold">
                            صحیح
                          </span>
                        ) : (
                          <span
                            className="text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200 text-[11px] font-semibold"
                            title={r.errors.join(' | ')}
                          >
                            خطا: {r.errors[0]}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ۴. نمایش خطاهای سطور نامعتبر */}
        {invalidCount > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5 max-h-28 overflow-y-auto text-xs text-amber-900">
            <span className="font-bold block">سطور دارای خطای اعتبارسنجی:</span>
            {parsedRows
              .filter((r) => !r.isValid)
              .slice(0, 10)
              .map((r) => (
                <p key={r.rowNumber} className="text-[11px] text-amber-800">
                  • ردیف #{r.rowNumber}: {r.errors.join(' - ')}
                </p>
              ))}
            {invalidCount > 10 && (
              <p className="text-[11px] font-semibold">
                و {invalidCount - 10} ردیف خطادار دیگر...
              </p>
            )}
          </div>
        )}

        {/* دکمه‌های اقدام مودال */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isImporting}
          >
            انصراف
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={handleImportValidRows}
            disabled={validCount === 0 || isImporting}
            className="min-w-[160px]"
          >
            {isImporting ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                در حال ثبت...
              </span>
            ) : (
              `ثبت ${validCount.toLocaleString('fa-IR')} ردیف معتبر`
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
