import { api } from '@/lib/api';
import {
  EquipmentItem,
  EventEquipmentItem,
  EquipmentTemplate,
  ShortagesResponse,
  CreateEquipmentItemInput,
  UpdateEquipmentItemInput,
  ApplyTemplateInput,
  EquipmentReadinessStatus,
} from './types';

export const equipmentApi = {
  /**
   * دریافت فهرست کمبودهای تجهیزات بر مبنای تاریخ رویداد و هشدار ۳ روزه
   */
  async getShortages(params?: {
    status?: string;
    urgentOnly?: boolean;
  }): Promise<ShortagesResponse> {
    const queryParams: Record<string, any> = {};
    if (params?.status && params.status !== 'all') queryParams.status = params.status;
    if (params?.urgentOnly) queryParams.urgentOnly = true;

    const { data } = await api.get<ShortagesResponse>('/equipment/shortages', {
      params: queryParams,
    });
    return data;
  },

  /**
   * واکشی فهرست تمامی اقلام تجهیزات سازمان
   */
  async getItems(params?: { search?: string; category?: string }): Promise<EquipmentItem[]> {
    const queryParams: Record<string, any> = {};
    if (params?.search?.trim()) queryParams.search = params.search.trim();
    if (params?.category && params.category !== 'all') queryParams.category = params.category;

    const { data } = await api.get<EquipmentItem[]>('/equipment/items', {
      params: queryParams,
    });
    return data;
  },

  /**
   * ثبت قلم تجهیز جدید
   */
  async createItem(input: CreateEquipmentItemInput): Promise<EquipmentItem> {
    const { data } = await api.post<EquipmentItem>('/equipment/items', input);
    return data;
  },

  /**
   * ویرایش مشخصات قلم تجهیز
   */
  async updateItem(id: string, input: UpdateEquipmentItemInput): Promise<EquipmentItem> {
    const { data } = await api.patch<EquipmentItem>(`/equipment/items/${id}`, input);
    return data;
  },

  /**
   * حذف یا غیرفعال‌سازی قلم تجهیز
   */
  async deleteItem(id: string): Promise<{ message: string; softDeleted: boolean }> {
    const { data } = await api.delete<{ message: string; softDeleted: boolean }>(`/equipment/items/${id}`);
    return data;
  },

  /**
   * دریافت قالب‌ها و پکیج‌های آماده تجهیزات
   */
  async getTemplates(): Promise<EquipmentTemplate[]> {
    const { data } = await api.get<EquipmentTemplate[]>('/equipment/templates');
    return data;
  },

  /**
   * اعمال دسته‌ای قالب به کمپین یا وبینار
   */
  async applyTemplate(input: ApplyTemplateInput): Promise<{
    success: boolean;
    appliedCount: number;
    templateName: string;
    records: EventEquipmentItem[];
  }> {
    const { data } = await api.post('/equipment/apply-template', input);
    return data;
  },

  /**
   * تغییر وضعیت آمادگی تجهیز (آماده، ناقص، تهیه نشده)
   */
  async updateReadiness(
    id: string,
    input: {
      status?: EquipmentReadinessStatus;
      responsibleId?: string;
      dueDate?: string;
      notes?: string;
    },
  ): Promise<EventEquipmentItem> {
    const { data } = await api.patch<EventEquipmentItem>(`/equipment/readiness/${id}`, input);
    return data;
  },
};
