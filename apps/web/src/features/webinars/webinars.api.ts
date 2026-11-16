import { api } from '@/lib/api';
import {
  WebinarListItem,
  WebinarDetail,
  WebinarAttendeeItem,
  CreateWebinarInput,
  ImportAttendeesInput,
  ImportAttendeesResponse,
  ConvertAttendeesPreviewResponse,
  ConvertAttendeesConfirmResponse,
  AddEquipmentInput,
  AddTaskInput,
  WebinarStatus,
  QueryWebinarsParams,
  QueryAttendeesParams,
  PaginatedResponse,
} from './types';

export const webinarsApi = {
  // Webinar List
  async getWebinars(params?: QueryWebinarsParams): Promise<PaginatedResponse<WebinarListItem>> {
    const res = await api.get<PaginatedResponse<WebinarListItem>>('/webinars', { params });
    return res.data;
  },

  // Create Webinar
  async createWebinar(data: CreateWebinarInput): Promise<WebinarListItem> {
    const res = await api.post<WebinarListItem>('/webinars', data);
    return res.data;
  },

  // Webinar Detail (4-Tab data)
  async getWebinarDetail(id: string): Promise<WebinarDetail> {
    const res = await api.get<WebinarDetail>(`/webinars/${id}`);
    return res.data;
  },

  // Status transitions
  async updateStatus(
    id: string,
    status: WebinarStatus,
  ): Promise<{ id: string; status: WebinarStatus; message: string }> {
    const res = await api.patch<{ id: string; status: WebinarStatus; message: string }>(
      `/webinars/${id}/status`,
      { status },
    );
    return res.data;
  },

  // Tab 2: Attendees
  async getAttendees(
    id: string,
    params?: QueryAttendeesParams,
  ): Promise<PaginatedResponse<WebinarAttendeeItem>> {
    const res = await api.get<PaginatedResponse<WebinarAttendeeItem>>(
      `/webinars/${id}/attendees`,
      { params },
    );
    return res.data;
  },

  // Action 1: Import Attendees
  async importAttendees(
    id: string,
    data: ImportAttendeesInput,
  ): Promise<ImportAttendeesResponse> {
    const res = await api.post<ImportAttendeesResponse>(`/webinars/${id}/import-attendees`, data);
    return res.data;
  },

  // Action 2: Convert Attendees to Leads
  async convertAttendeesPreview(id: string): Promise<ConvertAttendeesPreviewResponse> {
    const res = await api.post<ConvertAttendeesPreviewResponse>(
      `/webinars/${id}/convert-attendees/preview`,
    );
    return res.data;
  },

  async convertAttendeesConfirm(id: string): Promise<ConvertAttendeesConfirmResponse> {
    const res = await api.post<ConvertAttendeesConfirmResponse>(
      `/webinars/${id}/convert-attendees/confirm`,
    );
    return res.data;
  },

  // Tab 3: Equipment Link
  async addEquipment(id: string, data: AddEquipmentInput): Promise<any> {
    const res = await api.post(`/webinars/${id}/equipment`, data);
    return res.data;
  },

  // Tab 4: Tasks Link
  async addTask(id: string, data: AddTaskInput): Promise<any> {
    const res = await api.post(`/webinars/${id}/tasks`, data);
    return res.data;
  },
};
