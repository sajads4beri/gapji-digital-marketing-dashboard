export type SmsDeliveryStatus = 'delivered' | 'failed' | 'pending';

export interface SmsCampaignListItem {
  id: string;
  name: string;
  senderNumber: string;
  messageText: string;
  messagePreview: string;
  recipientCount: number;
  deliveredCount: number;
  failedCount: number;
  costAmount: number;
  unitCost: number;
  replyCount: number;
  status: string;
  campaignId: string | null;
  campaignName: string | null;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
}

export interface SmsSummaryMetrics {
  totalCount: number;
  deliveredCount: number;
  failedCount: number;
  repliesCount: number;
  convertedLeadsCount: number;
  costAmount: number;
  unitCost: number;
}

export interface SmsCampaignDetail {
  id: string;
  name: string;
  senderNumber: string;
  messageText: string;
  status: string;
  campaignId: string | null;
  campaignName: string | null;
  summary: SmsSummaryMetrics;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SmsRecipientItem {
  id: string;
  mobileMasked: string;
  status: SmsDeliveryStatus;
  deliveredAt: string | null;
  replyText: string | null;
  repliedAt: string | null;
  convertedLeadId: string | null;
  convertedLeadName: string | null;
  createdAt: string;
}

export interface CreateSmsCampaignInput {
  name: string;
  senderNumber: string;
  messageText: string;
  campaignId?: string;
  costAmount?: number;
  scheduledAt?: string;
}

export interface ImportSmsResultsInput {
  csvContent?: string;
  rows?: Array<{
    mobile: string;
    status?: string;
    deliveredAt?: string;
    replyText?: string;
    repliedAt?: string;
  }>;
}

export interface ImportSmsResultsResponse {
  totalRows: number;
  successfullyImported: number;
  failed: number;
  duplicates: number;
  errors: Array<{ row: number; reason: string }>;
}

export interface LeadRespondentPreviewItem {
  id: string;
  mobileMasked: string;
  replyText: string | null;
  repliedAt: string | null;
  isDuplicate: boolean;
  existingLeadId: string | null;
  existingLeadName: string | null;
}

export interface ConvertRepliesPreviewResponse {
  totalRespondents: number;
  eligibleCount: number;
  duplicateCount: number;
  respondents: LeadRespondentPreviewItem[];
}

export interface ConvertRepliesConfirmResponse {
  createdCount: number;
  skippedDuplicates: number;
  leadIds: string[];
  message: string;
}

export interface SmsListQuery {
  campaignId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface SmsRecipientQuery {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
