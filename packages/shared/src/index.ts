export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  channel: string;
  status: string;
  budget: number;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignStats {
  total: number;
  active: number;
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
}

export interface CreateCampaignDto {
  name: string;
  description?: string | null;
  channel: string;
  status: string;
  budget: number;
}

export interface UpdateCampaignDto extends Partial<CreateCampaignDto> {}

export enum CampaignStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

// User & Role Governance
export type UserRole =
  | 'admin'
  | 'marketing_manager'
  | 'campaign_manager'
  | 'sales_agent'
  | 'content_creator'
  | 'client';

export type UserStatus = 'active' | 'invited' | 'disabled';

export interface UserProfile {
  id: string;
  email: string;
  mobile: string | null;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string | null;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

// Multi-Tenancy Organization
export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  currency: 'toman' | 'rial';
  timezone: string;
  createdAt: string;
}

export interface OrganizationMembership {
  id: string;
  userId: string;
  organizationId: string;
  role: UserRole;
  isDefault: boolean;
}

// Leads Management
export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'proposal'
  | 'won'
  | 'lost';

export interface Lead {
  id: string;
  organizationId: string;
  fullName: string;
  phoneNumber: string;
  email?: string | null;
  status: LeadStatus;
  source: string;
  campaignId?: string | null;
  campaignName?: string | null;
  assignedToId?: string | null;
  assignedToName?: string | null;
  dealValue?: number | null;
  lostReason?: string | null;
  nextFollowUpAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Marketing Costs
export interface Cost {
  id: string;
  organizationId: string;
  campaignId: string;
  platformId: string;
  date: string;
  amount: number;
  quantity?: number | null;
  description?: string | null;
  source: 'manual' | 'import';
  createdById: string;
  createdAt: string;
}

// Tasks & Workflows
export type TaskStatus = 'todo' | 'in_progress' | 'waiting' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  organizationId: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  assigneeId?: string | null;
  relatedType?: 'campaign' | 'lead' | 'webinar' | null;
  relatedId?: string | null;
  sopId?: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

// Endpoints Registry
export const API_ENDPOINTS = {
  auth: {
    login: '/api/auth/login',
    refresh: '/api/auth/refresh',
    logout: '/api/auth/logout',
    me: '/api/auth/me',
  },
  campaigns: '/api/campaigns',
  campaignStats: '/api/campaigns/stats',
  campaignById: (id: string) => `/api/campaigns/${id}`,
  leads: '/api/leads',
  leadById: (id: string) => `/api/leads/${id}`,
  costs: '/api/costs',
  tasks: '/api/tasks',
  users: '/api/users',
  organization: '/api/organization',
  dashboard: '/api/dashboard',
} as const;
