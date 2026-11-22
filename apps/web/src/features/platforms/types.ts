export type PlatformRetrievalMethod = 'manual' | 'import' | 'api';

export interface PlatformInputDefinition {
  name: string;
  key: string;
  dataType: 'text' | 'number' | 'date' | 'boolean';
  isRequired: boolean;
}

export interface PlatformOutputColumn {
  key: string;
  label: string;
}

export interface Platform {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  category: string;
  retrievalMethod: PlatformRetrievalMethod;
  icon?: string | null;
  isActive: boolean;
  activeCampaignsCount: number;
  totalCampaignsCount: number;
  inputs: PlatformInputDefinition[];
  outputs: PlatformOutputColumn[];
  createdAt: string;
  updatedAt: string;
}

export interface PlatformTemplate {
  id: string;
  name: string;
  code: string;
  category: string;
  categoryLabel: string;
  retrievalMethod: PlatformRetrievalMethod;
  description: string;
  icon?: string;
  defaultInputs: PlatformInputDefinition[];
  defaultOutputs: PlatformOutputColumn[];
}

export interface CreatePlatformInput {
  name: string;
  category: string;
  retrievalMethod: PlatformRetrievalMethod;
  code?: string;
  icon?: string;
  templateId?: string;
  inputs?: PlatformInputDefinition[];
  outputs?: PlatformOutputColumn[];
}

export interface UpdatePlatformInput {
  name?: string;
  category?: string;
  retrievalMethod?: PlatformRetrievalMethod;
  isActive?: boolean;
  icon?: string;
  inputs?: PlatformInputDefinition[];
  outputs?: PlatformOutputColumn[];
}

export interface PlatformQueryFilter {
  search?: string;
  category?: string;
  retrievalMethod?: PlatformRetrievalMethod;
  status?: 'active' | 'inactive' | 'all';
}

export interface PlatformUsageDetails {
  platformId: string;
  platformName: string;
  activeCampaignsCount: number;
  totalCampaignsCount: number;
  activeCampaigns: Array<{
    id: string;
    name: string;
    status: string;
    budget: number;
  }>;
}
