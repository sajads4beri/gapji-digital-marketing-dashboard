'use client';

import * as React from 'react';
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  BookOpen,
  Compass,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/common/toast-provider';

export function CollapsibleGuides() {
  const { toast } = useToast();
  const [openGoogleAds, setOpenGoogleAds] = React.useState(false);
  const [openGA4, setOpenGA4] = React.useState(false);
  const [copiedSnippet, setCopiedSnippet] = React.useState<string | null>(null);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSnippet(label);
      toast.success(`${label} در حافظه کپی شد`, { title: 'کپی شد' });
      setTimeout(() => setCopiedSnippet(null), 2000);
    } catch {
      toast.error('خطا در کپی مقدار', { title: 'خطا' });
    }
  };

  const googleAdsTrackingTemplate =
    '{lpurl}?utm_source=google&utm_medium=cpc&utm_campaign={_campaign}&utm_term={keyword}&utm_content={creative}';
  const googleAdsSuffix =
    'utm_source=google&utm_medium=cpc&utm_campaign={_campaign}&utm_term={keyword}&utm_content={creative}';

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1 text-slate-300">
        <BookOpen className="w-4 h-4 text-[#719BDF]" />
        <h4 className="font-semibold text-xs text-white">راهنماهای اتصال و پایش حرفه‌ای</h4>
      </div>

      {/* Guide 1: Google Ads */}
      <div className="bg-[#111D2E]/80 backdrop-blur-md rounded-2xl border border-[#1F2E45] overflow-hidden shadow-xl shadow-black/20 transition-all">
        <button
          type="button"
          onClick={() => setOpenGoogleAds(!openGoogleAds)}
          className="w-full flex items-center justify-between p-4 text-right hover:bg-[#18263A]/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#18263A] border border-[#1F2E45] text-[#719BDF] flex items-center justify-center font-bold text-xs">
              GAds
            </div>
            <div>
              <span className="font-semibold text-white text-xs block">
                ثبت UTM در گوگل ادز (Google Ads Tracking Template)
              </span>
              <span className="text-[11px] text-slate-400">
                تنظیم خودکار الگوهای ردگیری و پارامترهای پویای ValueTrack
              </span>
            </div>
          </div>
          <div className="text-slate-400">
            {openGoogleAds ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </button>

        {openGoogleAds && (
          <div className="p-4 pt-1 border-t border-[#1F2E45] bg-[#0B1423]/40 text-xs space-y-4">
            <p className="text-slate-300 leading-relaxed text-[11px]">
              به‌جای ساخت دستی صدها لینک با پارامترهای ثابت، می‌توانید از قابلیت{' '}
              <strong className="text-white">Tracking Template</strong> یا{' '}
              <strong className="text-white">Final URL Suffix</strong> در پنل
              گوگل ادز در سطح اکانت، کمپین یا گروه آگهی استفاده کنید:
            </p>

            {/* Template Snippet */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-medium text-slate-300">
                  الگوی استاندارد Tracking Template:
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(googleAdsTrackingTemplate, 'Tracking Template')
                  }
                  className="h-6 px-2 text-[10px] text-[#719BDF] hover:bg-[#18263A]"
                >
                  {copiedSnippet === 'Tracking Template' ? (
                    <Check className="w-3 h-3 me-1 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3 me-1" />
                  )}
                  کپی الگو
                </Button>
              </div>
              <div
                dir="ltr"
                className="bg-[#0B1423] text-emerald-400 p-3 rounded-xl border border-[#1F2E45] font-mono text-[11px] overflow-x-auto select-all"
              >
                {googleAdsTrackingTemplate}
              </div>
            </div>

            {/* Suffix Snippet */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-medium text-slate-300">
                  یا درج در Final URL Suffix:
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(googleAdsSuffix, 'Final URL Suffix')
                  }
                  className="h-6 px-2 text-[10px] text-[#719BDF] hover:bg-[#18263A]"
                >
                  {copiedSnippet === 'Final URL Suffix' ? (
                    <Check className="w-3 h-3 me-1 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3 me-1" />
                  )}
                  کپی پسوند
                </Button>
              </div>
              <div
                dir="ltr"
                className="bg-[#0B1423] text-emerald-400 p-3 rounded-xl border border-[#1F2E45] font-mono text-[11px] overflow-x-auto select-all"
              >
                {googleAdsSuffix}
              </div>
            </div>

            {/* ValueTrack Explanation */}
            <div className="space-y-2">
              <span className="font-semibold text-white text-[11px] block">
                توضیح پارامترهای پویا (ValueTrack Parameters):
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                <div className="bg-[#18263A] p-2.5 rounded-xl border border-[#1F2E45]">
                  <span className="font-mono text-[#719BDF] font-bold block" dir="ltr">
                    {'{lpurl}'}
                  </span>
                  <span className="text-slate-300">
                    نشانی نهایی صفحه فرود (Final URL) شما
                  </span>
                </div>
                <div className="bg-[#18263A] p-2.5 rounded-xl border border-[#1F2E45]">
                  <span className="font-mono text-[#719BDF] font-bold block" dir="ltr">
                    {'{keyword}'}
                  </span>
                  <span className="text-slate-300">
                    کلمه کلیدی فعال‌کننده آگهی در سرچ گوگل
                  </span>
                </div>
                <div className="bg-[#18263A] p-2.5 rounded-xl border border-[#1F2E45]">
                  <span className="font-mono text-[#719BDF] font-bold block" dir="ltr">
                    {'{creative}'}
                  </span>
                  <span className="text-slate-300">
                    شناسه منحصر‌به‌فرد متن آگهی در گوگل ادز
                  </span>
                </div>
                <div className="bg-[#18263A] p-2.5 rounded-xl border border-[#1F2E45]">
                  <span className="font-mono text-[#719BDF] font-bold block" dir="ltr">
                    {'{_campaign}'}
                  </span>
                  <span className="text-slate-300">
                    پارامتر سفارشی (Custom Parameter) برای نام کمپین
                  </span>
                </div>
              </div>
            </div>

            {/* Setup path in Google Ads */}
            <div className="bg-[#18263A]/80 p-3 rounded-xl border border-[#1F2E45] text-[11px] text-slate-300">
              <strong className="text-white">مسیر تنظیم در پنل گوگل ادز:</strong>
              <div className="mt-1 font-mono text-[10px] text-[#719BDF]" dir="ltr">
                Campaigns &gt; Settings &gt; Additional Settings &gt; Campaign URL options
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Guide 2: GA4 */}
      <div className="bg-[#111D2E]/80 backdrop-blur-md rounded-2xl border border-[#1F2E45] overflow-hidden shadow-xl shadow-black/20 transition-all">
        <button
          type="button"
          onClick={() => setOpenGA4(!openGA4)}
          className="w-full flex items-center justify-between p-4 text-right hover:bg-[#18263A]/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#18263A] border border-[#1F2E45] text-amber-400 flex items-center justify-center font-bold text-xs">
              GA4
            </div>
            <div>
              <span className="font-semibold text-white text-xs block">
                دیدن نتیجه در گوگل آنالیتیکس ۴ (GA4 Results)
              </span>
              <span className="text-[11px] text-slate-400">
                گزارش‌های استاندارد جذب ترافیک و ساخت کاوش‌های سفارشی (Explorations)
              </span>
            </div>
          </div>
          <div className="text-slate-400">
            {openGA4 ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </button>

        {openGA4 && (
          <div className="p-4 pt-1 border-t border-[#1F2E45] bg-[#0B1423]/40 text-xs space-y-4">
            <p className="text-slate-300 leading-relaxed text-[11px]">
              پارامترهای ارسالی UTM توسط گوگل آنالیتیکس ۴ به‌صورت خودکار تفکیک شده
              و در ابعاد مرتبط ذخیره می‌گردند. برای مشاهده نتایج:
            </p>

            {/* Path 1: Traffic Acquisition */}
            <div className="bg-[#18263A] p-3 rounded-xl border border-[#1F2E45] space-y-2">
              <span className="font-semibold text-white text-[11px] flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-[#719BDF]" />
                ۱. گزارش استاندارد جذب ترافیک (Traffic Acquisition)
              </span>
              <div className="bg-[#0B1423] p-2 rounded-lg text-[10px] text-slate-300 font-mono border border-[#1F2E45]" dir="ltr">
                Reports &gt; Acquisition &gt; Traffic acquisition
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                بعد اصلی (Primary Dimension) جدول را از{' '}
                <code className="text-[#719BDF] font-mono bg-[#0B1423] px-1 py-0.5 rounded border border-[#1F2E45]">
                  Session default channel group
                </code>{' '}
                به{' '}
                <code className="text-[#719BDF] font-mono bg-[#0B1423] px-1 py-0.5 rounded border border-[#1F2E45]">
                  Session source / medium
                </code>{' '}
                یا{' '}
                <code className="text-[#719BDF] font-mono bg-[#0B1423] px-1 py-0.5 rounded border border-[#1F2E45]">
                  Session campaign
                </code>{' '}
                تغییر دهید.
              </p>
            </div>

            {/* Path 2: Custom Exploration */}
            <div className="bg-[#18263A] p-3 rounded-xl border border-[#1F2E45] space-y-2">
              <span className="font-semibold text-white text-[11px] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#719BDF]" />
                ۲. کاوش سفارشی با ابعاد کامل (Free-form Exploration)
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                در بخش Explore یک گزارش Free-form جدید ایجاد کرده و ابعاد زیر را به آن اضافه فرمایید:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 font-mono text-[10px]" dir="ltr">
                {['Session source', 'Session medium', 'Session campaign', 'Manual term', 'Manual ad content'].map(
                  (d) => (
                    <span
                      key={d}
                      className="bg-[#0B1423] text-slate-300 border border-[#1F2E45] px-2 py-1 rounded-lg text-center"
                    >
                      {d}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
