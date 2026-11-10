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
      {/* کارت مرکزی ورود مطابق صفحه ۶ سند محصول */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm backdrop-blur-xs">
        {/* لوگو و عنوان پلتفرم */}
        <div className="text-center space-y-3 pb-6 border-b border-slate-100">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-2xl shadow-md shadow-blue-500/20">
            گ
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              پلتفرم مارکتینگ گپ‌جی
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">
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
              className="block text-xs font-bold text-slate-700"
            >
              ایمیل یا شماره موبایل <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
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
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-2.5 pl-10 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all placeholder:text-slate-400 placeholder:text-right"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                {identifier.includes('@') ? <Mail size={16} /> : <Phone size={16} />}
              </div>
            </div>
          </div>

          {/* فیلد رمز عبور با دکمه نمایش/مخفی */}
          <div className="space-y-1.5 text-right">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-xs font-bold text-slate-700"
              >
                رمز عبور <span className="text-rose-500">*</span>
              </label>
              {/* پیوند «رمز را فراموش کرده‌ام» مطابق سند */}
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                tabIndex={3}
              >
                رمز را فراموش کرده‌ام
              </Link>
            </div>

            <div className="relative">
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
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-2.5 pl-10 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all placeholder:text-slate-400 placeholder:text-right"
              />
              {/* دکمه نمایش و مخفی کردن رمز مطابق سند */}
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
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
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            disabled={isSubmitting}
            className="w-full text-sm font-bold shadow-sm shadow-blue-500/20"
          >
            <span>ورود به سامانه</span>
          </Button>

          {/* نمایش خطای رمز اشتباه زیر فرم (نه Toast) طبق الزام صریح سند */}
          {errorMessage && (
            <div
              role="alert"
              className="p-3.5 bg-rose-50 border border-rose-200/90 rounded-2xl flex items-start gap-2.5 text-rose-800 text-xs animate-in fade-in slide-in-from-top-1"
            >
              <AlertCircle size={17} className="text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed font-semibold">{errorMessage}</div>
            </div>
          )}
        </form>
      </div>

      {/* راهنمای حساب‌های آزمایشی توسعه جهت تست سریع */}
      <div className="bg-white/80 border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
        <button
          type="button"
          onClick={() => setShowDemoAccounts((prev) => !prev)}
          className="w-full flex items-center justify-between text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors"
        >
          <div className="flex items-center gap-2 text-blue-700">
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
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 text-xs">
            <p className="text-[11px] text-slate-500 leading-relaxed mb-2">
              جهت ورود، روی هر حساب کلیک نمایید (رمز عبور تمامی حساب‌ها در دیتابیس محلی: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-slate-800">Password123!</code>):
            </p>
            {REAL_DEV_CREDENTIALS.map((u) => {
              return (
                <button
                  key={u.email}
                  type="button"
                  onClick={() => handleSelectDemoAccount(u.email)}
                  className="w-full text-right p-2 rounded-xl border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/50 transition-all flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900">{u.fullName}</span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        ({u.roleLabel})
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono" dir="ltr">
                      {u.email} | {u.mobile}
                    </span>
                  </div>
                  <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md shrink-0">
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
