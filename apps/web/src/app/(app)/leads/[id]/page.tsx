'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { EmptyState } from '@/components/common/empty-state';
import {
 LeadProfileCard,
 LeadQuickCallForm,
 LeadJourneyTimeline,
 type LeadDetail,
} from '@/features/leads';
import { leadService, leadApi } from '@/features/leads/api';
import { useAuth } from '@/features/auth';
import { AlertCircle, UserX, ArrowRight, RefreshCw, ShieldAlert } from 'lucide-react';

export default function LeadDetailPage() {
  const params = useParams();
  const leadId = (params?.id as string) || '';
  const { user, activeRole, canAccessRoute } = useAuth();
  const isRouteDenied =
    activeRole === 'campaign_manager' ||
    activeRole === 'client' ||
    activeRole === 'content_creator' ||
    (activeRole !== null && !canAccessRoute('/leads/:id'));

  const [lead, setLead] = React.useState<LeadDetail | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isUnauthorized, setIsUnauthorized] = React.useState<boolean>(false);
  const [timelineRefreshKey, setTimelineRefreshKey] = React.useState<number>(0);

  const fetchLead = React.useCallback(async () => {
    if (isRouteDenied) {
      setIsUnauthorized(true);
      setLead(null);
      setLoading(false);
      return;
    }

    if (!leadId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setIsUnauthorized(false);
      let data: LeadDetail | null = null;
      try {
        data = await leadApi.getLeadById(leadId);
      } catch (apiErr: any) {
        if (apiErr?.response?.status === 403) {
          setIsUnauthorized(true);
          setLead(null);
          setLoading(false);
          return;
        }
        data = await leadService.getById(leadId);
      }

      if (!data) {
        setLead(null);
        return;
      }

      // کنترل امنیتی سمت کلاینت برای نقش کارشناس فروش (GAP-01 بر اساس شناسه مرجع assignedToId)
      if (activeRole === 'sales_agent') {
        const ownerId = data.assignedToId;
        if (!ownerId || !user?.id || ownerId !== user.id) {
          setIsUnauthorized(true);
          setLead(null);
          return;
        }
      }

      setLead(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطا در دریافت اطلاعات لید';
      if (
        msg.includes('خطای دسترسی') ||
        msg.includes('مجوز') ||
        msg.includes('تخصیص‌یافته به خود') ||
        msg.includes('Access Denied')
      ) {
        setIsUnauthorized(true);
        setLead(null);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [leadId, activeRole, user?.id, isRouteDenied]);

 React.useEffect(() => {
 fetchLead();
 }, [fetchLead]);

 const handleCallSuccess = () => {
 // افزایش کلید جهت رفرش خودکار تایم‌لاین بدون بازخوانی مجدد کل صفحه
 setTimelineRefreshKey((prev) => prev + 1);
 };

 // ۱. حالت بارگذاری اولیه (Skeleton)
 if (loading) {
 return (
 <div className="space-y-6" dir="rtl">
 <div className="h-6 w-48 rounded bg-slate-200 animate-pulse" />
 <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
 {/* ستون راست - اسکلتون کارت مشخصات */}
 <div className="lg:col-span-4">
 <div className="h-96 rounded-2xl border border-slate-200 bg-slate-50 p-5 animate-pulse" />
 </div>
 {/* ستون چپ - اسکلتون فرم و تایم‌لاین */}
 <div className="space-y-6 lg:col-span-8">
 <div className="h-44 rounded-2xl border border-slate-200 bg-slate-50 p-5 animate-pulse" />
 <div className="h-96 rounded-2xl border border-slate-200 bg-slate-50 p-5 animate-pulse" />
 </div>
 </div>
 </div>
 );
 }

 // ۱.۵. حالت عدم دسترسی امنیتی به پرونده لید (GAP-01)
 if (isUnauthorized) {
 return (
 <div className="space-y-6" dir="rtl">
 <Breadcrumb
 items={[
 { label: 'فروش و لید', href: '/leads' },
 { label: 'صندوق لیدها', href: '/leads' },
 { label: 'عدم دسترسی' },
 ]}
 />

 <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-8 text-center shadow-sm">
 <ShieldAlert className="mx-auto h-12 w-12 text-rose-600" aria-hidden="true" />
 <h2 className="mt-3 text-lg font-bold text-rose-950">
 عدم دسترسی به پرونده لید
 </h2>
 <p className="mt-2 max-w-md mx-auto text-xs sm:text-sm text-rose-800 leading-relaxed">
  {activeRole === 'sales_agent'
   ? 'شما مجوز دسترسی به این پرونده را ندارید. کارشناسان فروش منحصراً مجاز به مشاهده لیدهای تخصیص‌یافته به خود هستند.'
   : 'نقش کاربری شما مجوز دسترسی به پرونده لید را ندارد.'}
 </p>
 <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
  {!isRouteDenied && (
   <Link
    href="/leads"
    className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-rose-700 transition"
   >
    <span>بازگشت به صندوق لیدها</span>
   </Link>
  )}
  <Link
   href="/"
   className={
    isRouteDenied
     ? 'inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-rose-700 transition'
     : 'inline-flex items-center gap-2 rounded-xl border border-rose-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-rose-700 shadow-sm hover:bg-rose-50 transition'
   }
  >
   <span>داشبورد اصلی</span>
  </Link>
 </div>
 </div>
 </div>
 );
 }

 // ۲. حالت بروز خطا در دریافت اطلاعات
 if (error) {
 return (
 <div className="space-y-6" dir="rtl">
 <div className="flex items-center gap-2 text-sm text-slate-500">
 <Link href="/" className="hover:text-blue-600">
 داشبورد
 </Link>
 <span>/</span>
 <span>جزئیات لید</span>
 </div>

 <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center ">
 <AlertCircle className="mx-auto h-12 w-12 text-rose-500 " aria-hidden="true" />
 <h2 className="mt-3 text-base font-bold text-rose-900 ">
 خطا در بارگذاری اطلاعات لید
 </h2>
 <p className="mt-1 text-xs sm:text-sm text-rose-700 ">
 {error}
 </p>
 <div className="mt-5 flex items-center justify-center gap-3">
 <button
 type="button"
 onClick={() => fetchLead()}
 className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow hover:bg-rose-700"
 >
 <RefreshCw className="h-4 w-4" aria-hidden="true" />
 تلاش مجدد
 </button>
 <Link
 href="/"
 className="rounded-xl border border-rose-300 px-4 py-2 text-xs sm:text-sm font-semibold text-rose-700 hover:bg-rose-100 "
 >
 بازگشت به داشبورد
 </Link>
 </div>
 </div>
 </div>
 );
 }

 // ۳. حالت لید یافت‌نشد (Not Found واقعی)
 if (!lead) {
 return (
 <div className="space-y-6" dir="rtl">
 <Breadcrumb
 items={[
 { label: 'فروش و لید', href: '#' },
 { label: 'جزئیات لید', href: '#' },
 { label: 'لید یافت نشد' },
 ]}
 />

 <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
 <EmptyState
 title="لید مورد نظر یافت نشد"
 description={`هیچ لیدی با شناسه «${leadId}» در سامانه ثبت نشده است یا دسترسی به آن امکان‌پذیر نیست.`}
 icon={<UserX className="h-8 w-8 text-slate-400" aria-hidden="true" />}
 action={{
 label: 'بازگشت به داشبورد اصلی',
 href: '/',
 }}
 />
 </div>
 </div>
 );
 }

 // ۴. حالت نمایش موفق داده‌های لید (Success State)
 return (
 <div className="space-y-6" dir="rtl">
 {/* نوار مسیر راهنما و هدر صفحه */}
 <div className="flex flex-wrap items-center justify-between gap-4">
 <Breadcrumb
 items={[
 { label: 'فروش و لید', href: '#' },
 { label: 'صندوق لیدها', href: '#' },
 { label: lead.fullName },
 ]}
 />

 <Link
 href="/"
 className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 "
 >
 <span>بازگشت به داشبورد</span>
 <ArrowRight className="h-3.5 w-3.5 rotate-180" aria-hidden="true" />
 </Link>
 </div>

 {/* چیدمان دو ستونه مطابق صفحه ۱۶ سند فاز ۱ */}
 <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
 {/* ستون راست: مشخصات و اطلاعات اصلی لید */}
 <div className="lg:col-span-4">
 <LeadProfileCard lead={lead} className="sticky top-6" />
 </div>

 {/* ستون چپ: فرم ثبت تماس سریع بالای خط زمانی تعاملات */}
 <div className="space-y-6 lg:col-span-8">
 {/* فرم ثبت تماس سریع */}
 <LeadQuickCallForm
 leadId={lead.id}
 onSuccess={handleCallSuccess}
 />

 {/* خط زمانی مسیر تعاملات لید */}
 <LeadJourneyTimeline
 leadId={lead.id}
 refreshTrigger={timelineRefreshKey}
 />
 </div>
 </div>
 </div>
 );
}
