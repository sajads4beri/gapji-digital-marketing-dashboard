'use client';

import * as React from 'react';
import {
  Globe,
  Plus,
  RefreshCw,
  ShieldAlert,
  Building2,
} from 'lucide-react';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/common/toast-provider';
import { useAuth } from '@/features/auth';
import {
  landingApi,
  LandingPageItem,
  UtmLinkItem,
  LandingOptionsResponse,
  LandingPagesTable,
  LandingPageDrawer,
  UtmBuilderForm,
  UtmHistoryTable,
  CollapsibleGuides,
  WordPressModal,
} from '@/features/landing';

export default function PerformanceLandingPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const userRole = user?.role || 'marketing_manager';
  // PRD Page 14: Authorized roles: Marketing Manager & Campaign Manager (+ Admin)
  const canAccess = ['admin', 'marketing_manager', 'campaign_manager'].includes(userRole);

  const [isLoading, setIsLoading] = React.useState(true);
  const [landingPages, setLandingPages] = React.useState<LandingPageItem[]>([]);
  const [utmLinks, setUtmLinks] = React.useState<UtmLinkItem[]>([]);
  const [options, setOptions] = React.useState<LandingOptionsResponse>({
    landingPages: [],
    campaigns: [],
    platforms: [],
    commonMediums: [],
  });

  // Modal / Drawer States
  const [isAddDrawerOpen, setIsAddDrawerOpen] = React.useState(false);
  const [isWordPressModalOpen, setIsWordPressModalOpen] = React.useState(false);
  const [selectedLandingForUtm, setSelectedLandingForUtm] =
    React.useState<LandingPageItem | null>(null);

  // Ref to scroll to builder
  const builderRef = React.useRef<HTMLDivElement>(null);

  // Fetch all initial data
  const fetchData = React.useCallback(async () => {
    if (!canAccess) return;

    setIsLoading(true);
    try {
      const [pagesRes, linksRes, optionsRes] = await Promise.all([
        landingApi.getLandingPages(),
        landingApi.getUtmLinks(),
        landingApi.getOptions(),
      ]);

      setLandingPages(pagesRes);
      setUtmLinks(linksRes);
      setOptions(optionsRes);
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || err.message || 'خطا در برقراری ارتباط با سرور',
        { title: 'خطا در دریافت اطلاعات لندینگ' },
      );
    } finally {
      setIsLoading(false);
    }
  }, [canAccess, toast]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Actions
  const handleLandingCreated = (newPage: LandingPageItem) => {
    setLandingPages((prev) => [newPage, ...prev]);
    landingApi.getOptions().then((opt) => setOptions(opt)).catch(() => {});
  };

  const handleDeleteLanding = async (landing: LandingPageItem) => {
    if (
      !confirm(
        `آیا از حذف صفحه فرود «${landing.title}» اطمینان دارید؟ لینک‌های UTM ساخته‌شده حفظ خواهند شد.`,
      )
    ) {
      return;
    }

    try {
      await landingApi.deleteLandingPage(landing.id);
      toast.success(`صفحه فرود «${landing.title}» حذف گردید`, {
        title: 'صفحه فرود حذف شد',
      });
      fetchData();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || err.message || 'خطا در حذف صفحه فرود',
        { title: 'خطا' },
      );
    }
  };

  const handleCreateUtmForLanding = (landing: LandingPageItem) => {
    setSelectedLandingForUtm(landing);
    if (builderRef.current) {
      builderRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleUtmLinkCreated = (newLink: UtmLinkItem) => {
    setUtmLinks((prev) => [newLink, ...prev]);
    landingApi.getLandingPages().then((res) => setLandingPages(res)).catch(() => {});
  };

  // RBAC guard
  if (!canAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#18263A] border border-rose-500/30 text-rose-400 flex items-center justify-center mb-4 shadow-xl">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-base font-bold text-white mb-1">
          عدم دسترسی به ماژول لندینگ و UTM
        </h2>
        <p className="text-xs text-rose-300/80 max-w-md leading-relaxed">
          طبق سند رسمی محصول Gapji (PRD ص ۱۴)، تنها نقش‌های «مدیر مارکتینگ» و
          «کمپین‌چی» به این بخش دسترسی دارند.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumb
        items={[
          { label: 'فضای کاری ۱: عملکرد', href: '/performance/dashboard' },
          { label: 'لندینگ و UTM' },
        ]}
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1F2E45]">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2 tracking-tight">
            <Globe className="w-6 h-6 text-[#719BDF]" />
            لندینگ و UTM
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            مدیریت صفحات فرود، اتصال وب‌هوک وردپرس و ساخت لینک‌های اختصاصی با برچسب‌های استاندارد UTM
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={isLoading}
            className="text-xs flex items-center gap-1.5 bg-[#18263A] border-[#1F2E45] text-slate-300 hover:text-white hover:bg-[#1F2E45]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            بروزرسانی
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsWordPressModalOpen(true)}
            className="text-xs flex items-center gap-1.5 bg-[#18263A] border-[#1F2E45] text-[#719BDF] hover:text-white hover:bg-[#1F2E45]"
          >
            <Building2 className="w-3.5 h-3.5" />
            اتصال به وردپرس
          </Button>

          <Button
            size="sm"
            onClick={() => setIsAddDrawerOpen(true)}
            className="text-xs flex items-center gap-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-md shadow-blue-900/30 font-medium"
          >
            <Plus className="w-4 h-4" />
            افزودن صفحه فرود
          </Button>
        </div>
      </div>

      {/* Section A: Landing Pages Table */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">
              بخش ۱: لندینگ‌ها (Landing Pages)
            </h2>
            <p className="text-[11px] text-slate-400">
              فهرست صفحات فرود ثبت‌شده، وضعیت اتصال وب‌هوک و آمار لیدهای ۷ روز اخیر
            </p>
          </div>
        </div>

        <LandingPagesTable
          landingPages={landingPages}
          isLoading={isLoading}
          onAdd={() => setIsAddDrawerOpen(true)}
          onOpenWordPressModal={() => setIsWordPressModalOpen(true)}
          onSelectForUtm={handleCreateUtmForLanding}
          onDelete={handleDeleteLanding}
        />
      </section>

      {/* Section B: UTM Builder Form */}
      <section ref={builderRef} className="space-y-3 pt-4">
        <div>
          <h2 className="text-sm font-bold text-white">
            بخش ۲: سازنده UTM (UTM Builder)
          </h2>
          <p className="text-[11px] text-slate-400">
            تولید لینک‌های تبلیغاتی با برچسب‌گذاری استاندارد برای تفکیک دقیق منابع ورودی در گزارش‌ها
          </p>
        </div>

        <UtmBuilderForm
          landingPages={landingPages}
          campaigns={options.campaigns}
          platforms={options.platforms}
          commonMediums={options.commonMediums}
          onLinkCreated={handleUtmLinkCreated}
          selectedLandingForUtm={selectedLandingForUtm}
        />
      </section>

      {/* Section C: UTM Links History */}
      <section className="space-y-3 pt-4">
        <div>
          <h2 className="text-sm font-bold text-white">
            بخش ۳: تاریخچه لینک‌های UTM
          </h2>
          <p className="text-[11px] text-slate-400">
            فهرست تمامی لینک‌های تولیدشده به همراه آمار لیدهای انتسابی و وضعیت ردیابی کلیک
          </p>
        </div>

        <UtmHistoryTable
          links={utmLinks}
          isLoading={isLoading}
          onScrollToBuilder={() => {
            if (builderRef.current) {
              builderRef.current.scrollIntoView({ behavior: 'smooth' });
            }
          }}
        />
      </section>

      {/* Section D: Collapsible Instructional Guides */}
      <section className="pt-4 border-t border-[#1F2E45]">
        <CollapsibleGuides />
      </section>

      {/* Drawers and Modals */}
      <LandingPageDrawer
        isOpen={isAddDrawerOpen}
        onClose={() => setIsAddDrawerOpen(false)}
        campaigns={options.campaigns}
        onSuccess={handleLandingCreated}
      />

      <WordPressModal
        isOpen={isWordPressModalOpen}
        onClose={() => setIsWordPressModalOpen(false)}
      />
    </div>
  );
}
