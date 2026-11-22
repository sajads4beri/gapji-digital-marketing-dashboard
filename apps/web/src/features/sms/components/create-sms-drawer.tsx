'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { X, Send, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

interface CreateSmsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateSmsDrawer({ isOpen, onClose, onSuccess }: CreateSmsDrawerProps) {
  const [name, setName] = useState('');
  const [senderNumber, setSenderNumber] = useState('3000505');
  const [messageText, setMessageText] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [costAmount, setCostAmount] = useState<number | ''>('');
  const [campaigns, setCampaigns] = useState<Array<{ id: string; name: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      api
        .get('/campaigns')
        .then((res) => {
          if (Array.isArray(res.data)) {
            setCampaigns(res.data);
          } else if (res.data?.items) {
            setCampaigns(res.data.items);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const charCount = messageText.length;
  const smsParts = charCount === 0 ? 0 : charCount <= 70 ? 1 : Math.ceil(charCount / 67);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('عنوان کمپین پیامکی الزامی است.');
      return;
    }
    if (!messageText.trim()) {
      setError('متن پیامک نمی‌تواند خالی باشد.');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/sms', {
        name: name.trim(),
        senderNumber: senderNumber.trim(),
        messageText: messageText.trim(),
        campaignId: campaignId || undefined,
        costAmount: costAmount ? Number(costAmount) : 0,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'خطا در ثبت کمپین پیامکی');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#111D2E] rounded-2xl w-full max-w-lg shadow-2xl border border-[#1F2E45] flex flex-col max-h-[90vh] overflow-hidden text-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1F2E45] bg-[#0B1423]/50">
          <div>
            <h2 className="text-base font-bold text-white">ایجاد یا ثبت ارسال پیامک</h2>
            <p className="text-xs text-slate-400 mt-0.5">ثبت کمپین پیامکی و اتصال به نتایج تحویل</p>
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
              عنوان کمپین پیامکی <span className="text-rose-400">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: ارسال اطلاع‌رسانی جشنواره بلک فرایدی"
              className="bg-[#0B1423] border-[#1F2E45] text-white placeholder-slate-500 focus:border-[#719BDF] text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                سرشماره ارسال <span className="text-rose-400">*</span>
              </label>
              <Input
                value={senderNumber}
                onChange={(e) => setSenderNumber(e.target.value)}
                placeholder="3000..."
                className="font-mono bg-[#0B1423] border-[#1F2E45] text-white focus:border-[#719BDF] text-xs"
                required
              />
            </div>
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
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-medium text-slate-300">
                متن پیامک <span className="text-rose-400">*</span>
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                {charCount} کاراکتر ({smsParts} پارت)
              </span>
            </div>
            <textarea
              rows={4}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="متن پیامک ارسالی را اینجا بنویسید..."
              className="w-full p-3 bg-[#0B1423] border border-[#1F2E45] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#719BDF] resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              هزینه کل ارسال (تومان)
            </label>
            <Input
              type="number"
              min="0"
              value={costAmount}
              onChange={(e) => setCostAmount(e.target.value ? Number(e.target.value) : '')}
              placeholder="مثال: ۱۲۵۰۰۰۰"
              className="font-mono bg-[#0B1423] border-[#1F2E45] text-white focus:border-[#719BDF] text-xs"
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
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs shadow-md shadow-blue-900/30"
            >
              {isSubmitting ? (
                'در حال ذخیره...'
              ) : (
                <>
                  <Send className="w-4 h-4 me-1.5" />
                  ذخیره و ایجاد پیامک
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
