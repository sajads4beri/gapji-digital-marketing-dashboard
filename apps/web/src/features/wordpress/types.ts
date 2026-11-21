export interface WordpressConfig {
  id: string;
  organizationId: string;
  siteUrl: string;
  apiKeyHash: string;
  webhookSecret: string;
  leadMappingConfig: string;
  isActive: boolean;
  lastSyncAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WordpressWebhookLogItem {
  id: string;
  organizationId: string;
  wordpressIntegrationId: string;
  status: 'success' | 'duplicate' | 'rejected' | 'error' | string;
  reason?: string | null;
  payloadSummary?: string | null;
  ipAddress?: string | null;
  receivedAt: string;
}

export interface UpdateWordpressConfigInput {
  siteUrl?: string;
  webhookSecret?: string;
  leadMappingConfig?: string;
  isActive?: boolean;
}

export interface TestConnectionResult {
  success: boolean;
  message: string;
  result?: {
    success: boolean;
    leadId?: string;
    isDuplicate?: boolean;
    message?: string;
  };
}
