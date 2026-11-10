import {
  ExtendedCampaign,
  CreateCampaignInput,
  UpdateCampaignInput,
  CampaignFilters,
  CampaignStats,
  CampaignStatusType,
} from '../types';
import { ICampaignService } from './campaign.contract';
import {
  delay,
  generateId,
  getStoredItem,
  setStoredItem,
  isBrowser,
  MockServiceError,
} from '@/lib/mock-utils';

const STORAGE_KEY = 'gapji_campaigns_v1';
const INIT_FLAG_KEY = 'gapji_campaigns_initialized_v1';

/**
 * تولید داده‌های اولیه ساختگی با تاریخ‌های پویا متصل به زمان حال
 */
function createInitialMockCampaigns(): ExtendedCampaign[] {
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;

  const toIso = (offsetDays: number) =>
    new Date(now.getTime() + offsetDays * dayMs).toISOString();

  return [
    {
      id: 'cmp_mock_1',
      name: 'کمپین تبلیغاتی جذب لید پاییزی',
      description: 'تبلیغات در اینستاگرام و استوری‌های تخصصی مارکتینگ',
      channel: 'اینستاگرام',
      status: 'active',
      budget: 45000000,
      spend: 21500000,
      impressions: 185000,
      clicks: 7400,
      conversions: 320,
      leadsCount: 320,
      cpl: 67187,
      health: 'healthy',
      budgetSpendPercentage: 47.7,
      startDate: toIso(-10),
      endDate: toIso(20),
      owner: {
        id: 'usr_mock_1',
        name: 'کارشناس کمپین الف',
      },
      createdAt: toIso(-12),
      updatedAt: toIso(-1),
    },
    {
      id: 'cmp_mock_2',
      name: 'کمپین سرچ کلمات کلیدی B2B',
      description: 'تبلیغات هدفمند گوگل ادز روی کلمات کلیدی پرجستجو',
      channel: 'گوگل ادز',
      status: 'active',
      budget: 80000000,
      spend: 68000000,
      impressions: 62000,
      clicks: 4100,
      conversions: 410,
      leadsCount: 410,
      cpl: 165853,
      health: 'warning',
      budgetSpendPercentage: 85.0,
      startDate: toIso(-15),
      endDate: toIso(5),
      owner: {
        id: 'usr_mock_2',
        name: 'مدیر مارکتینگ آزمایشی',
      },
      createdAt: toIso(-18),
      updatedAt: toIso(0),
    },
    {
      id: 'cmp_mock_3',
      name: 'ارسال پیامک تخفیف دوره‌های آموزشی',
      description: 'اطلاع‌رسانی پیامکی به جامعه هدف علاقه‌مندان به بازاریابی',
      channel: 'پیامک',
      status: 'completed',
      budget: 15000000,
      spend: 14800000,
      impressions: 50000,
      clicks: 3200,
      conversions: 185,
      leadsCount: 185,
      cpl: 80000,
      health: 'healthy',
      budgetSpendPercentage: 98.6,
      startDate: toIso(-25),
      endDate: toIso(-5),
      owner: {
        id: 'usr_mock_1',
        name: 'کارشناس کمپین الف',
      },
      createdAt: toIso(-28),
      updatedAt: toIso(-5),
    },
    {
      id: 'cmp_mock_4',
      name: 'کمپین بنری همسان شبکه‌های محتوا',
      description: 'تبلیغات همسان یکتانت برای افزایش آگاهی از برند',
      channel: 'یکتانت',
      status: 'paused',
      budget: 30000000,
      spend: 12000000,
      impressions: 240000,
      clicks: 2900,
      conversions: 45,
      leadsCount: 45,
      cpl: 266666,
      health: 'critical',
      budgetSpendPercentage: 40.0,
      startDate: toIso(-8),
      endDate: toIso(12),
      owner: {
        id: 'usr_mock_3',
        name: 'کارشناس رسانه ب',
      },
      createdAt: toIso(-9),
      updatedAt: toIso(-2),
    },
    {
      id: 'cmp_mock_5',
      name: 'ثبت‌نام وبینار استراتژی رشد کسب‌وکار',
      description: 'پست‌های اسپانسری در کانال‌های معتبر تلگرام',
      channel: 'تلگرام',
      status: 'draft',
      budget: 25000000,
      spend: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      leadsCount: 0,
      cpl: 0,
      health: 'healthy',
      budgetSpendPercentage: 0,
      startDate: toIso(4),
      endDate: toIso(18),
      owner: {
        id: 'usr_mock_2',
        name: 'مدیر مارکتینگ آزمایشی',
      },
      createdAt: toIso(-1),
      updatedAt: toIso(0),
    },
  ];
}

/**
 * پیاده‌سازی سرویس آزمایشی کمپین‌ها (Mock Campaign Service)
 * مستقل از بک‌اند با ذخیره‌سازی محلی در localStorage
 */
export class MockCampaignService implements ICampaignService {
  private inMemoryCampaigns: ExtendedCampaign[] | null = null;
  private simulateError = false;

  constructor(private readonly delayMs: number = 400) {}

  /**
   * فعال یا غیرفعال کردن شبیه‌سازی خطای سرور جهت تست وضعیت ErrorState در UI
   */
  public setSimulateError(enable: boolean): void {
    this.simulateError = enable;
  }

  public isSimulatingError(): boolean {
    return this.simulateError;
  }

  /**
   * بررسی شبیه‌ساز خطا قبل از هر عملیات
   */
  private checkSimulatedError(): void {
    if (this.simulateError) {
      throw new MockServiceError(
        'خطای شبیه‌سازی‌شده در لایه Mock: ارتباط با سرور دچار اختلال شده است.',
        500,
      );
    }
  }

  /**
   * بازیابی داده‌ها به‌صورت امن با رعایت SSR، کنترل ساختار و پشتیبانی از localStorage
   */
  private loadData(): ExtendedCampaign[] {
    if (!isBrowser()) {
      if (!this.inMemoryCampaigns) {
        this.inMemoryCampaigns = createInitialMockCampaigns();
      }
      return this.inMemoryCampaigns;
    }

    const isInitialized = getStoredItem<boolean>(INIT_FLAG_KEY, false);

    if (!isInitialized) {
      const initial = createInitialMockCampaigns();
      setStoredItem(STORAGE_KEY, initial);
      setStoredItem(INIT_FLAG_KEY, true);
      this.inMemoryCampaigns = initial;
      return initial;
    }

    const stored = getStoredItem<unknown>(STORAGE_KEY, null);

    // ۱. اعتبارسنجی ساختار: اگر داده ذخیره‌شده آرایه نبود، بازنشانی به داده‌های اولیه
    if (!Array.isArray(stored)) {
      console.warn(
        '[MockCampaignService] Stored campaigns data is not an array. Resetting to initial mock data.',
      );
      const initial = createInitialMockCampaigns();
      setStoredItem(STORAGE_KEY, initial);
      setStoredItem(INIT_FLAG_KEY, true);
      this.inMemoryCampaigns = initial;
      return initial;
    }

    // ۲. اعتبارسنجی محتوای آرایه: اگر آرایه حاوی آیتم است، ساختار پایه هر آیتم باید بررسی شود
    const isValidStructure =
      stored.length === 0 ||
      stored.every(
        (item) =>
          item &&
          typeof item === 'object' &&
          'id' in item &&
          'name' in item &&
          'status' in item,
      );

    if (!isValidStructure) {
      console.warn(
        '[MockCampaignService] Stored campaigns array contains invalid objects. Resetting to initial mock data.',
      );
      const initial = createInitialMockCampaigns();
      setStoredItem(STORAGE_KEY, initial);
      setStoredItem(INIT_FLAG_KEY, true);
      this.inMemoryCampaigns = initial;
      return initial;
    }

    // ۳. در صورتی که آرایه معتبر باشد (حتی اگر طول آن ۰ باشد پس از حذف تمام کمپین‌ها)
    this.inMemoryCampaigns = stored as ExtendedCampaign[];
    return this.inMemoryCampaigns;
  }

  /**
   * ذخیره تغییرات داده‌ها در حافظه و localStorage
   */
  private saveData(data: ExtendedCampaign[]): void {
    this.inMemoryCampaigns = data;
    if (isBrowser()) {
      setStoredItem(STORAGE_KEY, data);
    }
  }

  /**
   * اعمال جامع فیلترها (جستجو، وضعیت چندگانه، کانال و همپوشانی بازه زمانی)
   */
  private filterList(
    list: ExtendedCampaign[],
    filters?: CampaignFilters,
  ): ExtendedCampaign[] {
    if (!filters) {
      return [...list];
    }

    let result = [...list];

    // ۱. فیلتر جستجوی متنی (نام، کانال، توضیحات)
    if (filters.search && filters.search.trim()) {
      const query = filters.search.trim().toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.channel.toLowerCase().includes(query) ||
          (c.description && c.description.toLowerCase().includes(query)),
      );
    }

    // ۲. فیلتر وضعیت (پشتیبانی از تک‌وضعیت، آرایه، یا رشته کاما-جداشده)
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

    // ۴. فیلتر بازه تاریخ شمسی / میلادی با منطق همپوشانی زمانی کامل (Date Overlap)
    // کمپین زمانی با بازه [filterFrom, filterTo] همپوشانی دارد که:
    // (startDate <= filterTo) && (endDate >= filterFrom)
    const filterFrom = (filters.from || filters.startDate || '').trim().slice(0, 10);
    const filterTo = (filters.to || filters.endDate || '').trim().slice(0, 10);

    if (filterFrom || filterTo) {
      result = result.filter((c) => {
        const campStart = (c.startDate || '').slice(0, 10);
        const campEnd = (c.endDate || '').slice(0, 10);

        // اگر پایان بازه فیلتر تعیین شده، شروع کمپین نباید پس از آن باشد
        if (filterTo && campStart && campStart > filterTo) {
          return false;
        }

        // اگر آغاز بازه فیلتر تعیین شده، پایان کمپین نباید قبل از آن باشد
        if (filterFrom && campEnd && campEnd < filterFrom) {
          return false;
        }

        return true;
      });
    }

    return result;
  }

  public async getAll(filters?: CampaignFilters): Promise<ExtendedCampaign[]> {
    await delay(this.delayMs);
    this.checkSimulatedError();

    const list = this.loadData();
    return this.filterList(list, filters);
  }

  public async getById(id: string): Promise<ExtendedCampaign | null> {
    await delay(this.delayMs);
    this.checkSimulatedError();

    const list = this.loadData();
    const item = list.find((c) => c.id === id);
    return item ? { ...item } : null;
  }

  public async create(data: CreateCampaignInput): Promise<ExtendedCampaign> {
    await delay(this.delayMs);
    this.checkSimulatedError();

    const list = this.loadData();
    const nowIso = new Date().toISOString();

    const newCampaign: ExtendedCampaign = {
      id: generateId('cmp'),
      name: data.name,
      description: data.description ?? null,
      channel: data.channel,
      status: (data.status as CampaignStatusType) || 'draft',
      budget: data.budget,
      spend: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      leadsCount: 0,
      cpl: 0,
      health: 'healthy',
      budgetSpendPercentage: 0,
      startDate: data.startDate,
      endDate: data.endDate,
      objective: data.objective,
      targetAudience: data.targetAudience,
      platforms: data.platforms,
      targetKpis: data.targetKpis,
      trackingUtm: data.trackingUtm,
      owner: {
        id: generateId('usr'),
        name: data.ownerName || 'کاربر جاری',
      },
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    list.unshift(newCampaign);
    this.saveData(list);
    return { ...newCampaign };
  }

  public async update(
    id: string,
    data: UpdateCampaignInput,
  ): Promise<ExtendedCampaign> {
    await delay(this.delayMs);
    this.checkSimulatedError();

    const list = this.loadData();
    const index = list.findIndex((c) => c.id === id);

    if (index === -1) {
      throw new MockServiceError(`کمپینی با شناسه "${id}" یافت نشد.`, 404);
    }

    const current = list[index];
    const updated: ExtendedCampaign = {
      ...current,
      name: data.name ?? current.name,
      description:
        data.description !== undefined ? data.description : current.description,
      channel: data.channel ?? current.channel,
      status: (data.status as CampaignStatusType) ?? current.status,
      budget: data.budget !== undefined ? data.budget : current.budget,
      startDate: data.startDate ?? current.startDate,
      endDate: data.endDate ?? current.endDate,
      objective: data.objective !== undefined ? data.objective : current.objective,
      targetAudience:
        data.targetAudience !== undefined
          ? data.targetAudience
          : current.targetAudience,
      platforms:
        data.platforms !== undefined ? data.platforms : current.platforms,
      targetKpis:
        data.targetKpis !== undefined ? data.targetKpis : current.targetKpis,
      trackingUtm:
        data.trackingUtm !== undefined ? data.trackingUtm : current.trackingUtm,
      owner: data.ownerName
        ? { ...current.owner, name: data.ownerName }
        : current.owner,
      updatedAt: new Date().toISOString(),
      budgetSpendPercentage:
        data.budget && data.budget > 0
          ? Number(((current.spend / data.budget) * 100).toFixed(1))
          : current.budgetSpendPercentage,
    };

    list[index] = updated;
    this.saveData(list);
    return { ...updated };
  }

  public async delete(id: string): Promise<boolean> {
    await delay(this.delayMs);
    this.checkSimulatedError();

    const list = this.loadData();
    const filtered = list.filter((c) => c.id !== id);

    if (filtered.length === list.length) {
      throw new MockServiceError(`کمپینی با شناسه "${id}" برای حذف یافت نشد.`, 404);
    }

    this.saveData(filtered);
    return true;
  }

  public async updateStatus(
    id: string,
    status: CampaignStatusType | string,
  ): Promise<ExtendedCampaign> {
    await delay(this.delayMs);
    this.checkSimulatedError();

    const list = this.loadData();
    const item = list.find((c) => c.id === id);

    if (!item) {
      throw new MockServiceError(`کمپینی با شناسه "${id}" یافت نشد.`, 404);
    }

    item.status = status as CampaignStatusType;
    item.updatedAt = new Date().toISOString();
    this.saveData(list);
    return { ...item };
  }

  public async getStats(filters?: CampaignFilters): Promise<CampaignStats> {
    await delay(this.delayMs);
    this.checkSimulatedError();

    const rawList = this.loadData();
    const list = this.filterList(rawList, filters);

    return {
      total: list.length,
      active: list.filter((c) => c.status === 'active').length,
      totalSpend: list.reduce((sum, c) => sum + (c.spend || 0), 0),
      totalImpressions: list.reduce((sum, c) => sum + (c.impressions || 0), 0),
      totalClicks: list.reduce((sum, c) => sum + (c.clicks || 0), 0),
      totalConversions: list.reduce((sum, c) => sum + (c.conversions || 0), 0),
    };
  }
}
