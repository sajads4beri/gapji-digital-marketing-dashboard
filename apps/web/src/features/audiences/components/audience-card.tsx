'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Users,
  Copy,
  Edit2,
  Trash2,
  Share2,
  MapPin,
  Tag,
  ArrowLeft,
  Briefcase,
} from 'lucide-react';
import { Audience } from '../types';
import { AudienceGenderBadge } from './audience-gender-badge';

export interface AudienceCardProps {
  audience: Audience;
  onEdit: (audience: Audience) => void;
  onDuplicate: (audience: Audience) => void;
  onDelete: (audience: Audience) => void;
}

export function AudienceCard({
  audience,
  onEdit,
  onDuplicate,
  onDelete,
}: AudienceCardProps) {
  const ageLabel =
    audience.ageMin && audience.ageMax
      ? `${audience.ageMin} تا ${audience.ageMax} سال`
      : audience.ageMin
        ? `از ${audience.ageMin} سال به بالا`
        : audience.ageMax
          ? `تا ${audience.ageMax} سال`
          : 'نامحدود (تمام سنین)';

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-[#1F2E45] bg-[#111D2E]/80 backdrop-blur-md p-5 shadow-lg shadow-black/20 transition-all hover:border-[#719BDF]/40 hover:bg-[#111D2E] hover:shadow-[#719BDF]/5">
      <div>
        {/* هدر کارت: عنوان و نشان جنسیت */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#18263A] border border-[#1F2E45] text-[#719BDF] group-hover:border-[#719BDF]/40 group-hover:bg-[#719BDF]/10 transition-colors">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <Link
                href={`/performance/audiences/${audience.id}`}
                className="font-bold text-white hover:text-[#719BDF] transition-colors line-clamp-1 text-base tracking-tight"
              >
                {audience.name}
              </Link>
              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-400">
                <span>رده سنی:</span>
                <span className="font-medium text-slate-200">{ageLabel}</span>
              </div>
            </div>
          </div>
          <AudienceGenderBadge gender={audience.gender} />
        </div>

        {/* توضیحات */}
        {audience.description && (
          <p className="mt-3.5 text-xs text-slate-400 line-clamp-2 leading-relaxed bg-[#0B1423]/40 p-2.5 rounded-xl border border-[#1F2E45]/40">
            {audience.description}
          </p>
        )}

        {/* اطلاعات و برچسب‌های دموگرافیک */}
        <div className="mt-4 space-y-2 border-t border-[#1F2E45]/60 pt-3.5">
          {audience.channel && (
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Share2 className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <span className="text-slate-400">کانال مناسب:</span>
              <span className="font-medium text-slate-200 bg-[#18263A] border border-[#1F2E45] px-2 py-0.5 rounded-lg text-[11px]">
                {audience.channel}
              </span>
            </div>
          )}

          {audience.location && (
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <span className="text-slate-400">موقعیت:</span>
              <span className="font-medium text-slate-200 truncate">{audience.location}</span>
            </div>
          )}

          {audience.interests && (
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Tag className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <span className="text-slate-400">علایق:</span>
              <span className="font-medium text-slate-200 truncate">{audience.interests}</span>
            </div>
          )}
        </div>
      </div>

      {/* فوتر: تعداد کمپین‌های استفاده‌کننده و اکشن‌ها */}
      <div className="mt-5 border-t border-[#1F2E45]/60 pt-3.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs">
          <Briefcase className="h-3.5 w-3.5 text-slate-500" />
          <span className="text-slate-400">کمپین‌ها:</span>
          <span
            className={`font-semibold px-2 py-0.5 rounded-lg text-xs ${
              audience.campaignsCount > 0
                ? 'bg-[#719BDF]/15 text-[#719BDF] border border-[#719BDF]/30 font-bold'
                : 'bg-[#18263A] text-slate-400 border border-[#1F2E45]'
            }`}
          >
            {audience.campaignsCount} کمپین
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onDuplicate(audience)}
            title="کپی کردن مخاطب"
            className="p-1.5 text-slate-400 hover:text-[#719BDF] hover:bg-[#18263A] rounded-lg transition-colors border border-transparent hover:border-[#1F2E45]"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onEdit(audience)}
            title="ویرایش مشخصات"
            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-[#18263A] rounded-lg transition-colors border border-transparent hover:border-[#1F2E45]"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(audience)}
            title={
              audience.campaignsCount > 0
                ? 'امکان حذف مخاطب متصل به کمپین وجود ندارد'
                : 'حذف مخاطب'
            }
            className={`p-1.5 rounded-lg transition-colors border border-transparent ${
              audience.campaignsCount > 0
                ? 'text-slate-600 hover:text-slate-600 cursor-not-allowed'
                : 'text-slate-400 hover:text-rose-400 hover:bg-[#18263A] hover:border-[#1F2E45]'
            }`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <Link
            href={`/performance/audiences/${audience.id}`}
            title="مشاهده جزئیات و عملکرد کمپین‌ها"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-[#18263A] rounded-lg transition-colors border border-transparent hover:border-[#1F2E45]"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
