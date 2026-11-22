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
    <div className="bg-[#111D2E]/80 backdrop-blur-md rounded-2xl border border-[#1F2E45] p-3 sm:p-4 shadow-xl mb-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
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
              className={`flex items-center gap-2.5 p-2.5 rounded-xl text-right transition-all duration-200 border ${
                isCurrent
                  ? 'bg-[#18263A] border-[#719BDF]/50 shadow-md shadow-[#719BDF]/5'
                  : isCompleted
                  ? 'bg-[#111D2E]/40 border-emerald-500/30 hover:bg-[#18263A]/80'
                  : 'bg-[#0B1423]/40 border-transparent opacity-40 cursor-not-allowed'
              }`}
            >
              {/* نشانگر شماره یا آیکون وضعیت */}
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold transition-colors ${
                  isCompleted
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : isCurrent
                    ? 'bg-gradient-to-r from-blue-600 to-[#719BDF] text-white shadow-sm'
                    : 'bg-[#18263A] text-slate-500 border border-[#1F2E45]'
                }`}
              >
                {isCompleted ? <Check size={15} /> : <Icon size={15} />}
              </div>

              {/* متن عنوان و شماره مرحله */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 font-medium font-mono">
                    مرحله {step.id}
                  </span>
                  {isCurrent && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#719BDF] animate-pulse" />
                  )}
                </div>
                <h4
                  className={`text-xs font-bold truncate ${
                    isCurrent
                      ? 'text-[#719BDF]'
                      : isCompleted
                      ? 'text-slate-200'
                      : 'text-slate-500'
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
