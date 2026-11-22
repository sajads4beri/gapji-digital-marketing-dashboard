'use client';

import React, { useState, useEffect } from 'react';
import {
  CampaignFormData,
  MockLandingPage,
  PlatformUtmConfig,
} from '../../../types';
import { buildUtmUrl } from '../../../utils/utm-builder';
import {
  Link2,
  Copy,
  Check,
  ExternalLink,
  HelpCircle,
  Layers,
  Sparkles,
} from 'lucide-react';

// لندینگ‌پیج‌های متصل تستی (Mock Landing Pages)
// نکته: شامل مواردی با کوئری‌استرینگ (?ref=...) و هش (#...) برای اعتبارسنجی عدم تخریب URL
const CONNECTED_MOCK_LANDINGS: MockLandingPage[] = [
  {
    id: 'land_autumn_sale',
    title: 'صفحه اصلی جشنواره پاییزه مارکتینگ',
    url: 'https://gapji.ir/landing/autumn-sale',
    category: 'کمپین تخفیف ویژه',
  },
  {
    id: 'land_demo_request',
    title: 'درخواست دمو آنلاین محصول سازمانی',
    url: 'https://gapji.ir/demo-request?ref=campaign',
    category: 'جذب سرنخ و لید B2B',
  },
  {
    id: 'land_app_download',
    title: 'صفحه اختصاصی دانلود اپلیکیشن موبایل',
    url: 'https://gapji.ir/app/download#features',
    category: 'نصب اپلیکیشن',
  },
  {
    id: 'land_pricing',
    title: 'صفحه تعرفه‌ها و بسته‌های اشتراک',
    url: 'https://gapji.ir/pricing',
    category: 'فروش مستقیم',
  },
];

interface Step5LandingUtmProps {
  formData: CampaignFormData;
  onUpdateFormData: (partial: Partial<CampaignFormData>) => void;
  errors?: Record<string, string>;
}

export function Step5LandingUtm({
  formData,
  onUpdateFormData,
  errors = {},
}: Step5LandingUtmProps) {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // لندینگ انتخاب‌شده فعلی یا پیش‌فرض
  const selectedLanding =
    CONNECTED_MOCK_LANDINGS.find(
      (l) => l.url === formData.trackingUtm.landingUrl,
    ) || CONNECTED_MOCK_LANDINGS[0];

  // پلتفرم‌های فعال کمپین (از مرحله ۳)
  const activePlatforms = (formData.platforms || []).filter((p) => p.enabled);

  // همگام‌سازی پارامترهای UTM برای هر پلتفرم فعال
  useEffect(() => {
    const defaultCampaignName = (formData.name || 'campaign')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_');

    const landingUrl = formData.trackingUtm.landingUrl || selectedLanding.url;

    const existingConfigs: PlatformUtmConfig[] =
      formData.trackingUtm.platformUtms || [];

    const updatedConfigs: PlatformUtmConfig[] = activePlatforms.map((p) => {
      const found = existingConfigs.find((c) => c.platformId === p.platformId);

      const source = found?.source || getDefaultSource(p.name);
      const medium = found?.medium || getDefaultMedium(p.name);
      const campaign = found?.campaign || defaultCampaignName;
      const term = found?.term || '';
      const content = found?.content || '';

      const finalUrl = buildUtmUrl(landingUrl, {
        source,
        medium,
        campaign,
        term,
        content,
      });

      return {
        platformId: p.platformId,
        platformName: p.name,
        source,
        medium,
        campaign,
        term,
        content,
        finalUrl,
      };
    });

    // بررسی آیا تغییری ایجاد شده است
    const isDifferent =
      JSON.stringify(updatedConfigs) !== JSON.stringify(existingConfigs);

    if (isDifferent) {
      onUpdateFormData({
        trackingUtm: {
          ...formData.trackingUtm,
          landingUrl,
          platformUtms: updatedConfigs,
        },
      });
    }
  }, [
    activePlatforms,
    formData.name,
    formData.trackingUtm.landingUrl,
    selectedLanding.url,
  ]);

  // تغییر لندینگ پیج اصلی
  const handleSelectLanding = (landing: MockLandingPage) => {
    const updatedPlatformUtms = (formData.trackingUtm.platformUtms || []).map(
      (cfg) => ({
        ...cfg,
        finalUrl: buildUtmUrl(landing.url, {
          source: cfg.source,
          medium: cfg.medium,
          campaign: cfg.campaign,
          term: cfg.term,
          content: cfg.content,
        }),
      }),
    );

    const generatedUrl = buildUtmUrl(landing.url, {
      source: formData.trackingUtm.utmSource,
      medium: formData.trackingUtm.utmMedium,
      campaign: formData.trackingUtm.utmCampaign,
      term: formData.trackingUtm.utmTerm,
      content: formData.trackingUtm.utmContent,
    });

    onUpdateFormData({
      trackingUtm: {
        ...formData.trackingUtm,
        selectedLandingId: landing.id,
        landingUrl: landing.url,
        generatedUrl,
        platformUtms: updatedPlatformUtms,
      },
    });
  };

  // تغییر پارامترهای UTM یک پلتفرم خاص
  const handleUpdatePlatformUtm = (
    platformId: string,
    field: keyof PlatformUtmConfig,
    value: string,
  ) => {
    const list = formData.trackingUtm.platformUtms || [];
    const updated = list.map((item) => {
      if (item.platformId !== platformId) return item;

      const updatedItem = { ...item, [field]: value };
      updatedItem.finalUrl = buildUtmUrl(formData.trackingUtm.landingUrl, {
        source: updatedItem.source,
        medium: updatedItem.medium,
        campaign: updatedItem.campaign,
        term: updatedItem.term,
        content: updatedItem.content,
      });
      return updatedItem;
    });

    onUpdateFormData({
      trackingUtm: {
        ...formData.trackingUtm,
        platformUtms: updated,
      },
    });
  };

  // کپی لینک در حافظه
  const handleCopyUrl = (url: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    }
  };

  return (
    <div className="bg-[#111D2E]/80 backdrop-blur-md rounded-2xl border border-[#1F2E45] p-6 sm:p-7 shadow-xl space-y-6">
      {/* هدر مرحله */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1F2E45]">
        <div>
          <div className="flex items-center gap-2 text-[#719BDF] mb-1">
            <Link2 size={20} />
            <h3 className="text-base font-bold text-slate-100 font-display">
              صفحه فرود و ساخت پارامترهای UTM
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            صفحه فرود هدف را برگزینید و پارامترهای رهگیری استاندارد (UTM) را برای هر پلتفرم شخصی‌سازی کنید.
          </p>
        </div>
        <span className="text-xs bg-[#18263A] text-slate-300 border border-[#1F2E45] font-medium px-2.5 py-1 rounded-full self-start sm:self-auto">
          مرحله ۵ از ۶
        </span>
      </div>

      {/* ۱. انتخاب لندینگ‌پیج از میان صفحات فرود متصل */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-300">
            انتخاب صفحه فرود (از میان صفحات متصل آزمایشی / Mock Data):
          </label>
          <span className="text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30">
            داده‌های آزمایشی Frontend
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CONNECTED_MOCK_LANDINGS.map((landing) => {
            const isSelected =
              formData.trackingUtm.landingUrl === landing.url ||
              formData.trackingUtm.selectedLandingId === landing.id;

            return (
              <div
                key={landing.id}
                onClick={() => handleSelectLanding(landing)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#18263A] border-[#719BDF] shadow-lg shadow-[#719BDF]/5 ring-1 ring-[#719BDF]/30'
                    : 'bg-[#111D2E]/60 hover:bg-[#18263A]/50 border-[#1F2E45]'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="text-xs font-bold text-slate-100 font-display">{landing.title}</h4>
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border ${
                      isSelected
                        ? 'bg-gradient-to-r from-blue-600 to-[#719BDF] border-transparent text-white'
                        : 'border-[#1F2E45] bg-[#0B1423]'
                    }`}
                  >
                    {isSelected && <Check size={11} />}
                  </div>
                </div>
                <span className="text-[10px] text-[#719BDF] bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded font-medium inline-block mb-1.5">
                  {landing.category}
                </span>
                <p
                  className="text-[11px] text-slate-400 font-mono truncate text-left"
                  dir="ltr"
                >
                  {landing.url}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ۲. ساخت پارامترهای UTM برای هر پلتفرم فعال */}
      <div className="space-y-4 pt-3 border-t border-[#1F2E45]">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-[#719BDF]" />
          <h4 className="text-xs font-semibold text-slate-200">
            پارامترهای رهگیری اختصاصی برای کانال‌های فعال ({activePlatforms.length} پلتفرم):
          </h4>
        </div>

        {activePlatforms.length === 0 ? (
          <div className="text-center py-8 bg-[#0B1423]/40 rounded-xl border border-dashed border-[#1F2E45] text-slate-400 text-xs">
            در مرحله ۳ هیچ پلتفرمی فعال نشده است. لطفاً به مرحله قبل بازگردید و کانال‌های تبلیغاتی را مشخص کنید.
          </div>
        ) : (
          <div className="space-y-5">
            {(formData.trackingUtm.platformUtms || []).map((cfg) => (
              <div
                key={cfg.platformId}
                className="bg-[#0B1423]/60 rounded-2xl border border-[#1F2E45] p-4 sm:p-5 space-y-4"
              >
                <div className="flex items-center justify-between pb-2 border-b border-[#1F2E45]">
                  <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#719BDF]" />
                    {cfg.platformName}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    ID: {cfg.platformId}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                  {/* utm_source */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400">
                      utm_source <span className="text-[#D66B73]">*</span>
                    </label>
                    <input
                      type="text"
                      value={cfg.source}
                      onChange={(e) =>
                        handleUpdatePlatformUtm(
                          cfg.platformId,
                          'source',
                          e.target.value,
                        )
                      }
                      className="w-full bg-[#111D2E] border border-[#1F2E45] rounded-lg px-2.5 py-1.5 text-xs text-left font-mono text-slate-100 focus:border-[#719BDF] focus:outline-none"
                      dir="ltr"
                    />
                  </div>

                  {/* utm_medium */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400">
                      utm_medium <span className="text-[#D66B73]">*</span>
                    </label>
                    <input
                      type="text"
                      value={cfg.medium}
                      onChange={(e) =>
                        handleUpdatePlatformUtm(
                          cfg.platformId,
                          'medium',
                          e.target.value,
                        )
                      }
                      className="w-full bg-[#111D2E] border border-[#1F2E45] rounded-lg px-2.5 py-1.5 text-xs text-left font-mono text-slate-100 focus:border-[#719BDF] focus:outline-none"
                      dir="ltr"
                    />
                  </div>

                  {/* utm_campaign */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400">
                      utm_campaign <span className="text-[#D66B73]">*</span>
                    </label>
                    <input
                      type="text"
                      value={cfg.campaign}
                      onChange={(e) =>
                        handleUpdatePlatformUtm(
                          cfg.platformId,
                          'campaign',
                          e.target.value,
                        )
                      }
                      className="w-full bg-[#111D2E] border border-[#1F2E45] rounded-lg px-2.5 py-1.5 text-xs text-left font-mono text-slate-100 focus:border-[#719BDF] focus:outline-none"
                      dir="ltr"
                    />
                  </div>

                  {/* utm_term */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400">
                      utm_term (اختیاری)
                    </label>
                    <input
                      type="text"
                      value={cfg.term || ''}
                      onChange={(e) =>
                        handleUpdatePlatformUtm(
                          cfg.platformId,
                          'term',
                          e.target.value,
                        )
                      }
                      placeholder="کلمه کلیدی..."
                      className="w-full bg-[#111D2E] border border-[#1F2E45] rounded-lg px-2.5 py-1.5 text-xs text-left font-mono text-slate-100 placeholder:text-slate-500 focus:border-[#719BDF] focus:outline-none"
                      dir="ltr"
                    />
                  </div>

                  {/* utm_content */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400">
                      utm_content (اختیاری)
                    </label>
                    <input
                      type="text"
                      value={cfg.content || ''}
                      onChange={(e) =>
                        handleUpdatePlatformUtm(
                          cfg.platformId,
                          'content',
                          e.target.value,
                        )
                      }
                      placeholder="شناسه بنر یا پست..."
                      className="w-full bg-[#111D2E] border border-[#1F2E45] rounded-lg px-2.5 py-1.5 text-xs text-left font-mono text-slate-100 placeholder:text-slate-500 focus:border-[#719BDF] focus:outline-none"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* پیش‌نمایش URL نهایی تولیدشده */}
                <div className="bg-[#111D2E] p-3 rounded-xl border border-[#1F2E45] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-slate-400 block mb-0.5">
                      آدرس کامل رهگیری (Final Tracking URL):
                    </span>
                    <p
                      className="text-xs text-[#719BDF] font-mono truncate select-all text-left"
                      dir="ltr"
                    >
                      {cfg.finalUrl}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyUrl(cfg.finalUrl)}
                    className="flex items-center gap-1.5 bg-[#18263A] hover:bg-[#1F2E45] text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#1F2E45] shrink-0 self-end sm:self-auto transition-colors"
                    title="کپی لینک"
                  >
                    {copiedUrl === cfg.finalUrl ? (
                      <>
                        <Check size={14} className="text-emerald-400" />
                        <span className="text-emerald-400">کپی شد!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>کپی لینک</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getDefaultSource(platformName: string): string {
  const p = platformName.toLowerCase();
  if (p.includes('گوگل') || p.includes('google')) return 'google';
  if (p.includes('اینستاگرام') || p.includes('instagram')) return 'instagram';
  if (p.includes('یکتانت') || p.includes('yektanet')) return 'yektanet';
  if (p.includes('تلگرام') || p.includes('telegram')) return 'telegram';
  if (p.includes('دیوار') || p.includes('divar')) return 'divar';
  if (p.includes('پیامک') || p.includes('sms')) return 'sms';
  if (p.includes('ایمیل') || p.includes('email')) return 'email';
  return 'campaign';
}

function getDefaultMedium(platformName: string): string {
  const p = platformName.toLowerCase();
  if (p.includes('گوگل') || p.includes('google')) return 'cpc';
  if (p.includes('اینستاگرام') || p.includes('instagram')) return 'social_paid';
  if (p.includes('یکتانت') || p.includes('yektanet')) return 'native_cpc';
  if (p.includes('تلگرام') || p.includes('telegram')) return 'channel_post';
  if (p.includes('پیامک') || p.includes('sms')) return 'sms_marketing';
  if (p.includes('ایمیل') || p.includes('email')) return 'email_newsletter';
  return 'cpc';
}
