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
    badgeStyle: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    cardBorder: 'border-sky-500/30 bg-[#111D2E]',
    icon: <Clock size={16} className="text-sky-400" />,
  },
  {
    group: 'won',
    title: 'وضعیت‌های موفق و برنده (Won)',
    badgeLabel: LEAD_STATUS_GROUP_LABELS.won,
    description: 'لیدهایی که با موفقیت تبدیل به مشتری قطعی شده و خرید را تکمیل کرده‌اند',
    badgeStyle: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    cardBorder: 'border-emerald-500/30 bg-[#111D2E]',
    icon: <Trophy size={16} className="text-emerald-400" />,
  },
  {
    group: 'lost',
    title: 'وضعیت‌های ردشده و بازنده (Lost)',
    badgeLabel: LEAD_STATUS_GROUP_LABELS.lost,
    description: 'لیدهای انصرافی یا ناموفق که در پیگیری‌ها به نتیجه نرسیده‌اند',
    badgeStyle: 'bg-[#D66B73]/15 text-[#D66B73] border-[#D66B73]/30',
    cardBorder: 'border-[#D66B73]/30 bg-[#111D2E]',
    icon: <UserX size={16} className="text-[#D66B73]" />,
  },
];

export function LeadStatusGroupsView({
  statuses,
  onEditStatus,
  onToggleStatus,
}: LeadStatusGroupsViewProps) {
  return (
    <div className="space-y-4 text-slate-100" dir="rtl">
      {/* راهنمای ساختار گروه‌ها مطابق سند محصول */}
      <div className="bg-[#18263A] border border-[#1F2E45] rounded-2xl p-4 text-xs text-slate-300 flex items-start gap-3 shadow-lg">
        <ShieldCheck size={18} className="text-[#719BDF] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-slate-100">دسته‌بندی الزامی وضعیت‌های لید در سند محصول (صفحه ۲۳)</p>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            هر وضعیت لید در سامانه الزاماً به یکی از سه گروه کلیدی <strong>«باز (Open)»</strong>، <strong>«برنده (Won)»</strong> یا <strong>«بازنده (Lost)»</strong> تعلق دارد تا رفتارهای خودکار برد پیگیری لید (همچون باز شدن مودال ورود مبلغ معامله در وضعیت‌های برنده و مودال علت رد شدن در وضعیت‌های بازنده) به درستی عمل کنند.
          </p>
        </div>
      </div>

      {/* ستون‌های ۳ گانه گروه‌ها با تم لوکس Midnight Executive */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {GROUPS_CONFIG.map((cfg) => {
          const groupStatuses = statuses
            .filter((s) => s.group === cfg.group)
            .sort((a, b) => a.order - b.order);

          return (
            <div
              key={cfg.group}
              className={`rounded-2xl border p-4 flex flex-col justify-between space-y-3 shadow-xl ${cfg.cardBorder}`}
            >
              {/* سربرگ گروه */}
              <div className="space-y-1 pb-3 border-b border-[#1F2E45]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {cfg.icon}
                    <h4 className="text-xs sm:text-sm font-bold text-slate-100 font-display">{cfg.title}</h4>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border tabular-nums font-mono ${cfg.badgeStyle}`}
                  >
                    {groupStatuses.length.toLocaleString('fa-IR')} وضعیت
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{cfg.description}</p>
              </div>

              {/* فهرست وضعیت‌های متعلق به این گروه */}
              <div className="space-y-2 flex-1">
                {groupStatuses.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500 border border-dashed border-[#1F2E45] rounded-xl bg-[#0B1423]/40">
                    هیچ وضعیتی در این گروه قرار ندارد.
                  </div>
                ) : (
                  groupStatuses.map((st) => {
                    const usage = st.usageCount ?? 0;

                    return (
                      <div
                        key={st.id}
                        className={`p-3 rounded-xl border bg-[#0B1423] flex items-center justify-between gap-2 shadow-xs transition-all ${
                          st.isActive
                            ? 'border-[#1F2E45] hover:border-[#719BDF]/40'
                            : 'border-[#1F2E45]/40 opacity-60'
                        }`}
                      >
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                              #{st.order}
                            </span>
                            <span
                              className={`text-xs font-bold truncate ${
                                st.isActive ? 'text-slate-100' : 'text-slate-500 line-through'
                              }`}
                            >
                              {st.label}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                            <Tag size={10} className="text-slate-500" />
                            <span>{st.key}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* نمایش استفاده */}
                          <span
                            className="text-[10px] font-bold text-slate-300 bg-[#18263A] border border-[#1F2E45] px-1.5 py-0.5 rounded tabular-nums"
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
                              className="h-7 w-7 p-0 text-slate-400 hover:text-[#719BDF] hover:bg-[#18263A] rounded-lg"
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
                              className={`h-7 w-7 p-0 rounded-lg ${
                                st.isActive
                                  ? 'text-slate-400 hover:text-amber-400 hover:bg-amber-500/15'
                                  : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/15'
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
