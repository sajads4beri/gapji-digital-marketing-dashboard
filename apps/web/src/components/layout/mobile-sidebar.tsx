'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth';
import { useToast } from '@/components/common/toast-provider';
import { USER_ROLE_LABELS } from '@/features/users/types';
import { canAccessRoute as checkRoutePermission } from '@/lib/permissions';
import {
  navigationConfig,
  NavGroup,
  NavItem,
} from '@/config/navigation';
import {
  X,
  ChevronDown,
  Building2,
  User,
  Settings,
  LogOut,
  Check,
  ChevronsUpDown,
} from 'lucide-react';

export interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const {
    user,
    activeOrgId,
    activeOrgName,
    activeRole,
    availableOrganizations,
    selectOrganization,
    logout,
    can,
    canAccessRoute,
  } = useAuth();

  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = React.useState(false);
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>(
    () => {
      const initial: Record<string, boolean> = {};
      navigationConfig.forEach((group) => {
        initial[group.id] = group.defaultOpen ?? true;
      });
      return initial;
    },
  );

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const currentOrgDisplay = activeOrgName || 'شرکت فناوری گپ‌جی';
  const currentUserDisplay = user?.fullName || 'علی محمدی';
  const currentUserEmail = user?.email || 'ali@gapji.ir';
  const currentRoleDisplay = activeRole
    ? USER_ROLE_LABELS[activeRole]
    : 'مدیر مارکتینگ';

  const userInitials = React.useMemo(() => {
    if (!user?.fullName) return 'ع‌م';
    const parts = user.fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2);
    return `${parts[0][0]}‌${parts[parts.length - 1][0]}`;
  }, [user?.fullName]);

  const orgOptions = availableOrganizations.length > 0
    ? availableOrganizations
    : [
        {
          orgId: 'org_gapji_1',
          orgName: 'شرکت فناوری گپ‌جی',
          role: activeRole || 'admin',
          plan: 'سازمانی',
        },
      ];

  const handleSelectOrg = (orgId: string, orgName: string) => {
    if (orgId === activeOrgId) {
      setIsOrgDropdownOpen(false);
      return;
    }
    const ok = selectOrganization(orgId);
    if (ok) {
      toast.success(`سازمان فعال به «${orgName}» تغییر یافت.`);
      const targetOrg = availableOrganizations.find((o) => o.orgId === orgId);
      if (targetOrg && pathname !== '/' && !checkRoutePermission(pathname, targetOrg.role)) {
        toast.info('با توجه به تغییر سطح دسترسی، به صفحه اصلی هدایت شدید.');
        router.push('/');
      }
    }
    setIsOrgDropdownOpen(false);
    onClose();
  };

  const handleLogout = () => {
    logout();
    toast.success('با موفقیت از حساب کاربری خارج شدید.');
    onClose();
    router.replace('/login');
  };

  // بستن با Escape و قفل اسکرول زمینه
  React.useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isItemVisible = (item: NavItem): boolean => {
    const routeToCheck =
      item.permissionRoute || (item.href && item.href !== '#' ? item.href : null);

    if (routeToCheck) {
      return canAccessRoute(routeToCheck);
    }
    if (
      item.id === 'users-roles' ||
      item.id === 'organization-settings' ||
      item.id.startsWith('wordpress')
    ) {
      return can('settings.manage');
    }
    return true;
  };

  const isItemActive = (item: NavItem): boolean => {
    if (item.comingSoon || item.href === '#') return false;
    if (item.matchPattern) return item.matchPattern(pathname);
    return pathname === item.href;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="منوی ناوبری موبایل"
      className="fixed inset-0 z-50 lg:hidden select-none"
      dir="rtl"
    >
      {/* پس‌زمینه نیمه‌شفاف (Backdrop) */}
      <div
        role="presentation"
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* پنل کشویی سایدبار موبایل */}
      <div className="fixed inset-y-0 right-0 w-80 max-w-[85vw] bg-[#0B1423] border-l border-[#1F2E45] shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-200 text-slate-200">
        {/* ۱. هدر سایدبار موبایل با انتخابگر سازمان */}
        <div className="p-3.5 border-b border-[#1F2E45]/80 shrink-0">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#719BDF] via-[#3B82F6] to-[#1D4ED8] text-white flex items-center justify-center font-black text-sm shadow-[0_0_12px_rgba(113,155,223,0.3)]">
                گ
              </div>
              <span className="font-extrabold text-sm text-slate-100 font-display">
                MarTech Suite
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="بستن منو"
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-[#18263A] rounded-xl transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* سوئیچر سازمان موبایل */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
              className="w-full flex items-center justify-between p-2 rounded-xl border border-[#1F2E45] bg-[#111D2E] hover:bg-[#18263A] text-right text-xs"
            >
              <div className="flex items-center gap-2 truncate">
                <Building2 size={14} className="text-[#719BDF] shrink-0" />
                <span className="font-bold text-slate-200 truncate">
                  {currentOrgDisplay}
                </span>
              </div>
              <ChevronsUpDown size={14} className="text-slate-400 shrink-0 ms-1" />
            </button>

            {isOrgDropdownOpen && (
              <div className="absolute top-full mt-1.5 w-full bg-[#111D2E] rounded-xl shadow-2xl border border-[#1F2E45] p-1.5 z-50 animate-in fade-in zoom-in-95">
                {orgOptions.map((org) => (
                  <button
                    key={org.orgId}
                    type="button"
                    onClick={() => handleSelectOrg(org.orgId, org.orgName)}
                    className="w-full flex items-center justify-between p-2 rounded-lg text-xs hover:bg-[#18263A] text-right"
                  >
                    <span className="truncate text-slate-200 font-bold">{org.orgName}</span>
                    {activeOrgId === org.orgId && (
                      <Check size={14} className="text-[#719BDF] shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ۲. لیست آیتم‌های منو موبایل */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4 scrollbar-thin">
          {navigationConfig.map((group) => {
            const visibleItems = group.items.filter(isItemVisible);
            if (visibleItems.length === 0) return null;

            const isOpenGroup = openGroups[group.id] ?? true;

            return (
              <div key={group.id} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] font-bold text-slate-400 hover:text-slate-100 hover:bg-[#111D2E] rounded-lg transition-colors group/hdr"
                >
                  <span className="truncate tracking-wide">{group.title}</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-300 ease-in-out text-slate-500 group-hover/hdr:text-slate-300 ${
                      isOpenGroup ? 'rotate-0' : '-rotate-90'
                    }`}
                  />
                </button>

                <div
                  className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                    isOpenGroup
                      ? 'grid-rows-[1fr] opacity-100'
                      : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                  }`}
                >
                  <div className="overflow-hidden">
                    <ul className="space-y-1 border-s border-[#1F2E45]/80 ms-3 ps-2 my-1">
                      {visibleItems.map((item) => {
                        const active = isItemActive(item);
                        const Icon = item.icon;

                        if (item.comingSoon) {
                          return (
                            <li key={item.id}>
                              <div className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-500 opacity-50 bg-[#18263A]/20">
                                <div className="flex items-center gap-2.5 truncate">
                                  <Icon size={18} className="shrink-0" />
                                  <span className="truncate">{item.title}</span>
                                </div>
                                <span className="text-[10px] bg-[#18263A] text-slate-400 px-1.5 py-0.5 rounded border border-[#1F2E45]">
                                  به‌زودی
                                </span>
                              </div>
                            </li>
                          );
                        }

                        return (
                          <li key={item.id}>
                            <Link
                              href={item.href}
                              onClick={onClose}
                              className={`group/nav flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all relative ${
                                active
                                  ? 'bg-gradient-to-r from-[#18263A] to-[#142236] text-[#719BDF] border border-[#719BDF]/30 font-bold shadow-[0_0_12px_rgba(113,155,223,0.12)]'
                                  : 'text-slate-300 hover:bg-[#18263A] hover:text-slate-100'
                              }`}
                            >
                              {active && (
                                <span className="absolute right-0 top-1.5 bottom-1.5 w-1 bg-[#719BDF] rounded-l-full shadow-[0_0_8px_#719BDF]" />
                              )}

                              <div className="flex items-center gap-2.5 truncate">
                                <Icon
                                  size={18}
                                  className={`shrink-0 transition-all duration-200 ${
                                    active
                                      ? 'text-[#719BDF] scale-105'
                                      : 'text-slate-400 group-hover/nav:text-[#719BDF] group-hover/nav:scale-110'
                                  }`}
                                />
                                <span className="truncate group-hover/nav:text-slate-100 transition-colors">
                                  {item.title}
                                </span>
                              </div>

                              {item.badge && (
                                <span className="text-[10px] font-semibold bg-[#719BDF]/15 text-[#719BDF] border border-[#719BDF]/30 px-1.5 py-0.5 rounded-full">
                                  {item.badge}
                                </span>
                              )}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        {/* ۳. فوتر موبایل: پروفایل، تنظیمات و خروج کاربر (NavUser) */}
        <div className="p-3 border-t border-[#1F2E45]/80 shrink-0 bg-[#080F1C]/70 space-y-2">
          <div className="flex items-center gap-2.5 p-2 bg-[#111D2E] border border-[#1F2E45] rounded-xl">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#719BDF] to-[#2563eb] text-white flex items-center justify-center font-bold text-xs shrink-0">
              {userInitials}
            </div>
            <div className="truncate flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-100 truncate">
                {currentUserDisplay}
              </p>
              <p className="text-[10px] text-slate-400 font-mono truncate" dir="ltr">
                {currentUserEmail}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <Link
              href="/settings/users"
              onClick={onClose}
              className="flex items-center justify-center gap-1.5 py-2 px-2 bg-[#18263A] hover:bg-[#1F2E45] border border-[#1F2E45] rounded-xl text-slate-200 font-medium transition-colors"
            >
              <User size={13} className="text-[#719BDF]" />
              <span>پروفایل</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center justify-center gap-1.5 py-2 px-2 bg-[#D66B73]/15 hover:bg-[#D66B73]/25 border border-[#D66B73]/30 rounded-xl text-[#D66B73] font-bold transition-colors"
            >
              <LogOut size={13} />
              <span>خروج</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
