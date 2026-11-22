'use client';

import React from 'react';
import {
  ChevronRight,
  ChevronLeft,
  Save,
  Rocket,
  Loader2,
} from 'lucide-react';

interface WizardBottomBarProps {
  currentStep: number;
  totalSteps?: number;
  isSubmitting?: boolean;
  isDraftSaving?: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
}

export function WizardBottomBar({
  currentStep,
  totalSteps = 6,
  isSubmitting = false,
  isDraftSaving = false,
  onPrev,
  onNext,
  onSaveDraft,
  onPublish,
}: WizardBottomBarProps) {
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  return (
    <div className="sticky bottom-0 z-20 bg-[#0B1423]/95 backdrop-blur-md border-t border-[#1F2E45] py-3.5 px-6 shadow-2xl">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* دکمه مرحله قبلی */}
        <div>
          <button
            type="button"
            onClick={onPrev}
            disabled={isFirstStep || isSubmitting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border border-[#1F2E45] text-slate-300 bg-[#111D2E] hover:bg-[#18263A] hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight size={16} />
            <span>مرحله قبلی</span>
          </button>
        </div>

        {/* دکمه‌های اکشن مرکزی و راست */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {/* ذخیره پیش‌نویس */}
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={isSubmitting || isDraftSaving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border border-[#1F2E45] text-slate-300 bg-[#18263A] hover:bg-[#1F2E45] hover:text-white transition-colors disabled:opacity-50"
            title="ذخیره وضعیت فعلی فرم در حافظه مرورگر برای تکمیل در آینده"
          >
            {isDraftSaving ? (
              <Loader2 size={15} className="animate-spin text-slate-400" />
            ) : (
              <Save size={15} className="text-slate-400" />
            )}
            <span>{isDraftSaving ? 'درحال ذخیره...' : 'ذخیره پیش‌نویس'}</span>
          </button>

          {/* دکمه بعدی یا انتشار نهایی */}
          {isLastStep ? (
            <button
              type="button"
              onClick={onPublish}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>درحال ثبت کمپین...</span>
                </>
              ) : (
                <>
                  <Rocket size={16} />
                  <span>تأیید نهایی و انتشار کمپین</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={onNext}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-[#719BDF] hover:from-blue-500 hover:to-[#719BDF]/90 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
            >
              <span>مرحله بعدی</span>
              <ChevronLeft size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
