/**
 * سرویس ارتباط واقعی با اندپوینت‌های بک‌اند تنظیمات سازمان و دسته‌بندی‌ها (Organization Settings API)
 * متصل به پایگاه داده PostgreSQL و معماری NestJS
 * منطبق بر قرارداد IOrganizationService
 */

import { api } from '@/lib/api';
import type { IOrganizationService } from './organization.contract';
import type {
  OrgListType,
  OrgListItem,
  OrganizationGeneralSettings,
  CreateOrgListItemInput,
  UpdateOrgListItemInput,
  UpdateGeneralSettingsInput,
} from './types';

function extractErrorMessage(error: any, fallback: string): string {
  if (error?.response?.data?.message) {
    const msg = error.response.data.message;
    if (Array.isArray(msg)) {
      return msg.join('، ');
    }
    return String(msg);
  }
  if (error?.message) {
    return error.message;
  }
  return fallback;
}

export class RealOrganizationService implements IOrganizationService {
  /**
   * دریافت مشخصات تنظیمات عمومی سازمان از بک‌اند
   */
  async getGeneralSettings(): Promise<OrganizationGeneralSettings> {
    try {
      const { data } = await api.get<OrganizationGeneralSettings>('/organization/general');
      return data;
    } catch (err: any) {
      throw new Error(extractErrorMessage(err, 'خطا در دریافت تنظیمات عمومی سازمان'));
    }
  }

  /**
   * به‌روزرسانی تنظیمات عمومی سازمان
   */
  async updateGeneralSettings(
    input: UpdateGeneralSettingsInput,
  ): Promise<OrganizationGeneralSettings> {
    try {
      const { data } = await api.patch<OrganizationGeneralSettings>('/organization/general', input);
      return data;
    } catch (err: any) {
      throw new Error(extractErrorMessage(err, 'خطا در به‌روزرسانی تنظیمات عمومی سازمان'));
    }
  }

  /**
   * دریافت تمامی آیتم‌های یک فهرست سازمانی به همراه تعداد استفاده محاسبه‌شده
   */
  async getListItems(listType: OrgListType): Promise<OrgListItem[]> {
    try {
      const { data } = await api.get<OrgListItem[]>(`/organization/taxonomies/${listType}`);
      return data;
    } catch (err: any) {
      throw new Error(extractErrorMessage(err, `خطا در دریافت آیتم‌های فهرست ${listType}`));
    }
  }

  /**
   * دریافت یک گزینه خاص با شناسه یکتا
   */
  async getListItemById(listType: OrgListType, id: string): Promise<OrgListItem | null> {
    try {
      const { data } = await api.get<OrgListItem>(`/organization/taxonomies/${listType}/${id}`);
      return data;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        return null;
      }
      throw new Error(extractErrorMessage(err, 'خطا در دریافت جزئیات گزینه سازمانی'));
    }
  }

  /**
   * افزودن گزینه جدید به یکی از فهرست‌ها
   */
  async createListItem(
    listType: OrgListType,
    input: CreateOrgListItemInput,
  ): Promise<OrgListItem> {
    try {
      const { data } = await api.post<OrgListItem>(`/organization/taxonomies/${listType}`, input);
      return data;
    } catch (err: any) {
      throw new Error(extractErrorMessage(err, 'خطا در ایجاد گزینه سازمانی جدید'));
    }
  }

  /**
   * ویرایش عنوان و مشخصات یک گزینه
   */
  async updateListItem(
    listType: OrgListType,
    id: string,
    input: UpdateOrgListItemInput,
  ): Promise<OrgListItem> {
    try {
      const { data } = await api.patch<OrgListItem>(
        `/organization/taxonomies/${listType}/${id}`,
        input,
      );
      return data;
    } catch (err: any) {
      throw new Error(extractErrorMessage(err, 'خطا در ویرایش گزینه سازمانی'));
    }
  }

  /**
   * تغییر وضعیت فعال / غیرفعال بودن گزینه
   */
  async toggleListItemStatus(listType: OrgListType, id: string): Promise<OrgListItem> {
    try {
      const { data } = await api.patch<OrgListItem>(
        `/organization/taxonomies/${listType}/${id}/toggle-status`,
      );
      return data;
    } catch (err: any) {
      throw new Error(extractErrorMessage(err, 'خطا در تغییر وضعیت فعال‌سازی گزینه'));
    }
  }

  /**
   * مرتب‌سازی گزینه‌های یک فهرست (Drag & Drop)
   */
  async reorderListItems(listType: OrgListType, orderedIds: string[]): Promise<OrgListItem[]> {
    try {
      const { data } = await api.put<OrgListItem[]>(
        `/organization/taxonomies/${listType}/reorder`,
        { orderedIds },
      );
      return data;
    } catch (err: any) {
      throw new Error(extractErrorMessage(err, 'خطا در مرتب‌سازی گزینه‌ها'));
    }
  }

  /**
   * حذف فیزیکی یک گزینه (در صورت داشتن تعداد استفاده > 0 از سمت سرور رد می‌شود)
   */
  async deleteListItem(listType: OrgListType, id: string): Promise<void> {
    try {
      await api.delete(`/organization/taxonomies/${listType}/${id}`);
    } catch (err: any) {
      throw new Error(extractErrorMessage(err, 'خطا در حذف گزینه سازمانی'));
    }
  }

  /**
   * محاسبه داینامیک تعداد استفاده از یک گزینه در داده‌های واقعی سیستم
   */
  async calculateUsageCount(listType: OrgListType, item: OrgListItem): Promise<number> {
    if (typeof item.usageCount === 'number') {
      return item.usageCount;
    }
    const fresh = await this.getListItemById(listType, item.id);
    return fresh?.usageCount || 0;
  }
}

export const realOrganizationService = new RealOrganizationService();
