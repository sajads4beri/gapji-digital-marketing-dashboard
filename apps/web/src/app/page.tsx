'use client';

import { useEffect, useState } from 'react';
import { StatRow } from '@/components/stats-row';
import { CampaignsTable } from '@/components/campaigns-table';
import { CampaignStats } from '@gapji/shared';

export default function Home() {
  const [stats, setStats] = useState<CampaignStats>({
    total: 0,
    active: 0,
    totalSpend: 0,
    totalImpressions: 0,
    totalClicks: 0,
    totalConversions: 0,
  });
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [c, s] = await Promise.all([
          fetch('/api/campaigns').then((r) => r.json()),
          fetch('/api/campaigns/stats').then((r) => r.json()),
        ]);
        if (!cancelled) {
          setCampaigns(c);
          setStats(s);
        }
      } catch (err) {
        console.error('Failed to load data', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">داشبورد Markeiting</h1>
          <p className="text-gray-500">مدیریت تبلیغات و پیگیری کارایی کمپین‌ها</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm">
          + کمپین جدید
        </button>
      </header>
      <StatRow stats={stats} />
      <CampaignsTable campaigns={campaigns} />
    </div>
  );
}
