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
    <div className="sticky bottom-0 z-20 bg-white/95 backdrop-blur border-t border-gray-200 py-3.5 px-6 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* دکمه مرحله قبلی */}
        <div>
          <button
            type="button"
            onClick={onPrev}
            disabled={isFirstStep || isSubmitting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight size={18} />
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
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors disabled:opacity-50"
            title="ذخیره وضعیت فعلی فرم در حافظه مرورگر برای تکمیل در آینده"
          >
            {isDraftSaving ? (
              <Loader2 size={16} className="animate-spin text-gray-600" />
            ) : (
              <Save size={16} className="text-gray-500" />
            )}
            <span>{isDraftSaving ? 'درحال ذخیره...' : 'ذخیره پیش‌نویس'}</span>
          </button>

          {/* دکمه بعدی یا انتشار نهایی */}
          {isLastStep ? (
            <button
              type="button"
              onClick={onPublish}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>درحال ثبت کمپین...</span>
                </>
              ) : (
                <>
                  <Rocket size={18} />
                  <span>تأیید نهایی و انتشار کمپین</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={onNext}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
            >
              <span>مرحله بعدی</span>
              <ChevronLeft size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
