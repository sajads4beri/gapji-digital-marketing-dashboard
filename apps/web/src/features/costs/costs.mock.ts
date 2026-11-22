/**
 * پیاده‌سازی Mock Service ماژول مدیریت هزینه‌های بازاریابی (MockCostService)
 * منطبق بر قرارداد ICostService
 */

import {
  CostItem,
  CostChannel,
  CostCategory,
  CostCurrency,
  CreateCostInput,
  UpdateCostInput,
  CostFilter,
  CostStatsSummary,
  BatchImportResult,
  COST_CHANNELS,
  COST_CATEGORIES,
  convertCurrencyToToman,
  resolveExchangeRate,
  validateCostData,
} from './types';
import { ICostService } from './costs.contract';
import {
  getStoredCosts,
  getStoredCostById,
  addStoredCost,
  updateStoredCost,
  deleteStoredCost,
} from './costs.storage';
import { generateId } from '@/lib/mock-utils';
import { authService } from '../auth/auth.mock';

/**
 * نقشه کمپین‌های معتبر آزمایشی موجود در پروژه جهت اعتبارسنجی ارجاع کمپین
 * (منطبق بر شناسه‌های cmp_mock_1 تا cmp_mock_5 در ماژول Campaigns)
 */
export const VALID_MOCK_CAMPAIGNS: Record<string, string> = {
  cmp_mock_1: 'کمپین تبلیغاتی جذب لید پاییزی',
  cmp_mock_2: 'کمپین سرچ کلمات کلیدی B2B',
  cmp_mock_3: 'ارسال پیامک تخفیف دوره‌های آموزشی',
  cmp_mock_4: 'کمپین بنری همسان شبکه‌های محتوا',
  cmp_mock_5: 'ثبت‌نام وبینار استراتژی رشد کسب‌وکار',
};

/**
 * نرمال‌سازی ارقام و کاراکترها برای جستجوی متنی انعطاف‌پذیر
 */
function normalizeSearchText(text?: string | null): string {
  if (!text) return '';
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let res = text.toLowerCase();
  for (let i = 0; i < 10; i++) {
    res = res.replaceAll(persianDigits[i], String(i)).replaceAll(arabicDigits[i], String(i));
  }
  return res.trim();
}

export class MockCostService implements ICostService {
  private delayMs: number;
  private shouldSimulateError = false;

  constructor(delayMs = 100) {
    this.delayMs = delayMs;
  }

  public setDelay(ms: number): void {
    this.delayMs = ms;
  }

  public setSimulateError(enable: boolean): void {
    this.shouldSimulateError = enable;
  }

  private async simulateDelay(): Promise<void> {
    if (this.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }
    if (this.shouldSimulateError) {
      throw new Error('خطای شبیه‌سازی‌شده در ارتباط با سرویس هزینه‌ها');
    }
  }

  /**
   * دریافت تمامی هزینه‌ها با اعمال فیلترهای چندگانه و مرتب‌سازی
   */
  async getAll(filters?: CostFilter): Promise<CostItem[]> {
    await this.simulateDelay();
    let costs = getStoredCosts();

    if (!filters) {
      // مرتب‌سازی پیش‌فرض: تاریخ نزولی
      return [...costs].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    }

    // ۱. فیلتر جستجوی متنی (عنوان، فروشنده، شماره فاکتور، یادداشت)
    if (filters.search && filters.search.trim()) {
      const q = normalizeSearchText(filters.search);
      costs = costs.filter((item) => {
        const titleMatch = normalizeSearchText(item.title).includes(q);
        const vendorMatch = normalizeSearchText(item.vendor).includes(q);
        const invoiceMatch = normalizeSearchText(item.invoiceNumber).includes(q);
        const notesMatch = normalizeSearchText(item.notes).includes(q);
        const campaignMatch = normalizeSearchText(item.campaignName).includes(q);
        return titleMatch || vendorMatch || invoiceMatch || notesMatch || campaignMatch;
      });
    }

    // ۲. فیلتر دسته‌بندی
    if (filters.category && filters.category !== 'all') {
      costs = costs.filter((item) => item.category === filters.category);
    }

    // ۳. فیلتر کانال
    if (filters.channel && filters.channel !== 'all') {
      if (filters.channel === 'none') {
        costs = costs.filter((item) => !item.channel);
      } else {
        costs = costs.filter((item) => item.channel === filters.channel);
      }
    }

    // ۴. فیلتر کمپین
    if (filters.campaignId && filters.campaignId !== 'all') {
      if (filters.campaignId === 'unlinked') {
        costs = costs.filter((item) => !item.campaignId);
      } else {
        costs = costs.filter((item) => item.campaignId === filters.campaignId);
      }
    }

    // ۵. فیلتر وضعیت پرداخت
    if (filters.status && filters.status !== 'all') {
      costs = costs.filter((item) => item.status === filters.status);
    }

    // ۶. فیلتر بازه زمانی (بر اساس تاریخ استاندارد ISO YYYY-MM-DD)
    if (filters.dateRange) {
      const { from, to } = filters.dateRange;
      if (from) {
        costs = costs.filter((item) => item.date >= from);
      }
      if (to) {
        costs = costs.filter((item) => item.date <= to);
      }
    }

    // ۷. مرتب‌سازی
    const sortBy = filters.sortBy || 'date';
    const sortOrder = filters.sortOrder || 'desc';
    const multiplier = sortOrder === 'asc' ? 1 : -1;

    costs.sort((a, b) => {
      if (sortBy === 'date') {
        return (new Date(a.date).getTime() - new Date(b.date).getTime()) * multiplier;
      }
      if (sortBy === 'amount') {
        return (a.normalizedAmountToman - b.normalizedAmountToman) * multiplier;
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title, 'fa') * multiplier;
      }
      if (sortBy === 'category') {
        return a.category.localeCompare(b.category) * multiplier;
      }
      if (sortBy === 'channel') {
        const chA = a.channel || '';
        const chB = b.channel || '';
        return chA.localeCompare(chB) * multiplier;
      }
      return 0;
    });

    return [...costs];
  }

  /**
   * دریافت یک ردیف هزینه با شناسه
   */
  async getById(id: string): Promise<CostItem | null> {
    await this.simulateDelay();
    return getStoredCostById(id);
  }

  private assertNotClientReadOnly(): void {
    const session = authService.getActiveSession();
    if (session && session.activeRole === 'client') {
      throw new Error('خطای دسترسی: نقش کارفرما (فقط‌خواندنی) مجاز به ثبت، ویرایش یا حذف هزینه‌ها نیست.');
    }
  }

  /**
   * ایجاد هزینه جدید پس از اعتبارسنجی و تبدیل دقیق ارز
   */
  async create(data: CreateCostInput): Promise<CostItem> {
    this.assertNotClientReadOnly();
    await this.simulateDelay();

    // ۱. اعتبارسنجی فیلدهای ورودی
    const validation = validateCostData(data, false);
    if (!validation.isValid) {
      throw new Error(`خطای اعتبارسنجی هزینه: ${validation.errors.join(' | ')}`);
    }

    // ۲. اعتبارسنجی کمپین ارجاعی (در صورت ارسال)
    let validatedCampaignId: string | null = null;
    let validatedCampaignName: string | null = null;

    if (data.campaignId && data.campaignId.trim()) {
      const cId = data.campaignId.trim();
      if (!(cId in VALID_MOCK_CAMPAIGNS)) {
        throw new Error(`شناسه کمپین "${cId}" نامعتبر است یا کمپین در سیستم یافت نشد.`);
      }
      validatedCampaignId = cId;
      validatedCampaignName = data.campaignName?.trim() || VALID_MOCK_CAMPAIGNS[cId];
    }

    // ۳. تعیین نرخ ارز و محاسبه معادل تومانی
    const rate = resolveExchangeRate(data.currency, data.exchangeRate);
    const normalizedAmountToman = convertCurrencyToToman(data.amount, data.currency, rate);

    // ۴. ساخت شیء جدید
    const nowIso = new Date().toISOString();
    const newCost: CostItem = {
      id: generateId('cost'),
      title: data.title.trim(),
      category: data.category,
      channel: data.channel || null,
      campaignId: validatedCampaignId,
      campaignName: validatedCampaignName,
      amount: data.amount,
      currency: data.currency,
      exchangeRate: rate,
      normalizedAmountToman,
      date: data.date.includes('T') ? data.date.split('T')[0] : data.date,
      vendor: data.vendor?.trim() || null,
      invoiceNumber: data.invoiceNumber?.trim() || null,
      status: data.status || 'paid',
      notes: data.notes?.trim() || null,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    return addStoredCost(newCost);
  }

  /**
   * ویرایش ردیف هزینه موجود
   */
  async update(id: string, data: UpdateCostInput): Promise<CostItem> {
    this.assertNotClientReadOnly();
    await this.simulateDelay();

    const existing = getStoredCostById(id);
    if (!existing) {
      throw new Error(`رکوردی با شناسه "${id}" جهت ویرایش یافت نشد.`);
    }

    // ۱. اعتبارسنجی فیلدهای تغییریافته
    const validation = validateCostData(data, true);
    if (!validation.isValid) {
      throw new Error(`خطای اعتبارسنجی در ویرایش هزینه: ${validation.errors.join(' | ')}`);
    }

    // ۲. بررسی تغییر کمپین
    let updatedCampaignId = existing.campaignId;
    let updatedCampaignName = existing.campaignName;

    if (data.campaignId !== undefined) {
      if (data.campaignId === null || data.campaignId.trim() === '') {
        updatedCampaignId = null;
        updatedCampaignName = null;
      } else {
        const cId = data.campaignId.trim();
        if (!(cId in VALID_MOCK_CAMPAIGNS)) {
          throw new Error(`شناسه کمپین "${cId}" نامعتبر است یا کمپین در سیستم یافت نشد.`);
        }
        updatedCampaignId = cId;
        updatedCampaignName = data.campaignName?.trim() || VALID_MOCK_CAMPAIGNS[cId];
      }
    }

    // ۳. محاسبه مجدد مبالغ در صورت تغییر مقدار، ارز یا نرخ
    const nextAmount = data.amount !== undefined ? data.amount : existing.amount;
    const nextCurrency = data.currency !== undefined ? data.currency : existing.currency;
    const nextRate =
      data.exchangeRate !== undefined
        ? resolveExchangeRate(nextCurrency, data.exchangeRate)
        : nextCurrency === existing.currency
        ? existing.exchangeRate
        : resolveExchangeRate(nextCurrency);

    const isFinancialChanged =
      data.amount !== undefined ||
      data.currency !== undefined ||
      data.exchangeRate !== undefined;

    const normalizedAmountToman = isFinancialChanged
      ? convertCurrencyToToman(nextAmount, nextCurrency, nextRate)
      : existing.normalizedAmountToman;

    // ۴. اعمال فیلدهای مجاز
    const fieldsToUpdate: Partial<CostItem> = {
      ...(data.title !== undefined ? { title: data.title.trim() } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
      ...(data.channel !== undefined ? { channel: data.channel || null } : {}),
      campaignId: updatedCampaignId,
      campaignName: updatedCampaignName,
      amount: nextAmount,
      currency: nextCurrency,
      exchangeRate: nextRate,
      normalizedAmountToman,
      ...(data.date !== undefined
        ? { date: data.date.includes('T') ? data.date.split('T')[0] : data.date }
        : {}),
      ...(data.vendor !== undefined ? { vendor: data.vendor ? data.vendor.trim() : null } : {}),
      ...(data.invoiceNumber !== undefined
        ? { invoiceNumber: data.invoiceNumber ? data.invoiceNumber.trim() : null }
        : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.notes !== undefined ? { notes: data.notes ? data.notes.trim() : null } : {}),
    };

    const updated = updateStoredCost(id, fieldsToUpdate);
    if (!updated) {
      throw new Error(`خطا در ذخیره تغییرات هزینه "${id}".`);
    }

    return updated;
  }

  /**
   * حذف یک ردیف هزینه
   */
  async delete(id: string): Promise<boolean> {
    this.assertNotClientReadOnly();
    await this.simulateDelay();
    return deleteStoredCost(id);
  }

  /**
   * محاسبه آمار جامع هزینه‌ها (هزینه‌های پیش‌نویس draft در آمار قطعی کل لحاظ نمی‌شوند)
   */
  async getStats(filters?: { dateRange?: { from?: string; to?: string } }): Promise<CostStatsSummary> {
    await this.simulateDelay();
    let allCosts = getStoredCosts();

    if (filters?.dateRange) {
      const { from, to } = filters.dateRange;
      if (from) allCosts = allCosts.filter((c) => c.date >= from);
      if (to) allCosts = allCosts.filter((c) => c.date <= to);
    }

    // تفکیک هزینه‌های قطعی‌شده (paid + pending) از هزینه‌های پیش‌نویس (draft)
    const realizedCosts = allCosts.filter((c) => c.status === 'paid' || c.status === 'pending');
    const draftCosts = allCosts.filter((c) => c.status === 'draft');

    const totalSpendToman = realizedCosts.reduce((sum, c) => sum + c.normalizedAmountToman, 0);
    const paidSpendToman = realizedCosts
      .filter((c) => c.status === 'paid')
      .reduce((sum, c) => sum + c.normalizedAmountToman, 0);
    const pendingInvoicesAmountToman = realizedCosts
      .filter((c) => c.status === 'pending')
      .reduce((sum, c) => sum + c.normalizedAmountToman, 0);
    const draftSpendToman = draftCosts.reduce((sum, c) => sum + c.normalizedAmountToman, 0);

    // هزینه تبلیغات مستقیم رسانه (ad_media)
    const directAdSpendToman = realizedCosts
      .filter((c) => c.category === 'ad_media')
      .reduce((sum, c) => sum + c.normalizedAmountToman, 0);

    // هزینه بالاسری (هزینه‌های غیر مرتبط با کمپین یا غیر از ad_media)
    const overheadSpendToman = realizedCosts
      .filter((c) => !c.campaignId || c.category !== 'ad_media')
      .reduce((sum, c) => sum + c.normalizedAmountToman, 0);

    // سهم هزینه‌ها به تفکیک کانال (بدون دوبارشماری)
    const spendByChannel: Record<CostChannel, number> = {
      google_ads: 0,
      instagram: 0,
      sms: 0,
      email: 0,
      webinar: 0,
      content_seo: 0,
      influencer: 0,
      other: 0,
    };

    for (const cost of realizedCosts) {
      const channel = cost.channel && COST_CHANNELS.includes(cost.channel) ? cost.channel : 'other';
      spendByChannel[channel] += cost.normalizedAmountToman;
    }

    // سهم هزینه‌ها به تفکیک دسته‌بندی (بدون دوبارشماری)
    const spendByCategory: Record<CostCategory, number> = {
      ad_media: 0,
      content_production: 0,
      agency_fee: 0,
      software_saas: 0,
      events_webinar: 0,
      influencer: 0,
      other: 0,
    };

    for (const cost of realizedCosts) {
      if (COST_CATEGORIES.includes(cost.category)) {
        spendByCategory[cost.category] += cost.normalizedAmountToman;
      } else {
        spendByCategory.other += cost.normalizedAmountToman;
      }
    }

    // سهم هزینه‌ها به تفکیک کمپین‌های مرتبط
    const campaignMap = new Map<string, { campaignId: string; campaignName: string; amountToman: number; count: number }>();
    for (const cost of realizedCosts) {
      if (cost.campaignId) {
        const current = campaignMap.get(cost.campaignId) || {
          campaignId: cost.campaignId,
          campaignName: cost.campaignName || cost.campaignId,
          amountToman: 0,
          count: 0,
        };
        current.amountToman += cost.normalizedAmountToman;
        current.count += 1;
        campaignMap.set(cost.campaignId, current);
      }
    }

    const spendByCampaign = Array.from(campaignMap.values()).sort(
      (a, b) => b.amountToman - a.amountToman
    );

    // محاسبه هزینه‌های ماه جاری و ماه گذشته بر اساس زمان کنونی
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthKey = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

    const thisMonthSpendToman = realizedCosts
      .filter((c) => c.date.startsWith(currentMonthKey))
      .reduce((sum, c) => sum + c.normalizedAmountToman, 0);

    const lastMonthSpendToman = realizedCosts
      .filter((c) => c.date.startsWith(lastMonthKey))
      .reduce((sum, c) => sum + c.normalizedAmountToman, 0);

    let monthOverMonthChangePercent = 0;
    if (lastMonthSpendToman > 0) {
      monthOverMonthChangePercent = Math.round(
        ((thisMonthSpendToman - lastMonthSpendToman) / lastMonthSpendToman) * 100
      );
    }

    return {
      totalSpendToman,
      directAdSpendToman,
      overheadSpendToman,
      paidSpendToman,
      pendingInvoicesAmountToman,
      draftSpendToman,
      spendByChannel,
      spendByCategory,
      spendByCampaign,
      thisMonthSpendToman,
      lastMonthSpendToman,
      monthOverMonthChangePercent,
      totalItemsCount: allCosts.length,
    };
  }

  /**
   * ایمپورت دسته‌ای هزینه‌ها
   */
  async importBatch(items: CreateCostInput[]): Promise<BatchImportResult> {
    this.assertNotClientReadOnly();
    await this.simulateDelay();

    let importedCount = 0;
    let skippedCount = 0;
    const errors: Array<{ row: number; reason: string }> = [];

    for (let i = 0; i < items.length; i++) {
      const rowNum = i + 1;
      const input = items[i];

      try {
        const val = validateCostData(input, false);
        if (!val.isValid) {
          errors.push({ row: rowNum, reason: val.errors.join(' | ') });
          skippedCount++;
          continue;
        }

        await this.create(input);
        importedCount++;
      } catch (err) {
        errors.push({
          row: rowNum,
          reason: err instanceof Error ? err.message : 'خطای نامشخص در ثبت ردیف',
        });
        skippedCount++;
      }
    }

    return {
      totalRows: items.length,
      importedCount,
      skippedCount,
      errors,
    };
  }

  /**
   * تولید خروجی CSV استاندارد فارسی (همراه با UTF-8 BOM جهت نمایش درست در اکسل)
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
  }
}

// نمونه واحد (Singleton) سراسری
export const costService = new MockCostService();
