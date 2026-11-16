'use client';

import * as React from 'react';
import {
  Link2,
  Copy,
  Check,
  Sparkles,
  RotateCcw,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/common/toast-provider';
import {
  LandingPageItem,
  CampaignOption,
  PlatformOption,
  MediumOption,
  UtmLinkItem,
} from '../types';
import { landingApi } from '../landing.api';

interface UtmBuilderFormProps {
  landingPages: LandingPageItem[];
  campaigns: CampaignOption[];
  platforms: PlatformOption[];
  commonMediums: MediumOption[];
  onLinkCreated: (link: UtmLinkItem) => void;
  selectedLandingForUtm?: LandingPageItem | null;
}

export function UtmBuilderForm({
  landingPages,
  campaigns,
  platforms,
  commonMediums,
  onLinkCreated,
  selectedLandingForUtm,
}: UtmBuilderFormProps) {
  const { toast } = useToast();

  // Form states
  const [selectedLandingId, setSelectedLandingId] = React.useState<string>('');
  const [customDestinationUrl, setCustomDestinationUrl] = React.useState<string>('https://');
  const [isCustomUrlMode, setIsCustomUrlMode] = React.useState(false);

  const [platformId, setPlatformId] = React.useState<string>('');
  const [utmSource, setUtmSource] = React.useState<string>('google_ads');

  const [utmMedium, setUtmMedium] = React.useState<string>('cpc');

  const [campaignId, setCampaignId] = React.useState<string>('');
  const [utmCampaign, setUtmCampaign] = React.useState<string>('');

  const [utmTerm, setUtmTerm] = React.useState<string>('');
  const [utmContent, setUtmContent] = React.useState<string>('');

  const [copied, setCopied] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // When a landing page is selected from table
  React.useEffect(() => {
    if (selectedLandingForUtm) {
      setSelectedLandingId(selectedLandingForUtm.id);
      setIsCustomUrlMode(false);
    }
  }, [selectedLandingForUtm]);

  // Default selection if available
  React.useEffect(() => {
    if (!selectedLandingId && landingPages.length > 0) {
      setSelectedLandingId(landingPages[0].id);
    }
    if (!utmCampaign && campaigns.length > 0) {
      const firstCamp = campaigns[0];
      setCampaignId(firstCamp.id);
      setUtmCampaign(firstCamp.name.trim().toLowerCase().replace(/\s+/g, '_'));
    }
  }, [landingPages, campaigns]);

  // Resolved destination URL
  const resolvedDestinationUrl = React.useMemo(() => {
    if (isCustomUrlMode) {
      return customDestinationUrl.trim();
    }
    const found = landingPages.find((l) => l.id === selectedLandingId);
    return found ? found.url : customDestinationUrl.trim();
  }, [isCustomUrlMode, customDestinationUrl, selectedLandingId, landingPages]);

  // Live URL Generator (Client-side pure constructor with instant feedback)
  const { generatedUrl, urlError } = React.useMemo(() => {
    if (!resolvedDestinationUrl) {
      return { generatedUrl: '', urlError: null };
    }

    try {
      const parsed = new URL(resolvedDestinationUrl);
      if (parsed.protocol !== 'https:') {
        return {
          generatedUrl: '',
          urlError: 'آدرس مقصد باید الزاماً با پروتکل امن https شروع شود.',
        };
      }

      // Hash separation
      let urlWithoutHash = resolvedDestinationUrl;
      let hashPart = '';
      const hashIndex = resolvedDestinationUrl.indexOf('#');
      if (hashIndex !== -1) {
        urlWithoutHash = resolvedDestinationUrl.substring(0, hashIndex);
        hashPart = resolvedDestinationUrl.substring(hashIndex);
      }

      const urlObj = new URL(urlWithoutHash);

      if (utmSource.trim()) urlObj.searchParams.set('utm_source', utmSource.trim());
      if (utmMedium.trim()) urlObj.searchParams.set('utm_medium', utmMedium.trim());
      if (utmCampaign.trim()) urlObj.searchParams.set('utm_campaign', utmCampaign.trim());
      if (utmTerm.trim()) urlObj.searchParams.set('utm_term', utmTerm.trim());
      if (utmContent.trim()) urlObj.searchParams.set('utm_content', utmContent.trim());

      return {
        generatedUrl: urlObj.toString() + hashPart,
        urlError: null,
      };
    } catch {
      return {
        generatedUrl: '',
        urlError: 'آدرس وارد شده معتبر نیست.',
      };
    }
  }, [resolvedDestinationUrl, utmSource, utmMedium, utmCampaign, utmTerm, utmContent]);

  // Handle platform change
  const handlePlatformChange = (codeOrId: string) => {
    const found = platforms.find((p) => p.code === codeOrId || p.id === codeOrId);
    if (found) {
      setPlatformId(found.id || '');
      setUtmSource(found.code);
    } else {
      setPlatformId('');
      setUtmSource(codeOrId);
    }
  };

  // Handle campaign change
  const handleCampaignChange = (cId: string) => {
    setCampaignId(cId);
    const found = campaigns.find((c) => c.id === cId);
    if (found) {
      const slug = found.name.trim().toLowerCase().replace(/\s+/g, '_');
      setUtmCampaign(slug);
    }
  };

  // Copy handler
  const handleCopy = async () => {
    if (!generatedUrl || urlError) return;
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      toast.success('آدرس کامل UTM در حافظه کپی شد', {
        title: 'کپی شد',
      });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('خطا در کپی کردن آدرس', {
        title: 'خطا',
      });
    }
  };

  // Reset form
  const handleReset = () => {
    if (landingPages.length > 0) {
      setSelectedLandingId(landingPages[0].id);
      setIsCustomUrlMode(false);
    } else {
      setCustomDestinationUrl('https://');
      setIsCustomUrlMode(true);
    }
    setPlatformId('');
    setUtmSource('google_ads');
    setUtmMedium('cpc');
    if (campaigns.length > 0) {
      setCampaignId(campaigns[0].id);
      setUtmCampaign(campaigns[0].name.trim().toLowerCase().replace(/\s+/g, '_'));
    } else {
      setCampaignId('');
      setUtmCampaign('');
    }
    setUtmTerm('');
    setUtmContent('');
    setErrors({});
  };

  // Validate before submit
  const validate = () => {
    const errs: Record<string, string> = {};

    if (!resolvedDestinationUrl) {
      errs.destinationUrl = 'آدرس مقصد صفحه الزامی است.';
    } else {
      try {
        const u = new URL(resolvedDestinationUrl);
        if (u.protocol !== 'https:') {
          errs.destinationUrl = 'آدرس مقصد باید حتماً HTTPS باشد.';
        }
      } catch {
        errs.destinationUrl = 'فرمت آدرس مقصد نامعتبر است.';
      }
    }

    if (!utmSource.trim()) {
      errs.utmSource = 'منبع ترافیک (utm_source) الزامی است.';
    }

    if (!utmMedium.trim()) {
      errs.utmMedium = 'رسانه تبلیغاتی (utm_medium) الزامی است.';
    }

    if (!utmCampaign.trim()) {
      errs.utmCampaign = 'نام کمپین (utm_campaign) الزامی است.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !generatedUrl || urlError) return;

    setIsSubmitting(true);
    try {
      const created = await landingApi.createUtmLink({
        landingPageId: isCustomUrlMode ? undefined : selectedLandingId || undefined,
        destinationUrl: resolvedDestinationUrl,
        campaignId: campaignId || undefined,
        platformId: platformId || undefined,
        utmSource: utmSource.trim(),
        utmMedium: utmMedium.trim(),
        utmCampaign: utmCampaign.trim(),
        utmTerm: utmTerm.trim() || undefined,
        utmContent: utmContent.trim() || undefined,
      });

      toast.success('لینک UTM با موفقیت ثبت و ذخیره گردید', {
        title: 'لینک UTM ایجاد شد',
      });

      onLinkCreated(created);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'خطا در ثبت لینک UTM';
      toast.error(msg, {
        title: 'خطا در ذخیره لینک',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 bg-[#111D2E]/80 backdrop-blur-md p-5 rounded-2xl border border-[#1F2E45] shadow-xl shadow-black/20">
      <div className="flex items-center justify-between border-b border-[#1F2E45] pb-3">
        <div className="flex items-center gap-2">
          <Link2 className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-bold text-white">سازنده آدرس رهگیری UTM (UTM Builder)</h3>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          تنظیم مجدد فرم
        </button>
      </div>

      {/* Row 1: Destination URL Selection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-300">
            ۱. آدرس مقصد صفحه فرود <span className="text-rose-400">*</span>
          </label>
          <button
            type="button"
            onClick={() => setIsCustomUrlMode(!isCustomUrlMode)}
            className="text-[11px] text-[#719BDF] hover:text-[#93B5F5] font-medium"
          >
            {isCustomUrlMode ? 'انتخاب از لندینگ‌های ثبت‌شده' : 'وارد کردن آدرس دلخواه'}
          </button>
        </div>

        {!isCustomUrlMode && landingPages.length > 0 ? (
          <div>
            <Select
              value={selectedLandingId}
              onChange={(e) => setSelectedLandingId(e.target.value)}
              options={landingPages.map((l) => ({
                value: l.id,
                label: `${l.title} (${l.url})`,
              }))}
            />
          </div>
        ) : (
          <div>
            <Input
              value={customDestinationUrl}
              dir="ltr"
              onChange={(e) => setCustomDestinationUrl(e.target.value)}
              placeholder="https://example.com/landing"
              className="font-mono text-xs bg-[#0B1423] border-[#1F2E45] text-white placeholder-slate-500 focus:border-[#719BDF]"
            />
          </div>
        )}
        {errors.destinationUrl && (
          <p className="text-rose-400 text-[11px]">{errors.destinationUrl}</p>
        )}
      </div>

      {/* Row 2: Source (utm_source) & Medium (utm_medium) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Source */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            ۲. منبع ترافیک (utm_source) <span className="text-rose-400">*</span>
          </label>
          <div className="space-y-2">
            <select
              value={utmSource}
              onChange={(e) => handlePlatformChange(e.target.value)}
              className="w-full text-xs border border-[#1F2E45] rounded-xl px-3 py-2 bg-[#0B1423] text-white focus:outline-none focus:border-[#719BDF]"
            >
              <optgroup label="پلتفرم‌های استاندارد" className="bg-[#111D2E] text-white">
                {platforms.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </optgroup>
            </select>
            <Input
              value={utmSource}
              dir="ltr"
              onChange={(e) => setUtmSource(e.target.value)}
              placeholder="یا تایپ منبع دلخواه..."
              className="text-xs font-mono h-8 bg-[#0B1423] border-[#1F2E45] text-white placeholder-slate-500 focus:border-[#719BDF]"
            />
          </div>
          {errors.utmSource && <p className="text-rose-400 text-[11px] mt-1">{errors.utmSource}</p>}
        </div>

        {/* Medium */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            ۳. رسانه تبلیغاتی (utm_medium) <span className="text-rose-400">*</span>
          </label>
          <Input
            value={utmMedium}
            dir="ltr"
            onChange={(e) => setUtmMedium(e.target.value)}
            placeholder="مثال: cpc, banner, story"
            className="text-xs font-mono mb-2 bg-[#0B1423] border-[#1F2E45] text-white placeholder-slate-500 focus:border-[#719BDF]"
          />
          {/* Quick pills */}
          <div className="flex flex-wrap gap-1.5">
            {commonMediums.slice(0, 6).map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setUtmMedium(m.key)}
                className={`text-[10px] font-mono px-2 py-0.5 rounded-lg border transition-colors ${
                  utmMedium === m.key
                    ? 'bg-[#719BDF]/20 border-[#719BDF] text-white font-bold'
                    : 'bg-[#18263A] border-[#1F2E45] text-slate-300 hover:bg-[#1F2E45] hover:text-white'
                }`}
              >
                {m.key}
              </button>
            ))}
          </div>
          {errors.utmMedium && <p className="text-rose-400 text-[11px] mt-1">{errors.utmMedium}</p>}
        </div>
      </div>

      {/* Row 3: Campaign (utm_campaign) */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
          ۴. کمپین تبلیغاتی (utm_campaign) <span className="text-rose-400">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {campaigns.length > 0 && (
            <Select
              value={campaignId}
              onChange={(e) => handleCampaignChange(e.target.value)}
              placeholder="انتخاب از کمپین‌های فعال..."
              options={[
                { value: '', label: 'انتخاب از کمپین‌های فعال...' },
                ...campaigns.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
          )}

          <Input
            value={utmCampaign}
            dir="ltr"
            onChange={(e) => setUtmCampaign(e.target.value)}
            placeholder="نام شناسه کمپین (مثال: nowruz_1405)"
            className="text-xs font-mono bg-[#0B1423] border-[#1F2E45] text-white placeholder-slate-500 focus:border-[#719BDF]"
          />
        </div>
        {errors.utmCampaign && <p className="text-rose-400 text-[11px] mt-1">{errors.utmCampaign}</p>}
      </div>

      {/* Row 4: Optional Content (utm_content) & Term (utm_term) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            ۵. محتوای تبلیغ (utm_content) <span className="text-slate-500 font-normal">(اختیاری)</span>
          </label>
          <Input
            value={utmContent}
            dir="ltr"
            onChange={(e) => setUtmContent(e.target.value)}
            placeholder="مثال: cta_button_red یا banner_top"
            className="text-xs font-mono bg-[#0B1423] border-[#1F2E45] text-white placeholder-slate-500 focus:border-[#719BDF]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            ۶. کلمه کلیدی / عبارت (utm_term) <span className="text-slate-500 font-normal">(اختیاری)</span>
          </label>
          <Input
            value={utmTerm}
            dir="ltr"
            onChange={(e) => setUtmTerm(e.target.value)}
            placeholder="مثال: خرید_نرم_افزار"
            className="text-xs font-mono bg-[#0B1423] border-[#1F2E45] text-white placeholder-slate-500 focus:border-[#719BDF]"
          />
        </div>
      </div>

      {/* Live URL Preview Section */}
      <div className="p-4 rounded-xl border border-emerald-500/30 bg-[#0B1423]/70 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>پیش‌نمایش زنده آدرس نهایی UTM (Live URL Preview)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!generatedUrl || Boolean(urlError)}
              onClick={handleCopy}
              className="text-xs border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 h-8 gap-1.5 bg-[#18263A]"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'کپی شد!' : 'کپی لینک'}</span>
            </Button>
          </div>
        </div>

        {urlError ? (
          <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{urlError}</span>
          </div>
        ) : (
          <div className="bg-[#111D2E] p-3 rounded-lg border border-[#1F2E45] font-mono text-xs text-emerald-400 break-all select-all leading-relaxed shadow-sm" dir="ltr">
            {generatedUrl || 'لطفاً آدرس مقصد و پارامترها را وارد کنید...'}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="submit"
          disabled={isSubmitting || !generatedUrl || Boolean(urlError)}
          className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white min-w-36 gap-1.5 text-xs shadow-md shadow-blue-900/30 font-medium"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSubmitting ? 'در حال ثبت...' : 'ساخت و ذخیره لینک UTM'}
        </Button>
      </div>
    </form>
  );
}
