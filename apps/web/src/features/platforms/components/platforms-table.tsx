'use client';

import * as React from 'react';
import {
  Layers,
  Edit2,
  PowerOff,
  Power,
  CheckCircle2,
  XCircle,
  Sliders,
  Table as TableIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/empty-state';
import { Platform } from '../types';
import { PlatformCategoryBadge } from './platform-category-badge';
import { PlatformMethodBadge } from './platform-method-badge';

export interface PlatformsTableProps {
  platforms: Platform[];
  isLoading: boolean;
  onEdit: (platform: Platform) => void;
  onDeactivate: (platform: Platform) => void;
  onActivate: (platform: Platform) => void;
  onAddNew: () => void;
}

export function PlatformsTable({
  platforms,
  isLoading,
  onEdit,
  onDeactivate,
  onActivate,
  onAddNew,
}: PlatformsTableProps) {
  if (isLoading && platforms.length === 0) {
    return (
      <div className="rounded-2xl border border-[#1F2E45] bg-[#111D2E]/80 backdrop-blur-md p-8 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1F2E45]">
          <div className="h-4 w-32 bg-[#18263A] rounded animate-pulse" />
          <div className="h-4 w-20 bg-[#18263A] rounded animate-pulse" />
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-14 bg-[#0B1423]/70 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (platforms.length === 0) {
    return (
      <div className="rounded-2xl border border-[#1F2E45] bg-[#111D2E]/80 backdrop-blur-md overflow-hidden shadow-xl">
        <EmptyState
          title="هنوز پلتفرم تبلیغاتی در این سازمان تعریف نشده است"
          description="برای ثبت هزینه‌ها، تخصیص بودجه در ویزارد کمپین‌ها و دریافت داده‌های عملکردی، پلتفرم‌های مورد استفاده خود (مانند گوگل ادز، یکتانت یا اینستاگرام) را تعریف کنید."
          icon={<Layers className="w-6 h-6 text-[#719BDF]" />}
          action={{
            label: 'تعریف اولین پلتفرم',
            onClick: onAddNew,
          }}
        />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#1F2E45] bg-[#111D2E]/80 backdrop-blur-md overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs" dir="rtl">
          <thead>
            <tr className="border-b border-[#1F2E45] bg-[#0B1423]/60 text-slate-400 font-semibold">
              <th className="py-3.5 px-4 w-12 text-center">ردیف</th>
              <th className="py-3.5 px-4">نام پلتفرم</th>
              <th className="py-3.5 px-4">نوع پلتفرم</th>
              <th className="py-3.5 px-4">روش دریافت داده</th>
              <th className="py-3.5 px-4 text-center">تعداد کمپین فعال</th>
              <th className="py-3.5 px-4 text-center">وضعیت</th>
              <th className="py-3.5 px-4 text-center">ورودی‌ها / خروجی‌ها</th>
              <th className="py-3.5 px-4 text-left">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1F2E45]/60 text-slate-300">
            {platforms.map((p, idx) => {
              const activeCount = p.activeCampaignsCount || 0;

              return (
                <tr
                  key={p.id}
                  className={`hover:bg-[#18263A]/40 transition-colors ${
                    !p.isActive ? 'opacity-60 bg-[#0B1423]/30' : ''
                  }`}
                >
                  {/* ردیف */}
                  <td className="py-3.5 px-4 text-center text-slate-500 font-display text-[11px]">
                    {(idx + 1).toLocaleString('fa-IR')}
                  </td>

                  {/* نام پلتفرم */}
                  <td className="py-3.5 px-4 font-bold text-white">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#0B1423] text-[#719BDF] flex items-center justify-center shrink-0 border border-[#1F2E45]">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-100">{p.name}</div>
                        <div className="text-[10px] font-mono text-slate-400 font-normal">
                          کد: {p.code}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* نوع پلتفرم */}
                  <td className="py-3.5 px-4">
                    <PlatformCategoryBadge category={p.category} />
                  </td>

                  {/* روش دریافت داده (دستی / Import / API) */}
                  <td className="py-3.5 px-4">
                    <PlatformMethodBadge method={p.retrievalMethod} />
                  </td>

                  {/* تعداد کمپین فعال (ستون ۵ بر اساس سند) */}
                  <td className="py-3.5 px-4 text-center">
                    {activeCount > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#719BDF]/10 text-[#719BDF] border border-[#719BDF]/25 font-display">
                        {activeCount.toLocaleString('fa-IR')} کمپین فعال
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#18263A] text-slate-400 border border-[#1F2E45]">
                        بدون کمپین فعال
                      </span>
                    )}
                  </td>

                  {/* وضعیت (فعال / غیرفعال) */}
                  <td className="py-3.5 px-4 text-center">
                    {p.isActive ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>فعال</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/25">
                        <XCircle className="w-3.5 h-3.5 text-rose-400" />
                        <span>غیرفعال</span>
                      </span>
                    )}
                  </td>

                  {/* ورودی‌ها و خروجی‌ها */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex items-center gap-2 text-[11px] text-slate-400 font-display">
                      <span title={`${p.inputs?.length || 0} فیلد ورودی`} className="flex items-center gap-1">
                        <Sliders className="w-3 h-3 text-[#719BDF]" />
                        {(p.inputs?.length || 0).toLocaleString('fa-IR')}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span title={`${p.outputs?.length || 0} ستون گزارش`} className="flex items-center gap-1">
                        <TableIcon className="w-3 h-3 text-emerald-400" />
                        {(p.outputs?.length || 0).toLocaleString('fa-IR')}
                      </span>
                    </div>
                  </td>

                  {/* عملیات */}
                  <td className="py-3.5 px-4 text-left">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(p)}
                        className="text-xs h-7 px-2.5 bg-[#0B1423] text-slate-300 hover:text-white hover:bg-[#18263A] border border-[#1F2E45]"
                      >
                        <Edit2 className="w-3.5 h-3.5 me-1" />
                        ویرایش
                      </Button>

                      {p.isActive ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDeactivate(p)}
                          className="text-xs h-7 px-2 bg-rose-500/10 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 border border-rose-500/25"
                          title="غیرفعال‌سازی پلتفرم"
                        >
                          <PowerOff className="w-3.5 h-3.5" />
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onActivate(p)}
                          className="text-xs h-7 px-2 bg-emerald-500/10 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/25"
                          title="فعال‌سازی مجدد"
                        >
                          <Power className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
