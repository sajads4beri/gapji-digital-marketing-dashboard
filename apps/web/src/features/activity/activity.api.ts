import { api } from '@/lib/api';
import {
  ActivityListResponse,
  TeamSummaryResponse,
  QueryActivityParams,
} from './types';

export const activityApi = {
  /**
   * واکشی لاگ‌های رویداد با فیلتر ماژول، کاربر، تاریخ و صفحه‌بندی
   */
  async getActivities(params?: QueryActivityParams): Promise<ActivityListResponse> {
    const queryParams: Record<string, any> = {};
    if (params?.entityType && params.entityType !== 'all') queryParams.entityType = params.entityType;
    if (params?.action && params.action !== 'all') queryParams.action = params.action;
    if (params?.userId && params.userId !== 'all') queryParams.userId = params.userId;
    if (params?.startDate) queryParams.startDate = params.startDate;
    if (params?.endDate) queryParams.endDate = params.endDate;
    if (params?.search?.trim()) queryParams.search = params.search.trim();
    if (params?.page) queryParams.page = params.page;
    if (params?.limit) queryParams.limit = params.limit;

    const { data } = await api.get<ActivityListResponse>('/activity', {
      params: queryParams,
    });
    return data;
  },

  /**
   * دریافت آمار و گزارش تجمیعی فعالیت تیم
   */
  async getTeamSummary(): Promise<TeamSummaryResponse> {
    const { data } = await api.get<TeamSummaryResponse>('/activity/team-summary');
    return data;
  },

  /**
   * دانلود مستقیم خروجی فایل اکسل/CSV
   */
  async exportCsv(params?: QueryActivityParams): Promise<void> {
    const queryParams: Record<string, any> = {};
    if (params?.entityType && params.entityType !== 'all') queryParams.entityType = params.entityType;
    if (params?.userId && params.userId !== 'all') queryParams.userId = params.userId;

    const response = await api.get('/activity/export', {
      params: queryParams,
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `activity-logs-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * ثبت رویداد جدید به صورت برنامه‌ریزی‌شده
   */
  async logActivity(input: {
    action: string;
    entityType: string;
    entityId?: string;
    details?: string;
  }): Promise<void> {
    await api.post('/activity/log', input);
  },
};
