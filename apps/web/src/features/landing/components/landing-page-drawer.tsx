'use client';

import * as React from 'react';
import {
  Globe,
  Loader2,
  Lock,
} from 'lucide-react';
import { Drawer } from '@/components/common/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/common/toast-provider';
import { landingApi } from '../landing.api';
import { LandingPageItem, CampaignOption } from '../types';

interface LandingPageDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (saved: LandingPageItem) => void;
  campaigns?: CampaignOption[];
}

export function LandingPageDrawer({
  isOpen,
  onClose,
  onSuccess,
  campaigns = [],
}: LandingPageDrawerProps) {
  const { toast } = useToast();

  const [title, setTitle] = React.useState('');
  const [url, setUrl] = React.useState('');
  const [campaignId, setCampaignId] = React.useState('');

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (isOpen) {
      setTitle('');
      setUrl('https://');
      setCampaignId('');
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) {
      errs.title = 'عنوان صفحه فرود الزامی است.';
    }

    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      errs.url = 'آدرس اینترنتی صفحه لندینگ الزامی است.';
    } else {
      try {
        const parsed = new URL(trimmedUrl);
        if (parsed.protocol !== 'https:') {
          errs.url = 'آدرس مقصد باید الزاماً دارای پروتکل امن HTTPS باشد (پروتکل فعلی: ' + parsed.protocol + ').';
        } else if (!parsed.hostname || !parsed.hostname.includes('.')) {
          errs.url = 'دامنه آدرس اینترنتی نامعتبر است.';
        }
      } catch {
        errs.url = 'فرمت آدرس اینترنتی وارد شده معتبر نیست. نمونه: https://example.com/landing';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const created = await landingApi.createLandingPage({
        title: title.trim(),
        url: url.trim(),
        campaignId: campaignId || undefined,
      });

      toast.success(`صفحه فرود «${created.title}» با موفقیت ثبت گردید.`, {
        title: 'صفحه لندینگ ایجاد شد',
      });
      onSuccess(created);
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'خطا در ثبت صفحه فرود';
      toast.error(msg, {
        title: 'خطا در ثبت لندینگ',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-white font-bold text-base">
          <Globe className="w-5 h-5 text-[#719BDF]" />
          <span>ثبت صفحه فرود جدید (Landing Page)</span>
        </div>
      }
      description={
        <p className="text-xs text-slate-400">
          ثبت آدرس اینترنتی صفحه فرود جهت رهگیری خودکار لیدها و ساخت لینک‌های UTM.
        </p>
      }
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5 py-2">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            عنوان یا نام صفحه فرود <span className="text-rose-400">*</span>
          </label>
          <Input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
            }}
            placeholder="مثال: صفحه اصلی جشنواره تخفیف پاییزه"
            className={`text-xs bg-[#0B1423] border-[#1F2E45] text-white placeholder-slate-500 focus:border-[#719BDF] ${
              errors.title ? 'border-rose-500/80 focus:border-rose-400' : ''
            }`}
          />
          {errors.title && <p className="text-rose-400 text-[11px] mt-1">{errors.title}</p>}
        </div>

        {/* URL with HTTPS requirement */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              آدرس اینترنتی (الزاماً HTTPS) <span className="text-rose-400">*</span>
            </label>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg flex items-center gap-1 font-mono">
              <Lock className="w-2.5 h-2.5" />
              HTTPS Only
            </span>
          </div>

          <Input
            value={url}
            dir="ltr"
            onChange={(e) => {
              setUrl(e.target.value);
              if (errors.url) setErrors((prev) => ({ ...prev, url: '' }));
            }}
            placeholder="https://gapji.ir/landing/example"
            className={`font-mono text-xs bg-[#0B1423] border-[#1F2E45] text-white placeholder-slate-500 focus:border-[#719BDF] ${
              errors.url ? 'border-rose-500/80 focus:border-rose-400' : ''
            }`}
          />
          {errors.url && <p className="text-rose-400 text-[11px] mt-1">{errors.url}</p>}
          <p className="text-[11px] text-slate-500 mt-1">
            آدرس باید به صورت کامل با //:https وارد شود.
          </p>
        </div>

        {/* Campaign Selection */}
        <div>
          <Select
            label="کمپین مرتبط (اختیاری)"
            value={campaignId}
            onChange={(e) => setCampaignId(e.target.value)}
            helperText="در صورت اتصال، لیدهای این کمپین به صورت خودکار به این لندینگ منتسب می‌شوند."
            options={[
              { value: '', label: 'بدون اتصال به کمپین خاص (عمومی)' },
              ...campaigns.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1F2E45]">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-xs bg-[#18263A] border-[#1F2E45] text-slate-300 hover:text-white hover:bg-[#1F2E45]"
          >
            انصراف
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white min-w-28 gap-1.5 text-xs shadow-md shadow-blue-900/30 font-medium"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubmitting ? 'در حال ذخیره...' : 'ثبت صفحه لندینگ'}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
