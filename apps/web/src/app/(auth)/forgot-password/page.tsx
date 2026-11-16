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
      <div className="bg-[#0B1423]/95 border border-[#1F2E45] rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* هاله ظریف نوری بالای کارت */}
        <div
          className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#719BDF] to-transparent opacity-80"
          aria-hidden="true"
        />

        {/* هدر کارت بازیابی رمز */}
        <div className="text-center space-y-3 pb-6 border-b border-[#1F2E45]/80">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <KeyRound size={26} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight font-display">
              بازیابی رمز عبور
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-medium leading-relaxed">
              ایمیل یا شماره موبایل ثبت‌شده در حساب خود را وارد نمایید تا لینک بازیابی ارسال شود.
            </p>
          </div>
        </div>

        {successInfo ? (
          /* وضعیت نمایش نتیجه ارسال موفق لینک بازیابی */
          <div className="mt-6 space-y-5 text-center animate-in fade-in">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-right space-y-2">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                <span>لینک بازیابی رمز عبور صادر شد</span>
              </div>
              <p className="text-xs text-emerald-200/90 leading-relaxed">
                {successInfo.message}
              </p>
              <div className="pt-2 text-[11px] text-emerald-300/70 border-t border-emerald-500/20">
                <strong>نکته توسعه فرانت‌اند:</strong> مطابق مستند محصول، این عملیات در این فاز به‌صورت Mock شبیه‌سازی شده و ارسال ایمیل یا پیامک واقعی نیازمند اتصال به Backend در فازهای بعدی است.
              </div>
            </div>

            <div className="pt-2">
              <Link href="/login" className="w-full inline-block">
                <Button
                  size="lg"
                  className="w-full font-bold bg-gradient-to-r from-[#719BDF] to-[#3B82F6] hover:from-[#5A85C9] hover:to-[#2563EB] text-white shadow-lg shadow-[#719BDF]/25 rounded-xl h-11"
                >
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
                className="block text-xs font-bold text-slate-300"
              >
                ایمیل یا شماره موبایل <span className="text-rose-400">*</span>
              </label>
              <div className="relative flex items-center">
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
                  className="w-full bg-[#111D2E] border border-[#1F2E45] text-white text-sm rounded-xl py-2.5 pl-11 pr-4 focus:bg-[#18263A]/80 focus:ring-2 focus:ring-[#719BDF]/30 focus:border-[#719BDF] focus:outline-none transition-all placeholder:text-slate-500 placeholder:text-right"
                />
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-slate-400">
                  {identifier.includes('@') ? <Mail size={16} /> : <Phone size={16} />}
                </div>
              </div>
            </div>

            {/* نمایش خطای ورودی زیر فرم */}
            {errorMessage && (
              <div
                role="alert"
                className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-2 text-rose-300 text-xs animate-in fade-in"
              >
                <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                <span className="font-semibold">{errorMessage}</span>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              isLoading={isSubmitting}
              disabled={isSubmitting}
              className="w-full font-bold bg-gradient-to-r from-[#719BDF] to-[#3B82F6] hover:from-[#5A85C9] hover:to-[#2563EB] text-white shadow-lg shadow-[#719BDF]/25 rounded-xl h-11"
            >
              <span>ارسال لینک بازیابی</span>
            </Button>

            <div className="pt-2 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-[#719BDF] transition-colors"
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
