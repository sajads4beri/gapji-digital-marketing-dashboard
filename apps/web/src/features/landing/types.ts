export interface LandingPageItem {
  id: string;
  title: string;
  url: string;
  connectionStatus: boolean;
  connectionStatusText: string;
  isWordPressConnected: boolean;
  totalLeads: number;
  recent7DaysLeads: number;
  lastLeadDate: string | null;
  has30DayNoLeadWarning: boolean;
  inactivityStatus?: 'active' | 'inactive_30_days' | 'insufficient_history';
  campaignId: string | null;
  campaignName: string | null;
  utmLinksCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLandingPageInput {
  title: string;
  url: string;
  campaignId?: string;
}

export interface UtmLinkItem {
  id: string;
  finalUrl: string;
  originalUrl: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm: string | null;
  utmContent: string | null;
  clicksCount: number;
  isClickTrackingActive: boolean;
  clickTrackingNotice: string;
  attributedLeadsCount: number;
  landingPageId: string | null;
  landingPageTitle: string | null;
  campaignId: string | null;
  campaignName: string | null;
  platformId: string | null;
  platformName: string | null;
  createdAt: string;
}

export interface CreateUtmLinkInput {
  landingPageId?: string;
  destinationUrl: string;
  platformId?: string;
  utmSource: string;
  utmMedium: string;
  campaignId?: string;
  utmCampaign: string;
  utmTerm?: string;
  utmContent?: string;
}

export interface PreviewUtmInput {
  destinationUrl: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm?: string;
  utmContent?: string;
}

export interface PreviewUtmResponse {
  isValid: boolean;
  finalUrl: string;
}

export interface PlatformOption {
  id?: string;
  name: string;
  code: string;
}

export interface CampaignOption {
  id: string;
  name: string;
  status: string;
}

export interface MediumOption {
  key: string;
  label: string;
}

export interface LandingOptionsResponse {
  landingPages: Array<{ id: string; title: string; url: string; campaignId: string | null }>;
  campaigns: CampaignOption[];
  platforms: PlatformOption[];
  commonMediums: MediumOption[];
}

export interface WordPressStatusResponse {
  isConfigured: boolean;
  integrations: Array<{
    id: string;
    siteUrl: string;
    isActive: boolean;
    lastSyncAt: string | null;
    createdAt: string;
  }>;
  webhookEndpoint: string;
  statusMessage: string;
}
