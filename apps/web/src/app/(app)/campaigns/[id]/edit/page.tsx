'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CampaignWizard } from '@/features/campaigns/components/wizard/campaign-wizard';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { ArrowRight, Edit3 } from 'lucide-react';

export default function EditCampaignPage() {
  const params = useParams();
  const campaignId = params?.id as string;

  return (
    <div className="space-y-6 pb-16">
      {/* نوار مسیر و عنوان صفحه */}
      <div className="relative overflow-hidden rounded-2xl border border-[#1F2E45] bg-[#111D2E]/80 backdrop-blur-md p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/campaigns/${campaignId}`}
            className="flex items-center justify-center w-9 h-9 rounded-xl border border-[#1F2E45] bg-[#18263A] hover:bg-[#1F2E45] text-slate-300 hover:text-white transition-colors shrink-0"
            title="بازگشت به صفحه جزئیات"
          >
            <ArrowRight size={18} />
          </Link>
          <div className="space-y-1">
            <Breadcrumb
              items={[
                { label: 'عملکرد' },
                { label: 'کمپین‌ها', href: '/campaigns' },
                { label: 'جزئیات کمپین', href: `/campaigns/${campaignId}` },
                { label: 'ویرایش کمپین' },
              ]}
              showHomeIcon={false}
            />
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-100 tracking-tight font-display flex items-center gap-2">
              <Edit3 size={18} className="text-amber-400" />
              <span>ویرایش اطلاعات کمپین</span>
            </h1>
          </div>
        </div>

        <div className="text-left shrink-0">
          <span className="text-xs bg-amber-500/10 text-amber-400 font-bold px-3 py-1.5 rounded-xl border border-amber-500/30">
            حالت ویرایش کمپین
          </span>
        </div>
      </div>

      {/* بدنه ویزارد در حالت ویرایش */}
      <div>
        <CampaignWizard initialCampaignId={campaignId} mode="edit" />
      </div>
    </div>
  );
}
