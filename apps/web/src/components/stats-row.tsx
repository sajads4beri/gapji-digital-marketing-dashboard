'use client';

import { CampaignStats } from '@gapji/shared';
import { LayoutList, Activity, TrendingUp, BarChart3 } from 'lucide-react';

export function StatRow({ stats }: { stats: CampaignStats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard title="کل کمپین‌ها" value={stats.total} icon={<LayoutList size={24} />} color="text-blue-600" />
      <StatCard title="فعال" value={stats.active} icon={<Activity size={24} />} color="text-green-600" />
      <StatCard title="هزینه کل" value={`${stats.totalSpend.toLocaleString()} تومان`} icon={<TrendingUp size={24} />} color="text-orange-600" />
      <StatCard title="کل نمایش‌ها" value={stats.totalImpressions.toLocaleString()} icon={<BarChart3 size={24} />} color="text-purple-600" />
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: React.ReactNode; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="p-3 rounded-lg bg-gray-100">{React.cloneElement(icon as React.ReactElement, { className: color })}</div>
      </div>
    </div>
  );
}
