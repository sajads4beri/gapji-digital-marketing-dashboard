'use client';

import * as React from 'react';
import { CampaignStats } from '@gapji/shared';
import { LayoutList, Activity, PauseCircle, CheckCircle, TrendingUp, BarChart3, Target } from 'lucide-react';
import { KpiCard } from '@/components/common/kpi-card';

export interface ExtendedStatRowProps {
  stats: CampaignStats & {
    paused?: number;
    completed?: number;
  };
}

export function StatRow({ stats }: ExtendedStatRowProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      <KpiCard
        title="کل کمپین‌ها"
        value={stats.total.toLocaleString('fa-IR')}
        icon={<LayoutList size={20} />}
        color="text-[#719BDF]"
      />
      <KpiCard
        title="کمپین‌های فعال"
        value={stats.active.toLocaleString('fa-IR')}
        icon={<Activity size={20} />}
        color="text-emerald-400"
      />
      <KpiCard
        title="متوقف"
        value={(stats.paused ?? 0).toLocaleString('fa-IR')}
        icon={<PauseCircle size={20} />}
        color="text-amber-400"
      />
      <KpiCard
        title="تکمیل‌شده"
        value={(stats.completed ?? 0).toLocaleString('fa-IR')}
        icon={<CheckCircle size={20} />}
        color="text-blue-400"
      />
      <KpiCard
        title="هزینه کل"
        value={`${stats.totalSpend.toLocaleString('fa-IR')} ت`}
        icon={<TrendingUp size={20} />}
        color="text-[#719BDF]"
      />
      <KpiCard
        title="کل تبدیل‌ها"
        value={(stats.totalConversions || 0).toLocaleString('fa-IR')}
        icon={<Target size={20} />}
        color="text-emerald-400"
      />
    </div>
  );
}

export { KpiCard as StatCard };
