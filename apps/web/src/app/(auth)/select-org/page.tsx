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
      <div className="bg-[#0B1423]/95 border border-[#1F2E45] rounded-3xl p-8 shadow-2xl backdrop-blur-xl text-center">
        <div className="w-8 h-8 border-3 border-[#719BDF] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-400 font-semibold">درحال بررسی نشست کاربری...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="bg-[#0B1423]/95 border border-[#1F2E45] rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* هاله ظریف نوری بالای کارت */}
        <div
          className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#719BDF] to-transparent opacity-80"
          aria-hidden="true"
        />

        {/* هدر کارت انتخاب سازمان */}
        <div className="text-center space-y-3 pb-6 border-b border-[#1F2E45]/80">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#719BDF]/10 text-[#719BDF] border border-[#719BDF]/30 flex items-center justify-center shadow-[0_0_20px_rgba(113,155,223,0.2)]">
            <Building2 size={26} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight font-display">
              انتخاب سازمان فعال
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-medium leading-relaxed">
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
                    ? 'border-[#719BDF] bg-[#18263A] shadow-[0_0_15px_rgba(113,155,223,0.15)]'
                    : 'border-[#1F2E45] bg-[#111D2E]/70 hover:border-[#719BDF]/50 hover:bg-[#18263A]'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-[#0B1423] text-white flex items-center justify-center font-bold text-base border border-[#1F2E45] shrink-0 group-hover:scale-105 transition-transform">
                    {org.logoUrl ? (
                      <img
                        src={org.logoUrl}
                        alt={org.orgName}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <span className="font-display font-black text-[#719BDF]">{org.orgName.charAt(0)}</span>
                    )}
                  </div>

                  <div className="space-y-1 text-right min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm text-white truncate font-display">
                        {org.orgName}
                      </span>
                      {isLastSelected && (
                        <span className="text-[10px] font-bold bg-[#719BDF]/20 text-[#719BDF] border border-[#719BDF]/40 px-2 py-0.5 rounded-full shrink-0">
                          آخرین انتخاب شما
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <div className="flex items-center gap-1 text-slate-300 font-semibold">
                        <ShieldCheck size={13} className="text-[#719BDF] shrink-0" />
                        <span>نقش شما: {roleLabel}</span>
                      </div>
                      {org.plan && (
                        <span className="text-[11px] text-slate-500">
                          • پلن {org.plan}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-[#0B1423] border border-[#1F2E45] group-hover:bg-[#719BDF] group-hover:text-white group-hover:border-[#719BDF] transition-colors text-slate-400">
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
        <div className="mt-6 pt-5 border-t border-[#1F2E45] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-400 font-medium">
            <User size={14} className="text-slate-500" />
            <span>وارد شده با {user.email}</span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 font-bold text-rose-400 hover:text-rose-300 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
          >
            <LogOut size={14} />
            <span>خروج و ورود مجدد</span>
          </button>
        </div>
      </div>
    </div>
  );
}
