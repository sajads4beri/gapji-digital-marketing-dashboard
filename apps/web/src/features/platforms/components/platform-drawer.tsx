'use client';

import * as React from 'react';
import {
  Layers,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  Loader2,
  Table,
  Sliders,
  ChevronDown,
} from 'lucide-react';
import { Drawer } from '@/components/common/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/common/toast-provider';
import {
  Platform,
  PlatformTemplate,
  PlatformRetrievalMethod,
  PlatformInputDefinition,
  PlatformOutputColumn,
  CreatePlatformInput,
  UpdatePlatformInput,
} from '../types';
import { platformsApi } from '../platforms.api';

export interface PlatformDrawerProps {
  isOpen: boolean;
  platform: Platform | null;
  templates: PlatformTemplate[];
  onClose: () => void;
  onSuccess: (savedPlatform: Platform) => void;
}

const CATEGORY_OPTIONS = [
  { value: 'digital', label: 'تبلیغات دیجیتال و کلیکی' },
  { value: 'search_ads', label: 'تبلیغات جستجو (Search Ads)' },
  { value: 'social', label: 'شبکه‌های اجتماعی (Social Media)' },
  { value: 'ad_network', label: 'شبکه‌های تبلیغاتی و همسان' },
  { value: 'sms', label: 'ارسال پیامک انبوه' },
  { value: 'video', label: 'ویدیویی و یوتیوب' },
  { value: 'classifieds', label: 'نیازمندی‌ها و آگهی (دیوار، شیپور)' },
  { value: 'other', label: 'سایر کانال‌های بازاریابی' },
];

const STANDARD_REPORT_COLUMNS: PlatformOutputColumn[] = [
  { key: 'cost', label: 'کل هزینه پرداختی (تومان)' },
  { key: 'impressions', label: 'تعداد نمایش (Impressions)' },
  { key: 'clicks', label: 'تعداد کلیک‌های دریافتی' },
  { key: 'ctr', label: 'نرخ کلیک تبلیغ (CTR)' },
  { key: 'cpc', label: 'میانگین هزینه هر کلیک (CPC)' },
  { key: 'conversions', label: 'تعداد تبدیل (Conversions)' },
  { key: 'leads', label: 'تعداد سرنخ‌های جذب‌شده (Leads)' },
  { key: 'revenue', label: 'درآمد تخمینی فروش' },
  { key: 'roas', label: 'نرخ بازگشت هزینه تبلیغات (ROAS)' },
];

export function PlatformDrawer({
  isOpen,
  platform,
  templates,
  onClose,
  onSuccess,
}: PlatformDrawerProps) {
  const { toast } = useToast();
  const isEditing = !!platform;

  // انتخاب نحوه ایجاد: قالب آماده یا پیکربندی خالی
  const [creationMode, setCreationMode] = React.useState<'template' | 'custom'>('template');
  const [selectedTemplateId, setSelectedTemplateId] = React.useState<string>('');

  // مشخصات اصلی پلتفرم
  const [name, setName] = React.useState('');
  const [category, setCategory] = React.useState('digital');
  const [retrievalMethod, setRetrievalMethod] = React.useState<PlatformRetrievalMethod>('manual');

  // بخش ورودی‌ها (Inputs)
  const [inputs, setInputs] = React.useState<PlatformInputDefinition[]>([]);

  // بخش خروجی‌ها (Outputs)
  const [outputs, setOutputs] = React.useState<PlatformOutputColumn[]>([]);

  // وضعیت و خطاهای فرم
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<{ name?: string }>({});
  const [activeSection, setActiveSection] = React.useState<'inputs' | 'outputs'>('inputs');

  // مقداردهی اولیه فرم هنگام باز شدن
  React.useEffect(() => {
    if (!isOpen) return;

    if (platform) {
      // حالت ویرایش
      setName(platform.name);
      setCategory(platform.category);
      setRetrievalMethod(platform.retrievalMethod);
      setInputs(platform.inputs ? [...platform.inputs] : []);
      setOutputs(platform.outputs ? [...platform.outputs] : []);
      setErrors({});
    } else {
      // حالت افزودن جدید
      setCreationMode(templates.length > 0 ? 'template' : 'custom');
      const firstTpl = templates[0];
      if (firstTpl && templates.length > 0) {
        setSelectedTemplateId(firstTpl.id);
        setName(firstTpl.name);
        setCategory(firstTpl.category);
        setRetrievalMethod(firstTpl.retrievalMethod);
        setInputs([...firstTpl.defaultInputs]);
        setOutputs([...firstTpl.defaultOutputs]);
      } else {
        setSelectedTemplateId('');
        setName('');
        setCategory('digital');
        setRetrievalMethod('manual');
        setInputs([
          { name: 'مبلغ هزینه', key: 'spend', dataType: 'number', isRequired: true },
        ]);
        setOutputs([
          { key: 'cost', label: 'کل هزینه پرداختی (تومان)' },
          { key: 'clicks', label: 'تعداد کلیک‌های دریافتی' },
        ]);
      }
      setErrors({});
    }
    setActiveSection('inputs');
  }, [isOpen, platform, templates]);

  // تغییر قالب انتخابی
  const handleSelectTemplate = (tplId: string) => {
    setSelectedTemplateId(tplId);
    const tpl = templates.find((t) => t.id === tplId);
    if (tpl) {
      setName(tpl.name);
      setCategory(tpl.category);
      setRetrievalMethod(tpl.retrievalMethod);
      setInputs([...tpl.defaultInputs]);
      setOutputs([...tpl.defaultOutputs]);
    }
  };

  // سوئیچ به حالت پیکربندی خالی
  const handleSwitchToCustom = () => {
    setCreationMode('custom');
    setSelectedTemplateId('');
    setName('');
    setCategory('digital');
    setRetrievalMethod('manual');
    setInputs([
      { name: 'مبلغ هزینه', key: 'spend', dataType: 'number', isRequired: true },
    ]);
    setOutputs([
      { key: 'cost', label: 'کل هزینه پرداختی (تومان)' },
      { key: 'clicks', label: 'تعداد کلیک‌های دریافتی' },
    ]);
  };

  // افزودن فیلد ورودی جدید
  const handleAddInput = () => {
    const newIndex = inputs.length + 1;
    const key = `field_${Date.now().toString(36).slice(-4)}`;
    setInputs([
      ...inputs,
      {
        name: `فیلد ورودی ${newIndex}`,
        key,
        dataType: 'text',
        isRequired: false,
      },
    ]);
  };

  // ویرایش فیلد ورودی
  const handleUpdateInput = (index: number, patch: Partial<PlatformInputDefinition>) => {
    const updated = [...inputs];
    updated[index] = { ...updated[index], ...patch };
    setInputs(updated);
  };

  // حذف فیلد ورودی
  const handleRemoveInput = (index: number) => {
    setInputs(inputs.filter((_, i) => i !== index));
  };

  // تاگل ستون خروجی گزارش
  const handleToggleOutput = (col: PlatformOutputColumn) => {
    const exists = outputs.some((o) => o.key === col.key);
    if (exists) {
      if (outputs.length <= 1) {
        toast.error('حداقل یک ستون گزارش باید برای پلتفرم فعال باشد.');
        return;
      }
      setOutputs(outputs.filter((o) => o.key !== col.key));
    } else {
      setOutputs([...outputs, col]);
    }
  };

  // ارسال فرم
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setErrors({ name: 'نام پلتفرم الزامی است.' });
      toast.error('لطفاً نام پلتفرم را وارد نمایید.');
      return;
    }

    if (inputs.some((inp) => !inp.name.trim() || !inp.key.trim())) {
      toast.error('تمام فیلدهای ورودی باید دارای نام معتبر باشند.');
      return;
    }

    if (outputs.length === 0) {
      toast.error('حداقل یک ستون خروجی برای قالب گزارش پلتفرم تعیین نمایید.');
      return;
    }

    try {
      setIsSubmitting(true);

      if (isEditing) {
        const updatePayload: UpdatePlatformInput = {
          name: name.trim(),
          category,
          retrievalMethod,
          inputs,
          outputs,
        };
        const saved = await platformsApi.updatePlatform(platform.id, updatePayload);
        toast.success(`پلتفرم «${saved.name}» با موفقیت به‌روزرسانی شد.`);
        onSuccess(saved);
        onClose();
      } else {
        const createPayload: CreatePlatformInput = {
          name: name.trim(),
          category,
          retrievalMethod,
          templateId: creationMode === 'template' ? selectedTemplateId : undefined,
          inputs,
          outputs,
        };
        const saved = await platformsApi.createPlatform(createPayload);
        toast.success(`پلتفرم جدید «${saved.name}» با موفقیت تعریف گردید.`);
        onSuccess(saved);
        onClose();
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'خطا در ثبت پلتفرم.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={isSubmitting ? () => {} : onClose}
      size="xl"
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#719BDF]/10 text-[#719BDF] flex items-center justify-center border border-[#719BDF]/20">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {isEditing ? `ویرایش پلتفرم: ${platform.name}` : 'تعریف پلتفرم تبلیغاتی جدید'}
            </h3>
            <p className="text-xs text-slate-400">
              پیکربندی کانال‌های تبلیغاتی، ساختار ورودی‌ها و ستون‌های قالب گزارش (REQ-19)
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-xs bg-[#0B1423] border-[#1F2E45] text-slate-300 hover:text-white hover:bg-[#18263A]"
          >
            انصراف
          </Button>

          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="text-xs font-semibold bg-[#719BDF] hover:bg-[#5A85C9] text-white shadow-md shadow-[#719BDF]/20"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>در حال ذخیره...</span>
              </span>
            ) : (
              <span>{isEditing ? 'ذخیره تغییرات' : 'ایجاد پلتفرم'}</span>
            )}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
        {/* انتخاب روش ایجاد در حالت افزودن پلتفرم (قالب آماده در برابر پیکربندی خالی) */}
        {!isEditing && (
          <div className="space-y-3 p-4 rounded-2xl border border-[#1F2E45] bg-[#0B1423]/70">
            <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#719BDF]" />
              <span>روش تعریف پلتفرم:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setCreationMode('template');
                  if (templates.length > 0) handleSelectTemplate(templates[0].id);
                }}
                className={`flex items-start gap-3 p-3.5 rounded-xl border text-right transition-all cursor-pointer ${
                  creationMode === 'template'
                    ? 'border-[#719BDF] bg-[#18263A] text-white ring-1 ring-[#719BDF]/40'
                    : 'border-[#1F2E45] bg-[#0E1726] text-slate-300 hover:bg-[#18263A]/60'
                }`}
              >
                <div className="w-4 h-4 rounded-full border border-[#1F2E45] flex items-center justify-center mt-0.5 shrink-0 bg-[#0B1423]">
                  {creationMode === 'template' && <div className="w-2 h-2 rounded-full bg-[#719BDF]" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-100">انتخاب از قالب‌های آماده سامانه</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    الگوهای استاندارد برای گوگل ادز، یکتانت، اینستاگرام، پیامک و دیوار
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={handleSwitchToCustom}
                className={`flex items-start gap-3 p-3.5 rounded-xl border text-right transition-all cursor-pointer ${
                  creationMode === 'custom'
                    ? 'border-[#719BDF] bg-[#18263A] text-white ring-1 ring-[#719BDF]/40'
                    : 'border-[#1F2E45] bg-[#0E1726] text-slate-300 hover:bg-[#18263A]/60'
                }`}
              >
                <div className="w-4 h-4 rounded-full border border-[#1F2E45] flex items-center justify-center mt-0.5 shrink-0 bg-[#0B1423]">
                  {creationMode === 'custom' && <div className="w-2 h-2 rounded-full bg-[#719BDF]" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-100">پیکربندی خالی (Empty Configuration)</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    تعریف کامل فیلدها، دسته‌بندی و ورودی/خروجی‌ها از ابتدا توسط کاربر
                  </div>
                </div>
              </button>
            </div>

            {/* در صورت انتخاب قالب آماده، دراپ‌داون قالب‌ها نمایش می‌یابد */}
            {creationMode === 'template' && templates.length > 0 && (
              <div className="pt-2">
                <Select
                  label="قالب آماده مورد نظر را انتخاب کنید:"
                  value={selectedTemplateId}
                  onChange={(e) => handleSelectTemplate(e.target.value)}
                  options={templates.map((tpl) => ({
                    value: tpl.id,
                    label: `${tpl.name} — (${tpl.categoryLabel})`,
                  }))}
                />
              </div>
            )}
          </div>
        )}

        {/* مشخصات اصلی پلتفرم */}
        <div className="space-y-4">
          <div className="text-xs font-bold text-slate-200 border-b border-[#1F2E45] pb-2">
            مشخصات عمومی پلتفرم
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                نام پلتفرم <span className="text-rose-400">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors({});
                }}
                placeholder="مثال: گوگل ادز، صباویژن، اینستاگرام..."
                className="text-xs bg-[#0B1423] border-[#1F2E45] text-white placeholder:text-slate-500"
              />
              {errors.name && <p className="text-[11px] text-rose-400 mt-1">{errors.name}</p>}
            </div>

            <div>
              <Select
                label="نوع / دسته‌بندی پلتفرم"
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                options={CATEGORY_OPTIONS}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              روش دریافت داده (Data Collection Method) <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { value: 'manual', label: 'دستی (Manual)', desc: 'ثبت مستقیم در فرم هزینه‌ها' },
                { value: 'import', label: 'Import (فایل)', desc: 'بارگذاری با فایل اکسل یا CSV' },
                { value: 'api', label: 'API (همگام‌سازی)', desc: 'پیکربندی اتصال وب‌سرویس' },
              ].map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setRetrievalMethod(m.value as PlatformRetrievalMethod)}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    retrievalMethod === m.value
                      ? 'border-[#719BDF] bg-[#18263A] text-white font-bold ring-1 ring-[#719BDF]/40'
                      : 'border-[#1F2E45] bg-[#0B1423] text-slate-400 hover:bg-[#18263A]/40'
                  }`}
                >
                  <div className="text-xs">{m.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 truncate">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* دو بخش کاملاً مجزا طبق سند: ورودی‌ها (Inputs) و خروجی‌ها (Outputs) */}
        <div className="space-y-4 pt-2">
          {/* نوار جابجایی بین دو بخش */}
          <div className="flex items-center gap-2 border-b border-[#1F2E45] pb-2">
            <button
              type="button"
              onClick={() => setActiveSection('inputs')}
              className={`flex items-center gap-2 text-xs px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                activeSection === 'inputs'
                  ? 'bg-[#719BDF] text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-[#18263A]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>بخش اول: ورودی‌ها (Inputs)</span>
              <span className="text-[10px] bg-black/25 px-1.5 py-0.2 rounded-full font-mono">
                {inputs.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('outputs')}
              className={`flex items-center gap-2 text-xs px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                activeSection === 'outputs'
                  ? 'bg-[#719BDF] text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-[#18263A]'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>بخش دوم: خروجی‌ها (Outputs)</span>
              <span className="text-[10px] bg-black/25 px-1.5 py-0.2 rounded-full font-mono">
                {outputs.length}
              </span>
            </button>
          </div>

          {/* تب اول: ورودی‌ها (Inputs) */}
          {activeSection === 'inputs' && (
            <div className="space-y-3.5 animate-in fade-in-50 duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">
                    فهرست فیلدهای ورودی قابل پیکربندی
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    تعیین فیلدهایی که کاربر هنگام ثبت هزینه، ایمپورت یا تخصیص به این پلتفرم باید تکمیل کند
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddInput}
                  className="text-xs border-[#719BDF]/30 text-[#719BDF] hover:bg-[#719BDF]/10 bg-[#0B1423]"
                >
                  <Plus className="w-3.5 h-3.5 me-1" />
                  افزودن فیلد جدید
                </Button>
              </div>

              {inputs.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-[#1F2E45] rounded-xl bg-[#0B1423]/40">
                  هنوز فیلد ورودی تعریف نشده است. با کلیک روی «افزودن فیلد جدید» اقدام نمایید.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {inputs.map((inp, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-[#1F2E45] bg-[#0B1423] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 flex-1 w-full">
                        {/* نام فیلد */}
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1">نام فیلد</label>
                          <Input
                            value={inp.name}
                            onChange={(e) => handleUpdateInput(idx, { name: e.target.value })}
                            placeholder="مثال: تعداد کلیک"
                            className="text-xs h-8 bg-[#0E1726] border-[#1F2E45] text-white"
                          />
                        </div>

                        {/* نوع داده */}
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1">نوع داده</label>
                          <div className="relative">
                            <select
                              value={inp.dataType}
                              onChange={(e) =>
                                handleUpdateInput(idx, {
                                  dataType: e.target.value as 'text' | 'number' | 'date' | 'boolean',
                                })
                              }
                              className="w-full text-xs h-8 rounded-lg border border-[#1F2E45] bg-[#0E1726] ps-2 pe-6 text-white appearance-none focus:outline-hidden focus:ring-1 focus:ring-[#719BDF]/50 cursor-pointer"
                            >
                              <option value="number" className="bg-[#0B1423] text-white">عددی (Number)</option>
                              <option value="text" className="bg-[#0B1423] text-white">متن (Text)</option>
                              <option value="date" className="bg-[#0B1423] text-white">تاریخ (Date)</option>
                              <option value="boolean" className="bg-[#0B1423] text-white">بولی (Boolean)</option>
                            </select>
                            <div className="absolute inset-y-0 left-0 flex items-center pe-2 pointer-events-none text-slate-400">
                              <ChevronDown size={12} />
                            </div>
                          </div>
                        </div>

                        {/* وضعیت اجباری / اختیاری */}
                        <div className="flex items-center gap-2 pt-4">
                          <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={inp.isRequired}
                              onChange={(e) => handleUpdateInput(idx, { isRequired: e.target.checked })}
                              className="rounded border-[#1F2E45] bg-[#0E1726] text-[#719BDF] focus:ring-[#719BDF]"
                            />
                            <span>الزامی (اجباری)</span>
                          </label>
                        </div>
                      </div>

                      {/* دکمه حذف فیلد */}
                      <button
                        type="button"
                        onClick={() => handleRemoveInput(idx)}
                        title="حذف فیلد"
                        className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors self-end sm:self-center cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* تب دوم: خروجی‌ها (Outputs) */}
          {activeSection === 'outputs' && (
            <div className="space-y-3.5 animate-in fade-in-50 duration-200">
              <div>
                <h4 className="text-xs font-bold text-white">
                  ستون‌های قالب گزارش پلتفرم (Report Template Columns)
                </h4>
                <p className="text-[11px] text-slate-400">
                  ستون‌هایی که در گزارش‌های تجمیعی و جدول تحلیلی این پلتفرم نمایش داده می‌شوند را انتخاب کنید
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {STANDARD_REPORT_COLUMNS.map((col) => {
                  const isChecked = outputs.some((o) => o.key === col.key);

                  return (
                    <label
                      key={col.key}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-right cursor-pointer transition-all ${
                        isChecked
                          ? 'border-[#719BDF]/60 bg-[#18263A] text-white ring-1 ring-[#719BDF]/30'
                          : 'border-[#1F2E45] bg-[#0B1423] text-slate-300 hover:bg-[#18263A]/40'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleOutput(col)}
                        className="rounded border-[#1F2E45] bg-[#0E1726] text-[#719BDF] focus:ring-[#719BDF] w-4 h-4"
                      />
                      <div className="flex-1">
                        <div className="text-xs font-semibold">{col.label}</div>
                        <div className="text-[10px] font-mono text-slate-400">{col.key}</div>
                      </div>
                      {isChecked && <CheckCircle2 className="w-4 h-4 text-[#719BDF] shrink-0" />}
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </form>
    </Drawer>
  );
}
