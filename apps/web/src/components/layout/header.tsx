'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/components/common';
import { useAuth } from '@/features/auth';
import { USER_ROLE_LABELS } from '@/features/users/types';
import { canAccessRoute } from '@/lib/permissions';
import {
 Menu,
 Search,
 Bell,
 Building2,
 ChevronDown,
 User,
 LogOut,
 Settings,
 Check,
 Shield,
 ExternalLink,
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
 activeOrgId,
 activeOrgName,
 activeRole,
 availableOrganizations,
 selectOrganization,
 logout,
 } = useAuth();

 const [isOrgDropdownOpen, setIsOrgDropdownOpen] = React.useState(false);
 const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
 const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);

 // نمایش نام و سازمان فعال از وضعیت مشترک احراز هویت
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

 // فهرست سازمان‌های مجاز کاربر
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
 setIsOrgDropdownOpen(false);
 setIsNotificationsOpen(false);
 setIsUserMenuOpen(false);
 }
 };
 document.addEventListener('click', handleDocumentClick);
 return () => document.removeEventListener('click', handleDocumentClick);
 }, []);

 const handleSelectOrg = (orgId: string, orgName: string) => {
 if (orgId === activeOrgId) {
 setIsOrgDropdownOpen(false);
 return;
 }
 const ok = selectOrganization(orgId);
 if (ok) {
 toast.success(`سازمان فعال به «${orgName}» تغییر یافت.`);
 const targetOrg = availableOrganizations.find((o) => o.orgId === orgId);
 if (targetOrg && pathname !== '/' && !canAccessRoute(pathname, targetOrg.role)) {
 toast.info('با توجه به تفاوت سطح دسترسی شما در این سازمان، به صفحه خانه هدایت شدید.');
 router.push('/');
 }
 }
 setIsOrgDropdownOpen(false);
 };

 const handleLogout = () => {
 logout();
 toast.success('با موفقیت از حساب کاربری خارج شدید.');
 setIsUserMenuOpen(false);
 router.replace('/login');
 };

 return (
 <header
 className={`h-16 bg-white border-b border-gray-200 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-20 select-none transition-colors duration-150 ${className}`}
 dir="rtl"
 >
 {/* بخش راست: دکمه همبرگری موبایل + سوییچر سازمان فعال */}
 <div className="flex items-center gap-3">
 {/* دکمه باز کردن منوی کشویی در موبایل */}
 <button
 type="button"
 onClick={onOpenMobileMenu}
 aria-label="باز کردن منوی ناوبری"
 className="lg:hidden p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
 >
 <Menu size={20} />
 </button>

 {/* انتخابگر سازمان فعال با اتصال به useAuth */}
 <div className="relative header-dropdown">
 <button
 type="button"
 onClick={() => {
 setIsOrgDropdownOpen(!isOrgDropdownOpen);
 setIsNotificationsOpen(false);
 setIsUserMenuOpen(false);
 }}
 className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-xs font-bold text-gray-800 "
 >
 <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
 <Building2 size={14} />
 </div>
 <span className="truncate max-w-[140px] sm:max-w-[200px]">
 {currentOrgDisplay}
 </span>
 <ChevronDown size={14} className="text-gray-400 " />
 </button>

 {isOrgDropdownOpen && (
 <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in zoom-in-95">
 <div className="px-3 py-1.5 border-b border-gray-100 text-[11px] font-semibold text-gray-400 flex items-center justify-between">
 <span>انتخاب سازمان فعال</span>
 <span className="text-[10px] text-blue-600 font-bold">
 {orgOptions.length} سازمان
 </span>
 </div>
 <div className="max-h-60 overflow-y-auto divide-y divide-gray-50 ">
 {orgOptions.map((org) => {
 const isCurrent = (activeOrgId ? org.orgId === activeOrgId : org.orgName === currentOrgDisplay);
 const roleTxt = USER_ROLE_LABELS[org.role] || org.role;

 return (
 <button
 key={org.orgId}
 type="button"
 onClick={() => handleSelectOrg(org.orgId, org.orgName)}
 className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors text-right"
 >
 <div className="space-y-0.5 truncate text-right">
 <p className="font-bold text-gray-900 truncate">
 {org.orgName}
 </p>
 <p className="text-[10px] text-gray-400 ">
 نقش شما: {roleTxt}
 </p>
 </div>
 {isCurrent && (
 <Check size={14} className="text-blue-600 shrink-0 mr-2" />
 )}
 </button>
 );
 })}
 </div>

 {orgOptions.length > 1 && (
 <div className="pt-1.5 border-t border-gray-100 px-2">
 <Link
 href="/select-org"
 onClick={() => setIsOrgDropdownOpen(false)}
 className="w-full text-center block py-1.5 text-[11px] font-bold text-blue-600 hover:text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
 >
 مدیریت و مشاهده تمام سازمان‌ها
 </Link>
 </div>
 )}
 </div>
 )}
 </div>
 </div>

 {/* بخش میانی: جستجوی سراسری (Mock نمایشی) */}
 <div className="hidden md:flex flex-1 max-w-md mx-4">
 <div className="relative w-full">
 <Search
 size={16}
 className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
 />
 <input
 type="text"
 readOnly
 placeholder="جستجوی سریع سراسری لیدها و کمپین‌ها... (Ctrl+K)"
 onClick={() =>
 toast.info(
 'جستجوی سراسری در فازهای بعدی پس از ساخت ماژول‌های لید فعال خواهد شد.',
 )
 }
 className="w-full bg-gray-50 border border-gray-200 rounded-xl pr-10 pl-4 py-2 text-xs text-gray-700 placeholder-gray-400 cursor-pointer hover:bg-gray-100 transition-colors focus:outline-none"
 />
 </div>
 </div>

 {/* بخش چپ: زنگ اعلان‌ها + منوی کاربر */}
 <div className="flex items-center gap-2 sm:gap-3">
 {/* زنگ اعلان همراه با شمارنده */}
 <div className="relative header-dropdown">
 <button
 type="button"
 onClick={() => {
 setIsNotificationsOpen(!isNotificationsOpen);
 setIsOrgDropdownOpen(false);
 setIsUserMenuOpen(false);
 }}
 aria-label="اعلان‌ها"
 className="relative p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
 >
 <Bell size={19} />
 <span className="absolute top-1.5 left-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-extrabold text-white bg-red-500 rounded-full border-2 border-white ">
 ۲
 </span>
 </button>

 {isNotificationsOpen && (
 <div className="absolute left-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-200 p-2 z-50 animate-in fade-in zoom-in-95">
 <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 ">
 <span className="text-xs font-bold text-gray-900 ">
 اعلان‌های اخیر
 </span>
 <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full">
 ۲ پیام جدید
 </span>
 </div>
 <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
 {mockNotifications.map((n) => (
 <div
 key={n.id}
 className={`p-2.5 text-xs rounded-xl transition-colors ${
 n.unread
 ? 'bg-blue-50/40 font-semibold'
 : 'text-gray-600 '
 }`}
 >
 <p className="text-gray-900 leading-snug">{n.title}</p>
 <span className="text-[10px] text-gray-400 font-normal mt-1 block">
 {n.time}
 </span>
 </div>
 ))}
 </div>
 <div className="pt-2 border-t border-gray-100 text-center">
 <span className="text-[11px] text-gray-400 ">
 صفحه اختصاصی اعلان‌ها در اولویت ۲ ساخته خواهد شد.
 </span>
 </div>
 </div>
 )}
 </div>

 {/* منوی کاربر جاری با اتصال به useAuth */}
 <div className="relative header-dropdown">
 <button
 type="button"
 onClick={() => {
 setIsUserMenuOpen(!isUserMenuOpen);
 setIsOrgDropdownOpen(false);
 setIsNotificationsOpen(false);
 }}
 className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all text-right"
 >
 <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
 {userInitials}
 </div>
 <div className="hidden sm:flex flex-col text-right">
 <span className="text-xs font-bold text-gray-800 leading-tight">
 {currentUserDisplay}
 </span>
 <span className="text-[10px] text-gray-500 font-medium">
 {currentRoleDisplay}
 </span>
 </div>
 <ChevronDown size={14} className="hidden sm:block text-gray-400 " />
 </button>

 {isUserMenuOpen && (
 <div className="absolute left-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in zoom-in-95">
 <div className="px-4 py-2 border-b border-gray-100 ">
 <p className="text-xs font-bold text-gray-900 ">{currentUserDisplay}</p>
 <p className="text-[11px] text-gray-500 font-mono" dir="ltr">
 {currentUserEmail}
 </p>
 <span className="inline-block mt-1 text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold">
 {currentRoleDisplay}
 </span>
 </div>

 <div className="py-1">
 <button
 type="button"
 onClick={() => toast.info('پروفایل در بخش تنظیمات در دسترس خواهد بود.')}
 className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors text-right"
 >
 <User size={15} className="text-gray-400 " />
 <span>پروفایل کاربری</span>
 </button>
 <button
 type="button"
 onClick={() => toast.info('تنظیمات کاربری')}
 className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors text-right"
 >
 <Settings size={15} className="text-gray-400 " />
 <span>تنظیمات حساب</span>
 </button>
 </div>

 <div className="pt-1 border-t border-gray-100 ">
 <button
 type="button"
 onClick={handleLogout}
 className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors text-right"
 >
 <LogOut size={15} />
 <span>خروج از حساب</span>
 </button>
 </div>
 </div>
 )}
 </div>
 </div>
 </header>
 );
}
