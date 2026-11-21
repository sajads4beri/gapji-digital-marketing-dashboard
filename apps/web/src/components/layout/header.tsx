'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/components/common/toast-provider';
import { useAuth } from '@/features/auth';
import { canAccessRoute } from '@/lib/permissions';
import { searchApi, SearchItemResult, GlobalSearchResponse } from '@/features/search/search.api';
import { notificationsApi, NotificationItem } from '@/features/notifications';
import {
  Menu,
  Search,
  Bell,
  Sparkles,
  Building2,
  ChevronDown,
  LogOut,
  User as UserIcon,
  Layers,
  Users,
  Loader2,
  X,
  CheckCheck,
} from 'lucide-react';

export interface HeaderProps {
  onOpenMobileMenu: () => void;
  className?: string;
}

export function Header({ onOpenMobileMenu, className = '' }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const {
    user,
    activeOrgName,
    activeOrgId,
    availableOrganizations,
    logout,
    selectOrganization,
  } = useAuth();

  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = React.useState(false);

  // وضعیت جستجوی سراسری
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<GlobalSearchResponse | null>(null);
  const [isSearching, setIsSearching] = React.useState(false);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const searchContainerRef = React.useRef<HTMLDivElement>(null);

  // وضعیت اعلان‌ها
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = React.useState<number>(0);
  const [displayCount, setDisplayCount] = React.useState<string>('0');
  const [isLoadingNotifications, setIsLoadingNotifications] = React.useState<boolean>(false);

  const fetchNotifications = React.useCallback(async () => {
    try {
      const data = await notificationsApi.getNotifications({ limit: 10 });
      setNotifications(data.items);
      setUnreadCount(data.unreadCount);
      setDisplayCount(data.displayCount);
    } catch (e) {
      // در هدر خطا لاگ نمی‌شود تا تجربه کاربر مختل نشود
    }
  }, []);

  React.useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 45000);
      return () => clearInterval(interval);
    }
  }, [user, fetchNotifications, activeOrgId]);

  const handleMarkAllNotificationsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      setDisplayCount('0');
      toast.success('تمامی اعلان‌ها به عنوان خوانده‌شده علامت‌گذاری شدند.');
    } catch (e) {
      toast.error('خطا در علامت‌گذاری اعلان‌ها');
    }
  };

  const handleNotificationItemClick = async (n: NotificationItem) => {
    if (!n.isRead) {
      try {
        await notificationsApi.markAsRead(n.id);
        setNotifications((prev) =>
          prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item)),
        );
        setUnreadCount((c) => Math.max(0, c - 1));
        setDisplayCount((c) => {
          const num = Math.max(0, Number(c) - 1);
          return num > 99 ? '+99' : String(num);
        });
      } catch (e) {
        // ignore
      }
    }
    setIsNotificationsOpen(false);
    if (n.linkUrl) {
      router.push(n.linkUrl);
    } else {
      router.push('/notifications');
    }
  };

  // میانبر صفحه‌کلید Ctrl+K / Cmd+K برای فوکوس جستجو
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsNotificationsOpen(false);
        setIsOrgDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // جستجوی دیبانس‌شده
  React.useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await searchApi.globalSearch(trimmed);
        setSearchResults(res);
        setIsSearchOpen(true);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // بستن دراپ‌داون‌ها با کلیک بیرون
  React.useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.header-dropdown')) {
        setIsNotificationsOpen(false);
        setIsOrgDropdownOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  const handleSelectResult = (item: SearchItemResult) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    router.push(item.url);
  };

  return (
    <header
      className={`h-16 bg-[#080F1C]/90 backdrop-blur-md border-b border-[#1F2E45]/80 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-20 select-none transition-colors duration-150 ${className}`}
      dir="rtl"
    >
      {/* بخش راست: دکمه همبرگری موبایل و سازمان جاری */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="باز کردن منوی ناوبری"
          className="lg:hidden p-2 text-slate-400 hover:text-slate-100 hover:bg-[#18263A] rounded-xl transition-colors"
        >
          <Menu size={20} />
        </button>

        {/* سوییچر سازمان فعال */}
        <div className="relative header-dropdown hidden sm:block">
          <button
            type="button"
            onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#111D2E]/90 hover:bg-[#18263A] border border-[#1F2E45] text-xs font-semibold text-slate-200 transition-colors"
          >
            <Building2 size={14} className="text-[#719BDF]" />
            <span className="max-w-[140px] truncate">
              {activeOrgName || 'گپ‌جی مارکتینگ سوئیت'}
            </span>
            <ChevronDown size={12} className="text-slate-400" />
          </button>

          {isOrgDropdownOpen && availableOrganizations.length > 0 && (
            <div className="absolute right-0 mt-2 w-56 bg-[#111D2E] rounded-xl shadow-2xl border border-[#1F2E45] p-1.5 z-50 animate-in fade-in zoom-in-95">
              <div className="px-2.5 py-1.5 text-[11px] font-bold text-slate-400 border-b border-[#1F2E45]/80 mb-1">
                تغییر سازمان فعال
              </div>
              {availableOrganizations.map((org) => {
                const orgId = org.orgId || (org as any).id;
                const orgName = org.orgName || (org as any).name;
                return (
                  <button
                    key={orgId}
                    type="button"
                    onClick={() => {
                      const targetOrg = availableOrganizations.find((o) => (o.orgId || (o as any).id) === orgId);
                      selectOrganization(orgId);
                      setIsOrgDropdownOpen(false);
                      if (targetOrg && !canAccessRoute(pathname, targetOrg.role)) {
                        router.push('/');
                      }
                      toast.success(`سازمان فعال به «${orgName}» تغییر یافت.`);
                    }}
                    className={`w-full text-right px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      orgId === activeOrgId
                        ? 'bg-[#719BDF]/15 text-[#719BDF] font-bold'
                        : 'text-slate-300 hover:bg-[#18263A]'
                    }`}
                  >
                    <span className="truncate">{orgName}</span>
                    {orgId === activeOrgId && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#719BDF]" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="hidden md:flex items-center gap-1.5 text-slate-400 text-xs font-medium border-r border-[#1F2E45] pe-3 me-1">
          <Sparkles size={14} className="text-[#719BDF]" />
          <span className="text-[10px] text-slate-500 font-mono">v2.4</span>
        </div>
      </div>

      {/* بخش میانی: جستجوی سراسری هوشمند */}
      <div ref={searchContainerRef} className="relative flex flex-1 max-w-md mx-2 sm:mx-4">
        <div className="relative w-full">
          <Search
            size={15}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (searchQuery.trim().length >= 2) setIsSearchOpen(true);
            }}
            placeholder="جستجوی سریع لیدها، کمپین‌ها، هزینه‌ها..."
            className="w-full bg-[#111D2E]/80 border border-[#1F2E45] rounded-xl ps-10 pe-16 py-2 text-xs text-slate-200 placeholder-slate-400 hover:border-[#719BDF]/40 hover:bg-[#18263A]/60 transition-all focus:outline-none focus:border-[#719BDF]/60"
          />
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {isSearching ? (
              <Loader2 size={13} className="text-[#719BDF] animate-spin" />
            ) : searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults(null);
                  setIsSearchOpen(false);
                }}
                className="text-slate-400 hover:text-slate-200 p-0.5"
              >
                <X size={13} />
              </button>
            ) : (
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-400 bg-[#18263A] border border-[#1F2E45] rounded">
                Ctrl+K
              </kbd>
            )}
          </div>
        </div>

        {/* منوی شناور نتایج جستجو */}
        {isSearchOpen && searchQuery.trim().length >= 2 && (
          <div className="absolute top-full mt-2 w-full bg-[#111D2E] rounded-xl shadow-2xl border border-[#1F2E45] p-2 z-50 max-h-80 overflow-y-auto animate-in fade-in zoom-in-95">
            {isSearching ? (
              <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 size={14} className="text-[#719BDF] animate-spin" />
                <span>در حال جستجو در سازمان...</span>
              </div>
            ) : searchResults && searchResults.total > 0 ? (
              <div className="space-y-3">
                {searchResults.leads.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-slate-400 border-b border-[#1F2E45]/80">
                      <Users size={12} className="text-[#719BDF]" />
                      <span>سرنخ‌ها ({searchResults.leads.length})</span>
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {searchResults.leads.map((lead) => (
                        <button
                          key={lead.id}
                          type="button"
                          onClick={() => handleSelectResult(lead)}
                          className="w-full text-right px-2.5 py-2 rounded-lg text-xs flex items-center justify-between text-slate-300 hover:bg-[#18263A] hover:text-white transition-colors"
                        >
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-100">{lead.title}</span>
                            {lead.subtitle && (
                              <span className="text-[10px] text-slate-400">{lead.subtitle}</span>
                            )}
                          </div>
                          {lead.badge && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1F2E45] text-slate-300">
                              {lead.badge}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {searchResults.campaigns.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-slate-400 border-b border-[#1F2E45]/80">
                      <Layers size={12} className="text-emerald-400" />
                      <span>کمپین‌ها ({searchResults.campaigns.length})</span>
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {searchResults.campaigns.map((camp) => (
                        <button
                          key={camp.id}
                          type="button"
                          onClick={() => handleSelectResult(camp)}
                          className="w-full text-right px-2.5 py-2 rounded-lg text-xs flex items-center justify-between text-slate-300 hover:bg-[#18263A] hover:text-white transition-colors"
                        >
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-100">{camp.title}</span>
                            {camp.subtitle && (
                              <span className="text-[10px] text-slate-400">{camp.subtitle}</span>
                            )}
                          </div>
                          {camp.badge && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              {camp.badge}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                موردی مطابق با «{searchQuery}» یافت نشد.
              </div>
            )}
          </div>
        )}
      </div>

      {/* بخش چپ: زنگ اعلان‌ها، نام کاربر و دکمه خروج */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="relative header-dropdown">
          <button
            type="button"
            onClick={() => {
              setIsNotificationsOpen(!isNotificationsOpen);
              if (!isNotificationsOpen) fetchNotifications();
            }}
            aria-label="اعلان‌ها"
            className="relative p-2 text-slate-400 hover:text-slate-100 hover:bg-[#18263A] rounded-xl transition-colors border border-transparent hover:border-[#1F2E45]"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 left-1.5 flex items-center justify-center min-w-[16px] h-[16px] px-1 text-[10px] font-extrabold text-white bg-[#D66B73] rounded-full border-2 border-[#080F1C]">
                {displayCount}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute left-0 mt-2 w-84 bg-[#111D2E] rounded-2xl shadow-2xl border border-[#1F2E45] p-2 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between px-3 py-2 border-b border-[#1F2E45]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-100">
                    اعلان‌های اخیر
                  </span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] bg-[#719BDF]/15 text-[#719BDF] font-bold px-2 py-0.5 rounded-full border border-[#719BDF]/30">
                      {displayCount} جدید
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllNotificationsRead}
                    className="text-[11px] text-[#719BDF] hover:underline flex items-center gap-1 font-medium"
                  >
                    <CheckCheck size={13} />
                    <span>خوانده شدن همه</span>
                  </button>
                )}
              </div>

              <div className="divide-y divide-[#1F2E45]/60 max-h-64 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => handleNotificationItemClick(n)}
                      className={`w-full text-right p-2.5 text-xs rounded-xl transition-colors block ${
                        !n.isRead
                          ? 'bg-[#18263A]/80 font-semibold'
                          : 'text-slate-400 hover:bg-[#18263A]/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-slate-200 leading-snug line-clamp-1">{n.title}</p>
                        {!n.isRead && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#719BDF] shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{n.message}</p>
                    </button>
                  ))
                ) : (
                  <div className="py-6 text-center text-xs text-slate-400">
                    هیچ اعلانی یافت نشد.
                  </div>
                )}
              </div>

              <div className="p-2 border-t border-[#1F2E45] text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsNotificationsOpen(false);
                    router.push('/notifications');
                  }}
                  className="text-xs font-bold text-[#719BDF] hover:underline"
                >
                  مشاهده همه اعلان‌ها و تنظیمات
                </button>
              </div>
            </div>
          )}
        </div>

        {/* پروفایل مختصر کاربر و خروج */}
        {user && (
          <div className="hidden sm:flex items-center gap-2 ps-2 border-s border-[#1F2E45]">
            <div className="text-left text-xs">
              <div className="font-semibold text-slate-200">{user.fullName}</div>
            </div>
            <button
              type="button"
              onClick={() => logout()}
              title="خروج از حساب کاربری"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
