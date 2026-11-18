'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  ArrowRight,
  Edit2,
  Copy,
  Trash2,
  Share2,
  MapPin,
  Tag,
  Briefcase,
  DollarSign,
  TrendingUp,
  Percent,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/common/toast-provider';
import { useAuth } from '@/features/auth';
import {
  AudienceDetail,
  AudienceGenderBadge,
  audiencesApi,
  AudienceDrawer,
  AudienceDeleteDialog,
} from '@/features/audiences';

export default function AudienceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const audienceId = typeof params?.id === 'string' ? params.id : '';

  const userRole = user?.role || 'campaign_manager';
  const canManage = ['admin', 'marketing_manager'].includes(userRole);
  const canView = ['admin', 'marketing_manager', 'campaign_manager'].includes(userRole);

  const [audience, setAudience] = React.useState<AudienceDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Drawer & Dialog states
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const fetchAudience = React.useCallback(async () => {
    if (!audienceId || !canView) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await audiencesApi.getById(audienceId);
      setAudience(data);
    } catch (err: any) {
      console.error('Failed to load audience details:', err);
      setError(err.response?.data?.message || 'مخاطب مورد نظر یافت نشد یا دسترسی مجاز نیست.');
    } finally {
      setIsLoading(false);
    }
  }, [audienceId, canView]);

  React.useEffect(() => {
    fetchAudience();
  }, [fetchAudience]);

  const handleDuplicate = async () => {
    if (!audience) return;
    try {
      const dup = await audiencesApi.duplicate(audience.id);
      toast.success(`مخاطب با نام «${dup.name}» کپی گردید.`, {
        title: 'کپی موفق',
      });
      router.push(`/performance/audiences/${dup.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'خطا در کپی مخاطب.', {
        title: 'خطا در کپی',
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!audience) return;

    setIsDeleting(true);
    try {
      await audiencesApi.delete(audience.id);
      toast.success(`مخاطب «${audience.name}» با موفقیت حذف گردید.`, {
        title: 'حذف موفق',
      });
      setIsDeleteOpen(false);
      router.push('/performance/audiences');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'خطا در حذف مخاطب.', {
        title: 'عدم امکان حذف',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!canView) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-rose-500/30 bg-[#18263A] p-8 text-center text-rose-300">
          <ShieldAlert className="mx-auto h-12 w-12 text-rose-400 mb-3" />
          <h2 className="text-lg font-bold text-white">عدم دسترسی به جزئیات مخاطب</h2>
          <p className="mt-2 text-xs text-rose-300/80">
            شما مجوز مشاهده این صفحه را ندارید.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-8 w-48 bg-[#18263A] rounded animate-pulse" />
        <div className="h-44 bg-[#111D2E]/80 rounded-2xl border border-[#1F2E45] p-6 animate-pulse" />
        <div className="h-64 bg-[#111D2E]/80 rounded-2xl border border-[#1F2E45] p-6 animate-pulse" />
      </div>
    );
  }

  if (error || !audience) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-[#1F2E45] bg-[#111D2E]/80 backdrop-blur-md p-8 text-center text-slate-300 space-y-4">
          <Users className="mx-auto h-12 w-12 text-slate-500" />
          <h2 className="text-lg font-bold text-white">{error || 'مخاطب یافت نشد'}</h2>
          <Button
            variant="outline"
            onClick={() => router.push('/performance/audiences')}
            className="text-xs bg-[#18263A] border-[#1F2E45] text-slate-200 hover:text-white"
          >
            <ArrowRight className="h-4 w-4 me-1" />
            بازگشت به فهرست مخاطبان
          </Button>
        </div>
      </div>
    );
  }

  const ageLabel =
    audience.ageMin && audience.ageMax
      ? `${audience.ageMin} تا ${audience.ageMax} سال`
      : audience.ageMin
        ? `از ${audience.ageMin} سال به بالا`
        : audience.ageMax
          ? `تا ${audience.ageMax} سال`
          : 'نامحدود (تمام سنین)';

  const connectedList = audience.connectedCampaigns || audience.campaigns || [];
  const totalSpend = connectedList.reduce((sum, c) => sum + (c.spend || 0), 0);
  const totalLeads = connectedList.reduce((sum, c) => sum + (c.leadsCount || 0), 0);
  const avgCpl = totalLeads > 0 ? Math.round(totalSpend / totalLeads) : 0;

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'فضای کاری ۱: عملکرد', href: '/performance/dashboard' },
          { label: 'مخاطبان', href: '/performance/audiences' },
          { label: audience.name, href: `/performance/audiences/${audience.id}` },
        ]}
      />

      {/* هدر صفحه و دکمه‌های عملیات */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/performance/audiences"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#1F2E45] bg-[#18263A] text-slate-300 hover:bg-[#1F2E45] hover:text-white transition-colors shadow-lg shadow-black/20"
            title="بازگشت به فهرست مخاطبان"
          >
            <ArrowRight className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">{audience.name}</h1>
              <AudienceGenderBadge gender={audience.gender} />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              شناسه مخاطب: <span className="font-mono text-slate-300">{audience.id}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canManage && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDuplicate}
                className="text-xs gap-1.5 bg-[#18263A] border-[#1F2E45] text-slate-300 hover:text-white hover:bg-[#1F2E45]"
              >
                <Copy className="h-3.5 w-3.5" />
                کپی پرسونا
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditOpen(true)}
                className="text-xs gap-1.5 bg-[#18263A] border-[#1F2E45] text-slate-300 hover:text-white hover:bg-[#1F2E45]"
              >
                <Edit2 className="h-3.5 w-3.5" />
                ویرایش
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteOpen(true)}
                className={`text-xs gap-1.5 border-[#1F2E45] ${
                  audience.campaignsCount > 0
                    ? 'bg-[#18263A] text-slate-500 cursor-not-allowed'
                    : 'bg-[#18263A] text-rose-400 hover:text-rose-300 hover:bg-rose-500/10'
                }`}
              >
                <Trash2 className="h-3.5 w-3.5" />
                حذف
              </Button>
            </>
          )}
        </div>
      </div>

      {/* کارت مشخصات دموگرافیک پرسونا (Persona Demographics) */}
      <div className="rounded-2xl border border-[#1F2E45] bg-[#111D2E]/80 backdrop-blur-md p-6 shadow-xl shadow-black/20">
        <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Users className="h-4 w-4 text-[#719BDF]" />
          مشخصات دموگرافیک پرسونا (Target Demographic Persona)
        </h2>

        {audience.description && (
          <p className="text-xs text-slate-300 leading-relaxed mb-5 bg-[#0B1423]/60 p-3.5 rounded-xl border border-[#1F2E45]">
            {audience.description}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-[#1F2E45] bg-[#18263A]/60 p-3.5">
            <span className="text-[11px] font-medium text-slate-400 block mb-1">
              رده سنی هدف
            </span>
            <span className="text-xs font-bold text-white">{ageLabel}</span>
          </div>

          <div className="rounded-xl border border-[#1F2E45] bg-[#18263A]/60 p-3.5">
            <span className="text-[11px] font-medium text-slate-400 block mb-1">
              جنسیت
            </span>
            <AudienceGenderBadge gender={audience.gender} />
          </div>

          <div className="rounded-xl border border-[#1F2E45] bg-[#18263A]/60 p-3.5">
            <span className="text-[11px] font-medium text-slate-400 block mb-1 flex items-center gap-1">
              <Share2 className="h-3 w-3 text-slate-500" />
              کانال مناسب
            </span>
            <span className="text-xs font-bold text-white">
              {audience.channel || 'چندکاناله (تعیین‌نشده)'}
            </span>
          </div>

          <div className="rounded-xl border border-[#1F2E45] bg-[#18263A]/60 p-3.5">
            <span className="text-[11px] font-medium text-slate-400 block mb-1 flex items-center gap-1">
              <Briefcase className="h-3 w-3 text-slate-500" />
              تعداد کمپین‌های متصل
            </span>
            <span className="text-xs font-bold text-[#719BDF]">
              {audience.campaignsCount} کمپین
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-[#1F2E45]">
          <div>
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              موقعیت‌های مکانی و شهرها:
            </span>
            <p className="text-xs text-slate-300 bg-[#0B1423]/60 p-2.5 rounded-xl border border-[#1F2E45]">
              {audience.location || 'تمامی نقاط کشور (سراسری)'}
            </p>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
              <Tag className="h-3.5 w-3.5 text-slate-400" />
              علایق و رفتارهای کلیدی:
            </span>
            <p className="text-xs text-slate-300 bg-[#0B1423]/60 p-2.5 rounded-xl border border-[#1F2E45]">
              {audience.interests || 'عمومی / رفتار کاربران آنلاین'}
            </p>
          </div>
        </div>
      </div>

      {/* خلاصه آماری عملکرد تجمیعی کمپین‌ها */}
      {connectedList.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-[#1F2E45] bg-[#111D2E]/80 backdrop-blur-md p-5 shadow-xl shadow-black/20">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <DollarSign className="h-4 w-4 text-emerald-400" />
              <span>مجموع هزینه جذب (Spend)</span>
            </div>
            <div className="text-xl font-bold tabular-nums text-white">
              {totalSpend.toLocaleString('fa-IR')} <span className="text-xs font-normal text-slate-400 font-vazir">تومان</span>
            </div>
          </div>

          <div className="rounded-2xl border border-[#1F2E45] bg-[#111D2E]/80 backdrop-blur-md p-5 shadow-xl shadow-black/20">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <TrendingUp className="h-4 w-4 text-[#719BDF]" />
              <span>کل لیدهای جذب‌شده</span>
            </div>
            <div className="text-xl font-bold tabular-nums text-white">
              {totalLeads.toLocaleString('fa-IR')} <span className="text-xs font-normal text-slate-400 font-vazir">لید</span>
            </div>
          </div>

          <div className="rounded-2xl border border-[#1F2E45] bg-[#111D2E]/80 backdrop-blur-md p-5 shadow-xl shadow-black/20">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <Percent className="h-4 w-4 text-amber-400" />
              <span>میانگین CPL (هزینه هر سرنخ)</span>
            </div>
            <div className="text-xl font-bold tabular-nums text-white">
              {avgCpl.toLocaleString('fa-IR')} <span className="text-xs font-normal text-slate-400 font-vazir">تومان</span>
            </div>
          </div>
        </div>
      )}

      {/* جدول کمپین‌های استفاده‌کننده از این مخاطب (مطابق ص ۱۴ سند محصول) */}
      <div className="overflow-hidden rounded-2xl border border-[#1F2E45] bg-[#111D2E]/80 backdrop-blur-md shadow-xl shadow-black/20">
        <div className="p-5 border-b border-[#1F2E45] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-[#719BDF]" />
              کمپین‌های استفاده‌کننده از این مخاطب (Connected Campaigns)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              محاسبات عملکرد واقعی، نرخ تبدیل و شاخص‌های مالی متصل به این پرسونا (PRD ص ۱۴)
            </p>
          </div>
          <span className="text-xs font-medium text-slate-400 bg-[#18263A] border border-[#1F2E45] px-2.5 py-1 rounded-lg">
            تعداد: {connectedList.length} کمپین
          </span>
        </div>

        {connectedList.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <p className="text-xs">
              این مخاطب هنوز در هیچ کمپینی استفاده نشده است.
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              در مرحله ۲ ساخت کمپین جدید («مخاطبان هدف»)، می‌توانید این پرسونا را متصل فرمایید.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-[#1F2E45] bg-[#0B1423]/60 text-slate-400 font-medium">
                  <th className="py-3.5 px-4 font-semibold">نام کمپین</th>
                  <th className="py-3.5 px-4 font-semibold">کانال</th>
                  <th className="py-3.5 px-4 font-semibold">وضعیت</th>
                  <th className="py-3.5 px-4 text-left font-semibold">هزینه (Spend)</th>
                  <th className="py-3.5 px-4 text-center font-semibold">لیدها (Leads)</th>
                  <th className="py-3.5 px-4 text-left font-semibold">هزینه هر لید (CPL)</th>
                  <th className="py-3.5 px-4 text-center font-semibold">نرخ تبدیل</th>
                  <th className="py-3.5 px-4 text-center font-semibold">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2E45]/40 text-slate-300">
                {connectedList.map((c) => (
                  <tr key={c.id || c.campaignId} className="hover:bg-[#18263A]/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">
                      <Link
                        href={`/campaigns/${c.campaignId || c.id}`}
                        className="hover:text-[#719BDF] transition-colors inline-flex items-center gap-1.5"
                      >
                        {c.name}
                        <ExternalLink className="h-3 w-3 text-slate-500" />
                      </Link>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="bg-[#18263A] border border-[#1F2E45] text-slate-300 px-2.5 py-0.5 rounded-lg text-[11px] font-medium">
                        {c.channel || 'دیجیتال'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {c.status || 'فعال'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-left tabular-nums font-medium text-slate-200">
                      {(c.spend || 0).toLocaleString('fa-IR')} تومان
                    </td>

                    <td className="py-3.5 px-4 text-center tabular-nums font-bold text-white">
                      {(c.leadsCount || 0).toLocaleString('fa-IR')}
                    </td>

                    <td className="py-3.5 px-4 text-left tabular-nums font-semibold text-[#719BDF]">
                      {(c.cpl || 0).toLocaleString('fa-IR')} تومان
                    </td>

                    <td className="py-3.5 px-4 text-center tabular-nums font-bold text-emerald-400">
                      {c.conversionRate || 0}٪
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <Link
                        href={`/campaigns/${c.campaignId || c.id}`}
                        className="inline-flex items-center text-xs text-[#719BDF] hover:text-[#93B5F5] font-medium"
                      >
                        مشاهده کمپین
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* دراور ویرایش مخاطب */}
      <AudienceDrawer
        isOpen={isEditOpen}
        audience={audience}
        onClose={() => setIsEditOpen(false)}
        onSuccess={() => fetchAudience()}
      />

      {/* دیالوگ حذف مخاطب */}
      <AudienceDeleteDialog
        isOpen={isDeleteOpen}
        audience={audience}
        isDeleting={isDeleting}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
