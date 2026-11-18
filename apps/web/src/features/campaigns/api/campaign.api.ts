import { api } from '@/lib/api';
import type {
  ExtendedCampaign,
  CreateCampaignInput,
  UpdateCampaignInput,
  CampaignFilters,
  CampaignStats,
  CampaignStatusType,
} from '../types';
import { ICampaignService } from './campaign.contract';
import axios from 'axios';

let simulatedErrorState = false;

export const mockCampaignDevTools = {
  setSimulateError: (enable: boolean) => {
    simulatedErrorState = enable;
  },
  isSimulatingError: () => simulatedErrorState,
};

function checkSimulatedError() {
  if (simulatedErrorState) {
    throw new Error('خطای شبیه‌سازی‌شده: ارتباط با سرور دچار اختلال شده است.');
  }
}

/**
 * فیلتر کردن لیست کمپین‌ها در سمت کلاینت بر اساس فیلترهای جستجو، وضعیت، کانال و بازه تاریخ
 */
export function filterCampaigns(
  list: ExtendedCampaign[],
  filters?: CampaignFilters,
): ExtendedCampaign[] {
  if (!filters) return list;

  let result = [...list];

  // ۱. فیلتر جستجوی متنی (نام، کانال، توضیحات)
  if (filters.search && filters.search.trim()) {
    const query = filters.search.trim().toLowerCase();
    result = result.filter(
      (c) =>
        (c.name && c.name.toLowerCase().includes(query)) ||
        (c.channel && c.channel.toLowerCase().includes(query)) ||
        (c.description && c.description.toLowerCase().includes(query)),
    );
  }

  // ۲. فیلتر وضعیت (پشتیبانی از تک وضعیت، آرایه وضعیت‌ها، یا رشته کاما-جداشده)
  if (filters.status) {
    let statusList: string[] = [];
    if (Array.isArray(filters.status)) {
      statusList = filters.status.map((s) => String(s).trim()).filter(Boolean);
    } else if (typeof filters.status === 'string') {
      statusList = filters.status
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (statusList.length > 0) {
      result = result.filter((c) => statusList.includes(c.status));
    }
  }

  // ۳. فیلتر کانال
  if (filters.channel && filters.channel.trim()) {
    result = result.filter((c) => c.channel === filters.channel?.trim());
  }

  // ۴. فیلتر بازه تاریخ
  const filterFrom = (filters.from || filters.startDate || '').trim().slice(0, 10);
  const filterTo = (filters.to || filters.endDate || '').trim().slice(0, 10);

  if (filterFrom || filterTo) {
    result = result.filter((c) => {
      const campStart = (c.startDate || '').slice(0, 10);
      const campEnd = (c.endDate || '').slice(0, 10);

      if (filterTo && campStart && campStart > filterTo) return false;
      if (filterFrom && campEnd && campEnd < filterFrom) return false;

      return true;
    });
  }

  return result;
}

/**
 * کلاینت واقعی ارتباط با سرویس کمپین‌های بک‌اند Gapji و پایگاه داده PostgreSQL
 */
export const campaignApi: ICampaignService = {
  /**
   * دریافت تمام کمپین‌های سازمان کاربر از سرور واقعی
   */
  async getAll(filters?: CampaignFilters): Promise<ExtendedCampaign[]> {
    checkSimulatedError();
    const { data } = await api.get<ExtendedCampaign[]>('/campaigns');
    return filterCampaigns(data, filters);
  },

  /**
   * دریافت اطلاعات کامل یک کمپین با شناسه یکتا
   */
  async getById(id: string): Promise<ExtendedCampaign | null> {
    checkSimulatedError();
    try {
      const { data } = await api.get<ExtendedCampaign>(`/campaigns/${id}`);
      return data;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        return null;
      }
      throw err;
    }
  },

  /**
   * ثبت کمپین جدید در پایگاه داده واقعی PostgreSQL
   */
  async create(input: CreateCampaignInput): Promise<ExtendedCampaign> {
    checkSimulatedError();
    try {
      const { data } = await api.post<ExtendedCampaign>('/campaigns', input);
      return data;
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data) {
        const resData = err.response.data as any;
        const msg = Array.isArray(resData?.message)
          ? resData.message.join(' - ')
          : resData?.message || 'خطا در ثبت کمپین در پایگاه داده';
        throw new Error(msg);
      }
      throw err;
    }
  },

  /**
   * ویرایش مشخصات کمپین در پایگاه داده واقعی
   */
  async update(id: string, input: UpdateCampaignInput): Promise<ExtendedCampaign> {
    checkSimulatedError();
    try {
      const { data } = await api.patch<ExtendedCampaign>(`/campaigns/${id}`, input);
      return data;
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data) {
        const resData = err.response.data as any;
        const msg = Array.isArray(resData?.message)
          ? resData.message.join(' - ')
          : resData?.message || 'خطا در ویرایش کمپین در پایگاه داده';
        throw new Error(msg);
      }
      throw err;
    }
  },

  /**
   * حذف دائمی یک کمپین از سیستم
   */
  async delete(id: string): Promise<boolean> {
    checkSimulatedError();
    try {
      await api.delete(`/campaigns/${id}`);
      return true;
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data) {
        const resData = err.response.data as any;
        const msg = resData?.message || 'خطا در حذف کمپین';
        throw new Error(msg);
      }
      throw err;
    }
  },

  /**
   * به‌روزرسانی سریع وضعیت کمپین
   */
  async updateStatus(
    id: string,
    status: CampaignStatusType | string,
  ): Promise<ExtendedCampaign> {
    checkSimulatedError();
    try {
      const { data } = await api.patch<ExtendedCampaign>(`/campaigns/${id}`, { status });
      return data;
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data) {
        const resData = err.response.data as any;
        const msg = resData?.message || 'خطا در به‌روزرسانی وضعیت کمپین';
        throw new Error(msg);
      }
      throw err;
    }
  },

  /**
   * دریافت آمارهای خلاصه کمپین‌های سازمان
   */
  async getStats(filters?: CampaignFilters): Promise<CampaignStats> {
    checkSimulatedError();

    // اگر فیلتر فعالی تنظیم شده باشد، آمار بر مبنای کمپین‌های منطبق محاسبه می‌شود
    if (filters && (filters.search || filters.status || filters.from || filters.to || filters.channel)) {
      const filtered = await this.getAll(filters);
      return {
        total: filtered.length,
        active: filtered.filter((c) => c.status === 'active').length,
        totalSpend: filtered.reduce((sum, c) => sum + (c.spend || 0), 0),
        totalImpressions: filtered.reduce((sum, c) => sum + (c.impressions || 0), 0),
        totalClicks: filtered.reduce((sum, c) => sum + (c.clicks || 0), 0),
        totalConversions: filtered.reduce((sum, c) => sum + (c.conversions || 0), 0),
      };
    }

    try {
      const { data } = await api.get<CampaignStats>('/campaigns/stats');
      return data;
    } catch {
      const all = await this.getAll();
      return {
        total: all.length,
        active: all.filter((c) => c.status === 'active').length,
        totalSpend: all.reduce((sum, c) => sum + (c.spend || 0), 0),
        totalImpressions: all.reduce((sum, c) => sum + (c.impressions || 0), 0),
        totalClicks: all.reduce((sum, c) => sum + (c.clicks || 0), 0),
        totalConversions: all.reduce((sum, c) => sum + (c.conversions || 0), 0),
      };
    }
  },
};
