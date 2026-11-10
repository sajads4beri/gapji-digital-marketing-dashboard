'use client';

import * as React from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { MobileSidebar } from './mobile-sidebar';
import { Breadcrumb, BreadcrumbItem } from './breadcrumb';

export interface AppShellProps {
 children: React.ReactNode;
 breadcrumbItems?: BreadcrumbItem[];
 pageTitle?: string;
 pageAction?: React.ReactNode;
 maxWidth?: '1440' | '800' | 'full';
 className?: string;
}

const maxWidthClasses = {
 '1440': 'max-w-[1440px]',
 '800': 'max-w-[800px]',
 full: 'max-w-none',
};

export function AppShell({
 children,
 breadcrumbItems,
 pageTitle,
 pageAction,
 maxWidth = '1440',
 className = '',
}: AppShellProps) {
 const [isCollapsed, setIsCollapsed] = React.useState(false);
 const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

 // بازیابی ترجیح جمع‌شدن سایدبار از localStorage در سمت کلاینت
 React.useEffect(() => {
 try {
 const saved = localStorage.getItem('gapji_sidebar_collapsed');
 if (saved !== null) {
 setIsCollapsed(JSON.parse(saved));
 }
 } catch {
 // در صورت غیرفعال بودن localStorage نادیده گرفته شود
 }
 }, []);

 const handleToggleCollapse = () => {
 setIsCollapsed((prev) => {
 const next = !prev;
 try {
 localStorage.setItem(
 'gapji_sidebar_collapsed',
 JSON.stringify(next),
 );
 } catch {
 // نادیده گرفتن خطای ذخیره‌سازی
 }
 return next;
 });
 };

 return (
 <div
 className="min-h-screen bg-gray-50 flex flex-row w-full overflow-x-hidden text-right transition-colors duration-150"
 dir="rtl"
 >
 {/* منوی ناوبری موبایل (Drawer) */}
 <MobileSidebar
 isOpen={isMobileMenuOpen}
 onClose={() => setIsMobileMenuOpen(false)}
 />

 {/* سایدبار دسکتاپ (فقط در صفحات بزرگتر از lg) */}
 <div className="hidden lg:block shrink-0 h-screen sticky top-0">
 <Sidebar
 isCollapsed={isCollapsed}
 onToggleCollapse={handleToggleCollapse}
 className="h-full"
 />
 </div>

 {/* ناحیه محتوای اصلی و هدر سراسری */}
 <div className="flex-1 flex flex-col min-w-0">
 <Header onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />

 {/* نوار عنوان و مسیر صفحه در صورت ارسال */}
 {(breadcrumbItems || pageTitle || pageAction) && (
 <div className="bg-white border-b border-gray-200/80 px-4 sm:px-6 py-4 transition-colors">
 <div
 className={`mx-auto w-full ${maxWidthClasses[maxWidth]} flex flex-col sm:flex-row sm:items-center justify-between gap-3`}
 >
 <div className="space-y-1">
 {breadcrumbItems && (
 <Breadcrumb items={breadcrumbItems} />
 )}
 {pageTitle && (
 <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight">
 {pageTitle}
 </h1>
 )}
 </div>

 {pageAction && (
 <div className="shrink-0 flex items-center gap-2">
 {pageAction}
 </div>
 )}
 </div>
 </div>
 )}

 {/* بدنه صفحات با محدودیت ابعاد استاندارد سند (۱۴۴۰ پیکسل) */}
 <main
 className={`flex-1 w-full mx-auto px-4 sm:px-6 py-6 ${maxWidthClasses[maxWidth]} ${className}`}
 >
 {children}
 </main>
 </div>
 </div>
 );
}
