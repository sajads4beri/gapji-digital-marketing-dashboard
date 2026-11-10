import { api } from '@/lib/api';
import type {
  LeadDetail,
  LeadFilters,
  LeadEvent,
  LeadStatus,
  LeadEventMetadata,
} from '../types';
import type { CreateLeadInput } from './lead.contract';
import axios from 'axios';

export interface ExistingLeadSummary {
  id: string;
  fullName?: string;
  mobile?: string;
  statusKey?: string;
  createdAt?: string;
}

export class DuplicateLeadError extends Error {
  public readonly isDuplicate = true;
  public readonly existingLead?: ExistingLeadSummary;

  constructor(message: string, existingLead?: ExistingLeadSummary) {
    super(message);
    this.name = 'DuplicateLeadError';
    this.existingLead = existingLead;
  }
}

export const leadApi = {
  /**
   * ثبت لید دستی جدید در پایگاه داده واقعی بک‌اند
   */
  async createLead(input: CreateLeadInput): Promise<LeadDetail> {
    try {
      const { data } = await api.post<LeadDetail>('/leads', input);
      return data;
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        const resData = err.response.data as any;
        const msg = resData?.message || 'این شماره قبلاً ثبت شده';
        const existingLead = resData?.existingLead || resData?.message?.existingLead;
        throw new DuplicateLeadError(
          typeof msg === 'string' ? msg : 'این شماره قبلاً ثبت شده',
          existingLead,
        );
      }
      throw err;
    }
  },

  /**
   * دریافت لیست واقعی لیدهای سازمان از سرور با فیلترهای چندگانه
   */
  async getLeads(filters?: LeadFilters): Promise<LeadDetail[]> {
    const params: Record<string, string | undefined> = {};

    if (filters?.search) params.search = filters.search;
    if (filters?.status) {
      params.status = Array.isArray(filters.status)
        ? filters.status.join(',')
        : filters.status;
    }
    if (filters?.assignedToId) params.assignedToId = filters.assignedToId;
    if (filters?.campaignId) params.campaignId = filters.campaignId;
    if (filters?.source) params.source = filters.source;
    if (filters?.dateRange?.from) params.from = filters.dateRange.from;
    if (filters?.dateRange?.to) params.to = filters.dateRange.to;

    const { data } = await api.get<LeadDetail[]>('/leads', { params });
    return data;
  },

  /**
   * دریافت مشخصات کامل یک لید با شناسه یکتا
   */
  async getLeadById(id: string): Promise<LeadDetail | null> {
    try {
      const { data } = await api.get<LeadDetail>(`/leads/${id}`);
      return data;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        return null;
      }
      throw err;
    }
  },

  /**
   * دریافت لیست کارشناسان فعال سازمان جهت گزینه‌های تخصیص لید
   */
  async getAssignees(): Promise<Array<{ id: string; name: string; role?: string }>> {
    try {
      const { data } = await api.get<Array<{ id: string; name: string; role?: string }>>('/leads/assignees');
      return data;
    } catch {
      return [];
    }
  },

  /**
   * به‌روزرسانی وضعیت لید در پایپ‌لاین فروش و ثبت تاریخچه رویداد در دیتابیس
   */
  async updateStatus(
    id: string,
    newStatus: LeadStatus,
    metadata?: LeadEventMetadata
  ): Promise<{ lead: LeadDetail; event: LeadEvent }> {
    const { data } = await api.patch<{ lead: LeadDetail; event: LeadEvent }>(`/leads/${id}/status`, {
      status: newStatus,
      dealValue: metadata?.dealValue,
      lostReason: metadata?.lostReason,
    });
    return data;
  },

  /**
   * دریافت تاریخچه رویدادها و فعالیت‌های یک لید از پایگاه داده
   */
  async getEvents(leadId: string): Promise<LeadEvent[]> {
    try {
      const { data } = await api.get<LeadEvent[]>(`/leads/${leadId}/activities`);
      return data;
    } catch (err) {
      if (axios.isAxiosError(err) && (err.response?.status === 404 || err.response?.status === 403)) {
        throw err;
      }
      return [];
    }
  },
};
