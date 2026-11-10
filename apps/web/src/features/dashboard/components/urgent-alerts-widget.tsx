'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  ShieldAlert,
  PlusSquare,
  ArrowLeft,
  X,
} from 'lucide-react';
import type { UrgentAlertItem } from '../types';

export interface UrgentAlertsWidgetProps {
  alerts: UrgentAlertItem[];
}

export function UrgentAlertsWidget({ alerts }: UrgentAlertsWidgetProps) {
  const [taskModalAlert, setTaskModalAlert] = React.useState<UrgentAlertItem | null>(null);

  const getSeverityStyle = (severity: UrgentAlertItem['severity']) => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-rose-50/70',
          border: 'border-rose-200',
          iconColor: 'text-rose-600',
          badgeBg: 'bg-rose-100 text-rose-800',
          Icon: AlertCircle,
          label: 'بحرانی',
        };
      case 'warning':
        return {
          bg: 'bg-amber-50/70',
          border: 'border-amber-200',
          iconColor: 'text-amber-600',
          badgeBg: 'bg-amber-100 text-amber-800',
          Icon: AlertTriangle,
          label: 'هشدار',
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-50/70',
          border: 'border-blue-200',
          iconColor: 'text-blue-600',
          badgeBg: 'bg-blue-100 text-blue-800',
          Icon: Info,
          label: 'اطلاعیه',
        };
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4 transition-colors" dir="rtl">
      {/* هدر هشدارها */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <h3 className="text-sm font-bold text-slate-900">هشدارها و اقدامات موردنیاز</h3>
          </div>
          <p className="text-[11px] text-slate-400">
            انحراف بودجه و سرنخ‌های معوقه نیازمند رسیدگی (صفحه ۸ سند)
          </p>
        </div>
        <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100">
          {alerts.length} مورد
        </span>
      </div>

      {/* لیست هشدارها */}
      <div className="space-y-3">
        {alerts.map((alert) => {
          const style = getSeverityStyle(alert.severity);
          const IconComponent = style.Icon;

          return (
            <div
              key={alert.id}
              className={`p-3.5 rounded-xl border ${style.bg} ${style.border} flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:shadow-2xs`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${style.iconColor}`}>
                  <IconComponent className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${style.badgeBg}`}>
                      {style.label}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900">{alert.title}</h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{alert.description}</p>
                </div>
              </div>

              {/* اکشن هشدار: ساخت تسک (صفحه ۸) یا لینک هدایت */}
              {alert.actionType === 'create_task' ? (
                <button
                  type="button"
                  onClick={() => setTaskModalAlert(alert)}
                  className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 bg-white hover:bg-blue-50 px-3 py-2 rounded-xl border border-blue-200 transition-colors shrink-0 shadow-2xs self-start sm:self-auto"
                >
                  <PlusSquare className="w-3.5 h-3.5" />
                  <span>{alert.actionLabel}</span>
                </button>
              ) : alert.actionHref ? (
                <Link
                  href={alert.actionHref}
                  className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 transition-colors shrink-0 shadow-2xs self-start sm:self-auto"
                >
                  <span>{alert.actionLabel}</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </Link>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* دیالوگ شفاف وضعیت ماژول تسک (بند 11.D ممیزی) */}
      {taskModalAlert && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <PlusSquare className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">ساخت تسک از هشدار</h3>
              </div>
              <button
                type="button"
                onClick={() => setTaskModalAlert(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
              <p>
                <strong>عنوان هشدار:</strong> {taskModalAlert.title}
              </p>
              <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 text-amber-900 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-800">
                  <span className="px-1.5 py-0.5 rounded bg-amber-200 text-[10px] font-mono">BLOCKED BY TASKS MODULE</span>
                  <span>وضعیت اتصال به سیستم تسک‌ها</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  ماژول بک‌اند تسک‌ها (TasksModule) در اولویت ۳ پیاده‌سازی نقشه راه MVP قرار دارد. سامانه از ایجاد تسک‌های فیک یا شبیه‌سازی جعلی خودداری می‌نماید. پس از استقرار اندپوینت‌های واقعی تسک، ثبت خودکار اقدام اجرایی فعال خواهد شد.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setTaskModalAlert(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
