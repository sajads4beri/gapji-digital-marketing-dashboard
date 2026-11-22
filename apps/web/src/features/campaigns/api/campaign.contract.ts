import {
  ExtendedCampaign,
  CreateCampaignInput,
  UpdateCampaignInput,
  CampaignFilters,
  CampaignStats,
  CampaignFunnelResponse,
  CampaignStageLead,
  CampaignAllOkrResponse,
  CampaignStageOkrResponse,
  FunnelKeyResult,
  CreateKeyResultInput,
  UpdateKeyResultInput,
  CreateOkrTaskInput,
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

  /** دریافت قیف فروش و مراحل تبدیل سرنخ‌های کمپین */
  getFunnel(id: string): Promise<CampaignFunnelResponse>;

  /** دریافت لیست لیدهای یک مرحله خاص از قیف کمپین با امکان جستجو */
  getLeadsByStage(
    id: string,
    params?: { statusKey?: string; statusConfigId?: string; search?: string },
  ): Promise<CampaignStageLead[]>;

  /** دریافت نمای کلی و تمام اهداف و نتایج کلیدی قیف فروش کمپین */
  getFunnelAllOkr(campaignId: string): Promise<CampaignAllOkrResponse>;

  /** دریافت OKR یک مرحله خاص از قیف */
  getStageOkr(campaignId: string, stageKey: string): Promise<CampaignStageOkrResponse>;

  /** ثبت یا ویرایش عنوان و توضیحات هدف مرحله */
  upsertStageObjective(
    campaignId: string,
    stageKey: string,
    data: { title: string; description?: string },
  ): Promise<any>;

  /** ایجاد نتیجه کلیدی جدید در یک مرحله */
  createKeyResult(
    campaignId: string,
    stageKey: string,
    data: CreateKeyResultInput,
  ): Promise<FunnelKeyResult>;

  /** ویرایش نتیجه کلیدی */
  updateKeyResult(
    campaignId: string,
    krId: string,
    data: UpdateKeyResultInput,
  ): Promise<FunnelKeyResult>;

  /** حذف نتیجه کلیدی */
  deleteKeyResult(campaignId: string, krId: string): Promise<{ success: boolean }>;

  /** تعریف تسک جدید متصل به نتیجه کلیدی */
  createTaskUnderKeyResult(
    campaignId: string,
    krId: string,
    data: CreateOkrTaskInput,
  ): Promise<any>;
}
