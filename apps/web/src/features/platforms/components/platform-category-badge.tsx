import * as React from 'react';

const CATEGORY_MAP: Record<string, { label: string; color: string }> = {
  digital: { label: 'دیجیتال و کلیکی', color: 'bg-[#719BDF]/10 text-[#719BDF] border-[#719BDF]/25' },
  search_ads: { label: 'تبلیغات جستجو', color: 'bg-sky-500/10 text-sky-400 border-sky-500/25' },
  social: { label: 'شبکه‌های اجتماعی', color: 'bg-purple-500/10 text-purple-400 border-purple-500/25' },
  social_media: { label: 'شبکه‌های اجتماعی', color: 'bg-purple-500/10 text-purple-400 border-purple-500/25' },
  sms: { label: 'ارسال پیامک', color: 'bg-amber-500/10 text-amber-400 border-amber-500/25' },
  ad_network: { label: 'شبکه تبلیغاتی', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' },
  video: { label: 'ویدیویی و محتوا', color: 'bg-rose-500/10 text-rose-400 border-rose-500/25' },
  classifieds: { label: 'نیازمندی‌ها و آگهی', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25' },
};

interface PlatformCategoryBadgeProps {
  category: string;
  className?: string;
}

export function PlatformCategoryBadge({ category, className = '' }: PlatformCategoryBadgeProps) {
  const meta = CATEGORY_MAP[category.toLowerCase()] || {
    label: category,
    color: 'bg-[#18263A] text-slate-300 border-[#1F2E45]',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${meta.color} ${className}`}
    >
      {meta.label}
    </span>
  );
}
