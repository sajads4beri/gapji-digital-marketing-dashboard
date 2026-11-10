'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Mail,
  Phone,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { authService, normalizeIdentifier } from '@/features/auth';

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successInfo, setSuccessInfo] = React.useState<{
    message: string;
    destinationType: 'email' | 'mobile';
    maskedDestination: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmed = identifier.trim();
    if (!trimmed) {
      setErrorMessage('لطفاً ایمیل یا شماره موبایل حساب کاربری خود را وارد نمایید.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await authService.sendPasswordRecoveryLink(trimmed);
      if (result.success) {
        setSuccessInfo({
          message: result.message,
          destinationType: result.destinationType,
          maskedDestination: result.maskedDestination,
        });
      } else {
        setErrorMessage(result.message);
      }
    } catch {
      setErrorMessage('خطا در برقراری ارتباط با سرویس بازیابی رمز.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm">
        {/* هدر کارت بازیابی رمز */}
        <div className="text-center space-y-3 pb-6 border-b border-slate-100">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shadow-xs">
            <KeyRound size={26} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              بازیابی رمز عبور
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
              ایمیل یا شماره موبایل ثبت‌شده در حساب خود را وارد نمایید تا لینک بازیابی ارسال شود.
            </p>
          </div>
        </div>

        {successInfo ? (
          /* وضعیت نمایش نتیجه ارسال موفق لینک بازیابی (Mock شبیه‌سازی‌شده) */
          <div className="mt-6 space-y-5 text-center animate-in fade-in">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-right space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                <span>لینک بازیابی رمز عبور صادر شد</span>
              </div>
              <p className="text-xs text-emerald-700 leading-relaxed">
                {successInfo.message}
              </p>
              <div className="pt-2 text-[11px] text-emerald-800/80 border-t border-emerald-200/60">
                <strong>نکته توسعه فرانت‌اند:</strong> مطابق مستند محصول، این عملیات در این فاز به‌صورت Mock شبیه‌سازی شده و ارسال ایمیل یا پیامک واقعی نیازمند اتصال به Backend در فازهای بعدی است.
              </div>
            </div>

            <div className="pt-2">
              <Link href="/login" className="w-full inline-block">
                <Button variant="primary" size="lg" className="w-full font-bold">
                  <span>بازگشت به صفحه ورود</span>
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* فرم دریافت ایمیل یا موبایل */
          <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
            <div className="space-y-1.5 text-right">
              <label
                htmlFor="forgot-identifier"
                className="block text-xs font-bold text-slate-700"
              >
                ایمیل یا شماره موبایل <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="forgot-identifier"
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  disabled={isSubmitting}
                  placeholder="ali.mohammadi@gapji.ir یا ۰۹۱۲۱۱۱۱۱۱۱"
                  dir="ltr"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-2.5 pl-10 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all placeholder:text-slate-400 placeholder:text-right"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  {identifier.includes('@') ? <Mail size={16} /> : <Phone size={16} />}
                </div>
              </div>
            </div>

            {/* نمایش خطای ورودی زیر فرم */}
            {errorMessage && (
              <div
                role="alert"
                className="p-3 bg-rose-50 border border-rose-200/90 rounded-2xl flex items-start gap-2 text-rose-800 text-xs"
              >
                <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                <span className="font-semibold">{errorMessage}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              disabled={isSubmitting}
              className="w-full font-bold"
            >
              <span>ارسال لینک بازیابی</span>
            </Button>

            <div className="pt-2 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors"
              >
                <ArrowRight size={14} className="rotate-180" />
                <span>انصراف و بازگشت به صفحه ورود</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
