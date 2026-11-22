import { api } from '@/lib/api';
import {
  WordpressConfig,
  WordpressWebhookLogItem,
  UpdateWordpressConfigInput,
  TestConnectionResult,
} from './types';

export const wordpressApi = {
  /**
   * دریافت تنظیمات و مشخصات وب‌هوک اتصال به وردپرس
   */
  async getConfig(): Promise<WordpressConfig> {
    const { data } = await api.get<WordpressConfig>('/wordpress/config');
    return data;
  },

  /**
   * به‌روزرسانی تنظیمات و نگاشت فیلدهای لید
   */
  async updateConfig(input: UpdateWordpressConfigInput): Promise<WordpressConfig> {
    const { data } = await api.patch<WordpressConfig>('/wordpress/config', input);
    return data;
  },

  /**
   * نوسازی و چرخش کلید امنیتی وب‌هوک
   */
  async rotateSecret(): Promise<{ success: boolean; message: string; newSecret: string }> {
    const { data } = await api.post<{ success: boolean; message: string; newSecret: string }>(
      '/wordpress/rotate-secret'
    );
    return data;
  },

  /**
   * تست سلامت اتصال وب‌هوک و ارسال درخواست شبیه‌سازی‌شده
   */
  async testConnection(payload?: Record<string, any>): Promise<TestConnectionResult> {
    const { data } = await api.post<TestConnectionResult>('/wordpress/test-connection', {
      payload,
    });
    return data;
  },

  /**
   * واکشی لاگ رویدادهای وب‌هوک و درخواست‌های ردشده
   */
  async getWebhookLogs(): Promise<WordpressWebhookLogItem[]> {
    const { data } = await api.get<WordpressWebhookLogItem[]>('/wordpress/logs');
    return data;
  },
};
