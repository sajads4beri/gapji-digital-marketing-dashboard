import { api } from '@/lib/api';
import {
  NotificationItem,
  PaginatedNotificationsResponse,
  NotificationPreferenceItem,
  NotificationFilter,
} from './types';

export const notificationsApi = {
  /**
   * واکشی فهرست اعلان‌های کاربر جاری با فیلتر
   */
  async getNotifications(filter?: NotificationFilter): Promise<PaginatedNotificationsResponse> {
    const params: Record<string, any> = {};
    if (filter?.page) params.page = filter.page;
    if (filter?.limit) params.limit = filter.limit;
    if (typeof filter?.isRead === 'boolean') params.isRead = filter.isRead;
    if (filter?.type) params.type = filter.type;

    const { data } = await api.get<PaginatedNotificationsResponse>('/notifications', { params });
    return data;
  },

  /**
   * واکشی سریع تعداد اعلان‌های خوانده‌نشده
   */
  async getUnreadCount(): Promise<{ unreadCount: number; displayCount: string }> {
    const { data } = await api.get<{ unreadCount: number; displayCount: string }>('/notifications/unread-count');
    return data;
  },

  /**
   * علامت‌گذاری یک اعلان به عنوان خوانده‌شده
   */
  async markAsRead(id: string): Promise<NotificationItem> {
    const { data } = await api.patch<NotificationItem>(`/notifications/${id}/read`);
    return data;
  },

  /**
   * علامت‌گذاری همه اعلان‌ها به عنوان خوانده‌شده
   */
  async markAllAsRead(): Promise<{ success: boolean; count: number }> {
    const { data } = await api.patch<{ success: boolean; count: number }>('/notifications/read-all');
    return data;
  },

  /**
   * دریافت ماتریس تنظیمات کانال‌های دریافت اعلان‌ها
   */
  async getPreferences(): Promise<NotificationPreferenceItem[]> {
    const { data } = await api.get<NotificationPreferenceItem[]>('/notifications/preferences');
    return data;
  },

  /**
   * بروزرسانی و ذخیره تنظیمات اعلان‌ها
   */
  async updatePreferences(
    preferences: Array<{ eventType: string; inAppEnabled?: boolean; emailEnabled?: boolean }>,
  ): Promise<NotificationPreferenceItem[]> {
    const { data } = await api.patch<NotificationPreferenceItem[]>('/notifications/preferences', {
      preferences,
    });
    return data;
  },
};
