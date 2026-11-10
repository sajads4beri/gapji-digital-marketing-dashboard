'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { campaignService } from '@/features/campaigns/api';
import { ExtendedCampaign, CampaignStatusType } from '@/features/campaigns/types';
import { formatPersianDate } from '@/features/campaigns/utils/persian-date';
import { ConfirmModal } from '@/components/common/confirm-modal';
import { StatusBadge } from '@/components/common/status-badge';
import { EmptyState } from '@/components/common/empty-state';
import { useToast } from '@/components/common';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import {
  ArrowRight,
  Calendar,
  Layers,
  Users,
  Target,
  Link2,
  Edit3,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

export default function CampaignDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params?.id as string;
  const { toast } = useToast();

  const [campaign, setCampaign] = useState<ExtendedCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const fetchCampaign = useCallback(async () => {
    if (!campaignId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await campaignService.getById(campaignId);
      if (!data) {
        setCampaign(null);
      } else {
        setCampaign(data);
      }
    } catch (err: any) {
      console.error('Error fetching campaign details:', err);
      setError(err?.message || 'خطا در بارگذاری مشخصات کمپین.');
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    fetchCampaign();
  }, [fetchCampaign]);

  // حذف کمپین
  const handleDelete = async () => {
    if (!campaign) return;
    setIsDeleting(true);
    try {
      await campaignService.delete(campaign.id);
      toast.success('کمپین با موفقیت حذف شد.');
      router.push('/campaigns');
    } catch (err: any) {
      console.error('Error deleting campaign:', err);
      toast.error(err?.message || 'خطا در حذف کمپین.');
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  // تغییر وضعیت کمپین
  const handleStatusChange = async (newStatus: CampaignStatusType) => {
    if (!campaign) return;
    setIsUpdatingStatus(true);
    try {
      const updated = await campaignService.updateStatus(campaign.id, newStatus);
      setCampaign(updated);
      toast.success('وضعیت کمپین با موفقیت به‌روزرسانی شد.');
    } catch (err: any) {
      console.error('Error updating status:', err);
      toast.error(err?.message || 'خطا در تغییر وضعیت کمپین.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleCopy = (url: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      toast.success('پیوند لندینگ کپی شد.');
      setTimeout(() => setCopiedUrl(null), 2000);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-500">
        <Loader2 size={32} className="animate-spin text-blue-600" />
        <p className="text-sm font-medium">درحال بارگذاری اطلاعات کمپین...</p>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="py-12 flex items-center justify-center">
        <EmptyState
          icon={<AlertTriangle size={24} className="text-red-600" />}
          title="کمپین یافت نشد"
          description={
            error ||
            'کمپینی با این شناسه در سامانه وجود ندارد یا ممکن است قبلاً حذف شده باشد.'
          }
          action={{
            label: 'بازگشت به داشبورد',
            href: '/',
          }}
          className="bg-white border border-gray-200 rounded-2xl p-8 max-w-md w-full shadow-sm"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* نوار مسیر، عنوان و اکشن‌های کمپین */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/campaigns"
            className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-600 transition-colors shrink-0"
            title="بازگشت به لیست کمپین‌ها"
          >
            <ArrowRight size={18} />
          </Link>
          <div className="space-y-1">
            <Breadcrumb
              items={[
                { label: 'عملکرد' },
                { label: 'کمپین‌ها', href: '/campaigns' },
                { label: campaign.name },
              ]}
              showHomeIcon={false}
            />
            <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 flex items-center gap-2.5 flex-wrap">
              <span>{campaign.name}</span>
              <span className="text-xs bg-gray-100 text-gray-600 font-normal px-2.5 py-0.5 rounded-lg font-mono">
                ID: {campaign.id}
              </span>
              <StatusBadge status={campaign.status} />
            </h1>
          </div>
        </div>

        {/* اکشن‌ها: تغییر وضعیت، ویرایش، حذف */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* انتخابگر وضعیت */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5">
            <span className="text-[11px] text-gray-500 font-medium">وضعیت:</span>
            {isUpdatingStatus ? (
              <Loader2 size={14} className="animate-spin text-blue-600" />
            ) : (
              <select
                value={campaign.status}
                onChange={(e) =>
                  handleStatusChange(e.target.value as CampaignStatusType)
                }
                className="bg-transparent text-xs font-bold text-gray-800 cursor-pointer focus:outline-none"
              >
                <option value="active">فعال</option>
                <option value="paused">متوقف</option>
                <option value="completed">تکمیل شده</option>
                <option value="draft">پیش‌نویس</option>
                <option value="archived">بایگانی</option>
              </select>
            )}
          </div>

          {/* دکمه ویرایش */}
          <Link
            href={`/campaigns/${campaign.id}/edit`}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-colors"
          >
            <Edit3 size={15} />
            <span>ویرایش کمپین</span>
          </Link>

          {/* دکمه حذف */}
          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex items-center gap-1.5 bg-white hover:bg-red-50 text-red-600 border border-red-200 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors"
          >
            <Trash2 size={15} />
            <span>حذف</span>
          </button>
        </div>
      </div>

      {/* بدنه اصلی مشخصات کمپین */}
      <div className="space-y-6">
        {/* ۱. آمارهای کلیدی کمپین در نمای کلی */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-sm">
            <span className="text-[11px] text-gray-500 block mb-1">بودجه کل</span>
            <span className="text-base font-bold text-gray-900">
              {campaign.budget.toLocaleString('fa-IR')}
            </span>
            <span className="text-[10px] text-gray-400 block mt-0.5">تومان</span>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-sm">
            <span className="text-[11px] text-gray-500 block mb-1">هزینه‌شده</span>
            <span className="text-base font-bold text-gray-800">
              {campaign.spend.toLocaleString('fa-IR')}
            </span>
            <span className="text-[10px] text-gray-400 block mt-0.5">تومان</span>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-sm">
            <span className="text-[11px] text-gray-500 block mb-1">تعداد نمایش</span>
            <span className="text-base font-bold text-gray-800">
              {campaign.impressions.toLocaleString('fa-IR')}
            </span>
            <span className="text-[10px] text-gray-400 block mt-0.5">Impression</span>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-sm">
            <span className="text-[11px] text-gray-500 block mb-1">تعداد کلیک</span>
            <span className="text-base font-bold text-blue-700">
              {campaign.clicks.toLocaleString('fa-IR')}
            </span>
            <span className="text-[10px] text-gray-400 block mt-0.5">Clicks</span>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-sm">
            <span className="text-[11px] text-gray-500 block mb-1">تعداد تبدیل / لید</span>
            <span className="text-base font-bold text-emerald-700">
              {campaign.conversions.toLocaleString('fa-IR')}
            </span>
            <span className="text-[10px] text-gray-400 block mt-0.5">Conversions</span>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-sm">
            <span className="text-[11px] text-gray-500 block mb-1">میانگین CPL</span>
            <span className="text-base font-bold text-purple-700">
              {(campaign.cpl || 0).toLocaleString('fa-IR')}
            </span>
            <span className="text-[10px] text-gray-400 block mt-0.5">تومان به ازای لید</span>
          </div>
        </div>

        {/* ۲. کارت اطلاعات پایه و زمان‌بندی */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100 font-bold text-gray-900 text-sm">
            <Calendar size={18} className="text-blue-600" />
            <span>مشخصات پایه و زمان‌بندی اجرا</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-gray-500 block mb-1">هدف کلیدی:</span>
              <span className="font-semibold text-gray-800">
                {campaign.objective || 'جذب لید و سرنخ فروش'}
              </span>
            </div>

            <div>
              <span className="text-gray-500 block mb-1">کانال اصلی:</span>
              <span className="font-semibold text-gray-800">{campaign.channel}</span>
            </div>

            <div>
              <span className="text-gray-500 block mb-1">مدیر / مسئول کمپین:</span>
              <span className="font-semibold text-gray-800">
                {campaign.owner?.name || 'کاربر جاری'}
              </span>
            </div>

            <div>
              <span className="text-gray-500 block mb-1">بازه زمانی کمپین (شمسی):</span>
              <span className="font-semibold text-gray-800">
                {formatPersianDate(campaign.startDate)} تا {formatPersianDate(campaign.endDate)}
              </span>
            </div>

            {campaign.description && (
              <div className="col-span-1 sm:col-span-2 md:col-span-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="text-gray-500 block text-[11px] mb-0.5">یادداشت و توضیحات:</span>
                <p className="text-gray-800 leading-relaxed text-xs">{campaign.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* ۳. پلتفرم‌های تبلیغاتی و سهم بودجه */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 font-bold text-gray-900 text-sm">
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-blue-600" />
              <span>پلتفرم‌ها و کانال‌های تبلیغاتی</span>
            </div>
            <span className="text-xs text-gray-500">
              {(campaign.platforms || []).filter((p) => p.enabled).length} کانال فعال
            </span>
          </div>

          {(!campaign.platforms || campaign.platforms.length === 0) ? (
            <p className="text-xs text-gray-400 text-center py-6">
              پلتفرم مجزایی برای این کمپین ثبت نشده است.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {campaign.platforms
                .filter((p) => p.enabled)
                .map((p) => (
                  <div
                    key={p.platformId}
                    className="bg-gray-50/80 p-3.5 rounded-xl border border-gray-200 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between font-bold text-gray-900">
                      <span>{p.name}</span>
                      <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px]">
                        {p.percentage}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-gray-600">
                      <span>بودجه:</span>
                      <span className="font-semibold">
                        {p.allocatedBudget.toLocaleString('fa-IR')} ت
                      </span>
                    </div>
                    {p.count ? (
                      <div className="flex items-center justify-between text-gray-500 text-[11px]">
                        <span>تارگت / تعداد:</span>
                        <span>{p.count.toLocaleString('fa-IR')}</span>
                      </div>
                    ) : null}
                    {p.description && (
                      <p className="text-[10px] text-gray-500 truncate">{p.description}</p>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* ۴. مخاطبان هدف و شاخص‌های کلیدی (دو ستونه) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* مخاطبان هدف */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100 font-bold text-gray-900 text-sm">
              <Users size={18} className="text-blue-600" />
              <span>مخاطبان هدف کمپین</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">سگمنت‌های انتخاب‌شده:</span>
                <span className="font-bold text-gray-800">
                  {campaign.targetAudience?.selectedAudienceIds?.length || 1} دسته مخاطب
                </span>
              </div>

              {campaign.targetAudience?.estimatedReach && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">پوشش تخمینی کاربران:</span>
                  <span className="font-bold text-blue-700">
                    {campaign.targetAudience.estimatedReach.toLocaleString('fa-IR')} کاربر
                  </span>
                </div>
              )}

              {campaign.targetAudience?.locations && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">موقعیت‌های جغرافیایی:</span>
                  <span className="font-medium text-gray-800">
                    {campaign.targetAudience.locations.join('، ')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* شاخص‌های عملکرد (KPI) */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100 font-bold text-gray-900 text-sm">
              <Target size={18} className="text-blue-600" />
              <span>اهداف و شاخص‌های کلیدی عملکرد</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                <span className="text-gray-500 block text-[10px]">CPA هدف:</span>
                <span className="font-bold text-gray-800">
                  {(campaign.targetKpis?.targetCpa || 45_000).toLocaleString('fa-IR')} تومان
                </span>
              </div>

              <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                <span className="text-gray-500 block text-[10px]">کلیک مورد انتظار:</span>
                <span className="font-bold text-gray-800">
                  {(campaign.targetKpis?.targetClicks || 12_500).toLocaleString('fa-IR')} کلیک
                </span>
              </div>

              <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                <span className="text-gray-500 block text-[10px]">تارگت تبدیل:</span>
                <span className="font-bold text-gray-800">
                  {(campaign.targetKpis?.targetConversions || 450).toLocaleString('fa-IR')} تبدیل
                </span>
              </div>

              <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                <span className="text-gray-500 block text-[10px]">CTR هدف:</span>
                <span className="font-bold text-gray-800">
                  {campaign.targetKpis?.targetCtr || 3.8}٪
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ۵. صفحه فرود و پارامترهای UTM */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 font-bold text-gray-900 text-sm">
            <div className="flex items-center gap-2">
              <Link2 size={18} className="text-blue-600" />
              <span>صفحه فرود و لینک‌های رهگیری UTM</span>
            </div>
            <span className="text-xs text-gray-500">آماده برای انتشار در تبلیغات</span>
          </div>

          <div className="space-y-3">
            {campaign.trackingUtm?.landingUrl && (
              <div className="text-xs space-y-1">
                <span className="text-gray-500 block text-[11px]">آدرس لندینگ اصلی:</span>
                <p className="font-mono text-gray-800 text-xs bg-gray-50 p-2 rounded-lg border border-gray-200 text-left truncate" dir="ltr">
                  {campaign.trackingUtm.landingUrl}
                </p>
              </div>
            )}

            {/* لیست لینک‌های اختصاصی هر پلتفرم */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-semibold text-gray-700 block">
                آدرس‌های نهایی رهگیری بر اساس کانال:
              </span>
              {(campaign.trackingUtm?.platformUtms || []).map((cfg) => (
                <div
                  key={cfg.platformId}
                  className="bg-gray-50 p-3 rounded-xl border border-gray-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-gray-800 block text-[11px] mb-0.5">
                      {cfg.platformName}
                    </span>
                    <p className="font-mono text-blue-700 text-[11px] truncate text-left" dir="ltr">
                      {cfg.finalUrl}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(cfg.finalUrl)}
                    className="flex items-center gap-1.5 bg-white hover:bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 shrink-0 self-end sm:self-auto transition-colors"
                  >
                    {copiedUrl === cfg.finalUrl ? (
                      <>
                        <Check size={13} className="text-emerald-600" />
                        <span className="text-emerald-700">کپی شد!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        <span>کپی لینک</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* مدال تأیید حذف کمپین */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="حذف کمپین"
        message={`آیا از حذف کامل کمپین «${campaign.name}» اطمینان دارید؟ تمام سوابق و آمارهای مرتبط از حافظه پاک خواهند شد.`}
        confirmText="بله، حذف کن"
        cancelText="انصراف"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
}
