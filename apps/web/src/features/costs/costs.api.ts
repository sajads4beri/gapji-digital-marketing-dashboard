import { api } from '@/lib/api';
import type {
  CostItem,
  CreateCostInput,
  UpdateCostInput,
  CostFilter,
  CostStatsSummary,
  BatchImportResult,
} from './types';
import { ICostService } from './costs.contract';
import axios from 'axios';

export const costApi: ICostService = {
  /**
   * دریافت تمامی هزینه‌ها از سرور واقعی با اعمال فیلترهای ارسالی
   */
  async getAll(filters?: CostFilter): Promise<CostItem[]> {
    const params: Record<string, string | undefined> = {};
    if (filters?.search) params.search = filters.search;
    if (filters?.category && filters.category !== 'all') params.category = filters.category;
    if (filters?.channel && filters.channel !== 'all') params.channel = filters.channel;
    if (filters?.campaignId && filters.campaignId !== 'all') params.campaignId = filters.campaignId;
    if (filters?.status && filters.status !== 'all') params.status = filters.status;
    if (filters?.dateRange?.from) params.from = filters.dateRange.from;
    if (filters?.dateRange?.to) params.to = filters.dateRange.to;
    if (filters?.sortBy) params.sortBy = filters.sortBy;
    if (filters?.sortOrder) params.sortOrder = filters.sortOrder;

    const { data } = await api.get<CostItem[]>('/costs', { params });
    return data;
  },

  /**
   * دریافت جزئیات یک هزینه با شناسه اختصاصی
   */
  async getById(id: string): Promise<CostItem | null> {
    try {
      const { data } = await api.get<CostItem>(`/costs/${id}`);
      return data;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        return null;
      }
      throw err;
    }
  },

  /**
   * ثبت هزینه جدید در پایگاه داده واقعی
   */
  async create(input: CreateCostInput): Promise<CostItem> {
    try {
      const { data } = await api.post<CostItem>('/costs', input);
      return data;
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data) {
        const resData = err.response.data as any;
        const msg = Array.isArray(resData?.message)
          ? resData.message.join(' - ')
          : resData?.message || 'خطا در ثبت هزینه در سرور';
        throw new Error(msg);
      }
      throw err;
    }
  },

  /**
   * ویرایش مشخصات هزینه در پایگاه داده
   */
  async update(id: string, input: UpdateCostInput): Promise<CostItem> {
    try {
      const { data } = await api.patch<CostItem>(`/costs/${id}`, input);
      return data;
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data) {
        const resData = err.response.data as any;
        const msg = Array.isArray(resData?.message)
          ? resData.message.join(' - ')
          : resData?.message || 'خطا در ویرایش هزینه در سرور';
        throw new Error(msg);
      }
      throw err;
    }
  },

  /**
   * حذف دائمی یک ردیف هزینه
   */
  async delete(id: string): Promise<boolean> {
    try {
      await api.delete(`/costs/${id}`);
      return true;
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data) {
        const resData = err.response.data as any;
        const msg = resData?.message || 'خطا در حذف هزینه از سرور';
        throw new Error(msg);
      }
      throw err;
    }
  },

  /**
   * دریافت آمارهای تجمیعی هزینه‌ها از سرور
   */
  async getStats(filters?: { dateRange?: { from?: string; to?: string } }): Promise<CostStatsSummary> {
    const params: Record<string, string | undefined> = {};
    if (filters?.dateRange?.from) params.from = filters.dateRange.from;
    if (filters?.dateRange?.to) params.to = filters.dateRange.to;

    const { data } = await api.get<CostStatsSummary>('/costs/stats', { params });
    return data;
  },

  /**
   * ایمپورت دسته‌ای هزینه‌ها
   */
  async importBatch(items: CreateCostInput[]): Promise<BatchImportResult> {
    try {
      const { data } = await api.post<BatchImportResult>('/costs/batch', items);
      return data;
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data) {
        const resData = err.response.data as any;
        const msg = resData?.message || 'خطا در ایمپورت دسته‌ای هزینه‌ها';
        throw new Error(msg);
      }
      throw err;
    }
  },

  /**
   * دریافت خروجی CSV از هزینه‌های فیلترشده
   */
  async exportToCsv(filters?: CostFilter): Promise<string> {
    const costs = await this.getAll(filters);

    const headers = [
      'شناسه',
      'عنوان هزینه',
      'دسته‌بندی',
      'کانال / پلتفرم',
      'کمپین مرتبط',
      'مبلغ اصلی',
      'ارز',
      'نرخ تبدیل',
      'معادل به تومان',
      'تاریخ',
      'فروشنده / مجری',
      'شماره فاکتور',
      'وضعیت پرداخت',
      'توضیحات',
    ];

    const escapeCsv = (val?: string | number | null) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = costs.map((c) => [
      escapeCsv(c.id),
      escapeCsv(c.title),
      escapeCsv(c.category),
      escapeCsv(c.channel || '-'),
      escapeCsv(c.campaignName || '-'),
      escapeCsv(c.amount),
      escapeCsv(c.currency),
      escapeCsv(c.exchangeRate),
      escapeCsv(c.normalizedAmountToman),
      escapeCsv(c.date),
      escapeCsv(c.vendor || '-'),
      escapeCsv(c.invoiceNumber || '-'),
      escapeCsv(c.status),
      escapeCsv(c.notes || '-'),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    return `\uFEFF${csvContent}`;
  },
};
