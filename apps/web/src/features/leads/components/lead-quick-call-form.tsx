'use client';

import * as React from 'react';
import { PhoneCall, Clock, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { CallResult, LeadEvent } from '../types';
import { CALL_RESULT_LABELS } from '../types';
import { leadService } from '../api';

export interface LeadQuickCallFormProps {
 leadId: string;
 onSuccess?: (newEvent: LeadEvent) => void;
 className?: string;
}

/**
 * تبدیل ارقام فارسی و عربی به ارقام انگلیسی جهت اعتبارسنجی یکپارچه
 */
function normalizeDigits(str: string): string {
 if (!str) return '';
 const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
 const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
 let res = str;
 for (let i = 0; i < 10; i++) {
 res = res.replaceAll(persianDigits[i], String(i)).replaceAll(arabicDigits[i], String(i));
 }
 return res;
}

export function LeadQuickCallForm({
 leadId,
 onSuccess,
 className = '',
}: LeadQuickCallFormProps) {
 const [callResult, setCallResult] = React.useState<CallResult>('answered');
 const [durationMinutes, setDurationMinutes] = React.useState<string>('2');
 const [durationSeconds, setDurationSeconds] = React.useState<string>('30');
 const [note, setNote] = React.useState<string>('');

 const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
 const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
 const [successNotice, setSuccessNotice] = React.useState<boolean>(false);

 // تغییر نتیجه تماس: اگر پاسخ داده نشده باشد، مدت مکالمه به صفر تنظیم می‌شود
 const handleResultChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
 const newResult = e.target.value as CallResult;
 setCallResult(newResult);
 if (newResult !== 'answered') {
 setDurationMinutes('0');
 setDurationSeconds('0');
 }
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();

 // جلوگیری قطعی از ارسال مکرر (Double Submit Prevention)
 if (isSubmitting) return;

 setErrorMessage(null);

 // نرمال‌سازی ارقام و اعتبارسنجی
 const normMins = normalizeDigits(durationMinutes || '0').trim();
 const normSecs = normalizeDigits(durationSeconds || '0').trim();

 // بررسی عدد صحیح بودن (رد اعداد اعشاری و منفی)
 if (!/^\d+$/.test(normMins) || !/^\d+$/.test(normSecs)) {
 setErrorMessage('مدت مکالمه باید عدد صحیح نامنفی باشد.');
 return;
 }

 const mins = parseInt(normMins, 10);
 const secs = parseInt(normSecs, 10);

 if (secs >= 60) {
 setErrorMessage('ثانیه مدت مکالمه باید بین ۰ تا ۵۹ باشد.');
 return;
 }

 if (mins > 180) {
 setErrorMessage('حداکثر مدت مکالمه ۱۸۰ دقیقه است.');
 return;
 }

 const totalDuration = mins * 60 + secs;

 try {
 setIsSubmitting(true);
 const newEvent = await leadService.createCall(leadId, {
 callResult,
 callDurationSeconds: totalDuration,
 note: note.trim() || undefined,
 });

 // بازنشانی فرم در صورت موفقیت
 setCallResult('answered');
 setDurationMinutes('2');
 setDurationSeconds('30');
 setNote('');
 setSuccessNotice(true);
 setTimeout(() => setSuccessNotice(false), 3000);

 if (onSuccess) {
 onSuccess(newEvent);
 }
 } catch (err: unknown) {
 const msg = err instanceof Error ? err.message : 'خطا در ثبت تماس تلفنی';
 setErrorMessage(msg);
 // توجه: در صورت بروز خطا، مقادیر فیلدها پاک نمی‌شوند
 } finally {
 setIsSubmitting(false);
 }
 };

 return (
 <div
 className={`rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50/50 to-white p-5 shadow-sm ${className}`}
 dir="rtl"
 >
 <div className="flex items-center gap-2.5 pb-3">
 <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
 <PhoneCall className="h-4 w-4" aria-hidden="true" />
 </div>
 <div>
 <h3 className="text-sm font-bold text-slate-900 ">
 ثبت سریع تماس تلفنی
 </h3>
 <p className="text-xs text-slate-500 ">
 نتیجه و خلاصه مکالمه بلافاصله در خط زمانی ثبت می‌شود.
 </p>
 </div>
 </div>

 {errorMessage && (
 <div
 role="alert"
 id="callFormErrorMessage"
 className="mb-3 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800 "
 >
 <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 " aria-hidden="true" />
 <span>{errorMessage}</span>
 </div>
 )}

 {successNotice && (
 <div
 role="status"
 className="mb-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-800 "
 >
 <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 " aria-hidden="true" />
 <span>تماس با موفقیت در خط زمانی لید ثبت شد.</span>
 </div>
 )}

 <form onSubmit={handleSubmit} className="mt-2 space-y-3">
 <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
 {/* انتخاب نتیجه تماس */}
 <div>
 <label
 htmlFor="callResultSelect"
 className="mb-1 block text-xs font-semibold text-slate-700 "
 >
 نتیجه تماس <span className="text-rose-500">*</span>
 </label>
 <select
 id="callResultSelect"
 value={callResult}
 onChange={handleResultChange}
 disabled={isSubmitting}
 className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm text-slate-800 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 "
 >
 {(Object.keys(CALL_RESULT_LABELS) as CallResult[]).map((res) => (
 <option key={res} value={res}>
 {CALL_RESULT_LABELS[res]}
 </option>
 ))}
 </select>
 </div>

 {/* مدت مکالمه */}
 <div>
 <span
 id="callDurationLabel"
 className="mb-1 block text-xs font-semibold text-slate-700 "
 >
 مدت مکالمه (دقیقه و ثانیه)
 </span>
 <div className="flex items-center gap-1.5" dir="ltr">
 <div className="relative flex-1">
 <input
 id="callDurationMinutesInput"
 type="text"
 inputMode="numeric"
 aria-labelledby="callDurationLabel"
 aria-label="دقیقه مدت مکالمه"
 value={durationMinutes}
 onChange={(e) => setDurationMinutes(e.target.value)}
 disabled={isSubmitting || callResult !== 'answered'}
 className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-center text-xs sm:text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400 "
 placeholder="دقیقه"
 />
 </div>
 <span className="text-xs text-slate-400 select-none">:</span>
 <div className="relative flex-1">
 <input
 id="callDurationSecondsInput"
 type="text"
 inputMode="numeric"
 aria-labelledby="callDurationLabel"
 aria-label="ثانیه مدت مکالمه"
 value={durationSeconds}
 onChange={(e) => setDurationSeconds(e.target.value)}
 disabled={isSubmitting || callResult !== 'answered'}
 className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-center text-xs sm:text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400 "
 placeholder="ثانیه"
 />
 </div>
 <Clock className="h-4 w-4 text-slate-400 shrink-0" aria-hidden="true" />
 </div>
 </div>
 </div>

 {/* یادداشت تماس */}
 <div>
 <label
 htmlFor="callNoteInput"
 className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-700 "
 >
 <span>یادداشت و جزئیات مکالمه</span>
 <span className="text-[11px] font-normal text-slate-400">اختیاری</span>
 </label>
 <textarea
 id="callNoteInput"
 rows={2}
 value={note}
 onChange={(e) => setNote(e.target.value)}
 disabled={isSubmitting}
 placeholder="خلاصه مکالمه، نیازهای مطرح‌شده یا گام‌های بعدی..."
 className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs sm:text-sm text-slate-800 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 "
 />
 </div>

 {/* دکمه ارسال */}
 <div className="flex justify-end">
 <button
 type="submit"
 disabled={isSubmitting}
 aria-busy={isSubmitting}
 className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
 >
 <Send className="h-3.5 w-3.5" aria-hidden="true" />
 {isSubmitting ? 'در حال ثبت...' : 'ثبت تماس در خط زمانی'}
 </button>
 </div>
 </form>
 </div>
 );
}
