'use client';

import React from 'react';
import Link from 'next/link';
import { CampaignWizard } from '@/features/campaigns/components/wizard/campaign-wizard';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { ArrowRight } from 'lucide-react';

export default function NewCampaignPage() {
  return (
    <div className="space-y-6 pb-12">
      {/* نوار مسیر و عنوان صفحه */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/campaigns"
            className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-600 transition-colors shrink-0"
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
            <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight">
              ایجاد کمپین تبلیغاتی هوشمند
            </h1>
          </div>
        </div>

        <div className="text-left shrink-0">
          <span className="text-xs bg-blue-50 text-blue-700 font-bold px-3 py-1.5 rounded-xl border border-blue-100">
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
