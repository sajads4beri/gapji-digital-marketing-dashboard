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
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

export const API_ENDPOINTS = {
  campaigns: '/api/campaigns',
  campaignStats: '/api/campaigns/stats',
  campaignById: (id: string) => `/api/campaigns/${id}`,
} as const;
