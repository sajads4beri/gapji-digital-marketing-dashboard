'use client';

import * as React from 'react';
import {
  Users,
  CheckCircle2,
  Loader2,
  MapPin,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { Drawer } from '@/components/common/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/common/toast-provider';
import { Audience, AudienceGender, CreateAudienceInput, UpdateAudienceInput } from '../types';
import { audiencesApi } from '../audiences.api';

export interface AudienceDrawerProps {
  isOpen: boolean;
  audience: Audience | null;
  onClose: () => void;
  onSuccess: (saved: Audience) => void;
}

const COMMON_CHANNELS = [
  'اینستاگرام (Instagram)',
  'گوگل ادز (Google Ads)',
  'یکتانت / سنجاق',
  'لینکدین (LinkedIn)',
  'پیامک انبوه (SMS)',
  'ایمیل مارکتینگ',
  'سئو و وبلاگ',
  'تبلیغات بنری و همسان',
];

export function AudienceDrawer({
  isOpen,
  audience,
  onClose,
  onSuccess,
}: AudienceDrawerProps) {
  const { toast } = useToast();
  const isEditing = Boolean(audience);

  // Form states
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [channel, setChannel] = React.useState('');
  const [gender, setGender] = React.useState<AudienceGender>('all');
  const [ageMin, setAgeMin] = React.useState<string>('18');
  const [ageMax, setAgeMax] = React.useState<string>('65');
  const [location, setLocation] = React.useState('');
  const [interests, setInterests] = React.useState('');

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Reset or populate form when drawer opens or audience changes
  React.useEffect(() => {
    if (audience) {
      setName(audience.name || '');
      setDescription(audience.description || '');
      setChannel(audience.channel || '');
      setGender(audience.gender || 'all');
      setAgeMin(audience.ageMin !== null && audience.ageMin !== undefined ? String(audience.ageMin) : '');
      setAgeMax(audience.ageMax !== null && audience.ageMax !== undefined ? String(audience.ageMax) : '');
      setLocation(audience.location || '');
      setInterests(audience.interests || '');
    } else {
      setName('');
      setDescription('');
      setChannel('');
      setGender('all');
      setAgeMin('18');
      setAgeMax('65');
      setLocation('');
      setInterests('');
    }
    setErrors({});
  }, [audience, isOpen]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'وارد کردن نام مخاطب الزامی است.';
    }

    const minNum = ageMin.trim() ? Number(ageMin) : null;
    const maxNum = ageMax.trim() ? Number(ageMax) : null;

    if (minNum !== null && (isNaN(minNum) || minNum < 0 || minNum > 120)) {
      newErrors.ageMin = 'حداقل سن باید عددی معتبر بین ۰ تا ۱۲۰ باشد.';
    }

    if (maxNum !== null && (isNaN(maxNum) || maxNum < 0 || maxNum > 120)) {
      newErrors.ageMax = 'حداکثر سن باید عددی معتبر بین ۰ تا ۱۲۰ باشد.';
    }

    if (minNum !== null && maxNum !== null && minNum > maxNum) {
      newErrors.ageMax = 'حداکثر سن نمی‌تواند کمتر از حداقل سن باشد.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('لطفاً خطاهای مشخص‌شده در فرم را اصلاح فرمایید.', {
        title: 'خطای اعتبارسنجی',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const minNum = ageMin.trim() ? parseInt(ageMin, 10) : null;
      const maxNum = ageMax.trim() ? parseInt(ageMax, 10) : null;

      if (isEditing && audience) {
        const payload: UpdateAudienceInput = {
          name: name.trim(),
          description: description.trim() || undefined,
          channel: channel.trim() || undefined,
          gender,
          ageMin: minNum,
          ageMax: maxNum,
          location: location.trim() || undefined,
          interests: interests.trim() || undefined,
        };

        const updated = await audiencesApi.update(audience.id, payload);
        toast.success(`مشخصات مخاطب «${updated.name}» با موفقیت ذخیره شد.`, {
          title: 'به‌روزرسانی موفق',
        });
        onSuccess(updated);
      } else {
        const payload: CreateAudienceInput = {
          name: name.trim(),
          description: description.trim() || undefined,
          channel: channel.trim() || undefined,
          gender,
          ageMin: minNum,
          ageMax: maxNum,
          location: location.trim() || undefined,
          interests: interests.trim() || undefined,
        };

        const created = await audiencesApi.create(payload);
        toast.success(`مخاطب هدف «${created.name}» با موفقیت ایجاد گردید.`, {
          title: 'ثبت مخاطب جدید',
        });
        onSuccess(created);
      }
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'خطایی در ثبت مخاطب رخ داد.';
      toast.error(Array.isArray(msg) ? msg.join(' - ') : msg, {
        title: 'خطا در ذخیره‌سازی',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#18263A] border border-[#1F2E45] text-[#719BDF]">
            <Users className="h-4 w-4" />
          </div>
          <span className="text-base font-bold text-white">
            {isEditing ? `ویرایش مخاطب: ${audience?.name}` : 'تعریف مخاطب هدف جدید'}
          </span>
        </div>
      }
      description={
        <p className="text-xs text-slate-400">
          مشخصات دموگرافیک، کانال مناسب و علایق پرسونای مخاطب را طبق مستند محصول وارد نمایید.
        </p>
      }
      footer={
        <div className="flex w-full items-center justify-between gap-3">
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
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs gap-1.5 shadow-md shadow-blue-900/30 font-medium"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                در حال ذخیره‌سازی...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                {isEditing ? 'ذخیره تغییرات' : 'ایجاد مخاطب'}
              </>
            )}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5 py-2 text-right">
        {/* نام مخاطب */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            نام گروه مخاطب <span className="text-rose-400">*</span>
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثال: خریداران اینترنتی پرمصرف تهران"
            className={`text-xs bg-[#0B1423] border-[#1F2E45] text-white placeholder-slate-500 focus:border-[#719BDF] ${
              errors.name ? 'border-rose-500/80 focus:border-rose-400' : ''
            }`}
            disabled={isSubmitting}
          />
          {errors.name && (
            <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1">
              <AlertCircle className="h-3 w-3 shrink-0" />
              {errors.name}
            </p>
          )}
        </div>

        {/* توضیحات پرسونا */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            توضیحات پرسونا
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="شرح کوتاه از رفتارها، الگوهای خرید و ویژگی‌های کلیدی این گروه از مخاطبان..."
            className="w-full rounded-xl border border-[#1F2E45] bg-[#0B1423] px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-[#719BDF] focus:outline-none focus:ring-1 focus:ring-[#719BDF] disabled:bg-[#111D2E]/50"
            disabled={isSubmitting}
          />
        </div>

        {/* کانال مناسب بازاریابی */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            کانال مناسب بازاریابی (Channel)
          </label>
          <div className="space-y-2">
            <Input
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              placeholder="مثال: اینستاگرام، گوگل ادز، لینکدین..."
              className="text-xs bg-[#0B1423] border-[#1F2E45] text-white placeholder-slate-500 focus:border-[#719BDF]"
              disabled={isSubmitting}
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {COMMON_CHANNELS.map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setChannel(ch)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-[#18263A] hover:bg-[#719BDF]/20 hover:text-white text-slate-300 border border-[#1F2E45] transition-colors"
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* بخش جنسیت و رده سنی */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[#1F2E45]/60 pt-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              جنسیت هدف
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'all', label: 'همه' },
                { value: 'male', label: 'آقایان' },
                { value: 'female', label: 'خانم‌ها' },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setGender(item.value as AudienceGender)}
                  className={`py-2 px-2 rounded-xl text-xs font-medium border text-center transition-all ${
                    gender === item.value
                      ? 'border-[#719BDF] bg-[#719BDF]/20 text-white font-bold shadow-sm'
                      : 'border-[#1F2E45] bg-[#18263A] text-slate-300 hover:bg-[#1F2E45] hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              بازه سنی (سال)
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Input
                  type="number"
                  min={0}
                  max={120}
                  value={ageMin}
                  onChange={(e) => setAgeMin(e.target.value)}
                  placeholder="حداقل"
                  className={`text-xs text-center bg-[#0B1423] border-[#1F2E45] text-white focus:border-[#719BDF] ${
                    errors.ageMin ? 'border-rose-500/80' : ''
                  }`}
                  disabled={isSubmitting}
                />
              </div>
              <span className="text-slate-500 text-xs">تا</span>
              <div className="flex-1">
                <Input
                  type="number"
                  min={0}
                  max={120}
                  value={ageMax}
                  onChange={(e) => setAgeMax(e.target.value)}
                  placeholder="حداکثر"
                  className={`text-xs text-center bg-[#0B1423] border-[#1F2E45] text-white focus:border-[#719BDF] ${
                    errors.ageMax ? 'border-rose-500/80' : ''
                  }`}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            {(errors.ageMin || errors.ageMax) && (
              <p className="mt-1 text-[11px] text-rose-400">
                {errors.ageMin || errors.ageMax}
              </p>
            )}
          </div>
        </div>

        {/* موقعیت مکانی و شهرها */}
        <div className="border-t border-[#1F2E45]/60 pt-4">
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
            موقعیت مکانی / شهرها
          </label>
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="مثال: تهران، اصفهان، شیراز، مشهد، کرج (یا سراسر کشور)"
            className="text-xs bg-[#0B1423] border-[#1F2E45] text-white placeholder-slate-500 focus:border-[#719BDF]"
            disabled={isSubmitting}
          />
        </div>

        {/* علایق و رفتارها */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 text-slate-400" />
            علایق، ترجیحات و رفتارها
          </label>
          <textarea
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            rows={2}
            placeholder="مثال: خرید آنلاین، مد و پوشاک، فناوری، سرمایه‌گذاری، لوازم خانگی..."
            className="w-full rounded-xl border border-[#1F2E45] bg-[#0B1423] px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-[#719BDF] focus:outline-none focus:ring-1 focus:ring-[#719BDF] disabled:bg-[#111D2E]/50"
            disabled={isSubmitting}
          />
        </div>
      </form>
    </Drawer>
  );
}
