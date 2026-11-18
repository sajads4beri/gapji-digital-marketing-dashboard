'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Users,
  Copy,
  Edit2,
  Trash2,
  ArrowLeft,
  Briefcase,
  ExternalLink,
} from 'lucide-react';
import { Audience } from '../types';
import { AudienceGenderBadge } from './audience-gender-badge';

export interface AudiencesTableProps {
  audiences: Audience[];
  isLoading: boolean;
  onEdit: (audience: Audience) => void;
  onDuplicate: (audience: Audience) => void;
  onDelete: (audience: Audience) => void;
}

export function AudiencesTable({
  audiences,
  isLoading,
  onEdit,
  onDuplicate,
  onDelete,
}: AudiencesTableProps) {
  if (isLoading && audiences.length === 0) {
    return (
      <div className="rounded-2xl border border-[#1F2E45] bg-[#111D2E]/80 backdrop-blur-md p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1F2E45]">
          <div className="h-4 w-32 bg-[#18263A] rounded animate-pulse" />
          <div className="h-4 w-20 bg-[#18263A] rounded animate-pulse" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 bg-[#18263A]/50 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#1F2E45] bg-[#111D2E]/80 backdrop-blur-md shadow-xl shadow-black/20">
      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead>
            <tr className="border-b border-[#1F2E45] bg-[#0B1423]/60 text-slate-400 font-medium">
              <th className="py-3.5 px-4 font-semibold">نام مخاطب و توضیحات</th>
              <th className="py-3.5 px-4 font-semibold">رده سنی</th>
              <th className="py-3.5 px-4 font-semibold">جنسیت</th>
              <th className="py-3.5 px-4 font-semibold">کانال مناسب</th>
              <th className="py-3.5 px-4 font-semibold">موقعیت مکانی</th>
              <th className="py-3.5 px-4 font-semibold text-center">کمپین‌های متصل</th>
              <th className="py-3.5 px-4 font-semibold text-left">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1F2E45]/40 text-slate-300">
            {audiences.map((aud) => {
              const ageLabel =
                aud.ageMin && aud.ageMax
                  ? `${aud.ageMin} تا ${aud.ageMax} سال`
                  : aud.ageMin
                    ? `از ${aud.ageMin} سال`
                    : aud.ageMax
                      ? `تا ${aud.ageMax} سال`
                      : 'نامحدود';

              return (
                <tr
                  key={aud.id}
                  className="hover:bg-[#18263A]/50 transition-colors group"
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#18263A] border border-[#1F2E45] text-[#719BDF]">
                        <Users className="h-4 w-4" />
                      </div>
                      <div>
                        <Link
                          href={`/performance/audiences/${aud.id}`}
                          className="font-bold text-white hover:text-[#719BDF] transition-colors text-xs flex items-center gap-1"
                        >
                          {aud.name}
                          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 text-slate-400 transition-opacity" />
                        </Link>
                        {aud.description && (
                          <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                            {aud.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-medium text-slate-200 whitespace-nowrap">
                    {ageLabel}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <AudienceGenderBadge gender={aud.gender} />
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {aud.channel ? (
                      <span className="bg-[#18263A] border border-[#1F2E45] text-slate-300 px-2.5 py-0.5 rounded-lg text-[11px] font-medium">
                        {aud.channel}
                      </span>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate">
                    {aud.location || <span className="text-slate-500">—</span>}
                  </td>

                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold ${
                        aud.campaignsCount > 0
                          ? 'bg-[#719BDF]/15 text-[#719BDF] border border-[#719BDF]/30'
                          : 'bg-[#18263A] text-slate-400 border border-[#1F2E45]'
                      }`}
                    >
                      <Briefcase className="h-3 w-3" />
                      {aud.campaignsCount}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-left whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onDuplicate(aud)}
                        title="کپی کردن مخاطب"
                        className="p-1.5 text-slate-400 hover:text-[#719BDF] hover:bg-[#18263A] rounded-lg transition-colors border border-transparent hover:border-[#1F2E45]"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(aud)}
                        title="ویرایش مشخصات"
                        className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-[#18263A] rounded-lg transition-colors border border-transparent hover:border-[#1F2E45]"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(aud)}
                        title={
                          aud.campaignsCount > 0
                            ? 'امکان حذف مخاطب متصل به کمپین وجود ندارد'
                            : 'حذف مخاطب'
                        }
                        className={`p-1.5 rounded-lg transition-colors border border-transparent ${
                          aud.campaignsCount > 0
                            ? 'text-slate-600 hover:text-slate-600 cursor-not-allowed'
                            : 'text-slate-400 hover:text-rose-400 hover:bg-[#18263A] hover:border-[#1F2E45]'
                        }`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <Link
                        href={`/performance/audiences/${aud.id}`}
                        title="مشاهده جزئیات عملکرد"
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-[#18263A] rounded-lg transition-colors border border-transparent hover:border-[#1F2E45]"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Link>
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
