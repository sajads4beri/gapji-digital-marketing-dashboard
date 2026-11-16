import { api } from '@/lib/api';
import {
  SmsCampaignListItem,
  SmsCampaignDetail,
  SmsRecipientItem,
  CreateSmsCampaignInput,
  ImportSmsResultsInput,
  ImportSmsResultsResponse,
  ConvertRepliesPreviewResponse,
  ConvertRepliesConfirmResponse,
  SmsListQuery,
  SmsRecipientQuery,
  PaginatedResponse,
} from './types';

export const smsApi = {
  // SMS Campaign History
  async getCampaigns(params?: SmsListQuery): Promise<PaginatedResponse<SmsCampaignListItem>> {
    const res = await api.get<PaginatedResponse<SmsCampaignListItem>>('/sms', { params });
    return res.data;
  },

  async createCampaign(data: CreateSmsCampaignInput): Promise<SmsCampaignDetail> {
    const res = await api.post<SmsCampaignDetail>('/sms', data);
    return res.data;
  },

  async getCampaignDetail(id: string): Promise<SmsCampaignDetail> {
    const res = await api.get<SmsCampaignDetail>(`/sms/${id}`);
    return res.data;
  },

  // Recipients
  async getRecipients(
    id: string,
    params?: SmsRecipientQuery,
  ): Promise<PaginatedResponse<SmsRecipientItem>> {
    const res = await api.get<PaginatedResponse<SmsRecipientItem>>(`/sms/${id}/recipients`, {
      params,
    });
    return res.data;
  },

  // Action 1: Import Results
  async importResults(
    id: string,
    data: ImportSmsResultsInput,
  ): Promise<ImportSmsResultsResponse> {
    const res = await api.post<ImportSmsResultsResponse>(`/sms/${id}/import-results`, data);
    return res.data;
  },

  // Action 2: Convert Replies to Leads
  async convertRepliesPreview(id: string): Promise<ConvertRepliesPreviewResponse> {
    const res = await api.post<ConvertRepliesPreviewResponse>(`/sms/${id}/convert-replies/preview`);
    return res.data;
  },

  async convertRepliesConfirm(id: string): Promise<ConvertRepliesConfirmResponse> {
    const res = await api.post<ConvertRepliesConfirmResponse>(`/sms/${id}/convert-replies/confirm`);
    return res.data;
  },

  // Action 3: Export CSV
  async exportCsv(id: string): Promise<Blob> {
    const res = await api.get(`/sms/${id}/export`, {
      responseType: 'blob',
    });
    return res.data;
  },
};
