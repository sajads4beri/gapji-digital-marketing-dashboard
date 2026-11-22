'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
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
  Building2,
  ChevronsUpDown,
  ChevronDown,
  ChevronRight,
  PanelRightClose,
  PanelRightOpen,
  User,
  Settings,
  LogOut,
  Check,
  Sparkles,
  Shield,
  Layers,
} from 'lucide-react';

export interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  className?: string;
}

export function Sidebar({
  isCollapsed,
  onToggleCollapse,
  className = '',
}: SidebarProps) {
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

  const [isOrgMenuOpen, setIsOrgMenuOpen] = React.useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);

  const orgMenuRef = React.useRef<HTMLDivElement>(null);
  const userMenuRef = React.useRef<HTMLDivElement>(null);

  // استیت تولتیپ شناور لوکس در حالت جمع‌بودن سایدبار (Floating Tooltip)
  const [hoveredTooltip, setHoveredTooltip] = React.useState<{
    title: string;
    badge?: string;
    top: number;
    right: number;
  } | null>(null);

  const handleItemMouseEnter = React.useCallback(
    (e: React.MouseEvent<HTMLElement>, title: string, badge?: string) => {
      if (!isCollapsed) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const right = window.innerWidth - rect.left + 10;
      const top = rect.top + rect.height / 2;
      setHoveredTooltip({ title, badge, top, right });
    },
    [isCollapsed],
  );

  const handleItemMouseLeave = React.useCallback(() => {
    setHoveredTooltip(null);
  }, []);

  // بستن تولتیپ هنگام اسکرول یا تغییر وضعیت سایدبار
  React.useEffect(() => {
    const handleDismiss = () => setHoveredTooltip(null);
    window.addEventListener('scroll', handleDismiss, { capture: true, passive: true });
    window.addEventListener('resize', handleDismiss, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleDismiss, { capture: true });
      window.removeEventListener('resize', handleDismiss);
    };
  }, []);

  React.useEffect(() => {
    if (!isCollapsed) {
      setHoveredTooltip(null);
    }
  }, [isCollapsed]);

  // بستن منوهای باز با کلیک به بیرون یا فشردن Escape
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (orgMenuRef.current && !orgMenuRef.current.contains(target)) {
        setIsOrgMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOrgMenuOpen(false);
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // مشخصات کاربر جاری
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

  // فهرست سازمان‌های در دسترس
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
      setIsOrgMenuOpen(false);
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
    setIsOrgMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    toast.success('با موفقیت از حساب کاربری خارج شدید.');
    setIsUserMenuOpen(false);
    router.replace('/login');
  };

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

  // گروه‌های ناوبری باز/بسته
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>(
    () => {
      const initial: Record<string, boolean> = {};
      navigationConfig.forEach((group) => {
        initial[group.id] = group.defaultOpen ?? false;
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

  const isItemActive = (item: NavItem): boolean => {
    if (item.comingSoon || item.href === '#') return false;
    if (item.matchPattern) return item.matchPattern(pathname);
    return pathname === item.href;
  };

  return (
    <aside
      className={`relative flex flex-col h-full bg-[#0B1423] border-l border-[#1F2E45] text-slate-300 transition-all duration-300 z-30 select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      } ${className}`}
      dir="rtl"
      aria-label="منوی ناوبری اصلی پنل"
    >
      {/* ======================================================== */}
      {/* 1. SidebarHeader (Team/Workspace Switcher — sidebar-08)  */}
      {/* ======================================================== */}
      <div className="p-3 border-b border-[#1F2E45]/80 shrink-0 relative" ref={orgMenuRef}>
        <div className="flex items-center justify-between gap-1.5">
          <button
            type="button"
            onClick={() => {
              setIsOrgMenuOpen(!isOrgMenuOpen);
              setIsUserMenuOpen(false);
              setHoveredTooltip(null);
            }}
            onMouseEnter={(e) =>
              handleItemMouseEnter(e, currentOrgDisplay, currentRoleDisplay)
            }
            onMouseLeave={handleItemMouseLeave}
            className={`flex items-center gap-2.5 p-1.5 rounded-xl border border-[#1F2E45] bg-[#111D2E] hover:border-[#719BDF]/40 hover:bg-[#18263A] transition-all text-right flex-1 min-w-0 ${
              isCollapsed ? 'justify-center p-2' : ''
            }`}
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#719BDF] via-[#3B82F6] to-[#1D4ED8] text-white flex items-center justify-center font-black text-sm shadow-[0_0_14px_rgba(113,155,223,0.3)] shrink-0">
              گ
            </div>

            {!isCollapsed && (
              <>
                <div className="flex flex-col truncate flex-1 min-w-0 text-right">
                  <span className="font-extrabold text-xs text-slate-100 tracking-tight truncate font-display">
                    {currentOrgDisplay}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate">
                    {currentRoleDisplay}
                  </span>
                </div>
                <ChevronsUpDown size={14} className="text-slate-400 shrink-0 ms-1" />
              </>
            )}
          </button>

          {/* دکمه جمع‌شدن / باز شدن سایدبار */}
          {!isCollapsed && (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label="جمع کردن منو"
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-[#18263A] rounded-xl transition-colors shrink-0"
            >
              <PanelRightClose size={16} />
            </button>
          )}
        </div>

        {isCollapsed && (
          <div className="mt-2 flex justify-center">
            <button
              type="button"
              onClick={onToggleCollapse}
              onMouseEnter={(e) => handleItemMouseEnter(e, 'باز کردن منو')}
              onMouseLeave={handleItemMouseLeave}
              aria-label="باز کردن منو"
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-[#18263A] rounded-lg transition-colors"
            >
              <PanelRightOpen size={16} />
            </button>
          </div>
        )}

        {/* منوی بازشونده انتخاب سازمان (Team Switcher Popover) */}
        {isOrgMenuOpen && (
          <div
            className={`absolute top-full mt-1.5 w-60 bg-[#111D2E] rounded-2xl shadow-2xl border border-[#1F2E45] py-2 z-50 animate-in fade-in zoom-in-95 ${
              isCollapsed ? 'right-2' : 'right-3'
            }`}
          >
            <div className="px-3 py-1.5 border-b border-[#1F2E45] text-[11px] font-semibold text-slate-400 flex items-center justify-between">
              <span>انتخاب سازمان فعال</span>
              <span className="text-[10px] text-[#719BDF] font-bold">
                {orgOptions.length} سازمان
              </span>
            </div>

            <div className="max-h-60 overflow-y-auto divide-y divide-[#1F2E45]/60">
              {orgOptions.map((org) => {
                const isCurrent = activeOrgId
                  ? org.orgId === activeOrgId
                  : org.orgName === currentOrgDisplay;
                const roleTxt = USER_ROLE_LABELS[org.role] || org.role;

                return (
                  <button
                    key={org.orgId}
                    type="button"
                    onClick={() => handleSelectOrg(org.orgId, org.orgName)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-300 hover:bg-[#18263A] transition-colors text-right"
                  >
                    <div className="space-y-0.5 truncate text-right">
                      <p className="font-bold text-slate-100 truncate">
                        {org.orgName}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        نقش شما: {roleTxt}
                      </p>
                    </div>
                    {isCurrent && (
                      <Check size={14} className="text-[#719BDF] shrink-0 ms-2" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-1.5 border-t border-[#1F2E45] px-2">
              <Link
                href="/settings/organization"
                onClick={() => setIsOrgMenuOpen(false)}
                className="w-full text-center block py-1.5 text-[11px] font-bold text-[#719BDF] hover:text-[#96B9F2] rounded-lg hover:bg-[#18263A] transition-colors"
              >
                تنظیمات و اطلاعات سازمان
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 2. SidebarContent (NavMain / Primary Navigation)         */}
      {/* ======================================================== */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4 scrollbar-thin">
        {navigationConfig.map((group) => {
          const visibleItems = group.items.filter(isItemVisible);
          if (visibleItems.length === 0) return null;

          const isOpen = openGroups[group.id] ?? true;

          return (
            <div key={group.id} className="space-y-1.5">
              {!isCollapsed ? (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] font-bold text-slate-400 hover:text-slate-100 hover:bg-[#111D2E] rounded-lg transition-colors group/hdr"
                >
                  <span className="truncate tracking-wide">{group.title}</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-300 ease-in-out text-slate-500 group-hover/hdr:text-slate-300 ${
                      isOpen ? 'rotate-0' : '-rotate-90'
                    }`}
                  />
                </button>
              ) : (
                <div className="w-8 h-px bg-[#1F2E45] mx-auto my-1.5" />
              )}

              <div
                className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                  isOpen || isCollapsed
                    ? 'grid-rows-[1fr] opacity-100'
                    : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                }`}
              >
                <div className="overflow-hidden">
                  <ul
                    className={`space-y-1 ${
                      !isCollapsed ? 'border-s border-[#1F2E45]/80 ms-3 ps-2 my-1' : ''
                    }`}
                  >
                    {visibleItems.map((item) => {
                      const active = isItemActive(item);
                      const Icon = item.icon;

                      if (item.comingSoon) {
                        return (
                          <li key={item.id}>
                            <div
                              onMouseEnter={(e) =>
                                handleItemMouseEnter(e, item.title, 'به‌زودی')
                              }
                              onMouseLeave={handleItemMouseLeave}
                              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-500 cursor-not-allowed opacity-50 hover:bg-[#18263A]/30 transition-colors ${
                                isCollapsed ? 'justify-center' : 'justify-between'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                <Icon size={18} className="shrink-0" />
                                {!isCollapsed && (
                                  <span className="truncate">{item.title}</span>
                                )}
                              </div>
                              {!isCollapsed && (
                                <span className="text-[10px] font-normal bg-[#18263A] text-slate-400 px-1.5 py-0.5 rounded border border-[#1F2E45] shrink-0">
                                  به‌زودی
                                </span>
                              )}
                            </div>
                          </li>
                        );
                      }

                      return (
                        <li key={item.id}>
                          <Link
                            href={item.href}
                            onClick={() => setHoveredTooltip(null)}
                            onMouseEnter={(e) =>
                              handleItemMouseEnter(e, item.title, item.badge)
                            }
                            onMouseLeave={handleItemMouseLeave}
                            className={`group/nav flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all relative ${
                              isCollapsed ? 'justify-center' : 'justify-between'
                            } ${
                              active
                                ? 'bg-gradient-to-r from-[#18263A] to-[#142236] text-[#719BDF] border border-[#719BDF]/30 shadow-[0_0_12px_rgba(113,155,223,0.12)] font-bold'
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
                              {!isCollapsed && (
                                <span className="truncate group-hover/nav:text-slate-100 transition-colors">
                                  {item.title}
                                </span>
                              )}
                            </div>

                            {!isCollapsed && item.badge && (
                              <span className="text-[10px] font-semibold bg-[#719BDF]/15 text-[#719BDF] border border-[#719BDF]/30 px-1.5 py-0.5 rounded-full shrink-0">
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

      {/* ======================================================== */}
      {/* 3. SidebarFooter (NavUser — Bottom User Menu & Logout)    */}
      {/* ======================================================== */}
      <div className="p-3 border-t border-[#1F2E45]/80 shrink-0 bg-[#080F1C]/60 relative" ref={userMenuRef}>
        <button
          type="button"
          onClick={() => {
            setHoveredTooltip(null);
            setIsUserMenuOpen(!isUserMenuOpen);
            setIsOrgMenuOpen(false);
          }}
          onMouseEnter={(e) =>
            handleItemMouseEnter(e, currentUserDisplay, currentRoleDisplay)
          }
          onMouseLeave={handleItemMouseLeave}
          className={`w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-[#18263A] border border-[#1F2E45] bg-[#111D2E] transition-all text-right ${
            isCollapsed ? 'justify-center p-2' : 'justify-between'
          }`}
        >
          <div className="flex items-center gap-2.5 truncate min-w-0">
            {/* آواتار کاربر با گرادینت لوکس و افکت Midnight Executive */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#719BDF] to-[#2563eb] text-white flex items-center justify-center font-bold text-xs shadow-[0_0_10px_rgba(113,155,223,0.3)] shrink-0">
              {userInitials}
            </div>

            {!isCollapsed && (
              <div className="flex flex-col text-right truncate min-w-0">
                <span className="text-xs font-bold text-slate-100 leading-tight truncate">
                  {currentUserDisplay}
                </span>
                <span className="text-[10px] text-slate-400 font-mono truncate" dir="ltr">
                  {currentUserEmail}
                </span>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <ChevronsUpDown size={15} className="text-slate-400 shrink-0 ms-1" />
          )}
        </button>

        {/* منوی پاپ‌اور پروفایل، تنظیمات و خروج در پایین سایدبار (NavUser Dropdown) */}
        {isUserMenuOpen && (
          <div
            className={`absolute bottom-full mb-2 w-56 bg-[#111D2E] rounded-2xl shadow-2xl border border-[#1F2E45] py-2 z-50 animate-in fade-in zoom-in-95 ${
              isCollapsed ? 'right-2' : 'right-3'
            }`}
          >
            {/* سربرگ مشخصات کاربر */}
            <div className="px-4 py-2 border-b border-[#1F2E45]">
              <p className="text-xs font-bold text-slate-100 truncate">{currentUserDisplay}</p>
              <p className="text-[11px] text-slate-400 font-mono truncate" dir="ltr">
                {currentUserEmail}
              </p>
              <span className="inline-block mt-1.5 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">
                {currentRoleDisplay}
              </span>
            </div>

            {/* لینک‌های ناوبری کاربر */}
            <div className="py-1">
              <Link
                href="/settings/users"
                onClick={() => setIsUserMenuOpen(false)}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-[#18263A] hover:text-slate-100 transition-colors text-right"
              >
                <User size={15} className="text-[#719BDF]" />
                <span>پروفایل و اعضای تیم</span>
              </Link>
              <Link
                href="/settings/organization"
                onClick={() => setIsUserMenuOpen(false)}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-[#18263A] hover:text-slate-100 transition-colors text-right"
              >
                <Settings size={15} className="text-slate-400" />
                <span>تنظیمات سازمان</span>
              </Link>
            </div>

            {/* دکمه خروج از حساب کاربری */}
            <div className="pt-1 border-t border-[#1F2E45]">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-[#D66B73] hover:bg-[#D66B73]/10 transition-colors text-right"
              >
                <LogOut size={15} />
                <span>خروج از حساب کاربری</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* تولتیپ شناور لوکس برای سایدبار بسته (دقیقاً هماهنگ با طرح درخواست‌شده با پیکان راهنما) */}
      {isCollapsed && hoveredTooltip && typeof document !== 'undefined' && createPortal(
        <div
          role="tooltip"
          dir="rtl"
          style={{
            position: 'fixed',
            top: `${hoveredTooltip.top}px`,
            right: `${hoveredTooltip.right}px`,
            transform: 'translateY(-50%)',
            zIndex: 999999,
          }}
          className="pointer-events-none flex items-center animate-in fade-in zoom-in-95 duration-100 ease-out select-none"
        >
          <div className="relative flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white text-slate-900 font-bold text-xs shadow-2xl border border-slate-200/90 whitespace-nowrap">
            <span className="font-display tracking-tight text-slate-900">{hoveredTooltip.title}</span>
            {hoveredTooltip.badge && (
              <span className="text-[10px] font-extrabold bg-[#18263A] text-[#719BDF] border border-[#1F2E45] px-1.5 py-0.5 rounded-md">
                {hoveredTooltip.badge}
              </span>
            )}
            {/* پیکان / مثلث اشاره‌گر به سمت آیکون در سمت راست (RTL) */}
            <div
              className="absolute -right-[6px] top-1/2 -translate-y-1/2 w-0 h-0 border-y-[6px] border-y-transparent border-l-[6px] border-l-white"
              aria-hidden="true"
            />
          </div>
        </div>,
        document.body
      )}
    </aside>
  );
}
