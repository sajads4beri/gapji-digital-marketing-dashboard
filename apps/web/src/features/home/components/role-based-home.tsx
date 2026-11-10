'use client';

import * as React from 'react';
import { useAuth } from '@/features/auth';
import type { UserRole } from '@/features/users/types';
import { USER_ROLE_LABELS } from '@/features/users/types';
import { ClientHomeView } from './client-home-view';
import { ManagerHomeView } from './manager-home-view';
import { CampaignManagerHomeView } from './campaign-manager-home-view';
import { SalesAgentHomeView } from './sales-agent-home-view';
import { ContentCreatorHomeView } from './content-creator-home-view';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { ShieldCheck, RotateCcw, Sparkles } from 'lucide-react';

export function RoleBasedHome() {
  const { activeRole, user, activeOrgName } = useAuth();
  const [previewRole, setPreviewRole] = React.useState<UserRole | null>(null);

  // نقش موثر جهت رندر ویجت‌های صفحه خانه (با پشتیبانی از قابلیت پیش‌نمایش برای ادمین)
  const effectiveRole: UserRole =
    activeRole === 'admin' && previewRole ? previewRole : activeRole || 'marketing_manager';

  const isSimulating = activeRole === 'admin' && Boolean(previewRole);

  return (
    <div className="space-y-6 pb-12" dir="rtl">
      {/* مسیر راهنما (Breadcrumb) صفحه خانه */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Breadcrumb
          items={[{ label: 'صفحه خانه (به‌ازای نقش)' }]}
          showHomeIcon={false}
        />

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-bold text-slate-700">{activeOrgName || 'سازمان فعال'}</span>
          <span>•</span>
          <span>نقش شما: <strong className="text-blue-700">{USER_ROLE_LABELS[effectiveRole] || effectiveRole}</strong></span>
        </div>
      </div>

      {/* بنر حالت شبیه‌سازی پیش‌نمایش نقش برای ادمین */}
      {isSimulating && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-900 animate-in fade-in">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-amber-600 shrink-0" />
            <span>
              <strong>حالت شبیه‌سازی ادمین:</strong> در حال مشاهده صفحه خانه از دیدگاه نقش «{USER_ROLE_LABELS[effectiveRole]}» هستید.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setPreviewRole(null)}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold text-amber-900 bg-white border border-amber-300 rounded-xl hover:bg-amber-100 transition-colors shrink-0"
          >
            <RotateCcw size={12} />
            <span>بازگشت به نمای ادمین</span>
          </button>
        </div>
      )}

      {/* انتخاب و رندر نمای نقشمحور ص ۷ مستند مرجع */}
      {(() => {
        switch (effectiveRole) {
          case 'client':
            return <ClientHomeView />;

          case 'campaign_manager':
            return <CampaignManagerHomeView />;

          case 'sales_agent':
            return <SalesAgentHomeView />;

          case 'content_creator':
            return <ContentCreatorHomeView />;

          case 'admin':
            return (
              <ManagerHomeView
                isAdmin={true}
                onPreviewRole={(r) => setPreviewRole(r)}
              />
            );

          case 'marketing_manager':
          default:
            return <ManagerHomeView isAdmin={false} />;
        }
      })()}
    </div>
  );
}
