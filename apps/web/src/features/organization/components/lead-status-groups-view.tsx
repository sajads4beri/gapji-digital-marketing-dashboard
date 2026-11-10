'use client';

import * as React from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Trophy,
  UserX,
  Edit3,
  Power,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { OrgLeadStatusItem, LeadStatusGroup } from '../types';
import { LEAD_STATUS_GROUP_LABELS } from '../types';

export interface LeadStatusGroupsViewProps {
  statuses: OrgLeadStatusItem[];
  onEditStatus?: (item: OrgLeadStatusItem) => void;
  onToggleStatus?: (item: OrgLeadStatusItem) => void;
}

interface GroupConfig {
  group: LeadStatusGroup;
  title: string;
  badgeLabel: string;
  description: string;
  badgeStyle: string;
  cardBorder: string;
  icon: React.ReactNode;
}

const GROUPS_CONFIG: GroupConfig[] = [
  {
    group: 'open',
    title: 'وضعیت‌های در جریان (Open)',
    badgeLabel: LEAD_STATUS_GROUP_LABELS.open,
    description: 'مراحل فعال پیگیری فروش و لیدهای ورودی تا پیش از نهایی‌سازی معامله',
    badgeStyle: 'bg-blue-100 text-blue-800 border-blue-200',
    cardBorder: 'border-blue-200/80 bg-blue-50/20',
    icon: <Clock size={16} className="text-blue-600" />,
  },
  {
    group: 'won',
    title: 'وضعیت‌های موفق و برنده (Won)',
    badgeLabel: LEAD_STATUS_GROUP_LABELS.won,
    description: 'لیدهایی که با موفقیت تبدیل به مشتری قطعی شده و خرید را تکمیل کرده‌اند',
    badgeStyle: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    cardBorder: 'border-emerald-200/80 bg-emerald-50/20',
    icon: <Trophy size={16} className="text-emerald-600" />,
  },
  {
    group: 'lost',
    title: 'وضعیت‌های ردشده و بازنده (Lost)',
    badgeLabel: LEAD_STATUS_GROUP_LABELS.lost,
    description: 'لیدهای انصرافی یا ناموفق که در پیگیری‌ها به نتیجه نرسیده‌اند',
    badgeStyle: 'bg-rose-100 text-rose-800 border-rose-200',
    cardBorder: 'border-rose-200/80 bg-rose-50/20',
    icon: <UserX size={16} className="text-rose-600" />,
  },
];

export function LeadStatusGroupsView({
  statuses,
  onEditStatus,
  onToggleStatus,
}: LeadStatusGroupsViewProps) {
  return (
    <div className="space-y-4" dir="rtl">
      {/* راهنمای ساختار گروه‌ها مطابق سند محصول */}
      <div className="bg-purple-50/60 border border-purple-200/80 rounded-2xl p-4 text-xs text-purple-900 flex items-start gap-3">
        <ShieldCheck size={18} className="text-purple-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">دسته‌بندی الزامی وضعیت‌های لید در سند محصول (صفحه ۲۳)</p>
          <p className="text-purple-800/80 leading-relaxed text-[11px]">
            هر وضعیت لید در سامانه الزاماً به یکی از سه گروه کلیدی <strong>«باز (Open)»</strong>، <strong>«برنده (Won)»</strong> یا <strong>«بازنده (Lost)»</strong> تعلق دارد تا رفتارهای خودکار برد پیگیری لید (همچون باز شدن مودال ورود مبلغ معامله در وضعیت‌های برنده و مودال علت رد شدن در وضعیت‌های بازنده) به درستی عمل کنند.
          </p>
        </div>
      </div>

      {/* ستون‌های ۳ گانه گروه‌ها */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {GROUPS_CONFIG.map((cfg) => {
          const groupStatuses = statuses
            .filter((s) => s.group === cfg.group)
            .sort((a, b) => a.order - b.order);

          return (
            <div
              key={cfg.group}
              className={`rounded-2xl border p-4 flex flex-col justify-between space-y-3 bg-white shadow-2xs ${cfg.cardBorder}`}
            >
              {/* سربرگ گروه */}
              <div className="space-y-1 pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {cfg.icon}
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">{cfg.title}</h4>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.badgeStyle}`}
                  >
                    {groupStatuses.length.toLocaleString('fa-IR')} وضعیت
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">{cfg.description}</p>
              </div>

              {/* فهرست وضعیت‌های متعلق به این گروه */}
              <div className="space-y-2 flex-1">
                {groupStatuses.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    هیچ وضعیتی در این گروه قرار ندارد.
                  </div>
                ) : (
                  groupStatuses.map((st) => {
                    const usage = st.usageCount ?? 0;

                    return (
                      <div
                        key={st.id}
                        className={`p-3 rounded-xl border bg-white flex items-center justify-between gap-2 shadow-2xs transition-all ${
                          st.isActive
                            ? 'border-slate-200/90 hover:border-slate-300'
                            : 'border-slate-200/60 bg-slate-50/50 opacity-60'
                        }`}
                      >
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-mono text-slate-400">
                              #{st.order}
                            </span>
                            <span
                              className={`text-xs font-bold truncate ${
                                st.isActive ? 'text-slate-800' : 'text-slate-400 line-through'
                              }`}
                            >
                              {st.label}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                            <Tag size={10} />
                            <span>{st.key}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* نمایش استفاده */}
                          <span
                            className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded"
                            title="تعداد لیدهای دارای این وضعیت"
                          >
                            {usage.toLocaleString('fa-IR')} لید
                          </span>

                          {/* دکمه ویرایش */}
                          {onEditStatus && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEditStatus(st)}
                              className="h-7 w-7 p-0 text-slate-400 hover:text-purple-600"
                              title="ویرایش وضعیت"
                            >
                              <Edit3 size={13} />
                            </Button>
                          )}

                          {/* دکمه تغییر فعال / غیرفعال */}
                          {onToggleStatus && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onToggleStatus(st)}
                              className={`h-7 w-7 p-0 ${
                                st.isActive
                                  ? 'text-slate-400 hover:text-amber-600'
                                  : 'text-emerald-600 hover:text-emerald-700'
                              }`}
                              title={st.isActive ? 'غیرفعال‌سازی' : 'فعال‌سازی'}
                            >
                              <Power size={13} />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
