export type NotificationType = 'info' | 'success' | 'warning' | 'alert';

export interface NotificationItem {
  id: string;
  organizationId?: string | null;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  linkUrl?: string | null;
  createdAt: string;
}

export interface PaginatedNotificationsResponse {
  items: NotificationItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  unreadCount: number;
  displayCount: string;
}

export interface NotificationPreferenceItem {
  eventType: string;
  title: string;
  category: string;
  description: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
}

export interface NotificationFilter {
  page?: number;
  limit?: number;
  isRead?: boolean;
  type?: NotificationType;
}
