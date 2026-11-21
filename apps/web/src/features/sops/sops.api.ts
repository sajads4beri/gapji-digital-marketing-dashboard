import { api } from '@/lib/api';
import {
  SopItem,
  SopVersionItem,
  CreateSopInput,
  UpdateSopInput,
  CreateTaskFromSopInput,
} from './types';

export const sopsApi = {
  /**
   * دریافت فهرست کلیه دستورالعمل‌های استاندارد سازمان
   */
  async getSops(params?: {
    category?: string;
    status?: string;
    search?: string;
  }): Promise<SopItem[]> {
    const queryParams: Record<string, any> = {};
    if (params?.category && params.category !== 'all') {
      queryParams.category = params.category;
    }
    if (params?.status && params.status !== 'all') {
      queryParams.status = params.status;
    }
    if (params?.search?.trim()) {
      queryParams.search = params.search.trim();
    }

    const { data } = await api.get<SopItem[]>('/sops', { params: queryParams });
    return data;
  },

  /**
   * دریافت جزئیات کامل یک دستورالعمل به همراه تاریخچه نسخه‌ها
   */
  async getSop(id: string): Promise<SopItem> {
    const { data } = await api.get<SopItem>(`/sops/${id}`);
    return data;
  },

  /**
   * ثبت دستورالعمل جدید به همراه نگارش اولیه
   */
  async createSop(input: CreateSopInput): Promise<SopItem> {
    const { data } = await api.post<SopItem>('/sops', input);
    return data;
  },

  /**
   * ویرایش دستورالعمل و ارتقای خودکار نسخه در صورت تغییر محتوا
   */
  async updateSop(id: string, input: UpdateSopInput): Promise<SopItem> {
    const { data } = await api.patch<SopItem>(`/sops/${id}`, input);
    return data;
  },

  /**
   * حذف دستورالعمل
   */
  async deleteSop(id: string): Promise<{ success: boolean; message: string }> {
    const { data } = await api.delete<{ success: boolean; message: string }>(`/sops/${id}`);
    return data;
  },

  /**
   * دریافت تاریخچه نسخه‌های یک دستورالعمل
   */
  async getVersions(id: string): Promise<SopVersionItem[]> {
    const { data } = await api.get<SopVersionItem[]>(`/sops/${id}/versions`);
    return data;
  },

  /**
   * بازگشت به یکی از نسخه‌های تاریخی
   */
  async rollbackVersion(id: string, versionNumber: string): Promise<SopItem> {
    const { data } = await api.post<SopItem>(`/sops/${id}/rollback`, { versionNumber });
    return data;
  },

  /**
   * تبدیل مستقیم و ایجاد وظیفه عملیاتی (Task) از روی دستورالعمل
   */
  async createTaskFromSop(
    id: string,
    input: CreateTaskFromSopInput
  ): Promise<{
    success: boolean;
    message: string;
    task: any;
  }> {
    const { data } = await api.post(`/sops/${id}/create-task`, input);
    return data;
  },
};
