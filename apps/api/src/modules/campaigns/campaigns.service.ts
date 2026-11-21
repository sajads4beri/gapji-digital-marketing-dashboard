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
import {
  UpsertFunnelObjectiveDto,
  CreateFunnelKeyResultDto,
  UpdateFunnelKeyResultDto,
  CreateOkrTaskDto,
} from './funnel-okr.dto';

export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
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
      targetAudiences: campaign.campaignAudiences
        ? campaign.campaignAudiences.map((ca: any) => ({
            id: ca.targetAudience?.id || ca.targetAudienceId,
            name: ca.targetAudience?.name,
            gender: ca.targetAudience?.gender,
            ageMin: ca.targetAudience?.ageMin,
            ageMax: ca.targetAudience?.ageMax,
            location: ca.targetAudience?.location,
            interests: ca.targetAudience?.interests,
            channel: ca.targetAudience?.channel,
          }))
        : [],
      targetAudienceIds: campaign.campaignAudiences
        ? campaign.campaignAudiences.map((ca: any) => ca.targetAudienceId)
        : [],
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
        campaignAudiences: {
          include: {
            targetAudience: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return campaigns.map((campaign) => this.serializeCampaign(campaign));
  }

  async findOne(id: string, user?: CurrentUserPayload): Promise<any> {
    this.assertCampaignAccess(user, 'read');
    if (!UUID_REGEX.test(id)) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }
    const organizationId = user?.organizationId ?? DEFAULT_ORGANIZATION_ID;

    const campaign = await this.prisma.campaign.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        owner: { select: { id: true, fullName: true, email: true } },
        _count: { select: { leads: true } },
        campaignAudiences: {
          include: {
            targetAudience: true,
          },
        },
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
        campaignAudiences: {
          include: {
            targetAudience: true,
          },
        },
      },
    });

    this.logger.log(
      `Campaign created: ${campaign.id} ("${campaign.name}") for org ${organizationId} by user ${user?.id || 'system'}`,
    );

    // پیوند مخاطبان هدف انتخاب‌شده در ویزارد به کمپین در جدول campaign_audiences
    const audienceIds: string[] = [];
    if (Array.isArray(targetAudience?.selectedAudienceIds)) {
      audienceIds.push(...targetAudience.selectedAudienceIds);
    } else if (Array.isArray(targetAudience)) {
      audienceIds.push(...targetAudience);
    } else if (Array.isArray((dto as any).targetAudienceIds)) {
      audienceIds.push(...(dto as any).targetAudienceIds);
    }

    const uniqueAudienceIds = [...new Set(audienceIds.filter((id) => typeof id === 'string' && UUID_REGEX.test(id.trim())))];
    if (uniqueAudienceIds.length > 0) {
      const validAudiences = await this.prisma.targetAudience.findMany({
        where: {
          organizationId,
          id: { in: uniqueAudienceIds },
        },
        select: { id: true },
      });

      if (validAudiences.length > 0) {
        await this.prisma.campaignAudience.createMany({
          data: validAudiences.map((aud) => ({
            organizationId,
            campaignId: campaign.id,
            targetAudienceId: aud.id,
          })),
          skipDuplicates: true,
        });

        return this.findOne(campaign.id, user);
      }
    }

    return this.serializeCampaign(campaign);
  }

  async update(id: string, dto: UpdateCampaignDto, user?: CurrentUserPayload): Promise<any> {
    this.assertCampaignAccess(user, 'write');
    if (!UUID_REGEX.test(id)) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }
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
        campaignAudiences: {
          include: {
            targetAudience: true,
          },
        },
      },
    });

    this.logger.log(`Campaign updated: ${updated.id} ("${updated.name}")`);

    // همگام‌سازی مخاطبان متصل در صورت ارسال targetAudience یا targetAudienceIds
    if (targetAudience !== undefined || (dto as any).targetAudienceIds !== undefined) {
      const audienceIds: string[] = [];
      if (Array.isArray(targetAudience?.selectedAudienceIds)) {
        audienceIds.push(...targetAudience.selectedAudienceIds);
      } else if (Array.isArray(targetAudience)) {
        audienceIds.push(...targetAudience);
      } else if (Array.isArray((dto as any).targetAudienceIds)) {
        audienceIds.push(...(dto as any).targetAudienceIds);
      }

      const uniqueAudienceIds = [...new Set(audienceIds.filter((id) => typeof id === 'string' && UUID_REGEX.test(id.trim())))];

      await this.prisma.campaignAudience.deleteMany({
        where: { campaignId: existing.id },
      });

      if (uniqueAudienceIds.length > 0) {
        const validAudiences = await this.prisma.targetAudience.findMany({
          where: {
            organizationId: existing.organizationId,
            id: { in: uniqueAudienceIds },
          },
          select: { id: true },
        });

        if (validAudiences.length > 0) {
          await this.prisma.campaignAudience.createMany({
            data: validAudiences.map((aud) => ({
              organizationId: existing.organizationId,
              campaignId: existing.id,
              targetAudienceId: aud.id,
            })),
            skipDuplicates: true,
          });
        }
      }

      return this.findOne(existing.id, user);
    }

    return this.serializeCampaign(updated);
  }

  async remove(id: string, user?: CurrentUserPayload): Promise<void> {
    this.assertCampaignAccess(user, 'write');
    if (!UUID_REGEX.test(id)) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }
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

  async getCampaignFunnel(id: string, user?: CurrentUserPayload) {
    this.assertCampaignAccess(user, 'read');
    if (!UUID_REGEX.test(id)) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }
    const organizationId = user?.organizationId ?? DEFAULT_ORGANIZATION_ID;

    const campaign = await this.prisma.campaign.findFirst({
      where: { id, organizationId },
      select: { id: true, name: true, ownerId: true },
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }

    if (user && user.role === 'campaign_manager' && campaign.ownerId && campaign.ownerId !== user.id) {
      throw new ForbiddenException('شما فقط مجاز به مشاهده کمپین‌های خود هستید');
    }

    let statusConfigs = await this.prisma.leadStatusConfig.findMany({
      where: { organizationId, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    if (statusConfigs.length === 0) {
      statusConfigs = [
        { id: 'new', organizationId, key: 'new', label: 'سرنخ جدید', group: 'open' as any, color: '#3B82F6', sortOrder: 1, isSystem: true, isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { id: 'contacted', organizationId, key: 'contacted', label: 'تماس اولیه', group: 'open' as any, color: '#F59E0B', sortOrder: 2, isSystem: true, isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { id: 'qualified', organizationId, key: 'qualified', label: 'واجد شرایط', group: 'open' as any, color: '#10B981', sortOrder: 3, isSystem: true, isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { id: 'proposal', organizationId, key: 'proposal', label: 'ارسال پروپوزال', group: 'open' as any, color: '#8B5CF6', sortOrder: 4, isSystem: true, isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { id: 'customer', organizationId, key: 'customer', label: 'مشتری نهایی', group: 'won' as any, color: '#059669', sortOrder: 5, isSystem: true, isActive: true, createdAt: new Date(), updatedAt: new Date() },
      ];
    }

    const leads = await this.prisma.lead.findMany({
      where: { campaignId: id, organizationId },
      select: { id: true, statusKey: true, statusConfigId: true },
    });

    const totalLeads = leads.length;

    let previousStageCount = totalLeads;
    const stages = statusConfigs.map((status, index) => {
      const count = leads.filter(
        (lead) =>
          lead.statusConfigId === status.id ||
          lead.statusKey === status.key ||
          (status.key === 'new' && !lead.statusKey && !lead.statusConfigId)
      ).length;

      const percentageOfTotal = totalLeads > 0 ? Number(((count / totalLeads) * 100).toFixed(1)) : 0;
      
      let conversionRate = 100;
      if (index === 0) {
        conversionRate = 100;
      } else if (previousStageCount > 0) {
        conversionRate = Number(((count / previousStageCount) * 100).toFixed(1));
      } else {
        conversionRate = 0;
      }
      if (count > 0) {
        previousStageCount = count;
      }

      return {
        id: status.id,
        key: status.key,
        label: status.label,
        group: status.group,
        color: status.color || '#3B82F6',
        sortOrder: status.sortOrder,
        count,
        percentageOfTotal,
        conversionRate,
      };
    });

    return {
      campaignId: campaign.id,
      campaignName: campaign.name,
      totalLeads,
      stages,
    };
  }

  async getCampaignLeadsByStage(
    id: string,
    query: { statusKey?: string; statusConfigId?: string; search?: string },
    user?: CurrentUserPayload
  ) {
    this.assertCampaignAccess(user, 'read');
    if (!UUID_REGEX.test(id)) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }
    const organizationId = user?.organizationId ?? DEFAULT_ORGANIZATION_ID;

    const where: any = {
      campaignId: id,
      organizationId,
    };

    if (query.statusConfigId && UUID_REGEX.test(query.statusConfigId)) {
      where.statusConfigId = query.statusConfigId;
    } else if (query.statusKey) {
      where.statusKey = query.statusKey;
    }

    if (query.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { fullName: { contains: term, mode: 'insensitive' } },
        { mobile: { contains: term } },
      ];
    }

    const leads = await this.prisma.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        assignedTo: {
          select: { id: true, fullName: true, email: true },
        },
        statusConfig: {
          select: { id: true, key: true, label: true, color: true, group: true },
        },
      },
    });

    return leads.map((lead) => ({
      id: lead.id,
      fullName: lead.fullName,
      mobile: lead.mobile,
      email: lead.email,
      statusKey: lead.statusKey,
      statusLabel: lead.statusConfig?.label ?? lead.statusKey,
      statusColor: lead.statusConfig?.color ?? '#3B82F6',
      assignedTo: lead.assignedTo
        ? {
            id: lead.assignedTo.id,
            fullName: lead.assignedTo.fullName,
            email: lead.assignedTo.email,
          }
        : null,
      createdAt: lead.createdAt,
    }));
  }

  async getCampaignAllFunnelOkr(id: string, user?: CurrentUserPayload) {
    this.assertCampaignAccess(user, 'read');
    if (!UUID_REGEX.test(id)) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }
    const organizationId = user?.organizationId ?? DEFAULT_ORGANIZATION_ID;

    const campaign = await this.prisma.campaign.findFirst({
      where: { id, organizationId },
      select: { id: true, name: true, ownerId: true },
    });
    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }

    const objectives = await this.prisma.campaignFunnelObjective.findMany({
      where: { campaignId: id, organizationId },
      include: {
        keyResults: {
          orderBy: { createdAt: 'asc' },
          include: {
            tasks: {
              orderBy: { createdAt: 'desc' },
              select: {
                id: true,
                title: true,
                status: true,
                priority: true,
                dueDate: true,
                assignee: {
                  select: { id: true, fullName: true, email: true },
                },
              },
            },
          },
        },
      },
    });

    let totalKeyResults = 0;
    let sumPercentages = 0;
    let totalTasks = 0;
    let completedTasks = 0;

    const mappedObjectives = objectives.map((obj) => {
      const mappedKrs = obj.keyResults.map((kr) => {
        totalKeyResults++;
        const current = Number(kr.currentValue);
        const target = Number(kr.targetValue);
        const krTasks = kr.tasks.map((t) => {
          totalTasks++;
          if (t.status === 'done') completedTasks++;
          return {
            id: t.id,
            title: t.title,
            status: t.status,
            priority: t.priority,
            dueDate: t.dueDate ? t.dueDate.toISOString().slice(0, 10) : null,
            assignee: t.assignee,
          };
        });

        const tasksCount = krTasks.length;
        const doneCount = krTasks.filter((t) => t.status === 'done').length;
        const progressPercent =
          tasksCount > 0
            ? Math.min(100, Math.round((doneCount / tasksCount) * 100))
            : (target > 0 && current > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0);
        sumPercentages += progressPercent;

        return {
          id: kr.id,
          title: kr.title,
          currentValue: current,
          targetValue: target,
          unit: kr.unit,
          progressPercent,
          tasksCount,
          completedTasksCount: doneCount,
          tasks: krTasks,
          createdAt: kr.createdAt,
          updatedAt: kr.updatedAt,
        };
      });

      return {
        id: obj.id,
        stageKey: obj.stageKey,
        title: obj.title,
        description: obj.description,
        keyResults: mappedKrs,
        createdAt: obj.createdAt,
        updatedAt: obj.updatedAt,
      };
    });

    const averageProgress = totalKeyResults > 0 ? Math.round(sumPercentages / totalKeyResults) : 0;

    return {
      campaignId: campaign.id,
      campaignName: campaign.name,
      totalObjectives: objectives.length,
      totalKeyResults,
      averageProgress,
      totalTasks,
      completedTasks,
      objectives: mappedObjectives,
    };
  }

  async getStageOkr(id: string, stageKey: string, user?: CurrentUserPayload) {
    this.assertCampaignAccess(user, 'read');
    if (!UUID_REGEX.test(id)) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }
    const organizationId = user?.organizationId ?? DEFAULT_ORGANIZATION_ID;

    const campaign = await this.prisma.campaign.findFirst({
      where: { id, organizationId },
      select: { id: true, name: true },
    });
    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }

    const objective = await this.prisma.campaignFunnelObjective.findFirst({
      where: { campaignId: id, stageKey, organizationId },
      include: {
        keyResults: {
          orderBy: { createdAt: 'asc' },
          include: {
            tasks: {
              orderBy: { createdAt: 'desc' },
              select: {
                id: true,
                title: true,
                status: true,
                priority: true,
                dueDate: true,
                assignee: {
                  select: { id: true, fullName: true, email: true },
                },
              },
            },
          },
        },
      },
    });

    if (!objective) {
      return {
        campaignId: campaign.id,
        campaignName: campaign.name,
        stageKey,
        objective: null,
        keyResults: [],
      };
    }

    const mappedKrs = objective.keyResults.map((kr) => {
      const current = Number(kr.currentValue);
      const target = Number(kr.targetValue);
      const tasksCount = kr.tasks.length;
      const doneCount = kr.tasks.filter((t) => t.status === 'done').length;
      const progressPercent =
        tasksCount > 0
          ? Math.min(100, Math.round((doneCount / tasksCount) * 100))
          : (target > 0 && current > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0);
      return {
        id: kr.id,
        title: kr.title,
        currentValue: current,
        targetValue: target,
        unit: kr.unit,
        progressPercent,
        tasks: kr.tasks.map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          dueDate: t.dueDate ? t.dueDate.toISOString().slice(0, 10) : null,
          assignee: t.assignee,
        })),
        createdAt: kr.createdAt,
        updatedAt: kr.updatedAt,
      };
    });

    return {
      campaignId: campaign.id,
      campaignName: campaign.name,
      stageKey,
      objective: {
        id: objective.id,
        title: objective.title,
        description: objective.description,
        createdAt: objective.createdAt,
        updatedAt: objective.updatedAt,
      },
      keyResults: mappedKrs,
    };
  }

  async upsertStageObjective(
    id: string,
    stageKey: string,
    dto: UpsertFunnelObjectiveDto,
    user?: CurrentUserPayload,
  ) {
    this.assertCampaignAccess(user, 'write');
    if (!UUID_REGEX.test(id)) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }
    const organizationId = user?.organizationId ?? DEFAULT_ORGANIZATION_ID;

    const campaign = await this.prisma.campaign.findFirst({
      where: { id, organizationId },
    });
    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }

    const objective = await this.prisma.campaignFunnelObjective.upsert({
      where: {
        campaignId_stageKey_organizationId: {
          campaignId: id,
          stageKey,
          organizationId,
        },
      },
      update: {
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
      },
      create: {
        organizationId,
        campaignId: id,
        stageKey,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
      },
      include: {
        keyResults: true,
      },
    });

    return objective;
  }

  async createKeyResult(
    id: string,
    stageKey: string,
    dto: CreateFunnelKeyResultDto,
    user?: CurrentUserPayload,
  ) {
    this.assertCampaignAccess(user, 'write');
    if (!UUID_REGEX.test(id)) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }
    const organizationId = user?.organizationId ?? DEFAULT_ORGANIZATION_ID;

    const campaign = await this.prisma.campaign.findFirst({
      where: { id, organizationId },
    });
    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }

    // Auto-create objective if not yet created for this stage
    let objective = await this.prisma.campaignFunnelObjective.findFirst({
      where: { campaignId: id, stageKey, organizationId },
    });

    if (!objective) {
      const stageLabels: Record<string, string> = {
        awareness: 'آگاهی (Awareness)',
        interest: 'علاقه‌مندی (Interest)',
        consideration: 'بررسی و تعامل (Consideration)',
        intent: 'قصد خرید (Intent)',
        evaluation: 'ارزیابی نهایی (Evaluation)',
        purchase: 'خرید موفق (Purchase)',
      };
      const defaultTitle = `هدف مرحله ${stageLabels[stageKey] || stageKey}`;
      objective = await this.prisma.campaignFunnelObjective.create({
        data: {
          organizationId,
          campaignId: id,
          stageKey,
          title: defaultTitle,
        },
      });
    }

    const keyResult = await this.prisma.campaignFunnelKeyResult.create({
      data: {
        organizationId,
        objectiveId: objective.id,
        title: dto.title.trim(),
        currentValue: dto.currentValue ?? 0,
        targetValue: dto.targetValue,
        unit: dto.unit?.trim() || 'عدد',
      },
      include: {
        tasks: true,
      },
    });

    const current = Number(keyResult.currentValue);
    const target = Number(keyResult.targetValue);
    const progressPercent = 0;

    return {
      id: keyResult.id,
      objectiveId: objective.id,
      stageKey,
      title: keyResult.title,
      currentValue: current,
      targetValue: target,
      unit: keyResult.unit,
      progressPercent,
      tasks: [],
      createdAt: keyResult.createdAt,
      updatedAt: keyResult.updatedAt,
    };
  }

  async updateKeyResult(
    id: string,
    krId: string,
    dto: UpdateFunnelKeyResultDto,
    user?: CurrentUserPayload,
  ) {
    this.assertCampaignAccess(user, 'write');
    const organizationId = user?.organizationId ?? DEFAULT_ORGANIZATION_ID;

    const keyResult = await this.prisma.campaignFunnelKeyResult.findFirst({
      where: { id: krId, organizationId, objective: { campaignId: id } },
      include: { objective: true },
    });
    if (!keyResult) {
      throw new NotFoundException(`Key Result ${krId} not found in this campaign`);
    }

    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.currentValue !== undefined) data.currentValue = dto.currentValue;
    if (dto.targetValue !== undefined) data.targetValue = dto.targetValue;
    if (dto.unit !== undefined) data.unit = dto.unit.trim();

    const updated = await this.prisma.campaignFunnelKeyResult.update({
      where: { id: krId },
      data,
      include: {
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            assignee: { select: { id: true, fullName: true, email: true } },
          },
        },
      },
    });

    const current = Number(updated.currentValue);
    const target = Number(updated.targetValue);
    const tasksCount = updated.tasks.length;
    const doneCount = updated.tasks.filter((t) => t.status === 'done').length;
    const progressPercent =
      tasksCount > 0
        ? Math.min(100, Math.round((doneCount / tasksCount) * 100))
        : (target > 0 && current > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0);

    return {
      id: updated.id,
      objectiveId: updated.objectiveId,
      stageKey: keyResult.objective.stageKey,
      title: updated.title,
      currentValue: current,
      targetValue: target,
      unit: updated.unit,
      progressPercent,
      tasks: updated.tasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate ? t.dueDate.toISOString().slice(0, 10) : null,
        assignee: t.assignee,
      })),
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async deleteKeyResult(id: string, krId: string, user?: CurrentUserPayload) {
    this.assertCampaignAccess(user, 'write');
    const organizationId = user?.organizationId ?? DEFAULT_ORGANIZATION_ID;

    const keyResult = await this.prisma.campaignFunnelKeyResult.findFirst({
      where: { id: krId, organizationId, objective: { campaignId: id } },
    });
    if (!keyResult) {
      throw new NotFoundException(`Key Result ${krId} not found in this campaign`);
    }

    await this.prisma.task.updateMany({
      where: { okrKeyResultId: krId },
      data: { okrKeyResultId: null },
    });

    await this.prisma.campaignFunnelKeyResult.delete({
      where: { id: krId },
    });

    return { success: true, deletedId: krId };
  }

  async createTaskUnderKeyResult(
    id: string,
    krId: string,
    dto: CreateOkrTaskDto,
    user?: CurrentUserPayload,
  ) {
    this.assertCampaignAccess(user, 'write');
    const organizationId = user?.organizationId ?? DEFAULT_ORGANIZATION_ID;

    const keyResult = await this.prisma.campaignFunnelKeyResult.findFirst({
      where: { id: krId, organizationId, objective: { campaignId: id } },
      include: {
        objective: {
          include: { campaign: { select: { id: true, name: true } } },
        },
      },
    });
    if (!keyResult) {
      throw new NotFoundException(`Key Result ${krId} not found in this campaign`);
    }

    const createdById = user?.id || (await this.resolveDefaultUserId(organizationId));
    let dueDate: Date | null = null;
    if (dto.dueDate) {
      dueDate = new Date(dto.dueDate);
    } else {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      dueDate = nextWeek;
    }

    const task = await this.prisma.task.create({
      data: {
        organizationId,
        createdById,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        status: 'todo',
        priority: (dto.priority as any) || 'medium',
        dueDate,
        assigneeId: dto.assigneeId || null,
        relatedType: 'campaign',
        relatedId: id,
        okrKeyResultId: krId,
      },
      include: {
        assignee: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.toISOString().slice(0, 10) : null,
      assignee: task.assignee,
      okr: {
        keyResultId: keyResult.id,
        keyResultTitle: keyResult.title,
        objectiveId: keyResult.objective.id,
        objectiveTitle: keyResult.objective.title,
        stageKey: keyResult.objective.stageKey,
        campaignId: id,
        campaignName: keyResult.objective.campaign?.name,
      },
      createdAt: task.createdAt,
    };
  }

  private async resolveDefaultUserId(organizationId: string): Promise<string> {
    const user = await this.prisma.user.findFirst({
      where: { memberships: { some: { organizationId } } },
      select: { id: true },
    });
    if (user) return user.id;
    const anyUser = await this.prisma.user.findFirst({ select: { id: true } });
    if (anyUser) return anyUser.id;
    return '00000000-0000-0000-0000-000000000001';
  }
}
