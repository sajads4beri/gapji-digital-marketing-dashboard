import {
  ExtendedCampaign,
  CreateCampaignInput,
  UpdateCampaignInput,
  CampaignFilters,
  CampaignStats,
} from '../types';

/**
 * قرارداد انتزاعی سرویس کمپین‌ها
 * این اینترفیس منبع واحد تعامل لایه UI با هرگونه منبع داده (Mock یا API واقعی) است.
 */
export interface ICampaignService {
  /** دریافت لیست کمپین‌ها با فیلتر و جستجوی اختیاری */
  getAll(filters?: CampaignFilters): Promise<ExtendedCampaign[]>;

  /** دریافت یک کمپین بر اساس شناسه */
  getById(id: string): Promise<ExtendedCampaign | null>;

  /** ایجاد کمپین جدید */
  create(data: CreateCampaignInput): Promise<ExtendedCampaign>;

  /** ویرایش اطلاعات کمپین */
  update(id: string, data: UpdateCampaignInput): Promise<ExtendedCampaign>;

  /** حذف کمپین */
  delete(id: string): Promise<boolean>;

  /** به‌روزرسانی سریع وضعیت کمپین */
  updateStatus(id: string, status: string): Promise<ExtendedCampaign>;

  /** دریافت خلاصه آمارهای داشبورد محاسبه‌شده بر مبنای کمپین‌های موجود (با پشتیبانی از فیلترهای فعال) */
  getStats(filters?: CampaignFilters): Promise<CampaignStats>;
}
