import { api } from '@/lib/api';
import {
  ImportDataType,
  TargetFieldDef,
  InspectImportResult,
  ValidateImportResult,
  ExecuteImportPayload,
  ExecuteImportResult,
  ImportJobHistoryItem,
} from './types';

export const importsApi = {
  /**
   * دریافت فیلدهای مقصد و مشخصات متادیتای سیستم
   */
  async getTargetFields(dataType: ImportDataType): Promise<TargetFieldDef[]> {
    const res = await api.get<TargetFieldDef[]>(`/imports/fields?type=${dataType}`);
    return res.data;
  },

  /**
   * ارسال محتوای فایل به بک‌اند جهت بازرسی، استخراج هدرها و پیشنهاد خودکار نگاشت
   */
  async inspectFile(dataType: ImportDataType, csvContent: string): Promise<InspectImportResult> {
    const res = await api.post<InspectImportResult>('/imports/inspect', {
      dataType,
      csvContent,
    });
    return res.data;
  },

  /**
   * اعتبارسنجی معتبر و دقیق سمت سرور برای سطرها و شناسایی تکراری‌ها
   */
  async validateRows(
    dataType: ImportDataType,
    mapping: Record<string, string>,
    rows: Record<string, any>[],
  ): Promise<ValidateImportResult> {
    const res = await api.post<ValidateImportResult>('/imports/validate', {
      dataType,
      mapping,
      rows,
    });
    return res.data;
  },

  /**
   * اجرای نهایی ثبت دسته‌ای داده‌ها در پایگاه داده PostgreSQL با مکانیزم Idempotency
   */
  async executeImport(payload: ExecuteImportPayload): Promise<ExecuteImportResult> {
    const res = await api.post<ExecuteImportResult>('/imports/execute', payload);
    return res.data;
  },

  /**
   * دانلود نمونه فایل تمپلیت استاندارد از سرور
   */
  async getSampleTemplate(dataType: ImportDataType): Promise<{ fileName: string; content: string }> {
    const res = await api.get<{ fileName: string; content: string }>(`/imports/template?type=${dataType}`);
    return res.data;
  },

  /**
   * دریافت سوابق عملیات‌های ایمپورت سازمان
   */
  async getRecentJobs(dataType?: ImportDataType): Promise<ImportJobHistoryItem[]> {
    const url = dataType ? `/imports/jobs?type=${dataType}` : '/imports/jobs';
    const res = await api.get<ImportJobHistoryItem[]>(url);
    return res.data;
  },
};
