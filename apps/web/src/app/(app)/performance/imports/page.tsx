'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import {
  UploadCloud,
  Database,
  ShieldCheck,
} from 'lucide-react';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { ImportWizard, ImportHistoryTable, ImportDataType } from '@/features/imports';

function ImportPageContent() {
  const searchParams = useSearchParams();
  const rawType = searchParams.get('type');
  const initialType: ImportDataType = rawType === 'costs' ? 'costs' : 'leads';

  const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  const handleImportCompleted = () => {
    // بازخوانی جدول تاریخچه پس از موفقیت ایمپورت
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* مسیر ناوبری (Breadcrumb) استاندارد پروژه */}
      <Breadcrumb
        items={[
          { label: 'فضای کاری ۱: عملکرد', href: '/performance/dashboard' },
          { label: 'ورود اطلاعات (Import)' },
        ]}
      />

      {/* سربرگ صفحه و عنوان کاملاً هماهنگ با طراحی کمپین‌ها، هزینه‌ها و لیدها */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1F2E45]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#719BDF]/10 border border-[#719BDF]/20 text-[#719BDF] flex items-center justify-center shrink-0 shadow-lg shadow-[#719BDF]/10">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              ورود اطلاعات (Universal Import Wizard)
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">
              بارگذاری دسته‌ای، نگاشت ستون‌ها، اعتبارسنجی خودکار و درج سرنخ‌ها و هزینه‌های بازاریابی
            </p>
          </div>
        </div>

        {/* نشانگرهای استاندارد سلامت و امنیت */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#111D2E]/80 border border-[#1F2E45] text-xs font-semibold text-slate-300 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>کنترل دسترسی RBAC</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#111D2E]/80 border border-[#1F2E45] text-xs font-semibold text-slate-300 shadow-sm">
            <Database className="w-4 h-4 text-[#719BDF]" />
            <span>تضمین عدم تکرارپذیری</span>
          </div>
        </div>
      </div>

      {/* ویزارد چهار مرحله‌ای ایمپورت */}
      <ImportWizard
        initialDataType={initialType}
        onComplete={handleImportCompleted}
      />

      {/* تاریخچه عملیات‌های ایمپورت سازمان */}
      <div className="pt-2">
        <ImportHistoryTable refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
}

export default function PerformanceImportsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="space-y-6" dir="rtl">
          <div className="h-5 w-48 bg-[#1F2E45] rounded-lg animate-pulse" />
          <div className="h-16 w-full bg-[#111D2E]/80 border border-[#1F2E45] rounded-2xl animate-pulse" />
          <div className="h-96 bg-[#111D2E]/80 border border-[#1F2E45] rounded-2xl animate-pulse" />
        </div>
      }
    >
      <ImportPageContent />
    </React.Suspense>
  );
}
