'use client';

import * as React from 'react';
import { CampaignStats } from '@gapji/shared';
import { LayoutList, Activity, TrendingUp, BarChart3 } from 'lucide-react';
import { KpiCard } from '@/components/common/kpi-card';

export function StatRow({ stats }: { stats: CampaignStats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <KpiCard
        title="کل کمپین‌ها"
        value={stats.total}
        icon={<LayoutList size={24} />}
        color="text-blue-600"
      />
      <KpiCard
        title="فعال"
        value={stats.active}
        icon={<Activity size={24} />}
        color="text-green-600"
      />
      <KpiCard
        title="هزینه کل"
        value={`${stats.totalSpend.toLocaleString()} تومان`}
        icon={<TrendingUp size={24} />}
        color="text-orange-600"
      />
      <KpiCard
        title="کل نمایش‌ها"
        value={stats.totalImpressions.toLocaleString()}
        icon={<BarChart3 size={24} />}
        color="text-purple-600"
      />
    </div>
  );
}

export { KpiCard as StatCard };
