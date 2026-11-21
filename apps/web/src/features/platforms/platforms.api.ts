import { api } from '@/lib/api';
import {
  Platform,
  PlatformTemplate,
  CreatePlatformInput,
  UpdatePlatformInput,
  PlatformQueryFilter,
  PlatformUsageDetails,
} from './types';

export const platformsApi = {
  /**
   * دریافت فهرست قالب‌های آماده پلتفرم مستقیماً از وب‌سرویس
   */
  async getTemplates(): Promise<PlatformTemplate[]> {
    const response = await api.get<PlatformTemplate[]>('/platforms/templates');
    return response.data;
  },

  /**
   * دریافت فهرست تمام پلتفرم‌ها همراه با فیلترها
   */
  async getPlatforms(filter?: PlatformQueryFilter): Promise<Platform[]> {
    const params = new URLSearchParams();
    if (filter?.search) params.append('search', filter.search);
    if (filter?.category) params.append('category', filter.category);
    if (filter?.retrievalMethod) params.append('retrievalMethod', filter.retrievalMethod);
    if (filter?.status && filter.status !== 'all') params.append('status', filter.status);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await api.get<Platform[]>(`/platforms${queryString}`);
    return response.data;
  },

  /**
   * دریافت مشخصات یک پلتفرم
   */
  async getPlatform(id: string): Promise<Platform> {
    const response = await api.get<Platform>(`/platforms/${id}`);
    return response.data;
  },

  /**
   * ایجاد پلتفرم جدید
   */
  async createPlatform(input: CreatePlatformInput): Promise<Platform> {
    const response = await api.post<Platform>('/platforms', input);
    return response.data;
  },

  /**
   * ویرایش پلتفرم
   */
  async updatePlatform(id: string, input: UpdatePlatformInput): Promise<Platform> {
    const response = await api.patch<Platform>(`/platforms/${id}`, input);
    return response.data;
  },

  /**
   * غیرفعال‌سازی پلتفرم
   */
  async deactivatePlatform(id: string): Promise<{
    platform: Platform;
    activeCampaignsCount: number;
    message: string;
  }> {
    const response = await api.patch<{
      platform: Platform;
      activeCampaignsCount: number;
      message: string;
    }>(`/platforms/${id}/deactivate`);
    return response.data;
  },

  /**
   * فعال‌سازی مجدد پلتفرم
   */
  async activatePlatform(id: string): Promise<Platform> {
    const response = await api.patch<Platform>(`/platforms/${id}/activate`);
    return response.data;
  },

  /**
   * دریافت اطلاعات میزان استفاده و کمپین‌های مرتبط
   */
  async getPlatformUsage(id: string): Promise<PlatformUsageDetails> {
    const response = await api.get<PlatformUsageDetails>(`/platforms/${id}/usage`);
    return response.data;
  },
};
