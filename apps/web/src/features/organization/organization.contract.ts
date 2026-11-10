/**
 * قرارداد سرویس مدیریت تنظیمات سازمان (Organization Settings Service Contract)
 * مستقل از فریم‌ورک و قابل استفاده در محیط‌های کلاینت، سرور و آزمون‌های خودکار
 */

import type {
  OrgListType,
  OrgListItem,
  OrganizationGeneralSettings,
  CreateOrgListItemInput,
  UpdateOrgListItemInput,
  UpdateGeneralSettingsInput,
} from './types';

export interface IOrganizationService {
  /**
   * دریافت مشخصات تنظیمات عمومی سازمان
   */
  getGeneralSettings(): Promise<OrganizationGeneralSettings>;

  /**
   * به‌روزرسانی تنظیمات عمومی سازمان (نام، لوگو، واحد پول، منطقه زمانی)
   */
  updateGeneralSettings(
    input: UpdateGeneralSettingsInput
  ): Promise<OrganizationGeneralSettings>;

  /**
   * دریافت تمامی آیتم‌های یک فهرست سازمانی به ترتیب order و همراه با تعداد استفاده محاسبه‌شده
   */
  getListItems(listType: OrgListType): Promise<OrgListItem[]>;

  /**
   * دریافت یک گزینه خاص با شناسه یکتا
   */
  getListItemById(listType: OrgListType, id: string): Promise<OrgListItem | null>;

  /**
   * افزودن گزینه جدید به یکی از فهرست‌ها
   */
  createListItem(
    listType: OrgListType,
    input: CreateOrgListItemInput
  ): Promise<OrgListItem>;

  /**
   * ویرایش عنوان و خصوصیات یک گزینه بدون تغییر شناسه و کلید سیستمی
   */
  updateListItem(
    listType: OrgListType,
    id: string,
    input: UpdateOrgListItemInput
  ): Promise<OrgListItem>;

  /**
   * تغییر وضعیت فعال / غیرفعال بودن یک گزینه
   */
  toggleListItemStatus(listType: OrgListType, id: string): Promise<OrgListItem>;

  /**
   * مرتب‌سازی گزینه‌های یک فهرست بر اساس آرایه شناسه‌های مرتب‌شده (Drag & Drop)
   */
  reorderListItems(
    listType: OrgListType,
    orderedIds: string[]
  ): Promise<OrgListItem[]>;

  /**
   * حذف یک گزینه؛ در صورتی که گزینه در داده‌های سیستم استفاده شده باشد (usageCount > 0)،
   * بر اساس سند محصول عملیات رد شده و خطای صریح صادر می‌گردد.
   */
  deleteListItem(listType: OrgListType, id: string): Promise<void>;

  /**
   * محاسبه داینامیک تعداد استفاده از یک گزینه در داده‌های واقعی ماژول‌های سیستم
   */
  calculateUsageCount(listType: OrgListType, item: OrgListItem): Promise<number>;
}
