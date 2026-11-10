import type { DashboardDataPayload, DashboardDateRangeFilter } from '../types';

export interface IDashboardService {
  /**
   * واکشی بسته کامل داده‌های تحلیلی و شاخص‌های داشبورد اجرایی
   */
  getDashboardData(filter?: DashboardDateRangeFilter): Promise<DashboardDataPayload>;
}
