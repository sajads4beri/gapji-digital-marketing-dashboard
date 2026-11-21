import { api } from '@/lib/api';
import {
  MeetingItem,
  MeetingActionItem,
  CreateMeetingInput,
  UpdateMeetingInput,
  CreateActionItemInput,
  EmailPreviewResponse,
} from './types';

export const meetingsApi = {
  /**
   * دریافت فهرست صورتجلسات سازمان
   */
  async getMeetings(params?: { search?: string }): Promise<MeetingItem[]> {
    const queryParams: Record<string, any> = {};
    if (params?.search?.trim()) queryParams.search = params.search.trim();

    const { data } = await api.get<MeetingItem[]>('/meetings', { params: queryParams });
    return data;
  },

  /**
   * دریافت جزئیات کامل یک صورتجلسه
   */
  async getMeeting(id: string): Promise<MeetingItem> {
    const { data } = await api.get<MeetingItem>(`/meetings/${id}`);
    return data;
  },

  /**
   * ثبت صورتجلسه جدید به همراه مصوبات
   */
  async createMeeting(input: CreateMeetingInput): Promise<MeetingItem> {
    const { data } = await api.post<MeetingItem>('/meetings', input);
    return data;
  },

  /**
   * ویرایش صورتجلسه و ارتقای خودکار شماره نسخه
   */
  async updateMeeting(id: string, input: UpdateMeetingInput): Promise<MeetingItem> {
    const { data } = await api.patch<MeetingItem>(`/meetings/${id}`, input);
    return data;
  },

  /**
   * حذف صورتجلسه
   */
  async deleteMeeting(id: string): Promise<{ success: boolean; message: string }> {
    const { data } = await api.delete<{ success: boolean; message: string }>(`/meetings/${id}`);
    return data;
  },

  /**
   * افزودن مصوبه جدید به صورتجلسه
   */
  async addActionItem(meetingId: string, input: CreateActionItemInput): Promise<MeetingActionItem> {
    const { data } = await api.post<MeetingActionItem>(`/meetings/${meetingId}/action-items`, input);
    return data;
  },

  /**
   * تغییر وضعیت انجام مصوبه
   */
  async toggleActionItem(actionItemId: string, isCompleted: boolean): Promise<MeetingActionItem> {
    const { data } = await api.patch<MeetingActionItem>(`/meetings/action-items/${actionItemId}/toggle`, {
      isCompleted,
    });
    return data;
  },

  /**
   * تبدیل مستقیم مصوبه به وظیفه عملیاتی (Task)
   */
  async convertActionItemToTask(actionItemId: string): Promise<{
    success: boolean;
    message: string;
    task: any;
    actionItem: MeetingActionItem;
  }> {
    const { data } = await api.post(`/meetings/action-items/${actionItemId}/convert-to-task`);
    return data;
  },

  /**
   * دریافت پیش‌نمایش ایمیل صورتجلسه
   */
  async previewEmail(meetingId: string): Promise<EmailPreviewResponse> {
    const { data } = await api.get<EmailPreviewResponse>(`/meetings/${meetingId}/email-preview`);
    return data;
  },

  /**
   * تایید و ارسال ایمیل صورتجلسه به کلیه حاضرین
   */
  async sendEmail(meetingId: string): Promise<{
    success: boolean;
    message: string;
    subject: string;
    dispatchedAt: string;
  }> {
    const { data } = await api.post(`/meetings/${meetingId}/send-email`);
    return data;
  },
};
