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

  // بازیابی وضعیت جمع‌شدن سایدبار از localStorage در سمت کلاینت
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
        // نادیده گرفتن خطا
      }
      return next;
    });
  };

  return (
    <div
      className="h-screen w-screen overflow-hidden bg-[#080F1C] text-slate-100 flex flex-row text-right transition-colors duration-150"
      dir="rtl"
    >
      {/* منوی ناوبری موبایل (Drawer) */}
      <MobileSidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* سایدبار ثابت دسکتاپ (Fixed Sidebar — 100% ثابت در ارتفاع تمام‌صفحه) */}
      <div className="hidden lg:flex flex-col shrink-0 h-screen z-30 select-none">
        <Sidebar
          isCollapsed={isCollapsed}
          onToggleCollapse={handleToggleCollapse}
          className="h-full"
        />
      </div>

      {/* ناحیه محتوای این‌ست و هدر فیکس (SidebarInset Architecture) */}
      <div className="flex-1 h-screen overflow-hidden flex flex-col min-w-0 bg-[#080F1C]">
        {/* هدر فیکس در بالای صفحه (Fixed Header) */}
        <Header
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          className="shrink-0"
        />

        {/* ناحیه اسکرول‌شونده اختصاصی محتوا و نوار مسیر صفحه */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col min-w-0 scrollbar-thin">
          {/* نوار عنوان و مسیر صفحه در صورت ارسال */}
          {(breadcrumbItems || pageTitle || pageAction) && (
            <div className="bg-[#0B1423]/90 backdrop-blur-md border-b border-[#1F2E45]/80 px-4 sm:px-6 py-4 transition-colors shrink-0">
              <div
                className={`mx-auto w-full ${maxWidthClasses[maxWidth]} flex flex-col sm:flex-row sm:items-center justify-between gap-3`}
              >
                <div className="space-y-1">
                  {breadcrumbItems && (
                    <Breadcrumb items={breadcrumbItems} />
                  )}
                  {pageTitle && (
                    <h1 className="text-lg sm:text-xl font-extrabold text-slate-100 tracking-tight font-display">
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
    </div>
  );
}
