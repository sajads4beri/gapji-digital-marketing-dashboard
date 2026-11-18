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

    if (isSubmitting) return;

    setErrorMessage(null);
    setSuccessNotice(false);

    let parsedMinutes = 0;
    let parsedSeconds = 0;

    if (callResult === 'answered') {
      const cleanMin = normalizeDigits(durationMinutes).trim();
      const cleanSec = normalizeDigits(durationSeconds).trim();

      parsedMinutes = parseInt(cleanMin || '0', 10);
      parsedSeconds = parseInt(cleanSec || '0', 10);

      if (Number.isNaN(parsedMinutes) || parsedMinutes < 0) {
        setErrorMessage('مقدار دقیقه نامعتبر است.');
        return;
      }
      if (Number.isNaN(parsedSeconds) || parsedSeconds < 0 || parsedSeconds >= 60) {
        setErrorMessage('مقدار ثانیه باید بین ۰ تا ۵۹ باشد.');
        return;
      }
      if (parsedMinutes === 0 && parsedSeconds === 0) {
        setErrorMessage('برای تماس پاسخ‌داده‌شده، مدت مکالمه نمی‌تواند صفر باشد.');
        return;
      }
    }

    const totalDurationSeconds = parsedMinutes * 60 + parsedSeconds;

    try {
      setIsSubmitting(true);
      const newEvent = await leadService.createCall(leadId, {
        callResult: callResult,
        callDurationSeconds: totalDurationSeconds,
        note: note.trim() || undefined,
      });

      setSuccessNotice(true);
      setNote('');
      if (callResult === 'answered') {
        setDurationMinutes('1');
        setDurationSeconds('0');
      }

      onSuccess?.(newEvent);
      setTimeout(() => setSuccessNotice(false), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطا در ثبت رویداد تماس تلفنی';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`rounded-2xl border border-[#1F2E45] bg-[#111D2E]/80 backdrop-blur-md p-5 shadow-xl text-slate-200 ${className}`}
      dir="rtl"
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-[#719BDF] text-white shadow-md shadow-blue-500/20">
          <PhoneCall className="h-4 w-4" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-100 font-display">
            ثبت سریع تماس تلفنی
          </h3>
          <p className="text-xs text-slate-400">
            نتیجه و خلاصه مکالمه بلافاصله در خط زمانی ثبت می‌شود.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          id="callFormErrorMessage"
          className="mb-3 flex items-center gap-2 rounded-lg border border-[#D66B73]/30 bg-[#D66B73]/10 p-2.5 text-xs text-[#D66B73]"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-[#D66B73]" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successNotice && (
        <div
          role="status"
          className="mb-3 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-400"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
          <span>تماس با موفقیت در خط زمانی لید ثبت شد.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-2 space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* انتخاب نتیجه تماس */}
          <div>
            <label
              htmlFor="callResultSelect"
              className="mb-1 block text-xs font-semibold text-slate-300"
            >
              نتیجه تماس <span className="text-[#D66B73]">*</span>
            </label>
            <select
              id="callResultSelect"
              value={callResult}
              onChange={handleResultChange}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-[#1F2E45] bg-[#0B1423] px-3 py-2 text-xs sm:text-sm text-slate-100 shadow-sm transition-colors focus:border-[#719BDF] focus:outline-none"
            >
              {(Object.keys(CALL_RESULT_LABELS) as CallResult[]).map((res) => (
                <option key={res} value={res} className="bg-[#0B1423] text-slate-100">
                  {CALL_RESULT_LABELS[res]}
                </option>
              ))}
            </select>
          </div>

          {/* مدت مکالمه */}
          <div>
            <span
              id="callDurationLabel"
              className="mb-1 block text-xs font-semibold text-slate-300"
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
                  className="w-full rounded-xl border border-[#1F2E45] bg-[#0B1423] px-2.5 py-2 text-center text-xs sm:text-sm text-slate-100 font-mono shadow-sm focus:border-[#719BDF] focus:outline-none disabled:bg-[#0B1423]/40 disabled:text-slate-600"
                  placeholder="دقیقه"
                />
              </div>
              <span className="text-xs text-slate-500 select-none">:</span>
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
                  className="w-full rounded-xl border border-[#1F2E45] bg-[#0B1423] px-2.5 py-2 text-center text-xs sm:text-sm text-slate-100 font-mono shadow-sm focus:border-[#719BDF] focus:outline-none disabled:bg-[#0B1423]/40 disabled:text-slate-600"
                  placeholder="ثانیه"
                />
              </div>
              <Clock className="h-4 w-4 text-slate-500 shrink-0" aria-hidden="true" />
            </div>
          </div>
        </div>

        {/* یادداشت تماس */}
        <div>
          <label
            htmlFor="callNoteInput"
            className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-300"
          >
            <span>یادداشت و جزئیات مکالمه</span>
            <span className="text-[11px] font-normal text-slate-500">اختیاری</span>
          </label>
          <textarea
            id="callNoteInput"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={isSubmitting}
            placeholder="خلاصه مکالمه، نیازهای مطرح‌شده یا گام‌های بعدی..."
            className="w-full rounded-xl border border-[#1F2E45] bg-[#0B1423] p-3 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 shadow-sm transition-colors focus:border-[#719BDF] focus:outline-none"
          />
        </div>

        {/* دکمه ارسال */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-[#719BDF] hover:from-blue-500 hover:to-[#719BDF]/90 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send className="h-3.5 w-3.5" aria-hidden="true" />
            {isSubmitting ? 'در حال ثبت...' : 'ثبت تماس در خط زمانی'}
          </button>
        </div>
      </form>
    </div>
  );
}
