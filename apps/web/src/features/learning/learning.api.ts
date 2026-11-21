import { api } from '@/lib/api';
import {
  LearningResourceItem,
  UserLearningProgressItem,
  TeamProgressMatrixResponse,
  CreateLearningResourceInput,
  UpdateLearningResourceInput,
  UpdateProgressInput,
} from './types';

export const learningApi = {
  /**
   * واکشی فهرست منابع و دوره‌های آموزشی
   */
  async getResources(params?: {
    category?: string;
    software?: string;
    type?: string;
    search?: string;
  }): Promise<LearningResourceItem[]> {
    const queryParams: Record<string, any> = {};
    if (params?.category && params.category !== 'all') queryParams.category = params.category;
    if (params?.software && params.software !== 'all') queryParams.software = params.software;
    if (params?.type && params.type !== 'all') queryParams.type = params.type;
    if (params?.search?.trim()) queryParams.search = params.search.trim();

    const { data } = await api.get<LearningResourceItem[]>('/learning', {
      params: queryParams,
    });
    return data;
  },

  /**
   * دریافت مشخصات یک دوره آموزشی
   */
  async getResource(id: string): Promise<LearningResourceItem> {
    const { data } = await api.get<LearningResourceItem>(`/learning/${id}`);
    return data;
  },

  /**
   * ثبت دوره آموزشی جدید
   */
  async createResource(input: CreateLearningResourceInput): Promise<LearningResourceItem> {
    const { data } = await api.post<LearningResourceItem>('/learning', input);
    return data;
  },

  /**
   * ویرایش مشخصات دوره آموزشی
   */
  async updateResource(
    id: string,
    input: UpdateLearningResourceInput
  ): Promise<LearningResourceItem> {
    const { data } = await api.patch<LearningResourceItem>(`/learning/${id}`, input);
    return data;
  },

  /**
   * حذف دوره آموزشی
   */
  async deleteResource(id: string): Promise<{ success: boolean; message: string }> {
    const { data } = await api.delete<{ success: boolean; message: string }>(`/learning/${id}`);
    return data;
  },

  /**
   * به‌روزرسانی وضعیت پیشرفت یادگیری کاربر (اتمام، امتیاز، یادداشت)
   */
  async updateProgress(
    resourceId: string,
    input: UpdateProgressInput
  ): Promise<UserLearningProgressItem> {
    const { data } = await api.patch<UserLearningProgressItem>(
      `/learning/${resourceId}/progress`,
      input
    );
    return data;
  },

  /**
   * دریافت ماتریس پیشرفت آموزش تیم (جدول کاربر × آموزش ص ۲۴)
   */
  async getTeamMatrix(): Promise<TeamProgressMatrixResponse> {
    const { data } = await api.get<TeamProgressMatrixResponse>('/learning/matrix');
    return data;
  },

  /**
   * تخصیص دوره آموزشی به اعضای تیم
   */
  async assignResource(
    resourceId: string,
    userIds: string[]
  ): Promise<{ success: boolean; message: string; assignedCount: number }> {
    const { data } = await api.post('/learning/assign', { resourceId, userIds });
    return data;
  },
};
