'use client';

import React, { useState } from 'react';
import { smsApi } from '../sms.api';
import { ImportSmsResultsResponse } from '../types';
import { X, UploadCloud, AlertCircle, CheckCircle2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SmsImportModalProps {
  smsId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function SmsImportModal({ smsId, isOpen, onClose, onSuccess }: SmsImportModalProps) {
  const [csvContent, setCsvContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ImportSmsResultsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleImport = async () => {
    if (!csvContent.trim()) {
      setError('لطفاً محتوای فایل را بارگذاری کرده یا در کادر زیر وارد نمایید.');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      const res = await smsApi.importResults(smsId, { csvContent: csvContent.trim() });
      setResult(res);
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'خطا در ایمپورت نتایج ارسال پیامک');
    } finally {
      setIsUploading(false);
    }
  };

  const sampleCsv = `شماره تلفن,وضعیت ارسال,متن پاسخ
09121112233,delivered,علاقه‌مندم
09123334455,delivered,
09125556677,failed,`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#111D2E] rounded-2xl w-full max-w-lg shadow-2xl border border-[#1F2E45] flex flex-col max-h-[90vh] overflow-hidden text-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1F2E45] bg-[#0B1423]/50">
          <div>
            <h2 className="text-base font-bold text-white">ایمپورت نتیجه ارسال پیامک</h2>
            <p className="text-xs text-slate-400 mt-0.5">اکشن ۱ سند محصول ص ۱۷: بروزرسانی وضعیت تحویل و پاسخ‌ها</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-[#18263A] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center">
              <AlertCircle className="w-4 h-4 me-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <div className="flex items-center text-emerald-400 font-bold text-sm mb-2">
                  <CheckCircle2 className="w-5 h-5 me-2 text-emerald-400" />
                  عملیات ایمپورت با موفقیت انجام شد
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 mt-3 tabular-nums">
                  <div>کل ردیف‌های فایل: {result.totalRows.toLocaleString('fa-IR')}</div>
                  <div>موفق و ذخیره‌شده: {result.successfullyImported.toLocaleString('fa-IR')}</div>
                  <div>تکراری در فایل یا سامانه: {result.duplicates.toLocaleString('fa-IR')}</div>
                  <div>ردیف‌های نامعتبر: {result.failed.toLocaleString('fa-IR')}</div>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
                  <div className="font-semibold mb-1">خطاهای مشاهده شده:</div>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-300">
                    {result.errors.slice(0, 5).map((err, idx) => (
                      <li key={idx}>
                        ردیف {err.row}: {err.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <Button onClick={onClose} className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs">
                  بستن
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* File Upload Zone */}
              <div className="border-2 border-dashed border-[#1F2E45] rounded-2xl p-5 text-center hover:border-[#719BDF] transition-colors bg-[#0B1423]/50">
                <UploadCloud className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <p className="text-xs font-medium text-slate-200">انتخاب فایل CSV نتیجه ارسال</p>
                <p className="text-[11px] text-slate-500 mt-0.5">فرمت CSV سازگار با اکسل (UTF-8)</p>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="sms-csv-upload"
                />
                <label
                  htmlFor="sms-csv-upload"
                  className="mt-3 inline-block px-3.5 py-1.5 bg-[#18263A] border border-[#1F2E45] rounded-xl text-xs font-medium text-slate-200 hover:text-white hover:bg-[#1F2E45] cursor-pointer shadow-sm transition-colors"
                >
                  مرور فایل
                </label>
              </div>

              {/* CSV Content Textarea */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    یا محتوای CSV را اینجا جای‌گذاری (Paste) فرمایید:
                  </label>
                  <button
                    type="button"
                    onClick={() => setCsvContent(sampleCsv)}
                    className="text-[11px] text-[#719BDF] hover:underline"
                  >
                    درج داده نمونه
                  </button>
                </div>
                <textarea
                  rows={5}
                  value={csvContent}
                  onChange={(e) => setCsvContent(e.target.value)}
                  placeholder="شماره تلفن,وضعیت ارسال,متن پاسخ..."
                  className="w-full p-3 bg-[#0B1423] border border-[#1F2E45] rounded-xl text-xs font-mono text-emerald-400 focus:outline-none focus:border-[#719BDF] dir-ltr text-left"
                />
              </div>

              {/* Guide Note */}
              <div className="p-3 bg-[#18263A]/60 border border-[#1F2E45] rounded-xl text-[11px] text-slate-300 flex items-start gap-2">
                <FileText className="w-4 h-4 text-[#719BDF] flex-shrink-0 mt-0.5" />
                <div>
                  ستون‌های قابل شناسایی: <strong>شماره تلفن</strong> (الزامی)، <strong>وضعیت ارسال</strong> (delivered یا failed)، و <strong>متن پاسخ</strong>.
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#1F2E45]">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isUploading}
                  className="text-xs bg-[#18263A] border-[#1F2E45] text-slate-300 hover:text-white hover:bg-[#1F2E45]"
                >
                  انصراف
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={isUploading}
                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs shadow-md shadow-blue-900/30"
                >
                  {isUploading ? 'در حال ایمپورت...' : 'ایمپورت و پردازش داده‌ها'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
