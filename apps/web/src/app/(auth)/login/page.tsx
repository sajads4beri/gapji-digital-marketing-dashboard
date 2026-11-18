'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  AlertCircle,
  Building2,
  ChevronDown,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth, REAL_DEV_CREDENTIALS, REAL_DEV_PASSWORD } from '@/features/auth';
import { USER_ROLE_LABELS } from '@/features/users/types';
import { getValidatedRedirectUrl } from '@/lib/redirect-utils';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, availableOrganizations, activeOrgId, activeRole } = useAuth();

  const [identifier, setIdentifier] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [showDemoAccounts, setShowDemoAccounts] = React.useState(false);

  // در صورتی که کاربر قبلاً لاگین کرده و سازمان فعال دارد، به مقصد مجاز هدایت شود
  React.useEffect(() => {
    if (isAuthenticated && activeOrgId) {
      const searchParam =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('callbackUrl')
          : null;
      const destination = getValidatedRedirectUrl(searchParam, activeRole);
      router.replace(destination);
    }
  }, [isAuthenticated, activeOrgId, activeRole, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!identifier.trim()) {
      setErrorMessage('لطفاً ایمیل یا شماره موبایل خود را وارد نمایید.');
      return;
    }

    if (!password) {
      setErrorMessage('لطفاً رمز عبور خود را وارد نمایید.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await login({ identifier, password });

      if (result.success) {
        const searchParam =
          typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search).get('callbackUrl')
            : null;

        // طبق صفحه ۶ سند: «پس از ورود (در صورت چند سازمان): لیست کارت‌های سازمان با نام و نقش کاربر در آن»
        if (result.requiresOrgSelection) {
          const qs = searchParam ? `?callbackUrl=${encodeURIComponent(searchParam)}` : '';
          router.push(`/select-org${qs}`);
        } else {
          const destination = getValidatedRedirectUrl(searchParam, result.activeRole);
          router.push(destination);
        }
      } else {
        // الزامات صریح سند: «خطای رمز اشتباه زیر فرم (نه Toast)»
        setErrorMessage(result.errorMessage);
      }
    } catch (err: any) {
      setErrorMessage('خطای غیرمنتظره در برقراری ارتباط با سرویس ورود.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectDemoAccount = (demoEmail: string) => {
    setIdentifier(demoEmail);
    setPassword(REAL_DEV_PASSWORD);
    setErrorMessage(null);
  };

  return (
    <div className="w-full space-y-6">
      {/* کارت مرکزی ورود مطابق استایل Midnight Quiet Luxury */}
      <div className="bg-[#0B1423]/95 border border-[#1F2E45] rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* هاله ظریف نوری بالای کارت */}
        <div
          className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#719BDF] to-transparent opacity-80"
          aria-hidden="true"
        />

        {/* لوگو و عنوان پلتفرم */}
        <div className="text-center space-y-3 pb-6 border-b border-[#1F2E45]/80">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-[#719BDF] via-[#3B82F6] to-[#1D4ED8] text-white flex items-center justify-center font-black text-2xl shadow-[0_0_24px_rgba(113,155,223,0.35)] border border-[#719BDF]/30">
            گ
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight font-display">
              پلتفرم مارکتینگ گپ‌جی
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              سامانه کنترل فرآیندهای دیجیتال مارکتینگ و کمپین‌ها
            </p>
          </div>
        </div>

        {/* فرم ورود */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
          {/* فیلد ایمیل یا شماره موبایل */}
          <div className="space-y-1.5 text-right">
            <label
              htmlFor="identifier"
              className="block text-xs font-bold text-slate-300"
            >
              ایمیل یا شماره موبایل <span className="text-rose-400">*</span>
            </label>
            <div className="relative flex items-center">
              <input
                id="identifier"
                name="identifier"
                type="text"
                autoComplete="username"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                disabled={isSubmitting}
                placeholder="مثال: ali.mohammadi@gapji.ir یا ۰۹۱۲۱۱۱۱۱۱۱"
                dir="ltr"
                className="w-full bg-[#111D2E] border border-[#1F2E45] text-white text-sm rounded-xl py-2.5 pl-11 pr-4 focus:bg-[#18263A]/80 focus:ring-2 focus:ring-[#719BDF]/30 focus:border-[#719BDF] focus:outline-none transition-all placeholder:text-slate-500 placeholder:text-right"
              />
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-slate-400">
                {identifier.includes('@') ? <Mail size={16} /> : <Phone size={16} />}
              </div>
            </div>
          </div>

          {/* فیلد رمز عبور با دکمه نمایش/مخفی */}
          <div className="space-y-1.5 text-right">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-xs font-bold text-slate-300"
              >
                رمز عبور <span className="text-rose-400">*</span>
              </label>
              {/* پیوند «رمز را فراموش کرده‌ام» مطابق سند */}
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-[#719BDF] hover:text-[#96B9F2] transition-colors"
                tabIndex={3}
              >
                رمز را فراموش کرده‌ام
              </Link>
            </div>

            <div className="relative flex items-center">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                disabled={isSubmitting}
                placeholder="رمز عبور حساب کاربری"
                dir="ltr"
                className="w-full bg-[#111D2E] border border-[#1F2E45] text-white text-sm rounded-xl py-2.5 pl-11 pr-4 focus:bg-[#18263A]/80 focus:ring-2 focus:ring-[#719BDF]/30 focus:border-[#719BDF] focus:outline-none transition-all placeholder:text-slate-500 placeholder:text-right"
              />
              {/* دکمه نمایش و مخفی کردن رمز مطابق سند */}
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors rounded-lg hover:bg-[#18263A] focus:outline-none"
                title={showPassword ? 'مخفی کردن رمز عبور' : 'نمایش رمز عبور'}
                aria-label={showPassword ? 'مخفی کردن رمز عبور' : 'نمایش رمز عبور'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* دکمه ورود هنگام ارسال غیرفعال با اسپینر مطابق سند */}
          <Button
            type="submit"
            size="lg"
            isLoading={isSubmitting}
            disabled={isSubmitting}
            className="w-full text-sm font-bold bg-gradient-to-r from-[#719BDF] to-[#3B82F6] hover:from-[#5A85C9] hover:to-[#2563EB] text-white shadow-lg shadow-[#719BDF]/25 rounded-xl h-11 transition-all"
          >
            <span>ورود به سامانه</span>
          </Button>

          {/* نمایش خطای رمز اشتباه زیر فرم (نه Toast) طبق الزام صریح سند */}
          {errorMessage && (
            <div
              role="alert"
              className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-2.5 text-rose-300 text-xs animate-in fade-in slide-in-from-top-1"
            >
              <AlertCircle size={17} className="text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed font-semibold">{errorMessage}</div>
            </div>
          )}
        </form>
      </div>

      {/* راهنمای حساب‌های آزمایشی توسعه جهت تست سریع */}
      <div className="bg-[#0B1423]/80 border border-[#1F2E45] rounded-2xl p-4 shadow-lg backdrop-blur-md">
        <button
          type="button"
          onClick={() => setShowDemoAccounts((prev) => !prev)}
          className="w-full flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white transition-colors"
        >
          <div className="flex items-center gap-2 text-[#719BDF]">
            <Sparkles size={15} />
            <span>حساب‌های آزمایشی تستی فرانت‌اند (جهت ارزیابی)</span>
          </div>
          <ChevronDown
            size={15}
            className={`transition-transform duration-200 text-slate-400 ${
              showDemoAccounts ? 'rotate-180' : ''
            }`}
          />
        </button>

        {showDemoAccounts && (
          <div className="mt-3 pt-3 border-t border-[#1F2E45] space-y-2 text-xs">
            <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
              جهت ورود، روی هر حساب کلیک نمایید (رمز عبور تمامی حساب‌ها در دیتابیس محلی: <code className="bg-[#18263A] text-[#719BDF] border border-[#1F2E45] px-1.5 py-0.5 rounded font-mono font-bold text-[11px]">Password123!</code>):
            </p>
            {REAL_DEV_CREDENTIALS.map((u) => {
              return (
                <button
                  key={u.email}
                  type="button"
                  onClick={() => handleSelectDemoAccount(u.email)}
                  className="w-full text-right p-2.5 rounded-xl border border-[#1F2E45] bg-[#111D2E]/60 hover:border-[#719BDF]/40 hover:bg-[#18263A] transition-all flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white">{u.fullName}</span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        ({u.roleLabel})
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono" dir="ltr">
                      {u.email} | {u.mobile}
                    </span>
                  </div>
                  <span className="text-[10px] font-medium bg-[#18263A] text-[#719BDF] border border-[#1F2E45] px-2 py-0.5 rounded-md shrink-0">
                    ورود خودکار
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
