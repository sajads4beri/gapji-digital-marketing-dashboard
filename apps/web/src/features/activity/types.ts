export type ActivityEntityType =
  | 'lead'
  | 'campaign'
  | 'task'
  | 'meeting'
  | 'equipment'
  | 'sop'
  | 'idea'
  | 'auth'
  | 'system';

export interface ActivityUser {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  email?: string | null;
}

export interface ActivityLogItem {
  id: string;
  organizationId?: string | null;
  userId?: string | null;
  action: string;
  entityType: ActivityEntityType | string;
  entityId?: string | null;
  details?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  user?: ActivityUser | null;
}

export interface ActivityListResponse {
  items: ActivityLogItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TeamSummaryResponse {
  total: number;
  byEntityType: Array<{ entityType: string; count: number }>;
  topUsers: Array<{
    count: number;
    user: ActivityUser;
  }>;
}

export interface QueryActivityParams {
  entityType?: string;
  action?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}
