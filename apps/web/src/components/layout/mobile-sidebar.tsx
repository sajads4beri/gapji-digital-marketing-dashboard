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
import { X, ChevronDown, Sparkles } from 'lucide-react';

export interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
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
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* کشوی منو از راست */}
      <div className="fixed inset-y-0 right-0 w-72 max-w-[85vw] bg-white text-gray-800 shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-300 border-l border-gray-200">
        {/* هدر کشو */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-base shadow-sm">
              گ
            </div>
            <div>
              <span className="font-extrabold text-xs text-gray-900 block">
                پنل مارکتینگ گپ‌جی
              </span>
              <span className="text-[10px] text-gray-400 block">
                ناوبری موبایل
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="بستن منو"
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* لیست گروه‌ها و آیتم‌ها */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-5 scrollbar-thin">
          {navigationConfig.map((group) => {
            const visibleItems = group.items.filter(isItemVisible);
            if (visibleItems.length === 0) return null;

            const isOpenGroup = openGroups[group.id] ?? true;

            return (
              <div key={group.id} className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between py-1.5 px-2 text-xs font-bold text-gray-500 hover:text-gray-900"
                >
                  <span className="truncate">{group.title}</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 text-gray-400 ${
                      isOpenGroup ? 'rotate-0' : '-rotate-90'
                    }`}
                  />
                </button>

                {isOpenGroup && (
                  <ul className="space-y-1 pr-1">
                    {visibleItems.map((item) => {
                      const active = isItemActive(item);
                      const Icon = item.icon;

                      if (item.comingSoon) {
                        return (
                          <li key={item.id}>
                            <div className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-gray-400 cursor-not-allowed opacity-60 bg-gray-50/50">
                              <div className="flex items-center gap-2.5 truncate">
                                <Icon size={16} className="shrink-0" />
                                <span className="truncate">{item.title}</span>
                              </div>
                              <span className="text-[10px] font-normal bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200">
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
                            className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all relative ${
                              active
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {active && (
                              <span className="absolute right-0 top-1.5 bottom-1.5 w-1 bg-blue-600 rounded-l-full" />
                            )}

                            <div className="flex items-center gap-2.5 truncate">
                              <Icon
                                size={16}
                                className={
                                  active
                                    ? 'text-blue-600'
                                    : 'text-gray-500'
                                }
                              />
                              <span className="truncate">{item.title}</span>
                            </div>

                            {item.badge && (
                              <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
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

        {/* فوتر کشو با وضعیت آزمایشی */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Sparkles size={14} className="text-emerald-600" />
            <span>محیط آزمایشی فاز اول (Mock)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
