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
    <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-7 shadow-sm space-y-6">
      {/* هدر مرحله */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <Link2 size={20} />
            <h3 className="text-base font-bold text-gray-900">
              صفحه فرود و ساخت پارامترهای UTM
            </h3>
          </div>
          <p className="text-xs text-gray-500">
            صفحه فرود هدف را برگزینید و پارامترهای رهگیری استاندارد (UTM) را برای هر پلتفرم شخصی‌سازی کنید.
          </p>
        </div>
        <span className="text-xs bg-gray-100 text-gray-600 font-medium px-2.5 py-1 rounded-full self-start sm:self-auto">
          مرحله ۵ از ۶
        </span>
      </div>

      {/* ۱. انتخاب لندینگ‌پیج از میان صفحات فرود متصل */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-gray-800">
            انتخاب صفحه فرود (از میان صفحات متصل آزمایشی / Mock Data):
          </label>
          <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
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
                    ? 'bg-blue-50/70 border-blue-400 ring-1 ring-blue-300 shadow-sm'
                    : 'bg-gray-50/50 hover:bg-gray-100/60 border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="text-xs font-bold text-gray-900">{landing.title}</h4>
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check size={11} />}
                  </div>
                </div>
                <span className="text-[10px] text-blue-600 bg-blue-100/60 px-2 py-0.5 rounded font-medium inline-block mb-1.5">
                  {landing.category}
                </span>
                <p
                  className="text-[11px] text-gray-500 font-mono truncate text-left"
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
      <div className="space-y-4 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-blue-600" />
          <h4 className="text-xs font-bold text-gray-800">
            پارامترهای رهگیری اختصاصی برای کانال‌های فعال ({activePlatforms.length} پلتفرم):
          </h4>
        </div>

        {activePlatforms.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-500 text-xs">
            در مرحله ۳ هیچ پلتفرمی فعال نشده است. لطفاً به مرحله قبل بازگردید و کانال‌های تبلیغاتی را مشخص کنید.
          </div>
        ) : (
          <div className="space-y-5">
            {(formData.trackingUtm.platformUtms || []).map((cfg) => (
              <div
                key={cfg.platformId}
                className="bg-gray-50/80 rounded-2xl border border-gray-200 p-4 sm:p-5 space-y-4"
              >
                <div className="flex items-center justify-between pb-2 border-b border-gray-200/70">
                  <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    {cfg.platformName}
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">
                    ID: {cfg.platformId}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                  {/* utm_source */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-600">
                      utm_source <span className="text-red-500">*</span>
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
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-left font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      dir="ltr"
                    />
                  </div>

                  {/* utm_medium */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-600">
                      utm_medium <span className="text-red-500">*</span>
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
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-left font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      dir="ltr"
                    />
                  </div>

                  {/* utm_campaign */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-600">
                      utm_campaign <span className="text-red-500">*</span>
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
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-left font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      dir="ltr"
                    />
                  </div>

                  {/* utm_term */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-gray-500">
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
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-left font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      dir="ltr"
                    />
                  </div>

                  {/* utm_content */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-gray-500">
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
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-left font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* پیش‌نمایش URL نهایی تولیدشده */}
                <div className="bg-white p-3 rounded-xl border border-gray-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-gray-400 block mb-0.5">
                      آدرس کامل رهگیری (Final Tracking URL):
                    </span>
                    <p
                      className="text-xs text-blue-800 font-mono truncate select-all text-left"
                      dir="ltr"
                    >
                      {cfg.finalUrl}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyUrl(cfg.finalUrl)}
                    className="flex items-center gap-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 shrink-0 self-end sm:self-auto transition-colors"
                    title="کپی لینک"
                  >
                    {copiedUrl === cfg.finalUrl ? (
                      <>
                        <Check size={14} className="text-emerald-600" />
                        <span className="text-emerald-700">کپی شد!</span>
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
