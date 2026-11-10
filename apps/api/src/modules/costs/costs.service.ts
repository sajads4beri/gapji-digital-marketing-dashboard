import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCostDto } from './dto/create-cost.dto';
import { UpdateCostDto } from './dto/update-cost.dto';
import { CostQueryDto } from './dto/cost-query.dto';
import { Prisma } from '@prisma/client';

export interface CurrentUserPayload {
  id: string;
  email?: string;
  fullName?: string;
  organizationId: string | null;
  role: string;
}

const DEFAULT_ORGANIZATION_ID = '00000000-0000-0000-0000-000000000001';

@Injectable()
export class CostsService {
  private readonly logger = new Logger(CostsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * بررسی سطح دسترسی نقش‌های کاربری بر مبنای سند محصول (صفحات ۹، ۱۱ و ۱۲) و DEC-AUTH-11
   */
  public assertCostAccess(user?: CurrentUserPayload, action: 'read' | 'write' = 'read'): void {
    if (!user) return;
    if (!user.organizationId) {
      throw new BadRequestException('سازمان فعال برای کاربر مشخص نشده است');
    }

    if (action === 'write') {
      // فقط مدیر مارکتینگ، کمپین‌چی و ادمین حق ایجاد، ویرایش یا حذف هزینه‌ها را دارند
      if (!['admin', 'owner', 'marketing_manager', 'campaign_manager'].includes(user.role)) {
        this.logger.warn(`User ${user.id} with role ${user.role} denied write access to Costs`);
        throw new ForbiddenException('نقش کاربری شما مجوز ایجاد یا ویرایش هزینه‌ها را ندارد');
      }
    } else {
      // ادمین، مدیر مارکتینگ، کمپین‌چی و کارفرما (فقط‌خواندنی) حق مشاهده دارند
      if (!['admin', 'owner', 'marketing_manager', 'campaign_manager', 'client'].includes(user.role)) {
        this.logger.warn(`User ${user.id} with role ${user.role} denied read access to Costs`);
        throw new ForbiddenException('نقش کاربری شما مجوز مشاهده هزینه‌ها را ندارد');
      }
    }
  }

  /**
   * سریال‌سازی رکورد هزینه پایگاه داده به ساختار استاندارد مورد نیاز رابط کاربری
   */
  public serializeCost(cost: any): any {
    let meta: any = {};
    if (cost.notes) {
      try {
        meta = JSON.parse(cost.notes);
      } catch {
        meta = { notes: cost.notes };
      }
    }

    const amount = meta.amount !== undefined ? Number(meta.amount) : Number(cost.amount);
    const currency = meta.currency || 'TOMAN';
    const exchangeRate = meta.exchangeRate || 1;
    const normalizedAmountToman = Math.round(Number(cost.amount));

    return {
      id: cost.id,
      title: meta.title || 'هزینه بازاریابی',
      category: meta.category || 'ad_media',
      channel: meta.channel || null,
      campaignId: cost.campaignId || null,
      campaignName: cost.campaign?.name || meta.campaignName || null,
      amount,
      currency,
      exchangeRate,
      normalizedAmountToman,
      date: cost.date instanceof Date
        ? cost.date.toISOString().split('T')[0]
        : String(cost.date).slice(0, 10),
      vendor: meta.vendor || null,
      invoiceNumber: meta.invoiceNumber || null,
      status: meta.status || 'paid',
      notes: meta.notes || null,
      createdAt: cost.createdAt instanceof Date ? cost.createdAt.toISOString() : cost.createdAt,
      updatedAt: cost.updatedAt instanceof Date ? cost.updatedAt.toISOString() : cost.updatedAt,
    };
  }

  /**
   * همگام‌سازی مجموع هزینه مصرف‌شده در کمپین (Campaign.spend)
   */
  private async syncCampaignSpend(campaignId: string, organizationId: string): Promise<void> {
    try {
      const sumResult = await this.prisma.cost.aggregate({
        where: {
          campaignId,
          organizationId,
        },
        _sum: { amount: true },
      });
      const totalSpend = sumResult._sum.amount || new Prisma.Decimal(0);
      await this.prisma.campaign.update({
        where: { id: campaignId },
        data: { spend: totalSpend },
      });
    } catch (err) {
      this.logger.warn(`Failed to sync campaign spend for ${campaignId}: ${err}`);
    }
  }

  /**
   * دریافت لیست هزینه‌های سازمان فعال با اعمال فیلترهای ترکیبی
   */
  async findAll(query?: CostQueryDto, user?: CurrentUserPayload): Promise<any[]> {
    this.assertCostAccess(user, 'read');
    const organizationId = user?.organizationId ?? DEFAULT_ORGANIZATION_ID;

    const where: any = { organizationId };

    // فیلتر کمپین مرتبط
    if (query?.campaignId) {
      if (query.campaignId === 'unlinked') {
        where.campaignId = null;
      } else if (query.campaignId !== 'all') {
        where.campaignId = query.campaignId;
      }
    }

    // فیلتر بازه تاریخ وقوع
    if (query?.from || query?.to) {
      where.date = {};
      if (query.from) {
        where.date.gte = new Date(query.from);
      }
      if (query.to) {
        where.date.lte = new Date(query.to);
      }
    }

    const costs = await this.prisma.cost.findMany({
      where,
      include: {
        campaign: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
    });

    let items = costs.map((cost) => this.serializeCost(cost));

    // فیلترهای سمت سرویس بر مبنای متادیتا
    if (query?.category && query.category !== 'all') {
      items = items.filter((item) => item.category === query.category);
    }
    if (query?.channel && query.channel !== 'all') {
      if (query.channel === 'none') {
        items = items.filter((item) => !item.channel);
      } else {
        items = items.filter((item) => item.channel === query.channel);
      }
    }
    if (query?.status && query.status !== 'all') {
      items = items.filter((item) => item.status === query.status);
    }
    if (query?.search && query.search.trim()) {
      const q = query.search.trim().toLowerCase();
      items = items.filter((item) =>
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.vendor && item.vendor.toLowerCase().includes(q)) ||
        (item.invoiceNumber && item.invoiceNumber.toLowerCase().includes(q)) ||
        (item.notes && item.notes.toLowerCase().includes(q)) ||
        (item.campaignName && item.campaignName.toLowerCase().includes(q)),
      );
    }

    // مرتب‌سازی در صورت ارسال پارامتر
    if (query?.sortBy) {
      const order = query.sortOrder === 'asc' ? 1 : -1;
      items.sort((a, b) => {
        if (query.sortBy === 'amount') {
          return (a.normalizedAmountToman - b.normalizedAmountToman) * order;
        }
        if (query.sortBy === 'date') {
          return (new Date(a.date).getTime() - new Date(b.date).getTime()) * order;
        }
        if (query.sortBy === 'title') {
          return (a.title || '').localeCompare(b.title || '') * order;
        }
        if (query.sortBy === 'category') {
          return (a.category || '').localeCompare(b.category || '') * order;
        }
        if (query.sortBy === 'channel') {
          return ((a.channel || '') as string).localeCompare((b.channel || '') as string) * order;
        }
        return 0;
      });
    }

    return items;
  }

  /**
   * دریافت مشخصات یک هزینه با شناسه یکتا
   */
  async findOne(id: string, user?: CurrentUserPayload): Promise<any> {
    this.assertCostAccess(user, 'read');
    const organizationId = user?.organizationId ?? DEFAULT_ORGANIZATION_ID;

    const cost = await this.prisma.cost.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        campaign: { select: { id: true, name: true } },
      },
    });

    if (!cost) {
      throw new NotFoundException(`هزینه‌ای با شناسه "${id}" در این سازمان یافت نشد`);
    }

    return this.serializeCost(cost);
  }

  /**
   * ثبت هزینه جدید در پایگاه داده PostgreSQL با رعایت ایزولاسیون سازمانی
   */
  async create(dto: CreateCostDto, user?: CurrentUserPayload): Promise<any> {
    this.assertCostAccess(user, 'write');
    const organizationId = user?.organizationId ?? DEFAULT_ORGANIZATION_ID;

    // بررسی انتساب به کمپین و اطمینان از تعلق کمپین به همین سازمان
    if (dto.campaignId) {
      const campaign = await this.prisma.campaign.findFirst({
        where: { id: dto.campaignId, organizationId },
      });
      if (!campaign) {
        throw new BadRequestException('کمپین مشخص‌شده معتبر نبوده یا متعلق به سازمان شما نیست');
      }
    }

    const effectiveRate = dto.exchangeRate && dto.exchangeRate > 0 ? dto.exchangeRate : 1;
    const normalizedAmountToman = Math.round(dto.amount * effectiveRate);

    const meta = {
      title: dto.title.trim(),
      category: dto.category,
      channel: dto.channel || null,
      campaignName: dto.campaignName || null,
      amount: dto.amount,
      currency: dto.currency || 'TOMAN',
      exchangeRate: effectiveRate,
      vendor: dto.vendor ? dto.vendor.trim() : null,
      invoiceNumber: dto.invoiceNumber ? dto.invoiceNumber.trim() : null,
      status: dto.status || 'paid',
      notes: dto.notes ? dto.notes.trim() : null,
    };

    const cost = await this.prisma.cost.create({
      data: {
        organizationId,
        campaignId: dto.campaignId || null,
        date: new Date(dto.date),
        amount: new Prisma.Decimal(normalizedAmountToman),
        count: dto.count ?? null,
        source: 'manual',
        createdById: user?.id ?? null,
        notes: JSON.stringify(meta),
      },
      include: {
        campaign: { select: { id: true, name: true } },
      },
    });

    if (cost.campaignId) {
      await this.syncCampaignSpend(cost.campaignId, organizationId);
    }

    this.logger.log(`Cost created: ${cost.id} ("${meta.title}") for org ${organizationId}`);
    return this.serializeCost(cost);
  }

  /**
   * ویرایش مشخصات هزینه
   */
  async update(id: string, dto: UpdateCostDto, user?: CurrentUserPayload): Promise<any> {
    this.assertCostAccess(user, 'write');
    const organizationId = user?.organizationId ?? DEFAULT_ORGANIZATION_ID;

    const existing = await this.prisma.cost.findFirst({
      where: { id, organizationId },
      include: { campaign: true },
    });

    if (!existing) {
      throw new NotFoundException(`هزینه‌ای با شناسه "${id}" یافت نشد`);
    }

    const previousCampaignId = existing.campaignId;

    // بررسی انتساب به کمپین در صورت تغییر
    if (dto.campaignId !== undefined && dto.campaignId !== null && dto.campaignId !== existing.campaignId) {
      const campaign = await this.prisma.campaign.findFirst({
        where: { id: dto.campaignId, organizationId },
      });
      if (!campaign) {
        throw new BadRequestException('کمپین مشخص‌شده معتبر نبوده یا متعلق به سازمان شما نیست');
      }
    }

    let existingMeta: any = {};
    if (existing.notes) {
      try {
        existingMeta = JSON.parse(existing.notes);
      } catch {
        existingMeta = { notes: existing.notes };
      }
    }

    const amount = dto.amount !== undefined ? dto.amount : (existingMeta.amount ?? Number(existing.amount));
    const currency = dto.currency !== undefined ? dto.currency : (existingMeta.currency ?? 'TOMAN');
    const exchangeRate = dto.exchangeRate !== undefined ? dto.exchangeRate : (existingMeta.exchangeRate ?? 1);
    const effectiveRate = exchangeRate > 0 ? exchangeRate : 1;
    const normalizedAmountToman = Math.round(amount * effectiveRate);

    const updatedMeta = {
      ...existingMeta,
      title: dto.title !== undefined ? dto.title.trim() : existingMeta.title,
      category: dto.category !== undefined ? dto.category : existingMeta.category,
      channel: dto.channel !== undefined ? dto.channel : existingMeta.channel,
      campaignName: dto.campaignName !== undefined ? dto.campaignName : existingMeta.campaignName,
      amount,
      currency,
      exchangeRate: effectiveRate,
      vendor: dto.vendor !== undefined ? (dto.vendor ? dto.vendor.trim() : null) : existingMeta.vendor,
      invoiceNumber: dto.invoiceNumber !== undefined ? (dto.invoiceNumber ? dto.invoiceNumber.trim() : null) : existingMeta.invoiceNumber,
      status: dto.status !== undefined ? dto.status : existingMeta.status,
      notes: dto.notes !== undefined ? (dto.notes ? dto.notes.trim() : null) : existingMeta.notes,
    };

    const updateData: any = {
      notes: JSON.stringify(updatedMeta),
      amount: new Prisma.Decimal(normalizedAmountToman),
    };

    if (dto.date !== undefined) {
      updateData.date = new Date(dto.date);
    }
    if (dto.campaignId !== undefined) {
      updateData.campaignId = dto.campaignId || null;
    }
    if (dto.count !== undefined) {
      updateData.count = dto.count;
    }

    const updated = await this.prisma.cost.update({
      where: { id: existing.id },
      data: updateData,
      include: {
        campaign: { select: { id: true, name: true } },
      },
    });

    if (previousCampaignId) {
      await this.syncCampaignSpend(previousCampaignId, organizationId);
    }
    if (updated.campaignId && updated.campaignId !== previousCampaignId) {
      await this.syncCampaignSpend(updated.campaignId, organizationId);
    }

    this.logger.log(`Cost updated: ${updated.id} ("${updatedMeta.title}")`);
    return this.serializeCost(updated);
  }

  /**
   * حذف ردیف هزینه از دیتابیس
   */
  async remove(id: string, user?: CurrentUserPayload): Promise<void> {
    this.assertCostAccess(user, 'write');
    const organizationId = user?.organizationId ?? DEFAULT_ORGANIZATION_ID;

    const existing = await this.prisma.cost.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new NotFoundException(`هزینه‌ای با شناسه "${id}" جهت حذف یافت نشد`);
    }

    const campaignId = existing.campaignId;

    await this.prisma.cost.delete({
      where: { id: existing.id },
    });

    if (campaignId) {
      await this.syncCampaignSpend(campaignId, organizationId);
    }

    this.logger.log(`Cost deleted: ${existing.id}`);
  }

  /**
   * ایمپورت دسته‌ای هزینه‌ها (از فایل اکسل یا CSV)
   */
  async importBatch(items: CreateCostDto[], user?: CurrentUserPayload): Promise<any> {
    this.assertCostAccess(user, 'write');
    const organizationId = user?.organizationId ?? DEFAULT_ORGANIZATION_ID;

    let importedCount = 0;
    let skippedCount = 0;
    const errors: Array<{ row: number; reason: string }> = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        if (!item.title || !item.amount || !item.date) {
          skippedCount++;
          errors.push({ row: i + 1, reason: 'فیلدهای اجباری (عنوان، مبلغ یا تاریخ) مفقود هستند' });
          continue;
        }
        await this.create(item, user);
        importedCount++;
      } catch (err: any) {
        skippedCount++;
        errors.push({ row: i + 1, reason: err?.message || 'خطا در ثبت ردیف' });
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
   * محاسبه آمارهای تجمیعی داشبورد هزینه‌ها
   */
  async getStats(
    dateRange?: { from?: string; to?: string },
    user?: CurrentUserPayload,
  ): Promise<any> {
    this.assertCostAccess(user, 'read');
    const organizationId = user?.organizationId ?? DEFAULT_ORGANIZATION_ID;

    const allItems = await this.findAll({ from: dateRange?.from, to: dateRange?.to }, user);

    const nonDraftItems = allItems.filter((c) => c.status !== 'draft');
    const totalSpendToman = nonDraftItems.reduce((sum, c) => sum + (c.normalizedAmountToman || 0), 0);
    const directAdSpendToman = nonDraftItems
      .filter((c) => c.category === 'ad_media')
      .reduce((sum, c) => sum + (c.normalizedAmountToman || 0), 0);
    const overheadSpendToman = totalSpendToman - directAdSpendToman;
    const paidSpendToman = allItems
      .filter((c) => c.status === 'paid')
      .reduce((sum, c) => sum + (c.normalizedAmountToman || 0), 0);
    const pendingInvoicesAmountToman = allItems
      .filter((c) => c.status === 'pending')
      .reduce((sum, c) => sum + (c.normalizedAmountToman || 0), 0);
    const draftSpendToman = allItems
      .filter((c) => c.status === 'draft')
      .reduce((sum, c) => sum + (c.normalizedAmountToman || 0), 0);

    // سهم تفکیکی هر پلتفرم
    const spendByChannel: Record<string, number> = {};
    for (const item of nonDraftItems) {
      const ch = item.channel || 'other';
      spendByChannel[ch] = (spendByChannel[ch] || 0) + (item.normalizedAmountToman || 0);
    }

    // سهم تفکیکی هر دسته‌بندی
    const spendByCategory: Record<string, number> = {};
    for (const item of nonDraftItems) {
      const cat = item.category || 'other';
      spendByCategory[cat] = (spendByCategory[cat] || 0) + (item.normalizedAmountToman || 0);
    }

    // سهم تفکیکی کمپین‌ها
    const campaignMap: Record<string, { campaignId: string; campaignName: string; amountToman: number; count: number }> = {};
    for (const item of nonDraftItems) {
      if (item.campaignId) {
        if (!campaignMap[item.campaignId]) {
          campaignMap[item.campaignId] = {
            campaignId: item.campaignId,
            campaignName: item.campaignName || 'کمپین بدون عنوان',
            amountToman: 0,
            count: 0,
          };
        }
        campaignMap[item.campaignId].amountToman += item.normalizedAmountToman || 0;
        campaignMap[item.campaignId].count += 1;
      }
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
      spendByCampaign: Object.values(campaignMap),
      thisMonthSpendToman: totalSpendToman,
      lastMonthSpendToman: 0,
      monthOverMonthChangePercent: 0,
      totalItemsCount: allItems.length,
    };
  }
}
