'use client';

import * as React from 'react';
import {
  X,
  Globe,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/common/toast-provider';
import { WordPressStatusResponse } from '../types';
import { landingApi } from '../landing.api';

interface WordPressModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WordPressModal({ isOpen, onClose }: WordPressModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<WordPressStatusResponse | null>(null);
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setLoading(true);
      landingApi
        .getWordPressStatus()
        .then((res) => setData(res))
        .catch((err) => {
          console.error('Failed to load WordPress status:', err);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      toast.success('مقدار با موفقیت کپی شد', { title: 'کپی شد' });
      setTimeout(() => setCopiedKey(null), 2500);
    } catch {
      toast.error('خطا در کپی مقدار', { title: 'خطا' });
    }
  };

  const samplePayload = `{
  "campaignId": "شناسه کمپین (اختیاری)",
  "platformId": "شناسه پلتفرم (اختیاری)",
  "utmSource": "google",
  "utmMedium": "cpc",
  "utmCampaign": "summer_promo",
  "name": "نام کاربر",
  "phone": "09123456789",
  "email": "user@example.com"
}`;

  const webhookUrl =
    data?.webhookEndpoint || 'http://localhost:3001/api/leads/webhook';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#111D2E] rounded-2xl border border-[#1F2E45] shadow-2xl max-w-lg w-full overflow-hidden text-right">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1F2E45] bg-[#0B1423]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#18263A] border border-[#1F2E45] text-[#719BDF] flex items-center justify-center font-bold">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">
                وضعیت اتصال به وردپرس (WordPress Integration)
              </h3>
              <p className="text-xs text-slate-400">
                گزارش فنی وضعیت وب‌هوک و دریافت لید
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-[#18263A] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-[#719BDF]" />
              <span>در حال بررسی تنظیمات اتصال به وردپرس...</span>
            </div>
          ) : (
            <>
              {/* Truthful Status Banner */}
              <div
                className={`p-4 rounded-xl border ${
                  data?.isConfigured
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {data?.isConfigured ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <span className="font-bold block text-xs text-white">
                      {data?.isConfigured
                        ? 'یکپارچه‌سازی وب‌سایت وردپرس فعال است'
                        : 'عدم پیکربندی افزونه اختصاصی گپجی در وردپرس'}
                    </span>
                    <p className="text-[11px] leading-relaxed text-slate-300">
                      {data?.statusMessage ||
                        'اتصال مستقیم به افزونه وردپرس طبق سند محصول در مسیر تنظیمات قرار دارد. در حال حاضر امکان ارسال لید از طریق هوک و وب‌هوک استاندارد کاملاً مهیا و فعال است.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Connected Sites List if any */}
              {data?.integrations && data.integrations.length > 0 && (
                <div className="space-y-2">
                  <span className="font-semibold text-slate-300 text-xs block">
                    سایت‌های متصل:
                  </span>
                  <div className="space-y-1.5">
                    {data.integrations.map((site) => (
                      <div
                        key={site.id}
                        className="flex items-center justify-between p-2.5 bg-[#18263A] rounded-xl border border-[#1F2E45]"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          <span className="font-mono text-[11px] text-slate-200" dir="ltr">
                            {site.siteUrl}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {site.isActive ? 'فعال' : 'غیرفعال'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Webhook Endpoint for Elementor / CF7 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300 text-xs">
                    آدرس وب‌هوک دریافت لید (Lead Webhook Endpoint):
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(webhookUrl, 'webhookUrl')}
                    className="h-6 px-2 text-[10px] text-[#719BDF] hover:bg-[#18263A]"
                  >
                    {copiedKey === 'webhookUrl' ? (
                      <Check className="w-3 h-3 me-1 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3 me-1" />
                    )}
                    کپی آدرس وب‌هوک
                  </Button>
                </div>
                <div
                  dir="ltr"
                  className="bg-[#0B1423] text-emerald-400 p-3 rounded-xl font-mono text-[11px] break-all select-all border border-[#1F2E45]"
                >
                  {webhookUrl}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  این آدرس را در بخش وب‌هوک فرم‌های لندینگ سایت وردپرسی خود (مثل المنتور
                  پرو، فرم‌ساز گرویتی، فرم تماس ۷ یا WPForms) قرار دهید.
                </p>
              </div>

              {/* Sample Payload */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300 text-xs">
                    نمونه ساختار ارسال داده (JSON Payload):
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(samplePayload, 'samplePayload')}
                    className="h-6 px-2 text-[10px] text-[#719BDF] hover:bg-[#18263A]"
                  >
                    {copiedKey === 'samplePayload' ? (
                      <Check className="w-3 h-3 me-1 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3 me-1" />
                    )}
                    کپی نمونه داده
                  </Button>
                </div>
                <pre
                  dir="ltr"
                  className="bg-[#0B1423] text-[#719BDF] p-3 rounded-xl font-mono text-[10px] overflow-x-auto select-all border border-[#1F2E45] leading-tight"
                >
                  {samplePayload}
                </pre>
              </div>

              {/* Instructions steps */}
              <div className="bg-[#18263A]/60 p-3.5 rounded-xl border border-[#1F2E45] space-y-2 text-[11px] text-slate-300">
                <strong className="text-white block text-xs">
                  مراحل اتصال در فرم‌های وردپرس:
                </strong>
                <ol className="list-decimal list-inside space-y-1.5 ps-1 leading-relaxed">
                  <li>
                    در افزونه Elementor Pro، به تنظیمات فرم مراجعه کرده و اکشن پس از ارسال
                    را روی <strong>Webhook</strong> تنظیم کنید.
                  </li>
                  <li>نشانی وب‌هوک بالا را در فیلد Webhook URL قرار دهید.</li>
                  <li>
                    فیلدهای مخفی (Hidden Fields) برای مقادیر{' '}
                    <code className="text-[#719BDF] font-mono bg-[#0B1423] px-1.5 py-0.5 rounded border border-[#1F2E45]">
                      utm_source
                    </code>
                    ،{' '}
                    <code className="text-[#719BDF] font-mono bg-[#0B1423] px-1.5 py-0.5 rounded border border-[#1F2E45]">
                      utm_medium
                    </code>{' '}
                    و{' '}
                    <code className="text-[#719BDF] font-mono bg-[#0B1423] px-1.5 py-0.5 rounded border border-[#1F2E45]">
                      utm_campaign
                    </code>{' '}
                    تعریف کنید تا انتساب دقیق لید به لندینگ و پلتفرم ثبت گردد.
                  </li>
                </ol>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#1F2E45] bg-[#0B1423]/50 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs px-4 bg-[#18263A] border-[#1F2E45] text-slate-200 hover:text-white"
          >
            بستن پنجره
          </Button>
        </div>
      </div>
    </div>
  );
}
