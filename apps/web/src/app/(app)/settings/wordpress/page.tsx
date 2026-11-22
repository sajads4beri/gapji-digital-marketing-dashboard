'use client';

import * as React from 'react';
import { useToast } from '@/components/common/toast-provider';
import {
  wordpressApi,
  WordpressConfig,
  WordpressWebhookLogItem,
  TestConnectionResult,
} from '@/features/wordpress';
import {
  Globe,
  Key,
  Copy,
  RotateCw,
  Send,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Clock,
  Sparkles,
  Save,
  Check,
  X,
  ShieldCheck,
  HelpCircle,
  Code,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

export default function WordpressSettingsPage() {
  const { toast } = useToast();

  const [config, setConfig] = React.useState<WordpressConfig | null>(null);
  const [logs, setLogs] = React.useState<WordpressWebhookLogItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoadingLogs, setIsLoadingLogs] = React.useState(false);

  // وضعیت‌های فرم
  const [siteUrl, setSiteUrl] = React.useState('');
  const [isActive, setIsActive] = React.useState(true);
  const [showSecret, setShowSecret] = React.useState(false);
  const [isSavingConfig, setIsSavingConfig] = React.useState(false);

  // نگاشت فیلدها
  const [fieldMapping, setFieldMapping] = React.useState({
    fullName: 'your-name',
    mobile: 'your-tel',
    email: 'your-email',
    city: 'your-city',
    utmSource: 'utm_source',
    utmCampaign: 'utm_campaign',
  });

  // تست وب‌هوک
  const [isTesting, setIsTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<TestConnectionResult | null>(null);

  // مودال تایید نوسازی کلید
  const [isRotateModalOpen, setIsRotateModalOpen] = React.useState(false);
  const [isRotating, setIsRotating] = React.useState(false);

  // آدرس وب‌هوک
  const webhookUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/wordpress/webhook`
      : 'https://api.gapji.ir/api/wordpress/webhook';

  // واکشی تنظیمات و لاگ‌ها
  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const cfg = await wordpressApi.getConfig();
      setConfig(cfg);
      setSiteUrl(cfg.siteUrl || '');
      setIsActive(cfg.isActive);

      if (cfg.leadMappingConfig) {
        try {
          const parsed = JSON.parse(cfg.leadMappingConfig);
          setFieldMapping((prev) => ({ ...prev, ...parsed }));
        } catch {
          // استفاده از مقادیر پیش‌فرض
        }
      }

      // بارگذاری لاگ‌ها
      const logItems = await wordpressApi.getWebhookLogs();
      setLogs(logItems);
    } catch (err) {
      toast.error('خطا در بارگذاری تنظیمات اتصال وردپرس');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // کپی در کلیپ‌بورد
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} در حافظه کپی شد.`);
  };

  // ذخیره تنظیمات عمومی و نگاشت فیلدها
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    try {
      const updated = await wordpressApi.updateConfig({
        siteUrl,
        isActive,
        leadMappingConfig: JSON.stringify(fieldMapping),
      });
      setConfig(updated);
      toast.success('تنظیمات اتصال وردپرس و نگاشت فیلدها با موفقیت ذخیره شد.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'خطا در ذخیره تنظیمات');
    } finally {
      setIsSavingConfig(false);
    }
  };

  // چرخش و نوسازی کلید امنیتی
  const handleRotateSecret = async () => {
    setIsRotating(true);
    try {
      const res = await wordpressApi.rotateSecret();
      if (config) {
        setConfig({ ...config, webhookSecret: res.newSecret });
      }
      setIsRotateModalOpen(false);
      toast.success('کلید امنیتی وب‌هوک نوسازی شد. لطفاً کلید جدید را در سایت وردپرس ثبت کنید.');
    } catch (err) {
      toast.error('خطا در نوسازی کلید امنیتی');
    } finally {
      setIsRotating(false);
    }
  };

  // تست اتصال وب‌هوک
  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await wordpressApi.testConnection();
      setTestResult(res);
      toast.success(res.message);
      // به‌روزرسانی لاگ‌ها
      wordpressApi.getWebhookLogs().then(setLogs);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'خطا در اجرای تست وب‌هوک');
    } finally {
      setIsTesting(false);
    }
  };

  // فرمت تاریخ شمسی
  const formatPersianDate = (dateStr?: string | null) => {
    if (!dateStr) return 'تاکنون همگام نشده';
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('fa-IR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* سربرگ صفحه */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-100 font-display flex items-center gap-2.5">
            <Globe className="text-[#719BDF]" size={26} />
            <span>یکپارچه‌سازی با وردپرس و وب‌هوک لیدها</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            دریافت خودکار لیدها از فرم‌های سایت وردپرس (Elementor, CF7, Gravity Forms) و نگاشت فیلدها
          </p>
        </div>

        {config && (
          <div className="flex items-center gap-2">
            <span
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                config.isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  config.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'
                }`}
              />
              <span>{config.isActive ? 'سرویس دریافت لید فعال است' : 'سرویس غیرفعال'}</span>
            </span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-44 bg-[#111D2E] rounded-2xl border border-[#1F2E45]" />
          <div className="h-64 bg-[#111D2E] rounded-2xl border border-[#1F2E45]" />
        </div>
      ) : (
        <form onSubmit={handleSaveConfig} className="space-y-6">
          {/* کارت ۱: مشخصات فنی اتصال وب‌هوک */}
          <div className="bg-[#111D2E] rounded-2xl border border-[#1F2E45] p-6 space-y-5 shadow-xl">
            <div className="border-b border-[#1F2E45] pb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Key className="text-[#719BDF]" size={17} />
                <span>اطلاعات نقطه انتهایی (Webhook Endpoint)</span>
              </h2>

              <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                <Clock size={12} />
                <span>آخرین همگام‌سازی: {formatPersianDate(config?.lastSyncAt)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* آدرس Webhook URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">آدرس وب‌هوک سامانه (Webhook URL)</label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    readOnly
                    value={webhookUrl}
                    className="w-full bg-[#18263A] border border-[#1F2E45] rounded-xl pr-3.5 pl-10 py-2.5 text-xs font-mono text-slate-200 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(webhookUrl, 'آدرس وب‌هوک')}
                    className="absolute left-2.5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#1F2E45]"
                    title="کپی آدرس"
                  >
                    <Copy size={15} />
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  این آدرس را به عنوان Webhook Action در افزونه فرم‌ساز وردپرس خود وارد کنید.
                </p>
              </div>

              {/* کلید امنیتی وب‌هوک */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">کلید مخفی وب‌هوک (Webhook Secret)</label>
                  <button
                    type="button"
                    onClick={() => setIsRotateModalOpen(true)}
                    className="text-[11px] font-bold text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <RotateCw size={11} />
                    <span>نوسازی کلید</span>
                  </button>
                </div>

                <div className="relative flex items-center">
                  <input
                    type={showSecret ? 'text' : 'password'}
                    readOnly
                    value={config?.webhookSecret || ''}
                    className="w-full bg-[#18263A] border border-[#1F2E45] rounded-xl pr-3.5 pl-16 py-2.5 text-xs font-mono text-slate-200 focus:outline-none"
                  />
                  <div className="absolute left-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="p-1 rounded-lg text-slate-400 hover:text-white"
                      title={showSecret ? 'مخفی کردن' : 'نمایش کلید'}
                    >
                      {showSecret ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(config?.webhookSecret || '', 'کلید مخفی')}
                      className="p-1 rounded-lg text-slate-400 hover:text-white"
                      title="کپی کلید"
                    >
                      <Copy size={15} />
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">
                  در هدر <code className="text-[#719BDF] font-mono">X-Webhook-Secret</code> یا پارامتر کوئری <code className="text-[#719BDF] font-mono">?secret=</code> ارسال شود.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-[#1F2E45]/60 items-center">
              {/* آدرس وب‌سایت */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">آدرس سایت وردپرسی</label>
                <input
                  type="url"
                  value={siteUrl}
                  onChange={(e) => setSiteUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full bg-[#18263A] border border-[#1F2E45] rounded-xl px-3.5 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-[#719BDF]"
                />
              </div>

              {/* سوئیچ وضعیت فعال بودن */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#18263A]/40 border border-[#1F2E45]">
                <div>
                  <div className="text-xs font-bold text-slate-200">وضعیت دریافت لیدها</div>
                  <div className="text-[10px] text-slate-400">توقف یا فعال‌سازی آنی پردازش پیام‌های ورودی</div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#719BDF]"></div>
                </label>
              </div>
            </div>
          </div>

          {/* کارت ۲: نگاشت بصری فیلدها (Visual Field Mapper) */}
          <div className="bg-[#111D2E] rounded-2xl border border-[#1F2E45] p-6 space-y-5 shadow-xl">
            <div className="border-b border-[#1F2E45] pb-3">
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Code className="text-[#719BDF]" size={17} />
                <span>نگاشت فیلدهای فرم وردپرس به سامانه گپ‌جی (Field Mapping)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                نام فیلدهای ارسال شده در پی‌لود فرم وردپرس خود را در مقابل هر فیلد وارد نمایید.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5 bg-[#18263A]/40 p-3.5 rounded-xl border border-[#1F2E45]">
                <label className="text-xs font-bold text-slate-200">نام و نام خانوادگی</label>
                <input
                  type="text"
                  value={fieldMapping.fullName}
                  onChange={(e) => setFieldMapping({ ...fieldMapping, fullName: e.target.value })}
                  placeholder="your-name"
                  className="w-full bg-[#111D2E] border border-[#1F2E45] rounded-lg px-3 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-[#719BDF]"
                />
                <span className="text-[10px] text-slate-500">پیش‌فرض: your-name یا name</span>
              </div>

              <div className="space-y-1.5 bg-[#18263A]/40 p-3.5 rounded-xl border border-[#1F2E45]">
                <label className="text-xs font-bold text-slate-200">شماره تلفن همراه *</label>
                <input
                  type="text"
                  value={fieldMapping.mobile}
                  onChange={(e) => setFieldMapping({ ...fieldMapping, mobile: e.target.value })}
                  placeholder="your-tel"
                  className="w-full bg-[#111D2E] border border-[#1F2E45] rounded-lg px-3 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-[#719BDF]"
                />
                <span className="text-[10px] text-slate-500">نرمال‌سازی ارقام فارسی خودکار</span>
              </div>

              <div className="space-y-1.5 bg-[#18263A]/40 p-3.5 rounded-xl border border-[#1F2E45]">
                <label className="text-xs font-bold text-slate-200">آدرس ایمیل</label>
                <input
                  type="text"
                  value={fieldMapping.email}
                  onChange={(e) => setFieldMapping({ ...fieldMapping, email: e.target.value })}
                  placeholder="your-email"
                  className="w-full bg-[#111D2E] border border-[#1F2E45] rounded-lg px-3 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-[#719BDF]"
                />
                <span className="text-[10px] text-slate-500">پیش‌فرض: your-email یا email</span>
              </div>

              <div className="space-y-1.5 bg-[#18263A]/40 p-3.5 rounded-xl border border-[#1F2E45]">
                <label className="text-xs font-bold text-slate-200">شهر / استان</label>
                <input
                  type="text"
                  value={fieldMapping.city}
                  onChange={(e) => setFieldMapping({ ...fieldMapping, city: e.target.value })}
                  placeholder="your-city"
                  className="w-full bg-[#111D2E] border border-[#1F2E45] rounded-lg px-3 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-[#719BDF]"
                />
                <span className="text-[10px] text-slate-500">پیش‌فرض: your-city یا city</span>
              </div>

              <div className="space-y-1.5 bg-[#18263A]/40 p-3.5 rounded-xl border border-[#1F2E45]">
                <label className="text-xs font-bold text-slate-200">منبع ترافیک (UTM Source)</label>
                <input
                  type="text"
                  value={fieldMapping.utmSource}
                  onChange={(e) => setFieldMapping({ ...fieldMapping, utmSource: e.target.value })}
                  placeholder="utm_source"
                  className="w-full bg-[#111D2E] border border-[#1F2E45] rounded-lg px-3 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-[#719BDF]"
                />
                <span className="text-[10px] text-slate-500">پیش‌فرض: utm_source</span>
              </div>

              <div className="space-y-1.5 bg-[#18263A]/40 p-3.5 rounded-xl border border-[#1F2E45]">
                <label className="text-xs font-bold text-slate-200">نام کمپین (UTM Campaign)</label>
                <input
                  type="text"
                  value={fieldMapping.utmCampaign}
                  onChange={(e) => setFieldMapping({ ...fieldMapping, utmCampaign: e.target.value })}
                  placeholder="utm_campaign"
                  className="w-full bg-[#111D2E] border border-[#1F2E45] rounded-lg px-3 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-[#719BDF]"
                />
                <span className="text-[10px] text-slate-500">پیش‌فرض: utm_campaign</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#1F2E45]">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#18263A] hover:bg-[#1F2E45] text-slate-200 border border-[#1F2E45] transition-colors disabled:opacity-50"
              >
                <Send size={14} className="text-[#719BDF]" />
                <span>{isTesting ? 'در حال ارسال تست...' : 'تست اتصال با ارسال لید نمونه'}</span>
              </button>

              <button
                type="submit"
                disabled={isSavingConfig}
                className="flex items-center gap-1.5 px-6 py-2 rounded-xl text-xs font-bold bg-[#719BDF] hover:bg-[#5b87cf] text-slate-950 transition-colors disabled:opacity-50"
              >
                <Save size={15} />
                <span>{isSavingConfig ? 'در حال ذخیره‌سازی...' : 'ذخیره تنظیمات نگاشت'}</span>
              </button>
            </div>

            {/* بنر نتیجه تست */}
            {testResult && (
              <div
                className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
                  testResult.success
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  <span>{testResult.message}</span>
                </div>
                {testResult.result?.leadId && (
                  <span className="font-mono text-[11px] bg-emerald-500/20 px-2 py-0.5 rounded">
                    شناسه لید: {testResult.result.leadId.slice(0, 8)}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* کارت ۳: تاریخچه لاگ رویدادها و درخواست‌های ردشده (Diagnostic Log) */}
          <div className="bg-[#111D2E] rounded-2xl border border-[#1F2E45] p-6 space-y-4 shadow-xl">
            <div className="border-b border-[#1F2E45] pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <ShieldCheck className="text-[#719BDF]" size={17} />
                  <span>لاگ درخواست‌های اخیر وب‌هوک و موارد ردشده (Audit Logs)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  ردیابی پیام‌های دریافت‌شده، لیدهای تکراری و علل بروز خطا در احراز هویت وب‌هوک
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsLoadingLogs(true);
                  wordpressApi.getWebhookLogs().then(setLogs).finally(() => setIsLoadingLogs(false));
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-white bg-[#18263A] border border-[#1F2E45]"
                title="به‌روزرسانی لاگ‌ها"
              >
                <RefreshCw size={14} className={isLoadingLogs ? 'animate-spin' : ''} />
              </button>
            </div>

            {logs.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                تاکنون درخواستی برای وب‌هوک ثبت نشده است.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#1F2E45] text-slate-400 text-[11px]">
                      <th className="py-2.5 px-3">زمان دریافت</th>
                      <th className="py-2.5 px-3">وضعیت</th>
                      <th className="py-2.5 px-3">علت / شرح وضعیت</th>
                      <th className="py-2.5 px-3">خلاصه پی‌لود</th>
                      <th className="py-2.5 px-3">IP فرستنده</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F2E45] text-slate-300">
                    {logs.map((log) => {
                      const isSuccess = log.status === 'success';
                      const isDup = log.status === 'duplicate';
                      const isRejected = log.status === 'rejected';

                      return (
                        <tr key={log.id} className="hover:bg-[#18263A]/50 transition-colors">
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">
                            {formatPersianDate(log.receivedAt)}
                          </td>

                          <td className="py-2.5 px-3">
                            {isSuccess && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                ثبت موفق لید
                              </span>
                            )}
                            {isDup && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                لید تکراری (همگام شد)
                              </span>
                            )}
                            {isRejected && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                درخواست ردشد
                              </span>
                            )}
                          </td>

                          <td className="py-2.5 px-3 text-xs">{log.reason || '—'}</td>

                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400 max-w-xs truncate">
                            {log.payloadSummary || '—'}
                          </td>

                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                            {log.ipAddress || '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </form>
      )}

      {/* مودال تایید نوسازی کلید امنیتی (Rotate Webhook Secret Modal) */}
      {isRotateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#111D2E] border border-[#1F2E45] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1F2E45] pb-3">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <AlertCircle className="text-amber-400" size={18} />
                <span>نوسازی کلید امنیتی وب‌هوک</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsRotateModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              با نوسازی کلید، کلید قبلی بلافاصله باطل می‌شود و کلیه درخواست‌های فرم وردپرس تا زمان درج کلید جدید در تنظیمات سایت با خطای ۴۰۱ رد خواهند شد.
              <br /><br />
              آیا از ایجاد کلید جدید اطمینان دارید؟
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#1F2E45]">
              <button
                type="button"
                onClick={() => setIsRotateModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                انصراف
              </button>
              <button
                type="button"
                disabled={isRotating}
                onClick={handleRotateSecret}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition-colors disabled:opacity-50"
              >
                {isRotating ? 'در حال ایجاد کلید...' : 'تایید و نوسازی کلید'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
