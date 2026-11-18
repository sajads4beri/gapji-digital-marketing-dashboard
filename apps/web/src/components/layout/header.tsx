'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/components/common/toast-provider';
import { useAuth } from '@/features/auth';
import { canAccessRoute } from '@/lib/permissions';
import {
  Menu,
  Search,
  Bell,
  Sparkles,
  Building2,
  ChevronDown,
  LogOut,
  User as UserIcon,
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

  const mockNotifications = [
    {
      id: '1',
      title: 'کمپین تخفیف یلدا فعال شد',
      time: '۱۰ دقیقه پیش',
      unread: true,
    },
    {
      id: '2',
      title: 'ثبت ۳ لید جدید از کمپین گوگل ادز',
      time: '۱ ساعت پیش',
      unread: true,
    },
    {
      id: '3',
      title: 'مصرف ۸۵٪ از بودجه کمپین پیامکی',
      time: '۳ ساعت پیش',
      unread: false,
    },
  ];

  // بستن دراپ‌داون‌ها با کلیک بیرون
  React.useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.header-dropdown')) {
        setIsNotificationsOpen(false);
        setIsOrgDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

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
      <div className="flex flex-1 max-w-md mx-2 sm:mx-4">
        <div className="relative w-full">
          <Search
            size={15}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            readOnly
            placeholder="جستجوی سریع لیدها، کمپین‌ها، هزینه‌ها..."
            onClick={() =>
              toast.info(
                'جستجوی سریع سراسری در فازهای بعدی فعال خواهد شد.',
              )
            }
            className="w-full bg-[#111D2E]/80 border border-[#1F2E45] rounded-xl ps-10 pe-16 py-2 text-xs text-slate-200 placeholder-slate-400 cursor-pointer hover:border-[#719BDF]/40 hover:bg-[#18263A]/60 transition-all focus:outline-none"
          />
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-400 bg-[#18263A] border border-[#1F2E45] rounded">
              Ctrl+K
            </kbd>
          </div>
        </div>
      </div>

      {/* بخش چپ: زنگ اعلان‌ها، نام کاربر و دکمه خروج */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="relative header-dropdown">
          <button
            type="button"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            aria-label="اعلان‌ها"
            className="relative p-2 text-slate-400 hover:text-slate-100 hover:bg-[#18263A] rounded-xl transition-colors border border-transparent hover:border-[#1F2E45]"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 left-1.5 flex items-center justify-center min-w-[16px] h-[16px] px-1 text-[10px] font-extrabold text-white bg-[#D66B73] rounded-full border-2 border-[#080F1C]">
              ۲
            </span>
          </button>

          {isNotificationsOpen && (
            <div className="absolute left-0 mt-2 w-80 bg-[#111D2E] rounded-2xl shadow-2xl border border-[#1F2E45] p-2 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between px-3 py-2 border-b border-[#1F2E45]">
                <span className="text-xs font-bold text-slate-100">
                  اعلان‌های اخیر
                </span>
                <span className="text-[10px] bg-[#719BDF]/15 text-[#719BDF] font-bold px-2 py-0.5 rounded-full border border-[#719BDF]/30">
                  ۲ پیام جدید
                </span>
              </div>
              <div className="divide-y divide-[#1F2E45]/60 max-h-60 overflow-y-auto">
                {mockNotifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-2.5 text-xs rounded-xl transition-colors ${
                      n.unread
                        ? 'bg-[#18263A]/80 font-semibold'
                        : 'text-slate-400'
                    }`}
                  >
                    <p className="text-slate-200 leading-snug">{n.title}</p>
                    <span className="text-[10px] text-slate-400 font-normal mt-1 block">
                      {n.time}
                    </span>
                  </div>
                ))}
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
