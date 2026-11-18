'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { useAuth } from '@/features/auth';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, activeOrgId, activeRole, availableOrganizations, canAccessRoute } = useAuth();

  // محافظت مسیرهای پنل کلاینت و هدایت در صورت عدم ورود یا عدم انتخاب سازمان
  React.useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace('/login');
      } else if (!activeOrgId && availableOrganizations.length > 1) {
        router.replace('/select-org');
      }
    }
  }, [isLoading, isAuthenticated, activeOrgId, availableOrganizations, router]);

  // نمایش اسکلتون لودینگ هنگام مقداردهی اولیه نشست جهت جلوگیری از پرش و رندر ناخواسته
  if (isLoading || !isAuthenticated || (!activeOrgId && availableOrganizations.length > 1)) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6" dir="rtl">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-md mb-4 animate-pulse">
          گ
        </div>
        <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-500">
          <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>درحال اعتبارسنجی نشست کاربری...</span>
        </div>
      </div>
    );
  }

  // بررسی دسترسی نقشی به مسیر جاری بر مبنای ماتریس مرکزی permissions.ts
  const isAllowed = canAccessRoute(pathname);
  if (!isAllowed) {
    return (
      <AppShell maxWidth="1440">
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center" dir="rtl">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 border border-rose-200">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-lg font-black text-slate-900 mb-2">
            عدم دسترسی به این بخش
          </h2>
          <p className="text-xs text-slate-600 max-w-md mb-6 leading-relaxed">
            مطابق ماتریس دسترسی مستند اصلی محصول، نقش فعلی شما مجوز مشاهده یا کار با این مسیر ({pathname}) را ندارد.
          </p>
          <Button variant="primary" onClick={() => router.push('/')}>
            بازگشت به صفحه خانه
          </Button>
        </div>
      </AppShell>
    );
  }

  return <AppShell maxWidth="1440">{children}</AppShell>;
}
