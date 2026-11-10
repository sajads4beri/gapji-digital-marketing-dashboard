'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth';
import {
  navigationConfig,
  NavGroup,
  NavItem,
} from '@/config/navigation';
import {
  ChevronDown,
  ChevronRight,
  PanelRightClose,
  PanelRightOpen,
  Sparkles,
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
  const pathname = usePathname();
  const { can, canAccessRoute } = useAuth();

  const isItemVisible = (item: NavItem): boolean => {
    // طبق صفحه ۳ و ۲۳ سند: هر آیتم فقط در صورت داشتن دسترسی در ماتریس مرکزی نمایش داده می‌شود
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

  // وضعیت باز/بسته بودن گروه‌های منو در حالت Expanded
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
      className={`relative flex flex-col bg-white border-l border-gray-200 text-gray-800 transition-all duration-300 z-30 select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      } ${className}`}
      dir="rtl"
      aria-label="منوی ناوبری اصلی پنل"
    >
      {/* هدر سایدبار و لوگو */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-md shrink-0">
            گ
          </div>
          {!isCollapsed && (
            <div className="flex flex-col truncate">
              <span className="font-extrabold text-sm text-gray-900 tracking-tight">
                پنل مارکتینگ گپ‌جی
              </span>
              <span className="text-[11px] text-gray-500">
                نسخه فاز اول (Phase 1)
              </span>
            </div>
          )}
        </div>

        {/* دکمه باز و بسته کردن سایدبار دسکتاپ */}
        <button
          type="button"
          onClick={onToggleCollapse}
          title={isCollapsed ? 'باز کردن منو' : 'جمع کردن منو'}
          aria-label={isCollapsed ? 'باز کردن منو' : 'جمع کردن منو'}
          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
        >
          {isCollapsed ? (
            <PanelRightOpen size={18} />
          ) : (
            <PanelRightClose size={18} />
          )}
        </button>
      </div>

      {/* لیست گروه‌ها و آیتم‌های منو */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin">
        {navigationConfig.map((group) => {
          const visibleItems = group.items.filter(isItemVisible);
          if (visibleItems.length === 0) return null;

          const isOpen = openGroups[group.id] ?? true;

          return (
            <div key={group.id} className="space-y-1.5">
              {/* عنوان گروه (در حالت جمع‌شده خط جداکننده) */}
              {!isCollapsed ? (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors"
                >
                  <span className="truncate">{group.title}</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 text-gray-400 ${
                      isOpen ? 'rotate-0' : '-rotate-90'
                    }`}
                  />
                </button>
              ) : (
                <div className="w-8 h-px bg-gray-200 mx-auto my-2" />
              )}

              {/* آیتم‌های داخل گروه */}
              {(isOpen || isCollapsed) && (
                <ul className="space-y-1">
                  {visibleItems.map((item) => {
                    const active = isItemActive(item);
                    const Icon = item.icon;

                    if (item.comingSoon) {
                      return (
                        <li key={item.id}>
                          <div
                            title={`${item.title} (به‌زودی)`}
                            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-gray-400 cursor-not-allowed opacity-60 hover:bg-gray-50/50 transition-colors ${
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
                              <span className="text-[10px] font-normal bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200 shrink-0">
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
                          title={item.title}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all relative ${
                            isCollapsed ? 'justify-center' : 'justify-between'
                          } ${
                            active
                              ? 'bg-blue-50 text-blue-700 shadow-xs'
                              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                          }`}
                        >
                          {/* نوار نشانگر فعال سمت راست (RTL) */}
                          {active && (
                            <span className="absolute right-0 top-1.5 bottom-1.5 w-1 bg-blue-600 rounded-l-full" />
                          )}

                          <div className="flex items-center gap-2.5 truncate">
                            <Icon
                              size={18}
                              className={`shrink-0 ${
                                active
                                  ? 'text-blue-600'
                                  : 'text-gray-500'
                              }`}
                            />
                            {!isCollapsed && (
                              <span className="truncate">{item.title}</span>
                            )}
                          </div>

                          {!isCollapsed && item.badge && (
                            <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full shrink-0">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      {/* فوتر سایدبار شامل وضعیت Mock */}
      <div className="p-3 border-t border-gray-100 shrink-0 bg-gray-50/50">
        {!isCollapsed ? (
          <div className="flex items-center gap-2.5 px-2 py-1.5 bg-white border border-gray-200/80 rounded-xl shadow-xs">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Sparkles size={15} />
            </div>
            <div className="truncate">
              <p className="text-[11px] font-bold text-gray-800 truncate">
                محیط Mock Service
              </p>
              <p className="text-[10px] text-gray-400">
                بدون نیاز به سرور
              </p>
            </div>
          </div>
        ) : (
          <div
            title="محیط آزمایشی Mock"
            className="w-10 h-10 mx-auto rounded-xl bg-white border border-gray-200 flex items-center justify-center text-emerald-600 shadow-xs"
          >
            <Sparkles size={16} />
          </div>
        )}
      </div>
    </aside>
  );
}
