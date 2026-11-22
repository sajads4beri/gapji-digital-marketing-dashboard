import { api } from '@/lib/api';
import type { DashboardDataPayload, DashboardDateRangeFilter, TrendChartDataPoint } from '../types';
import type { IDashboardService } from './dashboard.contract';
import axios from 'axios';

export const dashboardApi: IDashboardService = {
  /**
   * واکشی بسته کامل داده‌های تحلیلی و شاخص‌های داشبورد اجرایی از بک‌اند واقعی و PostgreSQL
   */
  async getDashboardData(filter?: DashboardDateRangeFilter): Promise<DashboardDataPayload> {
    const params: Record<string, string | undefined> = {};
    if (filter?.preset) params.preset = filter.preset;
    if (filter?.from) params.from = filter.from;
    if (filter?.to) params.to = filter.to;
    if (filter?.campaignIds && filter.campaignIds.length > 0) {
      params.campaignIds = filter.campaignIds.join(',');
    }
    if (filter?.platformIds && filter.platformIds.length > 0) {
      params.platformIds = filter.platformIds.join(',');
    }
    if (filter?.comparePrevious) {
      params.comparePrevious = 'true';
    }

    try {
      const { data } = await api.get<DashboardDataPayload>('/dashboard/overview', { params });

      // تزریق فیلدهای سازگاری عقب‌رو برای ویجت‌های کلاینت (مانند client-home-view)
      if (data?.kpis) {
        data.kpis.leadConversionRate = data.kpis.conversionRate;
        data.kpis.budgetConsumedPercentage = data.kpis.totalSpendTargetProgress;
      }

      if (data && (!data.trends || data.trends.length === 0)) {
        const trendsMap = new Map<string, TrendChartDataPoint>();
        (data.spendTrend || []).forEach((pt) => {
          trendsMap.set(pt.date, { date: pt.date, label: pt.label, spend: pt.spend, revenue: 0, leadsCount: 0 });
        });
        (data.leadTrend || []).forEach((pt) => {
          const existing = trendsMap.get(pt.date);
          if (existing) {
            existing.leadsCount = pt.leadsCount;
          } else {
            trendsMap.set(pt.date, { date: pt.date, label: pt.label, spend: 0, revenue: 0, leadsCount: pt.leadsCount });
          }
        });
        data.trends = Array.from(trendsMap.values());
      }

      return data;
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data) {
        const resData = err.response.data as any;
        const msg = Array.isArray(resData?.message)
          ? resData.message.join(' - ')
          : resData?.message || 'خطا در بارگذاری اطلاعات داشبورد از سرور';
        throw new Error(msg);
      }
      throw err;
    }
  },
};
