'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/common';
import { CampaignFormData, ExtendedCampaign } from '../../types';
import {
  getDefaultCampaignFormData,
  saveWizardDraft,
  getWizardDraft,
  clearWizardDraft,
} from '../../utils/wizard-storage';
import { campaignService } from '../../api';
import { WizardStepper, WIZARD_STEPS } from './wizard-stepper';
import { WizardLiveSummary } from './wizard-live-summary';
import { WizardBottomBar } from './wizard-bottom-bar';
import { Step1BasicInfo } from './steps/step-1-basic-info';
import { Step2Audience } from './steps/step-2-audience';
import { Step3Platforms } from './steps/step-3-platforms';
import { Step4Kpis } from './steps/step-4-kpis';
import { Step5LandingUtm } from './steps/step-5-landing-utm';
import { Step6Review } from './steps/step-6-review';
import {
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
} from 'lucide-react';

interface CampaignWizardProps {
  initialCampaignId?: string;
  mode?: 'create' | 'edit';
  onCancel?: () => void;
}

export function CampaignWizard({
  initialCampaignId,
  mode = 'create',
  onCancel,
}: CampaignWizardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [formData, setFormData] = useState<CampaignFormData>(getDefaultCampaignFormData());
  const [completedSteps, setCompletedSteps] = useState<number[]>([1]);
  const [hasDraftNotice, setHasDraftNotice] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [draftCampaignId, setDraftCampaignId] = useState<string | null>(
    initialCampaignId || null,
  );
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingExisting, setIsLoadingExisting] = useState(mode === 'edit');
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // مرجع به‌روز از وضعیت فرم جهت ذخیره خودکار ۳۰ ثانیه‌ای
  const formDataRef = useRef(formData);
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // ۱. در حالت ویرایش: بارگذاری داده‌های قبلی کمپین موجود
  useEffect(() => {
    if (mode === 'edit' && initialCampaignId) {
      setIsLoadingExisting(true);
      campaignService
        .getById(initialCampaignId)
        .then((existing) => {
          if (existing) {
            setFormData({
              currentStep: 1,
              name: existing.name || '',
              objective: existing.objective || 'lead_generation',
              channel: existing.channel || 'چندکاناله (Omnichannel)',
              status: existing.status || 'active',
              budget: existing.budget || 50_000_000,
              startDate: existing.startDate || new Date().toISOString().split('T')[0],
              endDate: existing.endDate || new Date().toISOString().split('T')[0],
              description: existing.description || '',
              ownerName: existing.owner?.name || '',
              targetAudience: existing.targetAudience || {
                ageRanges: ['25-34'],
                gender: 'all',
                locations: ['تهران', 'اصفهان'],
                interests: ['دیجیتال مارکتینگ'],
                estimatedReach: 450_000,
                selectedAudienceIds: Array.isArray((existing as any).targetAudienceIds) && (existing as any).targetAudienceIds.length > 0
                  ? (existing as any).targetAudienceIds
                  : [],
              },
              platforms: existing.platforms || [
                {
                  platformId: 'google_ads',
                  name: 'گوگل ادز (Google Ads)',
                  allocatedBudget: existing.budget,
                  percentage: 100,
                  enabled: true,
                },
              ],
              targetKpis: existing.targetKpis || {
                targetCpa: existing.cpl || 45_000,
                targetClicks: existing.clicks || 12_500,
                targetConversions: existing.conversions || 450,
                targetCtr: 3.8,
                selectedKpiItems: [
                  {
                    id: 'kpi_cpa',
                    name: 'هزینه هر تبدیل یا لید (CPA)',
                    unit: 'تومان',
                    targetValue: existing.cpl || 45_000,
                  },
                ],
              },
              trackingUtm: existing.trackingUtm || {
                landingUrl: 'https://gapji.ir/landing/autumn-sale',
                utmSource: 'google',
                utmMedium: 'cpc',
                utmCampaign: (existing.name || 'campaign')
                  .toLowerCase()
                  .replace(/\s+/g, '_'),
              },
            });
            // در حالت ویرایش، کاربر می‌تواند به همه مراحل آزادانه دسترسی داشته باشد
            setCompletedSteps([1, 2, 3, 4, 5, 6]);
          }
        })
        .catch((err) => {
          console.error('Error fetching campaign for edit:', err);
          toast.error('خطا در بارگذاری اطلاعات کمپین جهت ویرایش.');
        })
        .finally(() => {
          setIsLoadingExisting(false);
        });
    }
  }, [mode, initialCampaignId]);

  // ۲. در حالت ساخت جدید: کنترل امن SSR و بررسی وجود پیش‌نویس موقت
  useEffect(() => {
    if (mode === 'create') {
      const existingDraft = getWizardDraft();
      if (existingDraft && (existingDraft.name || existingDraft.budget)) {
        setHasDraftNotice(true);
        if (existingDraft._savedAt) {
          try {
            const date = new Date(existingDraft._savedAt);
            setDraftSavedAt(
              new Intl.DateTimeFormat('fa-IR', {
                dateStyle: 'medium',
                timeStyle: 'short',
              }).format(date),
            );
          } catch {
            setDraftSavedAt(existingDraft._savedAt);
          }
        }
      }
    }
  }, [mode]);

  // ۳. ذخیره خودکار هر ۳۰ ثانیه (فقط در حالت ساخت کمپین جدید)
  useEffect(() => {
    if (mode !== 'create') return;

    const autoSaveInterval = setInterval(() => {
      const currentData = formDataRef.current;
      if (currentData.name && currentData.name.trim()) {
        saveWizardDraft(currentData);
      }
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [mode]);

  // به‌روزرسانی فیلدهای فرم
  const updateFormData = useCallback((partial: Partial<CampaignFormData>) => {
    setFormData((prev) => ({
      ...prev,
      ...partial,
    }));
    // پاکسازی خطاهای فیلدهای تغییریافته
    setStepErrors((prevErrors) => {
      const updated = { ...prevErrors };
      Object.keys(partial).forEach((key) => {
        delete updated[key];
      });
      return updated;
    });
  }, []);

  // بازیابی پیش‌نویس ذخیره‌شده
  const handleRestoreDraft = () => {
    const draft = getWizardDraft();
    if (draft) {
      if (draft._campaignId) {
        setDraftCampaignId(draft._campaignId);
      }
      setFormData((prev) => ({
        ...prev,
        ...draft,
        currentStep: draft.currentStep || prev.currentStep,
      }));
      toast.info('اطلاعات پیش‌نویس با موفقیت بازخوانی شد.');
    }
    setHasDraftNotice(false);
  };

  // انصراف از پیش‌نویس و حذف آن
  const handleDismissDraft = () => {
    clearWizardDraft();
    setHasDraftNotice(false);
  };

  // اعتبارسنجی دقیق هر مرحله
  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.name.trim()) {
        errors.name = 'نام کمپین الزامی است.';
      }
      if (!formData.objective) {
        errors.objective = 'تعیین هدف کلیدی کمپین الزامی است.';
      }
      if (!formData.channel) {
        errors.channel = 'انتخاب نوع/کانال اصلی کمپین الزامی است.';
      }
      if (!formData.budget || formData.budget <= 0) {
        errors.budget = 'بودجه کل کمپین باید مقداری معتبر و بزرگتر از صفر باشد.';
      }
      if (!formData.startDate) {
        errors.startDate = 'تاریخ شروع کمپین الزامی است.';
      }
      if (!formData.endDate) {
        errors.endDate = 'تاریخ پایان کمپین الزامی است.';
      }
      if (formData.startDate && formData.endDate) {
        const start = new Date(formData.startDate).getTime();
        const end = new Date(formData.endDate).getTime();
        if (end < start) {
          errors.endDate = 'تاریخ پایان نمی‌تواند قبل از تاریخ شروع کمپین باشد.';
        }
      }
    } else if (step === 2) {
      const selected = formData.targetAudience?.selectedAudienceIds || [];
      if (selected.length === 0) {
        errors.targetAudience = 'لطفاً حداقل یک دسته مخاطب را برای کمپین انتخاب فرمایید.';
      }
    } else if (step === 3) {
      const activePlatforms = (formData.platforms || []).filter((p) => p.enabled);
      if (activePlatforms.length === 0) {
        errors.platforms = 'حداقل یک پلتفرم تبلیغاتی باید فعال باشد.';
      }
    } else if (step === 4) {
      const selectedKpis = formData.targetKpis?.selectedKpiItems || [];
      if (selectedKpis.length === 0) {
        errors.targetKpis = 'لطفاً حداقل یک شاخص کلیدی عملکرد (KPI) را برای کمپین مشخص کنید.';
      }
    } else if (step === 5) {
      if (!formData.trackingUtm?.landingUrl || !formData.trackingUtm.landingUrl.trim()) {
        errors.landingUrl = 'آدرس صفحه فرود الزامی است.';
      }
    }

    setStepErrors(errors);

    if (Object.keys(errors).length > 0) {
      setFeedbackMessage({
        type: 'error',
        text: 'لطفاً خطاهای مشخص‌شده در فرم را برطرف فرمایید.',
      });
      return false;
    }

    setFeedbackMessage(null);
    return true;
  };

  // رفتن به مرحله بعد
  const handleNextStep = () => {
    if (!validateStep(formData.currentStep)) return;

    setFeedbackMessage(null);
    const nextStep = Math.min(6, formData.currentStep + 1);
    setCompletedSteps((prev) => Array.from(new Set([...prev, formData.currentStep])));
    setFormData((prev) => ({ ...prev, currentStep: nextStep }));

    if (mode === 'create') {
      saveWizardDraft({ ...formData, currentStep: nextStep });
    }
  };

  // بازگشت به مرحله قبل
  const handlePrevStep = () => {
    setFeedbackMessage(null);
    setStepErrors({});
    const prevStep = Math.max(1, formData.currentStep - 1);
    setFormData((prev) => ({ ...prev, currentStep: prevStep }));
  };

  // پرش به یک مرحله با کلیک روی Stepper یا دکمه ویرایش در صفحه مرور
  const handleStepClick = (stepId: number) => {
    if (stepId > formData.currentStep && !validateStep(formData.currentStep)) {
      return;
    }
    setFeedbackMessage(null);
    setStepErrors({});
    setFormData((prev) => ({ ...prev, currentStep: stepId }));
  };

  // ذخیره دستی پیش‌نویس
  const handleSaveDraft = async () => {
    if (isDraftSaving) return;
    setIsDraftSaving(true);
    try {
      const targetId = mode === 'edit' ? initialCampaignId : draftCampaignId;
      if (targetId) {
        // به‌روزرسانی همان کمپین با وضعیت draft
        await campaignService.update(targetId, {
          name: formData.name,
          description: formData.description,
          channel: formData.channel,
          budget: formData.budget,
          startDate: formData.startDate,
          endDate: formData.endDate,
          status: 'draft',
          ownerName: formData.ownerName,
          objective: formData.objective,
          targetAudience: formData.targetAudience,
          platforms: formData.platforms,
          targetKpis: formData.targetKpis,
          trackingUtm: formData.trackingUtm,
        });
        if (mode === 'create') {
          saveWizardDraft({ ...formData, _campaignId: targetId });
        }
        toast.success('پیش‌نویس تغییرات کمپین با موفقیت ذخیره شد.');
      } else {
        // در حالت ساخت جدید: ایجاد رکورد با وضعیت draft و ذخیره شناسه
        if (formData.name.trim()) {
          const created = await campaignService.create({
            name: formData.name,
            description: formData.description,
            channel: formData.channel,
            budget: formData.budget,
            startDate: formData.startDate,
            endDate: formData.endDate,
            status: 'draft',
            ownerName: formData.ownerName,
            objective: formData.objective,
            targetAudience: formData.targetAudience,
            platforms: formData.platforms,
            targetKpis: formData.targetKpis,
            trackingUtm: formData.trackingUtm,
          });
          setDraftCampaignId(created.id);
          saveWizardDraft({ ...formData, _campaignId: created.id });
        } else {
          saveWizardDraft(formData);
        }
        toast.success('پیش‌نویس کمپین با موفقیت ذخیره شد.');
      }
    } catch (err: any) {
      console.error('Error saving draft:', err);
      toast.error(err?.message || 'خطا در ذخیره پیش‌نویس.');
    } finally {
      setTimeout(() => setIsDraftSaving(false), 400);
    }
  };

  // ثبت و انتشار نهایی در مرحله ۶
  const handlePublish = async () => {
    // جلوگیری قاطع از ثبت تکراری با کلیک‌های متوالی
    if (isSubmitting) return;

    // اعتبارسنجی جامع تمامی مراحل ۱ تا ۵ پیش از انتشار نهایی
    for (let s = 1; s <= 5; s++) {
      if (!validateStep(s)) {
        setFormData((prev) => ({ ...prev, currentStep: s }));
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const targetId = mode === 'edit' ? initialCampaignId : draftCampaignId;
      if (targetId) {
        // اگر شناسه دارد (حالت ویرایش یا پیش‌نویس قبلی)، همان را update می‌کنیم و فعال می‌سازیم
        await campaignService.update(targetId, {
          name: formData.name,
          description: formData.description,
          channel: formData.channel,
          budget: formData.budget,
          startDate: formData.startDate,
          endDate: formData.endDate,
          status: 'active',
          ownerName: formData.ownerName,
          objective: formData.objective,
          targetAudience: formData.targetAudience,
          platforms: formData.platforms,
          targetKpis: formData.targetKpis,
          trackingUtm: formData.trackingUtm,
        });

        clearWizardDraft();
        toast.success('کمپین با موفقیت ذخیره و فعال شد.');

        setTimeout(() => {
          router.push(mode === 'edit' ? `/campaigns/${targetId}` : '/campaigns');
        }, 1000);
      } else {
        // ساخت مستقیم برای اولین بار
        await campaignService.create({
          name: formData.name,
          description: formData.description,
          channel: formData.channel,
          budget: formData.budget,
          startDate: formData.startDate,
          endDate: formData.endDate,
          status: 'active',
          ownerName: formData.ownerName,
          objective: formData.objective,
          targetAudience: formData.targetAudience,
          platforms: formData.platforms,
          targetKpis: formData.targetKpis,
          trackingUtm: formData.trackingUtm,
        });

        // پاکسازی پیش‌نویس موقت پس از ثبت موفق
        clearWizardDraft();
        toast.success('کمپین با موفقیت منتشر شد.');

        setTimeout(() => {
          router.push('/campaigns');
        }, 1000);
      }
    } catch (err: any) {
      console.error('Error publishing campaign:', err);
      setIsSubmitting(false);
      toast.error(err?.message || 'خطا در ثبت کمپین. داده‌های شما محفوظ است.');
    }
  };

  if (isLoadingExisting) {
    return (
      <div className="bg-[#111D2E]/80 backdrop-blur-md rounded-2xl border border-[#1F2E45] p-12 text-center shadow-xl">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 size={32} className="animate-spin text-[#719BDF]" />
          <p className="text-sm font-semibold">درحال بارگذاری اطلاعات کمپین جهت ویرایش...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* اعلان وجود پیش‌نویس ذخیره‌شده (فقط در حالت ساخت کمپین جدید) */}
      {hasDraftNotice && mode === 'create' && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl animate-in fade-in">
          <div className="flex items-center gap-2.5 text-xs text-amber-300">
            <RotateCcw size={18} className="text-amber-400 shrink-0" />
            <div>
              <span className="font-bold">پیش‌نویس کمپین تکمیل‌نشده یافت شد!</span>
              {draftSavedAt && (
                <span className="text-amber-400/80 ms-1.5 font-display">
                  (آخرین ذخیره: {draftSavedAt})
                </span>
              )}
              <p className="text-amber-300/70 text-[11px] mt-0.5">
                می‌توانید اطلاعات فرم را به وضعیت آخرین ذخیره خود بازگردانید.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleRestoreDraft}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
            >
              بازیابی پیش‌نویس
            </button>
            <button
              type="button"
              onClick={handleDismissDraft}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-amber-500/20 transition-colors"
              title="نادیده گرفتن و حذف پیش‌نویس"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* پیام بازخورد (Toast / Banner) */}
      {feedbackMessage && (
        <div
          className={`rounded-2xl p-3.5 flex items-center justify-between text-xs border shadow-xl transition-all ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : feedbackMessage.type === 'error'
              ? 'bg-[#D66B73]/10 text-[#D66B73] border-[#D66B73]/30'
              : 'bg-blue-500/10 text-[#719BDF] border-blue-500/30'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-400" />
            ) : feedbackMessage.type === 'error' ? (
              <AlertCircle size={16} className="text-[#D66B73]" />
            ) : (
              <AlertCircle size={16} className="text-[#719BDF]" />
            )}
            <span className="font-semibold">{feedbackMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-400 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* استپر ۶ مرحله‌ای */}
      <WizardStepper
        currentStep={formData.currentStep}
        onStepClick={handleStepClick}
        completedSteps={completedSteps}
      />

      {/* بخش اصلی بدنه و سایدبار زنده */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ستون محتوای مرحله فعلی (۲ ستون) */}
        <div className="lg:col-span-2">
          {formData.currentStep === 1 && (
            <Step1BasicInfo
              formData={formData}
              onUpdateFormData={updateFormData}
              errors={stepErrors}
            />
          )}

          {formData.currentStep === 2 && (
            <Step2Audience
              formData={formData}
              onUpdateFormData={updateFormData}
              errors={stepErrors}
            />
          )}

          {formData.currentStep === 3 && (
            <Step3Platforms
              formData={formData}
              onUpdateFormData={updateFormData}
              errors={stepErrors}
            />
          )}

          {formData.currentStep === 4 && (
            <Step4Kpis
              formData={formData}
              onUpdateFormData={updateFormData}
              errors={stepErrors}
            />
          )}

          {formData.currentStep === 5 && (
            <Step5LandingUtm
              formData={formData}
              onUpdateFormData={updateFormData}
              errors={stepErrors}
            />
          )}

          {formData.currentStep === 6 && (
            <Step6Review
              formData={formData}
              onEditStep={handleStepClick}
            />
          )}
        </div>

        {/* سایدبار خلاصه زنده بودجه و پلتفرم‌ها (۱ ستون) */}
        <div className="lg:col-span-1">
          <WizardLiveSummary formData={formData} />
        </div>
      </div>

      {/* نوار پایین ثابت */}
      <WizardBottomBar
        currentStep={formData.currentStep}
        totalSteps={6}
        isSubmitting={isSubmitting}
        isDraftSaving={isDraftSaving}
        onPrev={handlePrevStep}
        onNext={handleNextStep}
        onSaveDraft={handleSaveDraft}
        onPublish={handlePublish}
      />
    </div>
  );
}
