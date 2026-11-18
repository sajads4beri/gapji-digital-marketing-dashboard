export type AudienceGender = 'all' | 'male' | 'female';

export interface ConnectedCampaign {
  id: string;
  campaignId: string;
  name: string;
  status: string;
  channel: string;
  budget: number;
  spend: number;
  leadsCount: number;
  cpl: number;
  conversionRate: number;
  linkedAt: string;
}

export interface Audience {
  id: string;
  name: string;
  description: string | null;
  ageMin: number | null;
  ageMax: number | null;
  gender: AudienceGender;
  location: string | null;
  interests: string | null;
  channel: string | null;
  campaignsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AudienceDetail extends Audience {
  connectedCampaigns: ConnectedCampaign[];
  campaigns?: ConnectedCampaign[];
}

export interface CreateAudienceInput {
  name: string;
  description?: string;
  ageMin?: number | null;
  ageMax?: number | null;
  gender?: AudienceGender;
  location?: string;
  interests?: string;
  channel?: string;
}

export interface UpdateAudienceInput {
  name?: string;
  description?: string;
  ageMin?: number | null;
  ageMax?: number | null;
  gender?: AudienceGender;
  location?: string;
  interests?: string;
  channel?: string;
}

export interface AudienceQueryFilter {
  search?: string;
  gender?: AudienceGender;
  channel?: string;
  page?: number;
  limit?: number;
}

export interface AudienceListResponse {
  items: Audience[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
