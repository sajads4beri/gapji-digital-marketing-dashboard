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
          bg: 'bg-[#D66B73]/10',
          border: 'border-[#D66B73]/30',
          iconColor: 'text-[#D66B73]',
          badgeBg: 'bg-[#D66B73]/20 text-[#D66B73]',
          Icon: AlertCircle,
          label: 'بحرانی',
        };
      case 'warning':
        return {
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/30',
          iconColor: 'text-amber-400',
          badgeBg: 'bg-amber-500/20 text-amber-400',
          Icon: AlertTriangle,
          label: 'هشدار',
        };
      case 'info':
      default:
        return {
          bg: 'bg-[#719BDF]/10',
          border: 'border-[#719BDF]/30',
          iconColor: 'text-[#719BDF]',
          badgeBg: 'bg-[#719BDF]/20 text-[#719BDF]',
          Icon: Info,
          label: 'اطلاعیه',
        };
    }
  };

  return (
    <div
      className="bg-[#111D2E]/85 backdrop-blur-md rounded-2xl border border-[#1F2E45] p-5 shadow-xl space-y-4 transition-all relative overflow-hidden"
      dir="rtl"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D66B73]/30 to-transparent" />

      {/* هدر هشدارها */}
      <div className="flex items-center justify-between border-b border-[#1F2E45]/80 pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#D66B73]" />
            <h3 className="text-sm font-bold text-slate-100 font-display">
              هشدارها و اقدامات موردنیاز
            </h3>
          </div>
          <p className="text-[11px] text-slate-400">
            انحراف بودجه و سرنخ‌های معوقه نیازمند رسیدگی
          </p>
        </div>
        <span className="text-[11px] font-semibold text-[#D66B73] bg-[#D66B73]/10 border border-[#D66B73]/30 px-2.5 py-1 rounded-xl">
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
              className={`p-3.5 rounded-xl border ${style.bg} ${style.border} flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:bg-[#18263A]/40`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${style.iconColor}`}>
                  <IconComponent className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.badgeBg}`}>
                      {style.label}
                    </span>
                    <h4 className="text-xs font-bold text-slate-100">{alert.title}</h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{alert.description}</p>
                </div>
              </div>

              {/* اکشن هشدار */}
              {alert.actionType === 'create_task' ? (
                <button
                  type="button"
                  onClick={() => setTaskModalAlert(alert)}
                  className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-[#719BDF] hover:text-[#96B9F2] bg-[#18263A] hover:bg-[#20314A] px-3 py-2 rounded-xl border border-[#1F2E45] transition-colors shrink-0 self-start sm:self-auto"
                >
                  <PlusSquare className="w-3.5 h-3.5" />
                  <span>{alert.actionLabel}</span>
                </button>
              ) : alert.actionHref ? (
                <Link
                  href={alert.actionHref}
                  className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-200 hover:text-white bg-[#18263A] hover:bg-[#20314A] px-3 py-2 rounded-xl border border-[#1F2E45] transition-colors shrink-0 self-start sm:self-auto"
                >
                  <span>{alert.actionLabel}</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </Link>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* دیالوگ وضعیت تسک */}
      {taskModalAlert && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
          <div className="bg-[#111D2E] rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-[#1F2E45] text-slate-100">
            <div className="flex items-center justify-between border-b border-[#1F2E45] pb-3">
              <div className="flex items-center gap-2">
                <PlusSquare className="w-5 h-5 text-[#719BDF]" />
                <h3 className="text-sm font-bold text-slate-100 font-display">ساخت تسک از هشدار</h3>
              </div>
              <button
                type="button"
                onClick={() => setTaskModalAlert(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-[#18263A]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
              <p>
                <strong>عنوان هشدار:</strong> {taskModalAlert.title}
              </p>
              <div className="bg-[#18263A] p-3.5 rounded-xl border border-[#1F2E45] text-slate-300 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-400">
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-[10px] font-mono border border-amber-500/30">
                    TASKS INTEGRATION
                  </span>
                  <span>وضعیت اتصال به سیستم تسک‌ها</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-400">
                  سامانه از ایجاد تسک‌های فیک خودداری می‌کند. پس از استقرار اندپوینت‌های تسک، ثبت خودکار اقدام اجرایی فعال خواهد شد.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setTaskModalAlert(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-200 bg-[#18263A] hover:bg-[#20314A] rounded-xl border border-[#1F2E45]"
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
