'use client';

import * as React from 'react';
import { AudienceGender } from '../types';

export interface AudienceGenderBadgeProps {
  gender: AudienceGender | string | null | undefined;
}

export function AudienceGenderBadge({ gender }: AudienceGenderBadgeProps) {
  if (gender === 'female') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20">
        خانم‌ها
      </span>
    );
  }

  if (gender === 'male') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#719BDF]/15 text-[#719BDF] border border-[#719BDF]/30">
        آقایان
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
      همه (عمومی)
    </span>
  );
}
