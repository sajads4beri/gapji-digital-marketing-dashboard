'use client';

import * as React from 'react';
import { Modal } from '@/components/common/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Layers, Plus, Edit3, Tag, ShieldCheck, Check } from 'lucide-react';
import type {
  OrgListType,
  OrgListItem,
  OrgLeadStatusItem,
  LeadStatusGroup,
} from '../types';
import { ORG_LIST_TITLES, LEAD_STATUS_GROUP_LABELS } from '../types';

export interface OrgItemModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  listType: OrgListType;
  item?: OrgListItem | null;
  isLoading?: boolean;
  onClose: () => void;
  onSubmit: (data: {
    label: string;
    key?: string;
    group?: LeadStatusGroup;
    isActive?: boolean;
  }) => Promise<void> | void;
}

export function OrgItemModal({
  isOpen,
  mode,
  listType,
  item = null,
  isLoading = false,
  onClose,
  onSubmit,
}: OrgItemModalProps) {
  const isLeadStatusList = listType === 'lead_statuses';

  const [label, setLabel] = React.useState('');
  const [key, setKey] = React.useState('');
  const [group, setGroup] = React.useState<LeadStatusGroup>('open');
  const [isActive, setIsActive] = React.useState(true);
  const [errors, setErrors] = React.useState<{ label?: string; key?: string }>({});

  // همگام‌سازی وضعیت اولیه فرم هنگام باز شدن یا تغییر آیتم
  React.useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && item) {
        setLabel(item.label || '');
        setKey(item.key || '');
        setIsActive(item.isActive ?? true);
        if (isLeadStatusList && (item as OrgLeadStatusItem).group) {
          setGroup((item as OrgLeadStatusItem).group);
        } else {
          setGroup('open');
        }
      } else {
        setLabel('');
        setKey('');
        setGroup('open');
        setIsActive(true);
      }
      setErrors({});
    }
  }, [isOpen, mode, item, isLeadStatusList]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedLabel = label.trim();
    const newErrors: { label?: string; key?: string } = {};

    if (!trimmedLabel) {
      newErrors.label = 'عنوان گزینه الزامی است و نمی‌تواند خالی باشد.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    await onSubmit({
      label: trimmedLabel,
      ...(mode === 'create' && key.trim() ? { key: key.trim() } : {}),
      ...(isLeadStatusList ? { group } : {}),
      isActive,
    });
  };

  const titleText =
    mode === 'create'
      ? `افزودن گزینه جدید به ${ORG_LIST_TITLES[listType]}`
      : `ویرایش مشخصات «${item?.label || ''}»`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-slate-900" dir="rtl">
          {mode === 'create' ? (
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <Plus size={18} />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Edit3 size={18} />
            </div>
          )}
          <span className="font-bold text-sm sm:text-base">{titleText}</span>
        </div>
      }
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1" dir="rtl">
        {/* ۱. فیلد عنوان گزینه */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">
            عنوان گزینه <span className="text-rose-500">*</span>
          </label>
          <Input
            value={label}
            onChange={(e) => {
              setLabel(e.target.value);
              if (errors.label) setErrors((prev) => ({ ...prev, label: undefined }));
            }}
            placeholder="مثال: تبلیغات در پیام‌رسان‌ها، لید وبینار و ..."
            disabled={isLoading}
            className={`text-xs sm:text-sm ${errors.label ? 'border-rose-400 focus:ring-rose-200' : ''}`}
            autoFocus
          />
          {errors.label && (
            <p className="text-[11px] text-rose-600 font-medium">{errors.label}</p>
          )}
        </div>

        {/* ۲. فیلد کلید سیستمی */}
        {mode === 'create' ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">
                کلید سیستمی (اختیاری)
              </label>
              <span className="text-[10px] text-slate-400">فقط حروف انگلیسی و خط تیره (_)</span>
            </div>
            <Input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="مثال: messenger_ads (در صورت خالی بودن خودکار ساخته می‌شود)"
              disabled={isLoading}
              dir="ltr"
              className="text-xs font-mono text-left"
            />
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Tag size={13} className="text-slate-400" />
              <span>کلید سیستمی پایدار:</span>
            </span>
            <span className="font-mono text-slate-800 font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
              {item?.key}
            </span>
          </div>
        )}

        {/* ۳. انتخاب گروه وضعیت (صرفاً برای فهرست وضعیتهای لید) */}
        {isLeadStatusList && (
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-purple-600" />
                <span>گروه وضعیت لید</span>
                <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-slate-400">الزام سند محصول (صفحه ۲۳)</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setGroup('open')}
                disabled={isLoading}
                className={`p-2.5 rounded-xl border text-right transition-all flex flex-col justify-between gap-1 cursor-pointer ${
                  group === 'open'
                    ? 'border-blue-500 bg-blue-50/70 text-blue-900 ring-2 ring-blue-100'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{LEAD_STATUS_GROUP_LABELS.open}</span>
                  {group === 'open' && <Check size={13} className="text-blue-600" />}
                </div>
                <span className="text-[10px] text-slate-400">لیدهای جاری پیگیری</span>
              </button>

              <button
                type="button"
                onClick={() => setGroup('won')}
                disabled={isLoading}
                className={`p-2.5 rounded-xl border text-right transition-all flex flex-col justify-between gap-1 cursor-pointer ${
                  group === 'won'
                    ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 ring-2 ring-emerald-100'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{LEAD_STATUS_GROUP_LABELS.won}</span>
                  {group === 'won' && <Check size={13} className="text-emerald-600" />}
                </div>
                <span className="text-[10px] text-slate-400">تبدیل به مشتری</span>
              </button>

              <button
                type="button"
                onClick={() => setGroup('lost')}
                disabled={isLoading}
                className={`p-2.5 rounded-xl border text-right transition-all flex flex-col justify-between gap-1 cursor-pointer ${
                  group === 'lost'
                    ? 'border-rose-500 bg-rose-50/70 text-rose-900 ring-2 ring-rose-100'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{LEAD_STATUS_GROUP_LABELS.lost}</span>
                  {group === 'lost' && <Check size={13} className="text-rose-600" />}
                </div>
                <span className="text-[10px] text-slate-400">ردشده یا انصرافی</span>
              </button>
            </div>
          </div>
        )}

        {/* ۴. وضعیت فعال یا غیرفعال */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-800 block">وضعیت در سامانه</span>
            <span className="text-[11px] text-slate-500">
              {isActive
                ? 'گزینه فعال بوده و در فرم‌های ثبت جدید نمایش داده می‌شود.'
                : 'گزینه غیرفعال است و فقط برای نمایش سوابق قبلی حفظ می‌شود.'}
            </span>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              disabled={isLoading}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
          </label>
        </div>

        {/* دکمه‌های اقدام */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
            className="text-xs"
          >
            انصراف
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isLoading}
            className="text-xs bg-purple-600 hover:bg-purple-700 text-white min-w-[90px]"
          >
            {isLoading ? 'در حال ذخیره...' : mode === 'create' ? 'ایجاد گزینه' : 'ذخیره تغییرات'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
