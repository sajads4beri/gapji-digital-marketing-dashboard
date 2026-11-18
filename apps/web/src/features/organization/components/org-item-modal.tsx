'use client';

import * as React from 'react';
import { Modal } from '@/components/common/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
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
        <div className="flex items-center gap-2.5 text-slate-100" dir="rtl">
          {mode === 'create' ? (
            <div className="w-8 h-8 rounded-xl bg-[#719BDF]/15 text-[#719BDF] border border-[#719BDF]/30 flex items-center justify-center shrink-0">
              <Plus size={18} />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-[#719BDF]/15 text-[#719BDF] border border-[#719BDF]/30 flex items-center justify-center shrink-0">
              <Edit3 size={18} />
            </div>
          )}
          <span className="font-bold text-sm sm:text-base font-display">{titleText}</span>
        </div>
      }
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1 text-slate-100" dir="rtl">
        {/* ۱. فیلد عنوان گزینه */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-200">
            عنوان گزینه <span className="text-[#D66B73]">*</span>
          </label>
          <Input
            value={label}
            onChange={(e) => {
              setLabel(e.target.value);
              if (errors.label) setErrors((prev) => ({ ...prev, label: undefined }));
            }}
            placeholder="مثال: تبلیغات در پیام‌رسان‌ها، لید وبینار و ..."
            disabled={isLoading}
            className={`text-xs sm:text-sm bg-[#0B1423] border-[#1F2E45] text-slate-100 placeholder:text-slate-500 ${
              errors.label ? 'border-[#D66B73] focus:ring-[#D66B73]/20' : ''
            }`}
            autoFocus
          />
          {errors.label && (
            <p className="text-[11px] text-[#D66B73] font-medium">{errors.label}</p>
          )}
        </div>

        {/* ۲. فیلد کلید سیستمی */}
        {mode === 'create' ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-200">
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
              className="text-xs font-mono text-left bg-[#0B1423] border-[#1F2E45] text-slate-100 placeholder:text-slate-500"
            />
          </div>
        ) : (
          <div className="bg-[#18263A] border border-[#1F2E45] rounded-xl p-3 flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Tag size={13} className="text-[#719BDF]" />
              <span>کلید سیستمی پایدار:</span>
            </span>
            <span className="font-mono text-slate-200 font-bold bg-[#111D2E] px-2.5 py-0.5 rounded border border-[#1F2E45]">
              {item?.key}
            </span>
          </div>
        )}

        {/* ۳. انتخاب گروه وضعیت (صرفاً برای فهرست وضعیتهای لید) */}
        {isLeadStatusList && (
          <div className="space-y-2 pt-2 border-t border-[#1F2E45]">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-[#719BDF]" />
                <span>گروه وضعیت لید</span>
                <span className="text-[#D66B73]">*</span>
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
                    ? 'border-[#719BDF] bg-[#18263A] text-sky-300 ring-1 ring-[#719BDF]/40'
                    : 'border-[#1F2E45] bg-[#0B1423] hover:bg-[#18263A] text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{LEAD_STATUS_GROUP_LABELS.open}</span>
                  {group === 'open' && <Check size={13} className="text-[#719BDF]" />}
                </div>
                <span className="text-[10px] text-slate-400">لیدهای جاری پیگیری</span>
              </button>

              <button
                type="button"
                onClick={() => setGroup('won')}
                disabled={isLoading}
                className={`p-2.5 rounded-xl border text-right transition-all flex flex-col justify-between gap-1 cursor-pointer ${
                  group === 'won'
                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/40'
                    : 'border-[#1F2E45] bg-[#0B1423] hover:bg-[#18263A] text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{LEAD_STATUS_GROUP_LABELS.won}</span>
                  {group === 'won' && <Check size={13} className="text-emerald-400" />}
                </div>
                <span className="text-[10px] text-slate-400">تبدیل به مشتری</span>
              </button>

              <button
                type="button"
                onClick={() => setGroup('lost')}
                disabled={isLoading}
                className={`p-2.5 rounded-xl border text-right transition-all flex flex-col justify-between gap-1 cursor-pointer ${
                  group === 'lost'
                    ? 'border-[#D66B73] bg-[#D66B73]/15 text-[#D66B73] ring-1 ring-[#D66B73]/40'
                    : 'border-[#1F2E45] bg-[#0B1423] hover:bg-[#18263A] text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{LEAD_STATUS_GROUP_LABELS.lost}</span>
                  {group === 'lost' && <Check size={13} className="text-[#D66B73]" />}
                </div>
                <span className="text-[10px] text-slate-400">ردشده یا انصرافی</span>
              </button>
            </div>
          </div>
        )}

        {/* ۴. وضعیت فعال یا غیرفعال */}
        <div className="pt-2 border-t border-[#1F2E45] flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-200 block">وضعیت در سامانه</span>
            <span className="text-[11px] text-slate-400">
              {isActive
                ? 'گزینه فعال بوده و در فرم‌های ثبت جدید نمایش داده می‌شود.'
                : 'گزینه غیرفعال است و فقط برای نمایش سوابق قبلی حفظ می‌شود.'}
            </span>
          </div>

          <Switch
            id="item-active-status"
            checked={isActive}
            onCheckedChange={setIsActive}
            disabled={isLoading}
          />
        </div>

        {/* دکمه‌های اقدام */}
        <div className="pt-3 border-t border-[#1F2E45] flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
            className="text-xs border-[#1F2E45] bg-[#18263A] text-slate-300 hover:bg-[#1F2E45]"
          >
            انصراف
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isLoading}
            className="text-xs bg-gradient-to-r from-[#719BDF] to-[#3B82F6] hover:from-[#5e8bd8] hover:to-[#2563eb] text-white min-w-[90px] border-0 shadow-[0_0_15px_rgba(113,155,223,0.25)]"
          >
            {isLoading ? 'در حال ذخیره...' : mode === 'create' ? 'ایجاد گزینه' : 'ذخیره تغییرات'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
