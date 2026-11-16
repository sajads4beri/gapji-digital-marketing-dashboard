'use client';

import * as React from 'react';
import { AlertTriangle, PowerOff, Loader2 } from 'lucide-react';
import { Modal } from '@/components/common/modal';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/common/toast-provider';
import { Platform } from '../types';
import { platformsApi } from '../platforms.api';

export interface PlatformDeactivateDialogProps {
  isOpen: boolean;
  platform: Platform | null;
  onClose: () => void;
  onSuccess: (updatedPlatform: Platform) => void;
}

export function PlatformDeactivateDialog({
  isOpen,
  platform,
  onClose,
  onSuccess,
}: PlatformDeactivateDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [usageCount, setUsageCount] = React.useState<number | null>(null);
  const [isFetchingUsage, setIsFetchingUsage] = React.useState(false);

  // واکشی تعداد واقعی و لحظه‌ای کمپین‌های در حال استفاده از دیتابیس
  React.useEffect(() => {
    if (!isOpen || !platform) {
      setUsageCount(null);
      return;
    }

    let isMounted = true;
    setIsFetchingUsage(true);

    platformsApi
      .getPlatformUsage(platform.id)
      .then((data) => {
        if (isMounted) {
          setUsageCount(data.activeCampaignsCount);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch real-time usage, using cached count', err);
        if (isMounted) {
          setUsageCount(platform.activeCampaignsCount);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsFetchingUsage(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, platform]);

  if (!platform) return null;

  const count = usageCount ?? platform.activeCampaignsCount;
  const isInUse = count > 0;

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      const res = await platformsApi.deactivatePlatform(platform.id);
      toast.success(res.message || `پلتفرم «${platform.name}» با موفقیت غیرفعال شد.`);
      onSuccess(res.platform);
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'خطا در غیرفعال‌سازی پلتفرم.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isLoading ? () => {} : onClose}
      size="md"
      title={
        <div className="flex items-center gap-2.5 text-rose-400">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span className="font-bold text-base text-white">
            تأیید غیرفعال‌سازی پلتفرم
          </span>
        </div>
      }
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="text-xs bg-[#0B1423] border-[#1F2E45] text-slate-300 hover:text-white hover:bg-[#18263A]"
          >
            انصراف
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading || isFetchingUsage}
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md shadow-rose-900/30"
          >
            {isLoading ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>در حال ثبت...</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <PowerOff className="w-3.5 h-3.5" />
                <span>بله، غیرفعال شود</span>
              </span>
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-xs text-slate-300 leading-relaxed" dir="rtl">
        {/* هشدار صریح مبتنی بر تعداد واقعی کمپین‌های در حال استفاده طبق سند REQ-19 */}
        {isFetchingUsage ? (
          <div className="py-4 text-center text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-[#719BDF]" />
            <span>در حال استعلام وضعیت کمپین‌های متصل...</span>
          </div>
        ) : isInUse ? (
          <div className="p-4 rounded-2xl border border-amber-500/25 bg-amber-500/10 text-amber-200 space-y-1.5">
            <div className="font-bold text-sm text-amber-300 font-display">
              «این پلتفرم در {count.toLocaleString('fa-IR')} کمپین در حال استفاده است. آیا از غیرفعالسازی اطمینان دارید؟»
            </div>
            <p className="text-[11px] text-amber-200/80 leading-relaxed">
              با غیرفعال‌سازی، کمپین‌های جدید امکان انتخاب این پلتفرم را نخواهند داشت، اما سوابق هزینه‌ها و داده‌های تاریخی در سیستم محفوظ می‌ماند.
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-2xl border border-[#1F2E45] bg-[#0B1423] space-y-1.5">
            <div className="font-semibold text-white">
              «این پلتفرم در هیچ کمپین فعالی استفاده نمی‌شود. آیا از غیرفعال‌سازی اطمینان دارید؟»
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              این پلتفرم از منوی انتخاب کمپین‌ها پنهان خواهد شد و در هر زمان توسط ادمین مجدداً قابل فعال‌سازی است.
            </p>
          </div>
        )}

        <div className="text-[11px] text-slate-400 border-t border-[#1F2E45] pt-3">
          <strong className="text-slate-300">نام پلتفرم:</strong> {platform.name} ({platform.code})
        </div>
      </div>
    </Modal>
  );
}
