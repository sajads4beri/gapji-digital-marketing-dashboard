'use client';

import * as React from 'react';
import { Modal } from '@/components/common/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { MoneyInput, formatMoneyDisplay } from '@/components/ui/money-input';
import { PersianDatePicker } from '@/components/ui/persian-date-picker';
import { useToast } from '@/components/common/toast-provider';
import {
  CostItem,
  CostCategory,
  CostChannel,
  CostCurrency,
  CostStatus,
  COST_CATEGORIES,
  COST_CATEGORY_LABELS,
  COST_CHANNELS,
  COST_CHANNEL_LABELS,
  COST_CURRENCIES,
  COST_CURRENCY_LABELS,
  COST_STATUSES,
  COST_STATUS_LABELS,
  DEFAULT_EXCHANGE_RATES,
  convertCurrencyToToman,
  resolveExchangeRate,
} from '../types';
import { costService } from '../index';
import { campaignService } from '@/features/campaigns';

export interface CostFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  cost?: CostItem | null;
  onSuccess?: (savedCost: CostItem) => void;
}

export function CostFormModal({
  isOpen,
  onClose,
  cost,
  onSuccess,
}: CostFormModalProps) {
  const { toast } = useToast();
  const isEditMode = Boolean(cost);

  // وضعیت‌های فرم
  const [title, setTitle] = React.useState('');
  const [category, setCategory] = React.useState<CostCategory>('ad_media');
  const [channel, setChannel] = React.useState<CostChannel | ''>('google_ads');
  const [campaignId, setCampaignId] = React.useState<string>('');
  const [amount, setAmount] = React.useState<number>(0);
  const [currency, setCurrency] = React.useState<CostCurrency>('TOMAN');
  const [exchangeRate, setExchangeRate] = React.useState<number>(1);
  const [date, setDate] = React.useState<string>('');
  const [vendor, setVendor] = React.useState('');
  const [invoiceNumber, setInvoiceNumber] = React.useState('');
  const [status, setStatus] = React.useState<CostStatus>('paid');
  const [notes, setNotes] = React.useState('');

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [availableCampaigns, setAvailableCampaigns] = React.useState<Array<{ id: string; name: string }>>([]);

  React.useEffect(() => {
    if (isOpen) {
      campaignService
        .getAll()
        .then((list: any[]) => {
          if (list && Array.isArray(list)) {
            setAvailableCampaigns(list.map((c) => ({ id: c.id, name: c.name })));
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // مقداردهی اولیه یا ریست فرم بر اساس مد ویرایش/ایجاد
  React.useEffect(() => {
    if (!isOpen) {
      setFormError(null);
      return;
    }

    if (cost) {
      setTitle(cost.title || '');
      setCategory(cost.category || 'ad_media');
      setChannel(cost.channel || '');
      setCampaignId(cost.campaignId || '');
      setAmount(cost.amount || 0);
      setCurrency(cost.currency || 'TOMAN');
      setExchangeRate(cost.exchangeRate || resolveExchangeRate(cost.currency));
      setDate(cost.date || new Date().toISOString().split('T')[0]);
      setVendor(cost.vendor || '');
      setInvoiceNumber(cost.invoiceNumber || '');
      setStatus(cost.status || 'paid');
      setNotes(cost.notes || '');
    } else {
      const todayIso = new Date().toISOString().split('T')[0];
      setTitle('');
      setCategory('ad_media');
      setChannel('google_ads');
      setCampaignId('');
      setAmount(0);
      setCurrency('TOMAN');
      setExchangeRate(1);
      setDate(todayIso);
      setVendor('');
      setInvoiceNumber('');
      setStatus('paid');
      setNotes('');
    }
    setFormError(null);
  }, [isOpen, cost]);

  // به‌روزرسانی خودکار نرخ ارز پیش‌فرض هنگام تغییر ارز
  const handleCurrencyChange = (newCurrency: CostCurrency) => {
    setCurrency(newCurrency);
    if (newCurrency === 'TOMAN') {
      setExchangeRate(1);
    } else if (newCurrency === 'IRR') {
      setExchangeRate(0.1);
    } else {
      setExchangeRate(DEFAULT_EXCHANGE_RATES[newCurrency] || 1);
    }
  };

  // محاسبه پیش‌نمایش معادل تومانی با تابع رسمی ماژول
  const previewToman = React.useMemo(() => {
    if (!amount || amount <= 0) return 0;
    try {
      const rate = resolveExchangeRate(currency, exchangeRate);
      return convertCurrencyToToman(amount, currency, rate);
    } catch {
      return 0;
    }
  }, [amount, currency, exchangeRate]);

  // ارسال فرم
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // اعتبارسنجی اولیه کلاینت
    if (!title.trim() || title.trim().length < 3) {
      setFormError('عنوان هزینه باید حداقل ۳ کاراکتر باشد.');
      return;
    }
    if (!amount || amount <= 0) {
      setFormError('مبلغ هزینه باید بزرگتر از صفر باشد.');
      return;
    }
    if ((currency === 'USD' || currency === 'AED') && (!exchangeRate || exchangeRate <= 0)) {
      setFormError(`نرخ تبدیل برای ارز ${currency} باید عددی مثبت باشد.`);
      return;
    }
    if (!date) {
      setFormError('انتخاب تاریخ الزامی است.');
      return;
    }

    try {
      setIsSubmitting(true);

      const effectiveRate = resolveExchangeRate(currency, exchangeRate);
      const payload = {
        title: title.trim(),
        category,
        channel: channel ? (channel as CostChannel) : null,
        campaignId: campaignId ? campaignId : null,
        amount,
        currency,
        exchangeRate: effectiveRate,
        date,
        vendor: vendor.trim() || null,
        invoiceNumber: invoiceNumber.trim() || null,
        status,
        notes: notes.trim() || null,
      };

      let saved: CostItem;
      if (isEditMode && cost) {
        saved = await costService.update(cost.id, payload);
        toast.success('هزینه با موفقیت ویرایش شد.');
      } else {
        saved = await costService.create(payload);
        toast.success('هزینه جدید با موفقیت ثبت شد.');
      }

      onSuccess?.(saved);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'خطای نامشخص در ذخیره‌سازی هزینه';
      setFormError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isForeignCurrency = currency === 'USD' || currency === 'AED';

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting ? () => {} : onClose}
      title={isEditMode ? 'ویرایش مشخصات هزینه' : 'ثبت هزینه جدید بازاریابی'}
      description={
        isEditMode
          ? 'تغییر فیلدهای مالی، دسته‌بندی و وضعیت پرداخت ردیف هزینه انتخاب‌شده'
          : 'ورود اطلاعات فاکتور یا پرداختی به تفکیک پلتفرم و انتساب به کمپین'
      }
      size="xl"
      closeOnBackdropClick={!isSubmitting}
      closeOnEscape={!isSubmitting}
      showCloseButton={!isSubmitting}
    >
      <form onSubmit={handleSubmit} className="space-y-5" dir="rtl">
        {/* هشدار پیام خطا */}
        {formError && (
          <div
            className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2"
            role="alert"
          >
            <span className="font-bold">خطا:</span>
            <span>{formError}</span>
          </div>
        )}

        {/* ۱. عنوان هزینه */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            عنوان / شرح هزینه <span className="text-red-500">*</span>
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثلاً: شارژ اکانت گوگل ادز یا تولید موشن‌گرافیک تیزر"
            required
            disabled={isSubmitting}
          />
        </div>

        {/* ۲. ردیف دسته‌بندی و کانال */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="دسته‌بندی هزینه *"
            value={category}
            onChange={(e) => setCategory(e.target.value as CostCategory)}
            disabled={isSubmitting}
            options={COST_CATEGORIES.map((c) => ({
              value: c,
              label: COST_CATEGORY_LABELS[c],
            }))}
          />

          <Select
            label="کانال / پلتفرم انتشار"
            value={channel}
            onChange={(e) => setChannel(e.target.value as CostChannel | '')}
            disabled={isSubmitting}
            options={[
              { value: '', label: 'عمومی / نامشخص' },
              ...COST_CHANNELS.map((ch) => ({
                value: ch,
                label: COST_CHANNEL_LABELS[ch],
              })),
            ]}
          />
        </div>

        {/* ۳. ردیف کمپین مرتبط و تاریخ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="کمپین مرتبط (اختیاری)"
            value={campaignId}
            onChange={(e) => setCampaignId(e.target.value)}
            disabled={isSubmitting}
            options={[
              { value: '', label: 'هزینه عمومی مارکتینگ (بدون کمپین)' },
              ...availableCampaigns.map((camp) => ({
                value: camp.id,
                label: `${camp.name} (${camp.id.slice(0, 8)})`,
              })),
            ]}
          />

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              تاریخ وقوع هزینه <span className="text-red-500">*</span>
            </label>
            <PersianDatePicker
              mode="single"
              value={date}
              onChange={(newDate) => setDate(newDate || '')}
              disabled={isSubmitting}
              placeholder="انتخاب تاریخ وقوع"
            />
          </div>
        </div>

        {/* ۴. ردیف مبالغ و ارز */}
        <div className="p-4 bg-gray-50/70 rounded-xl border border-gray-200/70 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* انتخاب ارز */}
            <div>
              <Select
                label="واحد ارز *"
                value={currency}
                onChange={(e) => handleCurrencyChange(e.target.value as CostCurrency)}
                disabled={isSubmitting}
                options={COST_CURRENCIES.map((cur) => ({
                  value: cur,
                  label: COST_CURRENCY_LABELS[cur],
                }))}
              />
            </div>

            {/* مبلغ */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                مبلغ پرداختی ({COST_CURRENCY_LABELS[currency]}) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min="0"
                step="any"
                value={amount === 0 ? '' : amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                placeholder="مبلغ پرداختی"
                disabled={isSubmitting}
                required
              />
            </div>

            {/* نرخ تبدیل ارز خارجی */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                نرخ تبدیل به تومان
                {!isForeignCurrency && <span className="text-gray-400 font-normal mr-1">(ثابت)</span>}
              </label>
              <Input
                type="number"
                min="0"
                step="any"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 0)}
                disabled={!isForeignCurrency || isSubmitting}
                className={!isForeignCurrency ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}
              />
            </div>
          </div>

          {/* پیش‌نمایش معادل تومانی */}
          <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-200/60 text-gray-600">
            <span>معادل نهایی محاسباتی در سیستم:</span>
            <span className="font-bold text-sm text-gray-900 bg-white px-2.5 py-1 rounded-lg border border-gray-200">
              {formatMoneyDisplay(previewToman) || '۰'} تومان
            </span>
          </div>
        </div>

        {/* ۵. فروشنده، شماره فاکتور و وضعیت پرداخت */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              فروشنده / آژانس مجری
            </label>
            <Input
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              placeholder="مثلاً: آژانس نوین، کاوه‌نگار"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              شماره فاکتور / کد پیگیری
            </label>
            <Input
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="مثلاً: INV-8821"
              disabled={isSubmitting}
            />
          </div>

          <Select
            label="وضعیت پرداخت *"
            value={status}
            onChange={(e) => setStatus(e.target.value as CostStatus)}
            disabled={isSubmitting}
            options={COST_STATUSES.map((st) => ({
              value: st,
              label: COST_STATUS_LABELS[st],
            }))}
          />
        </div>

        {/* ۶. توضیحات تکمیلی */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            توضیحات و یادداشت تکمیلی
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full text-xs rounded-xl border border-gray-300 p-2.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="هرگونه یادداشت حسابداری یا شرایط تسویه..."
            disabled={isSubmitting}
          />
        </div>

        {/* دکمه‌های اقدام */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            انصراف
          </Button>

          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                در حال ثبت...
              </span>
            ) : isEditMode ? (
              'ذخیره تغییرات'
            ) : (
              'ثبت ردیف هزینه'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
