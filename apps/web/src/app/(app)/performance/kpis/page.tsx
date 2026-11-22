'use client';

import * as React from 'react';
import {
  Target,
  Calculator,
  Bell,
  RefreshCw,
  ShieldAlert,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/common/toast-provider';
import { useAuth } from '@/features/auth';
import { api } from '@/lib/api';
import {
  kpisApi,
  KpiItem,
  MetricDefinition,
  AlertRuleItem,
  KpisTable,
  KpiDrawer,
  MetricsTab,
  AlertRulesTab,
} from '@/features/kpis';

type ActiveTab = 'kpis' | 'metrics' | 'alerts';

export default function PerformanceKpisPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const userRole = user?.role || 'marketing_manager';
  const canWrite = ['admin', 'marketing_manager'].includes(userRole);
  const canView = ['admin', 'marketing_manager', 'campaign_manager'].includes(userRole);

  const [activeTab, setActiveTab] = React.useState<ActiveTab>('kpis');
  const [isLoading, setIsLoading] = React.useState(true);

  // Data states
  const [kpis, setKpis] = React.useState<KpiItem[]>([]);
  const [defaultMetrics, setDefaultMetrics] = React.useState<MetricDefinition[]>([]);
  const [customMetrics, setCustomMetrics] = React.useState<MetricDefinition[]>([]);
  const [alertRules, setAlertRules] = React.useState<AlertRuleItem[]>([]);
  const [campaigns, setCampaigns] = React.useState<Array<{ id: string; name: string }>>([]);

  // Drawers & Modals
  const [isKpiDrawerOpen, setIsKpiDrawerOpen] = React.useState(false);
  const [editingKpi, setEditingKpi] = React.useState<KpiItem | null>(null);

  // Combined metrics list for selectors
  const allMetrics = React.useMemo(() => {
    return [...defaultMetrics, ...customMetrics];
  }, [defaultMetrics, customMetrics]);

  // Load all initial data
  const fetchData = React.useCallback(async () => {
    if (!canView) return;

    setIsLoading(true);
    try {
      const [kpisRes, metricsRes, alertsRes] = await Promise.all([
        kpisApi.getAllKpis(),
        kpisApi.getMetrics(),
        kpisApi.getAlertRules(),
      ]);

      setKpis(kpisRes);
      setDefaultMetrics(metricsRes.defaultMetrics || []);
      setCustomMetrics(metricsRes.customMetrics || []);
      setAlertRules(alertsRes);

      // Attempt to load campaigns for dropdown selectors
      try {
        const campRes = await api.get('/campaigns');
        const list = Array.isArray(campRes.data)
          ? campRes.data
          : campRes.data?.data || campRes.data?.campaigns || [];
        setCampaigns(
          list.map((c: any) => ({
            id: c.id,
            name: c.name || c.title || 'کمپین بدون نام',
          })),
        );
      } catch (e) {
        // Silently continue if campaigns list fails
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'خطا در ارتباط با سرور', {
        title: 'خطا در بارگذاری اطلاعات KPI',
      });
    } finally {
      setIsLoading(false);
    }
  }, [canView, toast]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // KPI Actions
  const handleOpenAddKpi = () => {
    setEditingKpi(null);
    setIsKpiDrawerOpen(true);
  };

  const handleEditKpi = (kpi: KpiItem) => {
    setEditingKpi(kpi);
    setIsKpiDrawerOpen(true);
  };

  const handleDeleteKpi = async (kpi: KpiItem) => {
    if (!confirm(`آیا از حذف شاخص KPI «${kpi.name}» اطمینان دارید؟`)) return;

    try {
      await kpisApi.deleteKpi(kpi.id);
      toast.success(`شاخص «${kpi.name}» با موفقیت حذف گردید.`, {
        title: 'شاخص KPI حذف شد',
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'خطا در حذف شاخص', {
        title: 'خطا در حذف KPI',
      });
    }
  };

  // RBAC guard message
  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-base font-bold text-white mb-1.5">عدم دسترسی به ماژول KPI و شاخص‌ها</h2>
        <p className="text-xs text-slate-400 max-w-md leading-relaxed">
          طبق سند رسمی محصول Gapji (PRD ص ۱۳)، تنها مدیر مارکتینگ و مدیر ارشد به این بخش دسترسی دارند.
        </p>
      </div>
    );
  }

  const triggeredAlertsCount = alertRules.filter((r) => r.isTriggered).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Breadcrumb Navigation */}
      <Breadcrumb
        items={[
          { label: 'فضای کاری عملکرد', href: '/performance/dashboard' },
          { label: 'KPI و شاخص‌ها' },
        ]}
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1F2E45]">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#719BDF]/10 border border-[#719BDF]/20 text-[#719BDF] flex items-center justify-center shadow-lg shadow-[#719BDF]/10">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">KPI و شاخص‌ها</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                هدف‌گذاری، ارزیابی هوشمند شاخص‌های بازاریابی و تنظیم قواعد خودکار هشدار انحراف عملکرد
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={isLoading}
            className="text-xs gap-1.5 h-9 border-[#1F2E45] bg-[#111D2E]/80 text-slate-300 hover:text-white hover:bg-[#18263A] rounded-xl"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            بروزرسانی زنده
          </Button>
        </div>
      </div>

      {/* Three Tabs Switcher (PRD Section 11, Page 13) */}
      <div className="flex items-center border-b border-[#1F2E45] gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('kpis')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'kpis'
              ? 'border-[#719BDF] text-[#719BDF] bg-[#719BDF]/10 rounded-t-xl'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>KPIها</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
              activeTab === 'kpis'
                ? 'bg-[#719BDF] text-white'
                : 'bg-[#0B1423] text-slate-400 border border-[#1F2E45]'
            }`}
          >
            {kpis.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('metrics')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'metrics'
              ? 'border-[#719BDF] text-[#719BDF] bg-[#719BDF]/10 rounded-t-xl'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>شاخص‌ها (فرمول‌ساز)</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
              activeTab === 'metrics'
                ? 'bg-[#719BDF] text-white'
                : 'bg-[#0B1423] text-slate-400 border border-[#1F2E45]'
            }`}
          >
            {defaultMetrics.length + customMetrics.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('alerts')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'alerts'
              ? 'border-[#719BDF] text-[#719BDF] bg-[#719BDF]/10 rounded-t-xl'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>قواعد هشدار</span>
          {triggeredAlertsCount > 0 ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-rose-500 text-white animate-pulse">
              {triggeredAlertsCount} انحراف
            </span>
          ) : (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                activeTab === 'alerts'
                  ? 'bg-[#719BDF] text-white'
                  : 'bg-[#0B1423] text-slate-400 border border-[#1F2E45]'
              }`}
            >
              {alertRules.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: KPIها */}
      {activeTab === 'kpis' && (
        <KpisTable
          kpis={kpis}
          isLoading={isLoading}
          onEdit={handleEditKpi}
          onDelete={handleDeleteKpi}
          onAdd={handleOpenAddKpi}
          canWrite={canWrite}
        />
      )}

      {/* Tab 2: شاخص‌ها */}
      {activeTab === 'metrics' && (
        <MetricsTab
          defaultMetrics={defaultMetrics}
          customMetrics={customMetrics}
          isLoading={isLoading}
          onRefresh={fetchData}
          campaigns={campaigns}
          canWrite={canWrite}
        />
      )}

      {/* Tab 3: قواعد هشدار */}
      {activeTab === 'alerts' && (
        <AlertRulesTab
          rules={alertRules}
          metrics={allMetrics}
          kpis={kpis}
          isLoading={isLoading}
          onRefresh={fetchData}
          canWrite={canWrite}
        />
      )}

      {/* KPI Add / Edit Drawer */}
      <KpiDrawer
        isOpen={isKpiDrawerOpen}
        onClose={() => setIsKpiDrawerOpen(false)}
        onSuccess={() => {
          fetchData();
        }}
        kpi={editingKpi}
        metrics={allMetrics}
        campaigns={campaigns}
      />
    </div>
  );
}
