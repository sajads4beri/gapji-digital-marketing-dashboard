'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  CheckCircle2,
  ShieldCheck,
  ChevronLeft,
  LogOut,
  User,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth';
import { USER_ROLE_LABELS } from '@/features/users/types';
import { getValidatedRedirectUrl } from '@/lib/redirect-utils';

export default function SelectOrganizationPage() {
  const router = useRouter();
  const {
    user,
    availableOrganizations,
    selectOrganization,
    lastSelectedOrgId,
    activeOrgId,
    logout,
    isLoading,
  } = useAuth();

  const [selectingOrgId, setSelectingOrgId] = React.useState<string | null>(null);

  // اگر هنوز در حال خواندن نشست هستیم، صبر می‌کنیم
  // اگر کاربر اصلاً وارد نشده، به صفحه لاگین هدایت می‌شود
  React.useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [isLoading, user, router]);

  // اگر کاربر تک‌سازمانی است، به صورت خودکار به همان سازمان متصل و هدایت شود
  React.useEffect(() => {
    if (!isLoading && user && user.memberships.length === 1) {
      const singleOrg = user.memberships[0];
      selectOrganization(singleOrg.orgId);
      const searchParam =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('callbackUrl')
          : null;
      const destination = getValidatedRedirectUrl(searchParam, singleOrg.role);
      router.replace(destination);
    }
  }, [isLoading, user, selectOrganization, router]);

  const handleSelect = (orgId: string) => {
    setSelectingOrgId(orgId);
    selectOrganization(orgId);

    const selectedOrg = availableOrganizations.find((o) => o.orgId === orgId);
    const searchParam =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('callbackUrl')
        : null;
    const destination = getValidatedRedirectUrl(searchParam, selectedOrg?.role || null);

    // هدایت پس از انتخاب سازمان
    setTimeout(() => {
      router.push(destination);
    }, 250);
  };

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  if (isLoading || !user) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-3xl p-8 shadow-sm text-center">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-semibold">درحال بررسی نشست کاربری...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm">
        {/* هدر کارت انتخاب سازمان */}
        <div className="text-center space-y-3 pb-6 border-b border-slate-100">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shadow-xs">
            <Building2 size={26} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              انتخاب سازمان فعال
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
              حساب کاربری «{user.fullName}» در چند سازمان دارای دسترسی است. لطفاً فضای کاری مورد نظر خود را انتخاب نمایید:
            </p>
          </div>
        </div>

        {/* لیست کارت‌های سازمان با نام و نقش کاربر در هر سازمان (مطابق ص ۶ سند محصول) */}
        <div className="mt-6 space-y-3">
          {availableOrganizations.map((org) => {
            const isLastSelected = lastSelectedOrgId === org.orgId;
            const isCurrentlySelecting = selectingOrgId === org.orgId;
            const roleLabel = USER_ROLE_LABELS[org.role] || org.role;

            return (
              <button
                key={org.orgId}
                type="button"
                onClick={() => handleSelect(org.orgId)}
                disabled={Boolean(selectingOrgId)}
                className={`w-full text-right p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 group ${
                  isLastSelected
                    ? 'border-blue-300 bg-blue-50/40 hover:bg-blue-50/70 shadow-2xs'
                    : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/80 shadow-2xs'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-base border border-slate-200 shrink-0 group-hover:scale-105 transition-transform">
                    {org.logoUrl ? (
                      <img
                        src={org.logoUrl}
                        alt={org.orgName}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <span>{org.orgName.charAt(0)}</span>
                    )}
                  </div>

                  <div className="space-y-1 text-right min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm text-slate-900 truncate">
                        {org.orgName}
                      </span>
                      {isLastSelected && (
                        <span className="text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full shrink-0">
                          آخرین انتخاب شما
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <div className="flex items-center gap-1 text-slate-600 font-semibold">
                        <ShieldCheck size={13} className="text-blue-600 shrink-0" />
                        <span>نقش شما: {roleLabel}</span>
                      </div>
                      {org.plan && (
                        <span className="text-[11px] text-slate-400">
                          • پلن {org.plan}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 group-hover:bg-blue-600 group-hover:text-white transition-colors text-slate-400">
                  {isCurrentlySelecting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ChevronLeft size={16} />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* دکمه خروج و تغییر حساب */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-500 font-medium">
            <User size={14} className="text-slate-400" />
            <span>وارد شده با {user.email}</span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 font-bold text-rose-600 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
          >
            <LogOut size={14} />
            <span>خروج و ورود مجدد</span>
          </button>
        </div>
      </div>
    </div>
  );
}
