import { api } from '@/lib/api';
import {
  IdeaItem,
  CreateIdeaInput,
  UpdateIdeaStatusInput,
  ConvertIdeaToTaskInput,
} from './types';

export const ideasApi = {
  /**
   * واکشی فهرست ایده‌ها به همراه شمارش آرا و وضعیت رأی کاربر
   */
  async getIdeas(params?: {
    category?: string;
    status?: string;
    campaignId?: string;
    search?: string;
    sortBy?: 'votes' | 'newest';
  }): Promise<IdeaItem[]> {
    const queryParams: Record<string, any> = {};
    if (params?.category && params.category !== 'all') queryParams.category = params.category;
    if (params?.status && params.status !== 'all') queryParams.status = params.status;
    if (params?.campaignId) queryParams.campaignId = params.campaignId;
    if (params?.search?.trim()) queryParams.search = params.search.trim();
    if (params?.sortBy) queryParams.sortBy = params.sortBy;

    const { data } = await api.get<IdeaItem[]>('/ideas', { params: queryParams });
    return data;
  },

  /**
   * دریافت جزئیات یک ایده
   */
  async getIdea(id: string): Promise<IdeaItem> {
    const { data } = await api.get<IdeaItem>(`/ideas/${id}`);
    return data;
  },

  /**
   * ثبت ایده نوآورانه جدید
   */
  async createIdea(input: CreateIdeaInput): Promise<IdeaItem> {
    const { data } = await api.post<IdeaItem>('/ideas', input);
    return data;
  },

  /**
   * رأی مثبت تک‌کلیکه یا لغو رأی (1-Click Reversible Upvote)
   */
  async toggleVote(id: string): Promise<{ hasVoted: boolean; votesCount: number }> {
    const { data } = await api.post<{ hasVoted: boolean; votesCount: number }>(`/ideas/${id}/vote`);
    return data;
  },

  /**
   * تغییر وضعیت ایده توسط سرپرست یا مدیر
   */
  async updateStatus(id: string, input: UpdateIdeaStatusInput): Promise<IdeaItem> {
    const { data } = await api.patch<IdeaItem>(`/ideas/${id}/status`, input);
    return data;
  },

  /**
   * تبدیل مستقیم ایده مصوب به وظیفه عملیاتی (Task Pipeline)
   */
  async convertToTask(
    id: string,
    input: ConvertIdeaToTaskInput
  ): Promise<{
    success: boolean;
    message: string;
    task: any;
    idea: IdeaItem;
  }> {
    const { data } = await api.post(`/ideas/${id}/convert-to-task`, input);
    return data;
  },

  /**
   * حذف ایده
   */
  async deleteIdea(id: string): Promise<{ success: boolean; message: string }> {
    const { data } = await api.delete<{ success: boolean; message: string }>(`/ideas/${id}`);
    return data;
  },
};
