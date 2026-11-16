'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { webinarsApi } from '../webinars.api';
import { X, Video, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

interface CreateWebinarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateWebinarDrawer({ isOpen, onClose, onSuccess }: CreateWebinarDrawerProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [presenterName, setPresenterName] = useState('');
  const [platform, setPlatform] = useState('Skyroom');
  const [webinarDate, setWebinarDate] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [registrationUrl, setRegistrationUrl] = useState('');
  const [capacity, setCapacity] = useState<number | ''>('');
  const [campaignId, setCampaignId] = useState('');
  const [campaigns, setCampaigns] = useState<Array<{ id: string; name: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(18, 0, 0, 0);
      setWebinarDate(tomorrow.toISOString().slice(0, 16));

      api
        .get('/campaigns')
        .then((res) => {
          if (Array.isArray(res.data)) setCampaigns(res.data);
          else if (res.data?.items) setCampaigns(res.data.items);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('عنوان و موضوع وبینار الزامی است.');
      return;
    }
    if (!presenterName.trim()) {
      setError('نام مدرس یا مسئول وبینار الزامی است.');
      return;
    }
    if (!webinarDate) {
      setError('تاریخ و زمان برگزاری وبینار الزامی است.');
      return;
    }
    if (
      registrationUrl &&
      !registrationUrl.startsWith('http://') &&
      !registrationUrl.startsWith('https://')
    ) {
      setError('نشانی جلسه یا ثبت‌نام باید با http:// یا https:// آغاز شود.');
      return;
    }

    try {
      setIsSubmitting(true);
      await webinarsApi.createWebinar({
        title: title.trim(),
        description: description.trim() || undefined,
        presenterName: presenterName.trim(),
        platform: platform.trim(),
        webinarDate: new Date(webinarDate).toISOString(),
        durationMinutes: Number(durationMinutes) || 60,
        registrationUrl: registrationUrl.trim() || undefined,
        capacity: capacity ? Number(capacity) : undefined,
        campaignId: campaignId || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'خطا در ثبت وبینار جدید');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#111D2E] rounded-2xl w-full max-w-lg shadow-2xl border border-[#1F2E45] flex flex-col max-h-[90vh] overflow-hidden text-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1F2E45] bg-[#0B1423]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#18263A] border border-[#1F2E45] text-[#719BDF] flex items-center justify-center">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">تعریف وبینار جدید</h2>
              <p className="text-xs text-slate-400">سند محصول ص ۱۷: وضعیت اولیه پیش‌نویس (Draft)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-[#18263A] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center">
              <AlertCircle className="w-4 h-4 me-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              عنوان و موضوع وبینار <span className="text-rose-400">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: کارگاه آموزش استراتژی سئو و لیدجنریشن"
              className="bg-[#0B1423] border-[#1F2E45] text-white placeholder-slate-500 focus:border-[#719BDF] text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                مدرس / ارائه‌دهنده <span className="text-rose-400">*</span>
              </label>
              <Input
                value={presenterName}
                onChange={(e) => setPresenterName(e.target.value)}
                placeholder="نام ارائه‌دهنده"
                className="bg-[#0B1423] border-[#1F2E45] text-white placeholder-slate-500 focus:border-[#719BDF] text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                پلتفرم برگزاری <span className="text-rose-400">*</span>
              </label>
              <Input
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                placeholder="Skyroom, Zoom, Meet..."
                className="bg-[#0B1423] border-[#1F2E45] text-white placeholder-slate-500 focus:border-[#719BDF] text-xs"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                تاریخ و ساعت برگزاری <span className="text-rose-400">*</span>
              </label>
              <Input
                type="datetime-local"
                value={webinarDate}
                onChange={(e) => setWebinarDate(e.target.value)}
                className="bg-[#0B1423] border-[#1F2E45] text-white focus:border-[#719BDF] text-xs font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                مدت زمان (دقیقه) <span className="text-rose-400">*</span>
              </label>
              <Input
                type="number"
                min="15"
                step="15"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="bg-[#0B1423] border-[#1F2E45] text-white focus:border-[#719BDF] text-xs font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              نشانی ثبت‌نام یا لینک جلسه (URL)
            </label>
            <Input
              value={registrationUrl}
              onChange={(e) => setRegistrationUrl(e.target.value)}
              placeholder="https://skyroom.online/ch/..."
              className="font-mono dir-ltr text-left bg-[#0B1423] border-[#1F2E45] text-white placeholder-slate-500 focus:border-[#719BDF] text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Select
                label="کمپین بازاریابی مرتبط"
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                options={[
                  { value: '', label: 'بدون کمپین' },
                  ...campaigns.map((c) => ({ value: c.id, label: c.name })),
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                ظرفیت وبینار (نفر)
              </label>
              <Input
                type="number"
                min="1"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value ? Number(e.target.value) : '')}
                placeholder="اختیاری (مثال: ۵۰۰)"
                className="font-mono bg-[#0B1423] border-[#1F2E45] text-white placeholder-slate-500 focus:border-[#719BDF] text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              توضیحات و سرفصل‌ها
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="توضیحات مربوط به اهداف و مخاطبان وبینار..."
              className="w-full p-3 bg-[#0B1423] border border-[#1F2E45] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#719BDF] resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 flex items-center justify-end gap-2 border-t border-[#1F2E45]">
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
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs shadow-md shadow-blue-900/30 font-medium"
            >
              {isSubmitting ? (
                'در حال ثبت...'
              ) : (
                <>
                  <Sparkles className="w-4 h-4 me-1.5" />
                  ایجاد وبینار (پیش‌نویس)
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
