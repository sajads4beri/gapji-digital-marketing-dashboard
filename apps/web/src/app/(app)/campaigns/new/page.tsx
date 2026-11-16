'use client';

import React from 'react';
import Link from 'next/link';
import { CampaignWizard } from '@/features/campaigns/components/wizard/campaign-wizard';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function NewCampaignPage() {
  return (
    <div className="space-y-6 pb-12">
      {/* نوار مسیر و عنوان صفحه */}
      <div className="relative overflow-hidden rounded-2xl border border-[#1F2E45] bg-[#111D2E]/80 backdrop-blur-md p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/campaigns"
            className="flex items-center justify-center w-9 h-9 rounded-xl border border-[#1F2E45] bg-[#18263A] hover:bg-[#1F2E45] text-slate-300 hover:text-white transition-colors shrink-0"
            title="بازگشت به لیست کمپین‌ها"
          >
            <ArrowRight size={18} />
          </Link>
          <div className="space-y-1">
            <Breadcrumb
              items={[
                { label: 'عملکرد' },
                { label: 'کمپین‌ها', href: '/campaigns' },
                { label: 'کمپین جدید' },
              ]}
              showHomeIcon={false}
            />
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-100 tracking-tight font-display flex items-center gap-2">
              <Sparkles size={20} className="text-[#719BDF]" />
              <span>ایجاد کمپین تبلیغاتی هوشمند</span>
            </h1>
          </div>
        </div>

        <div className="text-left shrink-0">
          <span className="text-xs bg-[#18263A] text-[#719BDF] font-bold px-3 py-1.5 rounded-xl border border-[#1F2E45]">
            فرم ۶ مرحله‌ای
          </span>
        </div>
      </div>

      {/* بدنه ویزارد */}
      <div>
        <CampaignWizard />
      </div>
    </div>
  );
}
