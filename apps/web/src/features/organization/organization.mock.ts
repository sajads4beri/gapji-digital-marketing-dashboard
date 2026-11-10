/**
 * پیاده‌سازی سرویس Mock مدیریت تنظیمات سازمان (MockOrganizationService)
 * انطباق ۱۰۰٪ با قرارداد IOrganizationService، ذخیره‌سازی در LocalStorage و اعمال گاردهای امنیتی
 */

import type { IOrganizationService } from './organization.contract';
import type {
  OrgListType,
  OrgListItem,
  OrgLeadStatusItem,
  OrganizationGeneralSettings,
  CreateOrgListItemInput,
  UpdateOrgListItemInput,
  UpdateGeneralSettingsInput,
  LeadStatusGroup,
} from './types';
import {
  getOrganizationSettingsState,
  saveOrganizationSettingsState,
  calculateDynamicUsageCount,
} from './organization.storage';

export class MockOrganizationService implements IOrganizationService {
  /**
   * دریافت مشخصات تنظیمات عمومی سازمان
   */
  async getGeneralSettings(): Promise<OrganizationGeneralSettings> {
    const state = getOrganizationSettingsState();
    return JSON.parse(JSON.stringify(state.general));
  }

  /**
   * به‌روزرسانی تنظیمات عمومی سازمان
   */
  async updateGeneralSettings(
    input: UpdateGeneralSettingsInput
  ): Promise<OrganizationGeneralSettings> {
    const state = getOrganizationSettingsState();

    if (input.name !== undefined) {
      const trimmed = input.name.trim();
      if (!trimmed) {
        throw new Error('نام سازمان نمی‌تواند خالی باشد.');
      }
      state.general.name = trimmed;
    }

    if (input.currency !== undefined) {
      if (input.currency !== 'TOMAN' && input.currency !== 'IRR') {
        throw new Error('واحد پول انتخابی نامعتبر است. فقط تومان یا ریال مجاز است.');
      }
      state.general.currency = input.currency;
    }

    if (input.timezone !== undefined) {
      const tz = input.timezone.trim();
      if (!tz) {
        throw new Error('منطقه زمانی نمی‌تواند خالی باشد.');
      }
      state.general.timezone = tz;
    }

    if (input.logoUrl !== undefined) {
      // آدرس موقت blob فقط برای پیش‌نمایش محلی نشست جاری است و نباید به عنوان مقدار پایدار در استوریج ذخیره شود
      if (!input.logoUrl.startsWith('blob:')) {
        state.general.logoUrl = input.logoUrl;
      }
    }

    state.general.updatedAt = new Date().toISOString();
    saveOrganizationSettingsState(state);

    return JSON.parse(JSON.stringify(state.general));
  }

  /**
   * دریافت گزینه‌های یک فهرست به ترتیب صعودی order همراه با محاسبه داینامیک تعداد استفاده
   */
  async getListItems(listType: OrgListType): Promise<OrgListItem[]> {
    const state = getOrganizationSettingsState();
    const rawItems: OrgListItem[] = state[listType] || [];

    // مرتب‌سازی بر اساس order
    const sorted = [...rawItems].sort((a, b) => a.order - b.order);

    // الصاق داینامیک تعداد استفاده بدون ذخیره در استوریج
    const enriched = sorted.map((item) => ({
      ...item,
      usageCount: calculateDynamicUsageCount(listType, item),
    }));

    return JSON.parse(JSON.stringify(enriched));
  }

  /**
   * دریافت یک گزینه خاص با شناسه
   */
  async getListItemById(
    listType: OrgListType,
    id: string
  ): Promise<OrgListItem | null> {
    const items = await this.getListItems(listType);
    const found = items.find((i) => i.id === id);
    return found ? JSON.parse(JSON.stringify(found)) : null;
  }

  /**
   * ایجاد گزینه جدید در فهرست مورد نظر
   */
  async createListItem(
    listType: OrgListType,
    input: CreateOrgListItemInput
  ): Promise<OrgListItem> {
    const trimmedLabel = input.label?.trim();
    if (!trimmedLabel) {
      throw new Error('عنوان گزینه الزامی است و نمی‌تواند خالی باشد.');
    }

    const state = getOrganizationSettingsState();
    const items = state[listType] as OrgListItem[];

    // ساخت یا بررسی کلید سیستمی یکتا
    let finalKey = input.key?.trim();
    if (!finalKey) {
      // تولید کلید انگلیسی از روی زمان یا برچسب
      finalKey = `custom_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    }

    // بررسی عدم تکرار کلید در همان فهرست
    const keyExists = items.some(
      (item) => item.key.toLowerCase() === finalKey!.toLowerCase()
    );
    if (keyExists) {
      throw new Error(`کلید سیستمی «${finalKey}» در این فهرست قبلاً تعریف شده است.`);
    }

    // اعتبارسنجی گروه برای وضعیت‌های لید
    let group: LeadStatusGroup | undefined = undefined;
    if (listType === 'lead_statuses') {
      const validGroups: LeadStatusGroup[] = ['open', 'won', 'lost'];
      if (input.group && validGroups.includes(input.group)) {
        group = input.group;
      } else {
        group = 'open'; // پیش‌فرض برای وضعیت جدید
      }
    }

    const now = new Date().toISOString();
    const maxOrder = items.length > 0 ? Math.max(...items.map((i) => i.order || 0)) : 0;

    const prefixMap: Record<OrgListType, string> = {
      campaign_types: 'ct',
      lead_sources: 'ls',
      lead_statuses: 'lst',
      lost_reasons: 'lr',
      cost_categories: 'cc',
    };

    const newItem: OrgListItem = {
      id: `${prefixMap[listType]}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      key: finalKey,
      label: trimmedLabel,
      order: maxOrder + 1,
      isActive: input.isActive !== undefined ? input.isActive : true,
      isSystem: false,
      ...(group ? { group } : {}),
      ...(input.color ? { color: input.color } : {}),
      createdAt: now,
      updatedAt: now,
    };

    if (listType === 'lead_statuses') {
      (state.lead_statuses as OrgLeadStatusItem[]).push(newItem as OrgLeadStatusItem);
    } else {
      (state[listType] as OrgListItem[]).push(newItem);
    }

    saveOrganizationSettingsState(state);

    return {
      ...newItem,
      usageCount: 0,
    };
  }

  /**
   * ویرایش مشخصات گزینه (شناسه و کلید پایدار حفظ می‌شوند و تغییر نمی‌کنند)
   */
  async updateListItem(
    listType: OrgListType,
    id: string,
    input: UpdateOrgListItemInput
  ): Promise<OrgListItem> {
    const state = getOrganizationSettingsState();
    const items = state[listType] as OrgListItem[];
    const itemIndex = items.findIndex((i) => i.id === id);

    if (itemIndex === -1) {
      throw new Error(`گزینه‌ای با شناسه «${id}» در فهرست یافت نشد.`);
    }

    const targetItem = items[itemIndex];

    if (input.label !== undefined) {
      const trimmed = input.label.trim();
      if (!trimmed) {
        throw new Error('عنوان گزینه نمی‌تواند خالی باشد.');
      }
      if (trimmed !== targetItem.label) {
        const oldLabels = targetItem.previousLabels || [];
        if (!oldLabels.includes(targetItem.label)) {
          targetItem.previousLabels = [...oldLabels, targetItem.label];
        }
        targetItem.label = trimmed;
      }
    }

    if (input.isActive !== undefined) {
      targetItem.isActive = Boolean(input.isActive);
    }

    if (input.order !== undefined && typeof input.order === 'number') {
      targetItem.order = input.order;
    }

    if (input.color !== undefined) {
      targetItem.color = input.color;
    }

    if (listType === 'lead_statuses' && input.group) {
      const validGroups: LeadStatusGroup[] = ['open', 'won', 'lost'];
      if (!validGroups.includes(input.group)) {
        throw new Error('گروه وضعیت لید باید یکی از مقادیر open، won یا lost باشد.');
      }
      (targetItem as OrgLeadStatusItem).group = input.group;
    }

    targetItem.updatedAt = new Date().toISOString();
    saveOrganizationSettingsState(state);

    return {
      ...targetItem,
      usageCount: calculateDynamicUsageCount(listType, targetItem),
    };
  }

  /**
   * تغییر وضعیت فعال / غیرفعال گزینه
   */
  async toggleListItemStatus(
    listType: OrgListType,
    id: string
  ): Promise<OrgListItem> {
    const state = getOrganizationSettingsState();
    const items = state[listType] as OrgListItem[];
    const item = items.find((i) => i.id === id);

    if (!item) {
      throw new Error(`گزینه‌ای با شناسه «${id}» یافت نشد.`);
    }

    item.isActive = !item.isActive;
    item.updatedAt = new Date().toISOString();
    saveOrganizationSettingsState(state);

    return {
      ...item,
      usageCount: calculateDynamicUsageCount(listType, item),
    };
  }

  /**
   * مرتب‌سازی گزینه‌های یک فهرست بر مبنای Drag & Drop (تغییر فیلد order)
   */
  async reorderListItems(
    listType: OrgListType,
    orderedIds: string[]
  ): Promise<OrgListItem[]> {
    const state = getOrganizationSettingsState();
    const items = state[listType] as OrgListItem[];

    // به‌روزرسانی ترتیب ردیف‌ها
    orderedIds.forEach((id, index) => {
      const item = items.find((i) => i.id === id);
      if (item) {
        item.order = index + 1;
        item.updatedAt = new Date().toISOString();
      }
    });

    saveOrganizationSettingsState(state);
    return this.getListItems(listType);
  }

  /**
   * حذف یک گزینه با اعمال گارد قاطع سند محصول:
   * در صورت usageCount > 0 صریحاً با پیام سند رد می‌شود:
   * «در X مورد استفاده شده؛ فقط غیرفعال می‌شود»
   * در صورت usageCount === 0 نیز طبق دستورالعمل گام، حذف فیزیکی غیرفعال بوده و خطای ممانعت صادر می‌شود.
   */
  async deleteListItem(listType: OrgListType, id: string): Promise<void> {
    const state = getOrganizationSettingsState();
    const items = state[listType] as OrgListItem[];
    const item = items.find((i) => i.id === id);

    if (!item) {
      throw new Error(`گزینه‌ای با شناسه «${id}» یافت نشد.`);
    }

    const usageCount = calculateDynamicUsageCount(listType, item);

    // گارد صریح سند محصول برای موارد پراستفاده
    if (usageCount > 0) {
      throw new Error(
        `در ${usageCount.toLocaleString('fa-IR')} مورد استفاده شده؛ فقط غیرفعال می‌شود`
      );
    }

    // برای گزینه‌های بدون استفاده (usageCount === 0)، به دلیل عدم تعیین رفتار حذف دائمی در سند محصول،
    // قابلیت حذف فیزیکی مسدود است و پیشنهاد غیرفعال‌سازی داده می‌شود.
    throw new Error(
      'حذف فیزیکی گزینه‌ها در این نسخه پشتیبانی نمی‌شود؛ گزینه فقط غیرفعال می‌شود.'
    );
  }

  /**
   * محاسبه داینامیک تعداد استفاده از آیتم در داده‌های موجود سیستم
   */
  async calculateUsageCount(
    listType: OrgListType,
    item: OrgListItem
  ): Promise<number> {
    return calculateDynamicUsageCount(listType, item);
  }
}

// صدور نمونه یکتای سراسری (Singleton)
export const organizationService = new MockOrganizationService();
