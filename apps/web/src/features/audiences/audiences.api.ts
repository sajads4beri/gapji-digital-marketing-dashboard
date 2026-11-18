import { api } from '@/lib/api';
import {
  Audience,
  AudienceDetail,
  AudienceListResponse,
  AudienceQueryFilter,
  CreateAudienceInput,
  UpdateAudienceInput,
} from './types';

export const audiencesApi = {
  /**
   * دریافت فهرست مخاطبان همراه با فیلتر و جستجو
   */
  async getAll(filter?: AudienceQueryFilter): Promise<AudienceListResponse> {
    const params = new URLSearchParams();
    if (filter?.search) params.append('search', filter.search);
    if (filter?.gender && filter.gender !== 'all') params.append('gender', filter.gender);
    if (filter?.channel) params.append('channel', filter.channel);
    if (filter?.page) params.append('page', String(filter.page));
    if (filter?.limit) params.append('limit', String(filter.limit));

    const queryString = params.toString();
    const url = queryString ? `/audiences?${queryString}` : '/audiences';
    const response = await api.get<AudienceListResponse>(url);
    return response.data;
  },

  /**
   * دریافت مشخصات دموگرافیک و جدول عملکرد کمپین‌های متصل یک مخاطب
   */
  async getById(id: string): Promise<AudienceDetail> {
    const response = await api.get<AudienceDetail>(`/audiences/${id}`);
    return response.data;
  },

  /**
   * ایجاد مخاطب هدف جدید
   */
  async create(data: CreateAudienceInput): Promise<Audience> {
    const response = await api.post<Audience>('/audiences', data);
    return response.data;
  },

  /**
   * ویرایش مشخصات مخاطب
   */
  async update(id: string, data: UpdateAudienceInput): Promise<Audience> {
    const response = await api.patch<Audience>(`/audiences/${id}`, data);
    return response.data;
  },

  /**
   * کپی کردن مخاطب (Clone/Duplicate)
   */
  async duplicate(id: string): Promise<Audience> {
    const response = await api.post<Audience>(`/audiences/${id}/duplicate`);
    return response.data;
  },

  /**
   * حذف مخاطب (تنها در صورتی که در هیچ کمپینی استفاده نشده باشد)
   */
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete<{ success: boolean; message: string }>(`/audiences/${id}`);
    return response.data;
  },
};
