'use client';

import React from 'react';
import { LucideIcon, Check, Info, Users, Layers, Target, Link2, Eye } from 'lucide-react';

export interface StepDefinition {
  id: number;
  title: string;
  subtitle: string;
  icon: LucideIcon;
}

export const WIZARD_STEPS: StepDefinition[] = [
  {
    id: 1,
    title: 'اطلاعات پایه',
    subtitle: 'نام، هدف و بودجه کل',
    icon: Info,
  },
  {
    id: 2,
    title: 'مخاطبان هدف',
    subtitle: 'سن، جنسیت و جغرافیا',
    icon: Users,
  },
  {
    id: 3,
    title: 'پلتفرم‌ها و بودجه',
    subtitle: 'سهم‌بندی کانال‌های تبلیغ',
    icon: Layers,
  },
  {
    id: 4,
    title: 'اهداف و KPI',
    subtitle: 'تارگت کلیک، تبدیل و CPA',
    icon: Target,
  },
  {
    id: 5,
    title: 'لندینگ و UTM',
    subtitle: 'لینک فرود و پارامترها',
    icon: Link2,
  },
  {
    id: 6,
    title: 'مرور نهایی',
    subtitle: 'بازبینی و انتشار کمپین',
    icon: Eye,
  },
];

interface WizardStepperProps {
  currentStep: number;
  onStepClick: (stepId: number) => void;
  completedSteps: number[];
}

export function WizardStepper({
  currentStep,
  onStepClick,
  completedSteps,
}: WizardStepperProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-sm mb-6">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        {WIZARD_STEPS.map((step) => {
          const isCurrent = step.id === currentStep;
          const isCompleted = completedSteps.includes(step.id);
          const isClickable = isCompleted || step.id <= currentStep;
          const Icon = step.icon;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => isClickable && onStepClick(step.id)}
              disabled={!isClickable}
              className={`flex items-center gap-3 p-2.5 rounded-xl text-right transition-all duration-200 ${
                isCurrent
                  ? 'bg-blue-50/80 border border-blue-200 shadow-sm'
                  : isCompleted
                  ? 'hover:bg-gray-50 border border-transparent'
                  : 'opacity-50 cursor-not-allowed border border-transparent'
              }`}
            >
              {/* نشانگر شماره یا آیکون وضعیت */}
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold transition-colors ${
                  isCompleted
                    ? 'bg-emerald-600 text-white'
                    : isCurrent
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {isCompleted ? <Check size={16} /> : <Icon size={16} />}
              </div>

              {/* متن عنوان و شماره مرحله */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-gray-400 font-medium">
                    مرحله {step.id}
                  </span>
                  {isCurrent && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                  )}
                </div>
                <h4
                  className={`text-xs font-bold truncate ${
                    isCurrent
                      ? 'text-blue-900'
                      : isCompleted
                      ? 'text-gray-800'
                      : 'text-gray-500'
                  }`}
                >
                  {step.title}
                </h4>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
