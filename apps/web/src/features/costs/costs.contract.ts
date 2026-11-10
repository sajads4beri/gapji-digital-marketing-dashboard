/**
 * قرارداد سرویس مدیریت هزینه‌های بازاریابی (ICostService)
 * مرجع: Marketing Platform – Phase 1: Frontend Pages
 */

import {
  CostItem,
  CreateCostInput,
  UpdateCostInput,
  CostFilter,
  CostStatsSummary,
  BatchImportResult,
} from './types';

export interface ICostService {
  /**
   * دریافت تمامی هزینه‌ها به همراه اعمال فیلترهای ترکیبی، جستجو و مرتب‌سازی
   */
  getAll(filters?: CostFilter): Promise<CostItem[]>;

  /**
   * دریافت جزئیات یک هزینه با شناسه اختصاصی
   */
  getById(id: string): Promise<CostItem | null>;

  /**
   * ایجاد و ثبت یک ردیف هزینه جدید پس از اعتبارسنجی و تبدیل دقیق ارز
   */
  create(data: CreateCostInput): Promise<CostItem>;

  /**
   * ویرایش فیلدهای مجاز یک هزینه موجود و محاسبه مجدد مبلغ تومانی در صورت تغییر مبالغ
   */
  update(id: string, data: UpdateCostInput): Promise<CostItem>;

  /**
   * حذف یک ردیف هزینه
   */
  delete(id: string): Promise<boolean>;

  /**
   * محاسبه و دریافت آمار تجمیعی هزینه‌ها تفکیک‌شده بر اساس کانال، دسته‌بندی، کمپین و وضعیت
   * (هزینه‌های draft در آمار قطعی کل لحاظ نمی‌شوند)
   */
  getStats(filters?: { dateRange?: { from?: string; to?: string } }): Promise<CostStatsSummary>;

  /**
   * ایمپورت دسته‌ای هزینه‌ها (از فایل اکسل یا CSV) با اعتبارسنجی ردیف به ردیف
   */
  importBatch(items: CreateCostInput[]): Promise<BatchImportResult>;

  /**
   * تولید خروجی CSV از ردیف‌های هزینه‌های فیلترشده جهت گزارش‌گیری
   */
  exportToCsv(filters?: CostFilter): Promise<string>;
}
