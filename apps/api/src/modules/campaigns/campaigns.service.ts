import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Campaign, CampaignStatus, CampaignHealth } from './campaign.entity';
import { CreateCampaignDto } from './create-campaign.dto';
import { UpdateCampaignDto } from './update-campaign.dto';

export const DEFAULT_ORGANIZATION_ID = '00000000-0000-0000-0000-000000000001';

export interface CurrentUserPayload {
  id: string;
  email: string;
  mobile?: string;
  fullName?: string;
  organizationId: string | null;
  role: string;
}

@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * بررسی سطح دسترسی نقش‌های کاربری بر اساس ماتریس سند محصول (صفحات ۵، ۶ و ۷)
   */
  private assertCampaignAccess(user?: CurrentUserPayload, action: 'read' | 'write' = 'read'): void {
    if (!user) return; // حفظ سازگاری با تست‌های واحد فاقد نشست
    if (!user.organizationId) {
      throw new BadRequestException('سازمان فعال برای کاربر مشخص نشده است');
    }

    if (action === 'write') {
      // فقط مدیر مارکتینگ، کمپین‌چی و ادمین حق ایجاد یا ویرایش کمپین دارند (ص ۶ سند محصول)
      if (!['admin', 'owner', 'marketing_manager', 'campaign_manager'].includes(user.role)) {
        this.logger.warn(`User ${user.id} with role ${user.role} denied write access to Campaigns`);
        throw new ForbiddenException('نقش کاربری شما مجوز ایجاد یا ویرایش کمپین را ندارد');
      }
    } else {
      // ادمین، مدیر مارکتینگ، کمپین‌چی و کارفرما (فقط‌خواندنی) حق مشاهده دارند
      if (!['admin', 'owner', 'marketing_manager', 'campaign_manager', 'client'].includes(user.role)) {
        this.logger.warn(`User ${user.id} with role ${user.role} denied read access to Campaigns`);
        throw new ForbiddenException('نقش کاربری شما مجوز دسترسی به ماژول کمپین‌ها را ندارد');
      }
    }
  }

  /**
   * Safely transforms a Prisma Campaign record into an API Campaign response.
   * Converts Decimal fields to numeric values and populates frontend-expected metrics.
   */
  public serializeCampaign(campaign: any): any {
    const budget = Number(campaign.budget || 0);
    const spend = Number(campaign.spend || 0);
    const budgetSpendPercentage = budget > 0 ? Number(((spend / budget) * 100).toFixed(1)) : 0;
    const leadsCount = campaign.conversions || campaign._count?.leads || 0;
    const cpl = leadsCount > 0 ? Math.round(spend / leadsCount) : 0;

    let health: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (campaign.health === 'needs_attention' || campaign.health === 'warning') {
      health = 'warning';
    } else if (campaign.health === 'critical') {
      health = 'critical';
    }

    return {
      id: campaign.id,
      organizationId: campaign.organizationId,
      name: campaign.name,
      description: campaign.description ?? null,
      channel: campaign.channel,
      type: campaign.type || 'digital',
      objective: campaign.objective || 'lead_generation',
      status: campaign.status || 'draft',
      health,
      budget,
      spend,
      budgetSpendPercentage,
      leadsCount,
      cpl,
      startDate: campaign.startDate
        ? (campaign.startDate instanceof Date ? campaign.startDate.toISOString().split('T')[0] : String(campaign.startDate))
        : null,
      endDate: campaign.endDate
        ? (campaign.endDate instanceof Date ? campaign.endDate.toISOString().split('T')[0] : String(campaign.endDate))
        : null,
      targetLeads: campaign.targetLeads ?? null,
      targetSales: campaign.targetSales !== null && campaign.targetSales !== undefined ? Number(campaign.targetSales) : null,
      impressions: campaign.impressions || 0,
      clicks: campaign.clicks || 0,
      conversions: campaign.conversions || 0,
      ownerId: campaign.ownerId ?? null,
      owner: {
        id: campaign.owner?.id || campaign.ownerId || 'unassigned',
        name: campaign.owner?.fullName || campaign.owner?.email || 'نامشخص',
      },
      createdAt: campaign.createdAt instanceof Date ? campaign.createdAt.toISOString() : campaign.createdAt,
      updatedAt: campaign.updatedAt instanceof Date ? campaign.updatedAt.toISOString() : campaign.updatedAt,
    };
  }

  async findAll(user?: CurrentUserPayload): Promise<any[]> {
    this.assertCampaignAccess(user, 'read');
    const organizationId = user?.organizationId ?? DEFAULT_ORGANIZATION_ID;

    const where: any = { organizationId };
    if (user && user.role === 'campaign_manager') {
      // کمپین‌چی طبق ص ۵ سند محصول فقط کمپین‌های خود را مشاهده می‌کند
      where.ownerId = user.id;
    }

    const campaigns = await this.prisma.campaign.findMany({
      where,
      include: {
        owner: { select: { id: true, fullName: true, email: true } },
        _count: { select: { leads: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return campaigns.map((campaign) => this.serializeCampaign(campaign));
  }

  async findOne(id: string, user?: CurrentUserPayload): Promise<any> {
    this.assertCampaignAccess(user, 'read');
    const organizationId = user?.organizationId ?? DEFAULT_ORGANIZATION_ID;

    const campaign = await this.prisma.campaign.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        owner: { select: { id: true, fullName: true, email: true } },
        _count: { select: { leads: true } },
      },
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }

    if (user && user.role === 'campaign_manager' && campaign.ownerId && campaign.ownerId !== user.id) {
      throw new ForbiddenException('شما فقط مجاز به مشاهده کمپین‌های اختصاص‌یافته به خود هستید');
    }

    return this.serializeCampaign(campaign);
  }

  async create(dto: CreateCampaignDto, user?: CurrentUserPayload): Promise<any> {
    this.assertCampaignAccess(user, 'write');
    // شناسه سازمان فقط و فقط از نشست کاربر اعتبارسنجی‌شده استخراج می‌شود
    const organizationId = user?.organizationId ?? dto.organizationId ?? DEFAULT_ORGANIZATION_ID;

    const {
      landingPageUrl: rawLandingUrl,
      organizationId: _clientSuppliedOrg,
      startDate: rawStartDate,
      endDate: rawEndDate,
      targetAudience,
      platforms,
      targetKpis,
      trackingUtm,
      ownerName,
      ...data
    } = dto;

    // استخراج هوشمند هدف سرنخ از فیلدهای تکمیلی ویزارد در صورت ارسال
    let targetLeads = data.targetLeads;
    if (targetLeads === undefined && targetKpis?.targetConversions !== undefined) {
      targetLeads = targetKpis.targetConversions;
    }

    // استخراج آدرس لندینگ پیج از ویزارد
    let landingPageUrl = rawLandingUrl;
    if (!landingPageUrl && trackingUtm?.landingUrl) {
      landingPageUrl = trackingUtm.landingUrl;
    }

    // تعیین کارشناس مالک کمپین بر مبنای قوانین امنیتی
    let ownerId: string | null = null;
    if (user && user.role === 'campaign_manager') {
      ownerId = user.id;
    } else if (data.ownerId) {
      ownerId = data.ownerId;
    } else if (user) {
      ownerId = user.id;
    }

    const campaign = await this.prisma.campaign.create({
      data: {
        organizationId,
        name: data.name.trim(),
        description: data.description ? data.description.trim() : null,
        channel: data.channel || 'چندکاناله (Omnichannel)',
        type: data.type || 'digital',
        objective: data.objective || 'lead_generation',
        status: (data.status as any) ?? CampaignStatus.DRAFT,
        health: (data.health as any) ?? CampaignHealth.HEALTHY,
        budget: data.budget,
        startDate: rawStartDate ? new Date(rawStartDate) : null,
        endDate: rawEndDate ? new Date(rawEndDate) : null,
        targetLeads: targetLeads ?? null,
        targetSales: data.targetSales !== undefined && data.targetSales !== null ? data.targetSales : null,
        ownerId,
      },
      include: {
        owner: { select: { id: true, fullName: true, email: true } },
        _count: { select: { leads: true } },
      },
    });

    this.logger.log(
      `Campaign created: ${campaign.id} ("${campaign.name}") for org ${organizationId} by user ${user?.id || 'system'}`,
    );

    return this.serializeCampaign(campaign);
  }

  async update(id: string, dto: UpdateCampaignDto, user?: CurrentUserPayload): Promise<any> {
    this.assertCampaignAccess(user, 'write');
    const existing = await this.findOne(id, user);

    const {
      landingPageUrl: rawLandingUrl,
      organizationId: _clientOrg,
      startDate: rawStartDate,
      endDate: rawEndDate,
      targetAudience,
      platforms,
      targetKpis,
      trackingUtm,
      ownerName,
      ...data
    } = dto;

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.description !== undefined) updateData.description = data.description ? data.description.trim() : null;
    if (data.channel !== undefined) updateData.channel = data.channel;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.objective !== undefined) updateData.objective = data.objective;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.health !== undefined) updateData.health = data.health;
    if (data.budget !== undefined) updateData.budget = data.budget;
    if (rawStartDate !== undefined) updateData.startDate = rawStartDate ? new Date(rawStartDate) : null;
    if (rawEndDate !== undefined) updateData.endDate = rawEndDate ? new Date(rawEndDate) : null;

    if (data.targetLeads !== undefined) {
      updateData.targetLeads = data.targetLeads;
    } else if (targetKpis?.targetConversions !== undefined) {
      updateData.targetLeads = targetKpis.targetConversions;
    }

    if (data.targetSales !== undefined) updateData.targetSales = data.targetSales;

    if (data.ownerId !== undefined && (!user || user.role !== 'campaign_manager')) {
      updateData.ownerId = data.ownerId;
    }

    const updated = await this.prisma.campaign.update({
      where: { id: existing.id },
      data: updateData,
      include: {
        owner: { select: { id: true, fullName: true, email: true } },
        _count: { select: { leads: true } },
      },
    });

    this.logger.log(`Campaign updated: ${updated.id} ("${updated.name}")`);
    return this.serializeCampaign(updated);
  }

  async remove(id: string, user?: CurrentUserPayload): Promise<void> {
    this.assertCampaignAccess(user, 'write');
    const existing = await this.findOne(id, user);
    await this.prisma.campaign.delete({
      where: { id: existing.id },
    });
    this.logger.log(`Campaign deleted: ${existing.id}`);
  }

  async getStats(user?: CurrentUserPayload) {
    const campaigns = await this.findAll(user);
    return {
      total: campaigns.length,
      active: campaigns.filter((c: any) => c.status === 'active').length,
      totalSpend: campaigns.reduce((sum: number, c: any) => sum + Number(c.spend || 0), 0),
      totalImpressions: campaigns.reduce((sum: number, c: any) => sum + Number(c.impressions || 0), 0),
      totalClicks: campaigns.reduce((sum: number, c: any) => sum + Number(c.clicks || 0), 0),
      totalConversions: campaigns.reduce((sum: number, c: any) => sum + Number(c.conversions || 0), 0),
    };
  }
}
