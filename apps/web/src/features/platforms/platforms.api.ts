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
   * دریافت فهرست قالب‌های آماده پلتفرم
   */
  async getTemplates(): Promise<PlatformTemplate[]> {
    try {
      const response = await api.get<PlatformTemplate[]>('/platforms/templates');
      return response.data;
    } catch (error) {
      console.warn('Failed to fetch platform templates from API, using fallback templates', error);
      return [
        {
          id: 'tpl_google_ads',
          name: 'گوگل ادز (Google Ads)',
          code: 'google_ads',
          category: 'digital',
          categoryLabel: 'تبلیغات دیجیتال و کلیکی',
          retrievalMethod: 'api',
          description: 'کمپین‌های جستجو (Search)، بنری (Display)، ویدیویی یوتیوب و تبلیغات اپلیکیشن گوگل',
          defaultInputs: [
            { name: 'مبلغ هزینه (تومان)', key: 'spend', dataType: 'number', isRequired: true },
            { name: 'شناسه یا نام کمپین در گوگل', key: 'campaign_name', dataType: 'text', isRequired: true },
            { name: 'تعداد کلیک (Clicks)', key: 'clicks', dataType: 'number', isRequired: false },
            { name: 'تعداد نمایش (Impressions)', key: 'impressions', dataType: 'number', isRequired: false },
          ],
          defaultOutputs: [
            { key: 'cost', label: 'کل هزینه تبلیغ' },
            { key: 'impressions', label: 'تعداد نمایش (Impression)' },
            { key: 'clicks', label: 'تعداد کلیک' },
            { key: 'ctr', label: 'نرخ کلیک (CTR)' },
            { key: 'cpc', label: 'میانگین هزینه هر کلیک (CPC)' },
            { key: 'conversions', label: 'تعداد تبدیل (Conversions)' },
          ],
        },
        {
          id: 'tpl_yektanet',
          name: 'یکتانت (تبلیغات همسان و کلیکی)',
          code: 'yektanet',
          category: 'ad_network',
          categoryLabel: 'شبکه تبلیغاتی ایرانی',
          retrievalMethod: 'import',
          description: 'تبلیغات همسان (Native)، ریتارگتینگ محصول، بنری و محتوایی در وبسایت‌های پربازدید',
          defaultInputs: [
            { name: 'مبلغ صورتحساب هزینه', key: 'spend', dataType: 'number', isRequired: true },
            { name: 'عنوان کمپین در پنل یکتانت', key: 'campaign_title', dataType: 'text', isRequired: true },
            { name: 'تعداد کلیک دریافتی', key: 'clicks', dataType: 'number', isRequired: false },
            { name: 'تعداد نمایش تبلیغ', key: 'impressions', dataType: 'number', isRequired: false },
          ],
          defaultOutputs: [
            { key: 'cost', label: 'هزینه کل کمپین' },
            { key: 'clicks', label: 'کلیک‌های ورودی' },
            { key: 'impressions', label: 'تعداد نمایش' },
            { key: 'ctr', label: 'نرخ کلیک (CTR)' },
            { key: 'conversions', label: 'تعداد لید یا ثبت‌نام' },
          ],
        },
        {
          id: 'tpl_instagram',
          name: 'اینستاگرام و شبکه‌های اجتماعی',
          code: 'instagram',
          category: 'social',
          categoryLabel: 'شبکه‌های اجتماعی',
          retrievalMethod: 'import',
          description: 'تبلیغات اینفلوئنسری، استوری اسپانسرشیپ و کمپین‌های پیج‌های همکار اینستاگرام',
          defaultInputs: [
            { name: 'هزینه پرداختی تبلیغ/اسپانسر', key: 'spend', dataType: 'number', isRequired: true },
            { name: 'نام پیج یا اینفلوئنسر مجری', key: 'influencer_or_page', dataType: 'text', isRequired: true },
            { name: 'قالب انتشار (استوری/پست/ریلز)', key: 'post_format', dataType: 'text', isRequired: false },
            { name: 'لینک یا شناسه انتشار', key: 'post_url', dataType: 'text', isRequired: false },
          ],
          defaultOutputs: [
            { key: 'cost', label: 'هزینه تبلیغاتی' },
            { key: 'leads', label: 'تعداد سرنخ جذب‌شده' },
            { key: 'reach', label: 'دسترسی تخمینی (Reach)' },
            { key: 'engagement', label: 'نرخ تعامل مخاطبان' },
          ],
        },
        {
          id: 'tpl_sms_smart',
          name: 'سامانه پیامک انبوه هوشمند',
          code: 'sms_smart',
          category: 'sms',
          categoryLabel: 'ارسال پیامک',
          retrievalMethod: 'import',
          description: 'ارسال پیامک انبوه تبلیغاتی، اطلاع‌رسانی لیدها و پیامک هدفمند مبتنی بر دیتابیس',
          defaultInputs: [
            { name: 'تعداد کل پیامک‌های ارسالی', key: 'sent_count', dataType: 'number', isRequired: true },
            { name: 'تعرفه به ازای هر پیامک', key: 'cost_per_sms', dataType: 'number', isRequired: true },
            { name: 'شماره خط ارسال‌کننده', key: 'sender_line', dataType: 'text', isRequired: false },
            { name: 'خلاصه متن پیامک', key: 'message_summary', dataType: 'text', isRequired: false },
          ],
          defaultOutputs: [
            { key: 'sent_count', label: 'تعداد ارسال‌شده' },
            { key: 'delivered_count', label: 'پیامک‌های تحویل‌شده' },
            { key: 'total_cost', label: 'کل هزینه ارسال' },
            { key: 'replies_count', label: 'پاسخ‌ها و لیدهای ورودی' },
          ],
        },
        {
          id: 'tpl_divar',
          name: 'دیوار (تبلیغات نردبان و پنل آگهی)',
          code: 'divar',
          category: 'ad_network',
          categoryLabel: 'نیازمندی‌ها و آگهی آنلاین',
          retrievalMethod: 'manual',
          description: 'ثبت آگهی، نردبان و تبلیغات هدفمند تجاری در پلتفرم دیوار',
          defaultInputs: [
            { name: 'مبلغ هزینه نردبان/آگهی', key: 'spend', dataType: 'number', isRequired: true },
            { name: 'تعداد آگهی‌های فعال', key: 'ad_count', dataType: 'number', isRequired: false },
            { name: 'دسته‌بندی موضوعی آگهی', key: 'category_name', dataType: 'text', isRequired: false },
          ],
          defaultOutputs: [
            { key: 'cost', label: 'مجموع هزینه آگهی' },
            { key: 'ad_count', label: 'تعداد آگهی' },
            { key: 'calls', label: 'تماس‌های برقرارشده' },
            { key: 'leads', label: 'سرنخ‌های قطعی' },
          ],
        },
      ];
    }
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
