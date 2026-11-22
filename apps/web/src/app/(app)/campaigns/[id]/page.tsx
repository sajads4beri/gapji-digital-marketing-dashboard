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
import { CampaignSalesFunnel } from '@/features/campaigns/components';
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
  TrendingUp,
  DollarSign,
  Activity,
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
      toast.success('لینک رهگیری در حافظه کپی شد.');
      setTimeout(() => setCopiedUrl(null), 2500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[450px] flex flex-col items-center justify-center gap-3" dir="rtl">
        <Loader2 className="w-8 h-8 animate-spin text-[#719BDF]" />
        <span className="text-xs text-slate-400 font-medium">در حال واکشی اطلاعات کمپین...</span>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-4" dir="rtl">
        <EmptyState
          icon={<AlertTriangle size={26} className="text-[#D66B73]" />}
          title="کمپین یافت نشد"
          description={
            error ||
            'کمپینی با این شناسه در سامانه وجود ندارد یا ممکن است قبلاً حذف شده باشد.'
          }
          action={{
            label: 'بازگشت به فهرست کمپین‌ها',
            href: '/campaigns',
          }}
          className="bg-[#111D2E]/80 border border-[#1F2E45] rounded-3xl p-8 max-w-md w-full shadow-2xl"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16" dir="rtl">
      {/* نوار مسیر، عنوان و اکشن‌های کمپین به سبک Midnight Executive */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#0B1423] via-[#111D2E] to-[#0B1423] border border-[#1F2E45] p-5 sm:p-6 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-5 overflow-hidden">
        <div className="flex items-center gap-4">
          <Link
            href="/campaigns"
            className="flex items-center justify-center w-10 h-10 rounded-xl border border-[#1F2E45] bg-[#18263A] hover:bg-[#20314A] text-slate-300 transition-colors shrink-0"
            title="بازگشت به لیست کمپین‌ها"
          >
            <ArrowRight size={18} />
          </Link>
          <div className="space-y-1.5">
            <Breadcrumb
              items={[
                { label: 'عملکرد' },
                { label: 'کمپین‌ها', href: '/campaigns' },
                { label: campaign.name },
              ]}
              showHomeIcon={false}
            />
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-lg sm:text-2xl font-black text-slate-100 font-display tracking-tight">
                {campaign.name}
              </h1>
              <span className="text-[11px] bg-[#18263A] text-slate-400 font-mono px-2.5 py-0.5 rounded-lg border border-[#1F2E45]">
                {campaign.id.slice(0, 8)}...
              </span>
              <StatusBadge status={campaign.status} />
            </div>
          </div>
        </div>

        {/* اکشن‌ها: تغییر وضعیت، ویرایش، حذف */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* انتخابگر وضعیت */}
          <div className="flex items-center gap-2 bg-[#18263A] border border-[#1F2E45] rounded-xl px-3 py-1.5">
            <span className="text-[11px] text-slate-400 font-medium">وضعیت:</span>
            {isUpdatingStatus ? (
              <Loader2 size={14} className="animate-spin text-[#719BDF]" />
            ) : (
              <select
                value={campaign.status}
                onChange={(e) =>
                  handleStatusChange(e.target.value as CampaignStatusType)
                }
                className="bg-transparent text-xs font-bold text-slate-200 cursor-pointer focus:outline-none"
              >
                <option value="active" className="bg-[#111D2E] text-slate-100">فعال</option>
                <option value="paused" className="bg-[#111D2E] text-slate-100">متوقف</option>
                <option value="completed" className="bg-[#111D2E] text-slate-100">تکمیل شده</option>
                <option value="draft" className="bg-[#111D2E] text-slate-100">پیش‌نویس</option>
                <option value="archived" className="bg-[#111D2E] text-slate-100">بایگانی</option>
              </select>
            )}
          </div>

          {/* دکمه ویرایش */}
          <Link
            href={`/campaigns/${campaign.id}/edit`}
            className="inline-flex items-center gap-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <Edit3 size={15} />
            <span>ویرایش کمپین</span>
          </Link>

          {/* دکمه حذف */}
          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="inline-flex items-center gap-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs"
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
          <div className="bg-[#111D2E]/80 backdrop-blur-md rounded-2xl border border-[#1F2E45] p-4 shadow-xl hover:border-[#719BDF]/40 transition-colors">
            <span className="text-[11px] text-slate-400 block mb-1">بودجه کل مصوب</span>
            <span className="text-base sm:text-lg font-black text-slate-100 font-display tabular-nums">
              {campaign.budget.toLocaleString('fa-IR')}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">تومان</span>
          </div>

          <div className="bg-[#111D2E]/80 backdrop-blur-md rounded-2xl border border-[#1F2E45] p-4 shadow-xl hover:border-[#719BDF]/40 transition-colors">
            <span className="text-[11px] text-slate-400 block mb-1">هزینه‌شده قطعی</span>
            <span className="text-base sm:text-lg font-black text-slate-200 font-display tabular-nums">
              {campaign.spend.toLocaleString('fa-IR')}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">تومان</span>
          </div>

          <div className="bg-[#111D2E]/80 backdrop-blur-md rounded-2xl border border-[#1F2E45] p-4 shadow-xl hover:border-[#719BDF]/40 transition-colors">
            <span className="text-[11px] text-slate-400 block mb-1">تعداد نمایش</span>
            <span className="text-base sm:text-lg font-black text-slate-200 font-display tabular-nums">
              {campaign.impressions.toLocaleString('fa-IR')}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Impression</span>
          </div>

          <div className="bg-[#111D2E]/80 backdrop-blur-md rounded-2xl border border-[#1F2E45] p-4 shadow-xl hover:border-[#719BDF]/40 transition-colors">
            <span className="text-[11px] text-slate-400 block mb-1">تعداد کلیک</span>
            <span className="text-base sm:text-lg font-black text-[#719BDF] font-display tabular-nums">
              {campaign.clicks.toLocaleString('fa-IR')}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Clicks</span>
          </div>

          <div className="bg-[#111D2E]/80 backdrop-blur-md rounded-2xl border border-[#1F2E45] p-4 shadow-xl hover:border-[#719BDF]/40 transition-colors">
            <span className="text-[11px] text-slate-400 block mb-1">تعداد تبدیل / سرنخ</span>
            <span className="text-base sm:text-lg font-black text-emerald-400 font-display tabular-nums">
              {campaign.conversions.toLocaleString('fa-IR')}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Conversions</span>
          </div>

          <div className="bg-[#111D2E]/80 backdrop-blur-md rounded-2xl border border-[#1F2E45] p-4 shadow-xl hover:border-[#719BDF]/40 transition-colors">
            <span className="text-[11px] text-slate-400 block mb-1">میانگین CPL</span>
            <span className="text-base sm:text-lg font-black text-purple-400 font-display tabular-nums">
              {(campaign.cpl || 0).toLocaleString('fa-IR')}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">تومان به ازای لید</span>
          </div>
        </div>

        {/* ۲. قیف فروش و پایپ‌لاین سرنخ‌های ورودی این کمپین */}
        <CampaignSalesFunnel
          campaignId={campaign.id}
          campaignName={campaign.name}
        />

        {/* ۳. کارت اطلاعات پایه و زمان‌بندی */}
        <div className="bg-[#111D2E]/80 backdrop-blur-md rounded-3xl border border-[#1F2E45] p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#1F2E45] font-bold text-slate-100 text-sm font-display">
            <Calendar size={18} className="text-[#719BDF]" />
            <span>مشخصات پایه و زمان‌بندی اجرا</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-[#18263A]/40 p-3 rounded-xl border border-[#1F2E45]/80">
              <span className="text-slate-400 block mb-1">هدف کلیدی:</span>
              <span className="font-bold text-slate-100 font-display">
                {campaign.objective || 'جذب لید و سرنخ فروش'}
              </span>
            </div>

            <div className="bg-[#18263A]/40 p-3 rounded-xl border border-[#1F2E45]/80">
              <span className="text-slate-400 block mb-1">کانال اصلی:</span>
              <span className="font-bold text-slate-100 font-display">{campaign.channel}</span>
            </div>

            <div className="bg-[#18263A]/40 p-3 rounded-xl border border-[#1F2E45]/80">
              <span className="text-slate-400 block mb-1">مدیر / مسئول کمپین:</span>
              <span className="font-bold text-slate-100 font-display">
                {campaign.owner?.name || 'کاربر جاری'}
              </span>
            </div>

            <div className="bg-[#18263A]/40 p-3 rounded-xl border border-[#1F2E45]/80">
              <span className="text-slate-400 block mb-1">بازه زمانی کمپین (شمسی):</span>
              <span className="font-bold text-slate-100 font-display">
                {formatPersianDate(campaign.startDate)} تا {formatPersianDate(campaign.endDate)}
              </span>
            </div>

            {campaign.description && (
              <div className="col-span-1 sm:col-span-2 md:col-span-4 bg-[#18263A]/40 p-4 rounded-xl border border-[#1F2E45]">
                <span className="text-slate-400 block text-[11px] mb-1 font-semibold">یادداشت و توضیحات استراتژیک:</span>
                <p className="text-slate-200 leading-relaxed text-xs">{campaign.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* ۳. پلتفرم‌های تبلیغاتی و سهم بودجه */}
        <div className="bg-[#111D2E]/80 backdrop-blur-md rounded-3xl border border-[#1F2E45] p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1F2E45] font-bold text-slate-100 text-sm font-display">
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-[#719BDF]" />
              <span>پلتفرم‌ها و کانال‌های تبلیغاتی تخصیص‌یافته</span>
            </div>
            <span className="text-xs text-[#719BDF] font-semibold">
              {(campaign.platforms || []).filter((p) => p.enabled).length} کانال فعال
            </span>
          </div>

          {(!campaign.platforms || campaign.platforms.length === 0) ? (
            <p className="text-xs text-slate-500 text-center py-6">
              پلتفرم مجزایی برای این کمپین ثبت نشده است.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {campaign.platforms
                .filter((p) => p.enabled)
                .map((p) => (
                  <div
                    key={p.platformId}
                    className="bg-[#18263A]/60 p-4 rounded-xl border border-[#1F2E45] text-xs space-y-2 hover:border-[#719BDF]/30 transition-colors"
                  >
                    <div className="flex items-center justify-between font-bold text-slate-100">
                      <span>{p.name}</span>
                      <span className="text-[#719BDF] bg-[#719BDF]/15 px-2 py-0.5 rounded text-[11px] font-mono">
                        {p.percentage}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>بودجه مصوب:</span>
                      <span className="font-bold text-slate-200 font-display">
                        {p.allocatedBudget.toLocaleString('fa-IR')} ت
                      </span>
                    </div>
                    {p.count ? (
                      <div className="flex items-center justify-between text-slate-400 text-[11px]">
                        <span>تارگت ورودی:</span>
                        <span className="font-bold text-slate-200 font-display">{p.count.toLocaleString('fa-IR')}</span>
                      </div>
                    ) : null}
                    {p.description && (
                      <p className="text-[10px] text-slate-500 truncate mt-1">{p.description}</p>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* ۴. مخاطبان هدف و شاخص‌های کلیدی (دو ستونه) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* مخاطبان هدف */}
          <div className="bg-[#111D2E]/80 backdrop-blur-md rounded-3xl border border-[#1F2E45] p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#1F2E45] font-bold text-slate-100 text-sm font-display">
              <Users size={18} className="text-[#719BDF]" />
              <span>مخاطبان هدف و پرسونا</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between bg-[#18263A]/40 p-3 rounded-xl border border-[#1F2E45]/80">
                <span className="text-slate-400">سگمنت‌های انتخاب‌شده:</span>
                <span className="font-bold text-slate-100">
                  {campaign.targetAudience?.selectedAudienceIds?.length || 1} سگمنت فعال
                </span>
              </div>

              {campaign.targetAudience?.estimatedReach && (
                <div className="flex items-center justify-between bg-[#18263A]/40 p-3 rounded-xl border border-[#1F2E45]/80">
                  <span className="text-slate-400">پوشش تخمینی کاربران:</span>
                  <span className="font-bold text-[#719BDF] font-display">
                    {campaign.targetAudience.estimatedReach.toLocaleString('fa-IR')} کاربر
                  </span>
                </div>
              )}

              {campaign.targetAudience?.locations && (
                <div className="flex items-center justify-between bg-[#18263A]/40 p-3 rounded-xl border border-[#1F2E45]/80">
                  <span className="text-slate-400">موقعیت‌های جغرافیایی:</span>
                  <span className="font-semibold text-slate-200">
                    {campaign.targetAudience.locations.join('، ')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* شاخص‌های عملکرد (KPI) */}
          <div className="bg-[#111D2E]/80 backdrop-blur-md rounded-3xl border border-[#1F2E45] p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#1F2E45] font-bold text-slate-100 text-sm font-display">
              <Target size={18} className="text-[#719BDF]" />
              <span>اهداف و شاخص‌های کلیدی عملکرد</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-[#18263A]/40 p-3 rounded-xl border border-[#1F2E45]/80">
                <span className="text-slate-400 block text-[10px] mb-1">CPA هدف:</span>
                <span className="font-black text-slate-100 font-display">
                  {(campaign.targetKpis?.targetCpa || 45_000).toLocaleString('fa-IR')} تومان
                </span>
              </div>

              <div className="bg-[#18263A]/40 p-3 rounded-xl border border-[#1F2E45]/80">
                <span className="text-slate-400 block text-[10px] mb-1">کلیک مورد انتظار:</span>
                <span className="font-black text-slate-100 font-display">
                  {(campaign.targetKpis?.targetClicks || 12_500).toLocaleString('fa-IR')} کلیک
                </span>
              </div>

              <div className="bg-[#18263A]/40 p-3 rounded-xl border border-[#1F2E45]/80">
                <span className="text-slate-400 block text-[10px] mb-1">تارگت تبدیل:</span>
                <span className="font-black text-slate-100 font-display">
                  {(campaign.targetKpis?.targetConversions || 450).toLocaleString('fa-IR')} تبدیل
                </span>
              </div>

              <div className="bg-[#18263A]/40 p-3 rounded-xl border border-[#1F2E45]/80">
                <span className="text-slate-400 block text-[10px] mb-1">CTR هدف:</span>
                <span className="font-black text-slate-100 font-display">
                  {campaign.targetKpis?.targetCtr || 3.8}٪
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ۵. صفحه فرود و پارامترهای UTM */}
        <div className="bg-[#111D2E]/80 backdrop-blur-md rounded-3xl border border-[#1F2E45] p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1F2E45] font-bold text-slate-100 text-sm font-display">
            <div className="flex items-center gap-2">
              <Link2 size={18} className="text-[#719BDF]" />
              <span>صفحه فرود و لینک‌های رهگیری UTM</span>
            </div>
            <span className="text-xs text-slate-400">آماده برای انتشار در تبلیغات</span>
          </div>

          <div className="space-y-3">
            {campaign.trackingUtm?.landingUrl && (
              <div className="text-xs space-y-1">
                <span className="text-slate-400 block text-[11px]">آدرس لندینگ اصلی:</span>
                <p className="font-mono text-[#719BDF] text-xs bg-[#0B1423] p-2.5 rounded-xl border border-[#1F2E45] text-left truncate" dir="ltr">
                  {campaign.trackingUtm.landingUrl}
                </p>
              </div>
            )}

            {/* لیست لینک‌های اختصاصی هر پلتفرم */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-semibold text-slate-300 block">
                آدرس‌های نهایی رهگیری بر اساس کانال:
              </span>
              {(campaign.trackingUtm?.platformUtms || []).map((cfg) => (
                <div
                  key={cfg.platformId}
                  className="bg-[#18263A]/40 p-3.5 rounded-xl border border-[#1F2E45] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-slate-200 block text-[11px] mb-0.5 font-display">
                      {cfg.platformName}
                    </span>
                    <p className="font-mono text-[#719BDF] text-[11px] truncate text-left" dir="ltr">
                      {cfg.finalUrl}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(cfg.finalUrl)}
                    className="inline-flex items-center gap-1.5 bg-[#18263A] hover:bg-[#20314A] text-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold border border-[#1F2E45] shrink-0 self-end sm:self-auto transition-colors"
                  >
                    {copiedUrl === cfg.finalUrl ? (
                      <>
                        <Check size={13} className="text-emerald-400" />
                        <span className="text-emerald-400 font-bold">کپی شد!</span>
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
