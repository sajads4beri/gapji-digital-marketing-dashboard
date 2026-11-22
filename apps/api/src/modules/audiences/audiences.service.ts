import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateAudienceDto } from './dto/create-audience.dto';
import { UpdateAudienceDto } from './dto/update-audience.dto';
import { AudienceQueryDto } from './dto/audience-query.dto';

export interface CurrentUserPayload {
  id: string;
  email?: string;
  role: string;
  organizationId: string;
}

@Injectable()
export class AudiencesService {
  private readonly logger = new Logger(AudiencesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * کنترل دسترسی نقشی بر مبنای سند رسمی محصول (REQ-23 / p. 13)
   * فقط مدیر مارکتینگ و مدیر ارشد (Admin) دسترسی مدیریت دارند.
   * مدیر کمپین جهت انتخاب در ویزارد دسترسی فقط‌خواندنی دارد.
   */
  private assertAccess(user?: CurrentUserPayload, action: 'read' | 'write' = 'read') {
    if (!user) return; // در صورت اجرای تست‌های مستقیم داخلی بدون گارد

    const allowedRoles = action === 'write'
      ? ['admin', 'marketing_manager']
      : ['admin', 'marketing_manager', 'campaign_manager'];

    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenException(
        `نقش شما (${user.role}) مجوز ${action === 'write' ? 'ویرایش یا ثبت' : 'مشاهده'} مخاطبان را ندارد (PRD ص ۱۳).`,
      );
    }
  }

  /**
   * دریافت فهرست مخاطبان سازمان با فیلترها و شمارنده کمپین‌های متصل
   */
  async findAll(query: AudienceQueryDto, user?: CurrentUserPayload) {
    this.assertAccess(user, 'read');
    const organizationId = user?.organizationId || '00000000-0000-0000-0000-000000000001';

    const where: any = { organizationId };

    if (query.search && query.search.trim()) {
      const s = query.search.trim();
      where.OR = [
        { name: { contains: s, mode: 'insensitive' } },
        { location: { contains: s, mode: 'insensitive' } },
        { interests: { contains: s, mode: 'insensitive' } },
        { channel: { contains: s, mode: 'insensitive' } },
      ];
    }

    if (query.gender && query.gender !== 'all') {
      where.gender = query.gender;
    }

    if (query.channel && query.channel !== 'all') {
      where.channel = { contains: query.channel, mode: 'insensitive' };
    }

    const [total, audiences] = await Promise.all([
      this.prisma.targetAudience.count({ where }),
      this.prisma.targetAudience.findMany({
        where,
        include: {
          _count: {
            select: { campaigns: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: query.limit || 50,
        skip: ((query.page || 1) - 1) * (query.limit || 50),
      }),
    ]);

    const items = audiences.map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      ageMin: a.ageMin,
      ageMax: a.ageMax,
      gender: a.gender || 'all',
      location: a.location,
      interests: a.interests,
      channel: a.channel,
      campaignsCount: a._count.campaigns,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    }));

    return {
      items,
      total,
      page: query.page || 1,
      limit: query.limit || 50,
      totalPages: Math.ceil(total / (query.limit || 50)) || 1,
    };
  }

  /**
   * دریافت جزئیات یک مخاطب به همراه جدول عملکرد کمپین‌های استفاده‌کننده (PRD ص ۱۴)
   */
  async findOne(id: string, user?: CurrentUserPayload) {
    this.assertAccess(user, 'read');
    const organizationId = user?.organizationId || '00000000-0000-0000-0000-000000000001';

    const audience = await this.prisma.targetAudience.findFirst({
      where: { id, organizationId },
      include: {
        campaigns: {
          include: {
            campaign: {
              select: {
                id: true,
                name: true,
                status: true,
                channel: true,
                budget: true,
                startDate: true,
                endDate: true,
                leads: { select: { id: true } },
                costs: { select: { amount: true } },
              },
            },
          },
        },
      },
    });

    if (!audience) {
      throw new NotFoundException(`مخاطب با شناسه ${id} در این سازمان یافت نشد.`);
    }

    // استخراج جدول کمپین‌های استفاده‌کننده طبق نیازمندی ص ۱۴ سند محصول:
    // (نام، هزینه، لید، CPL، نرخ تبدیل)
    const connectedCampaigns = audience.campaigns.map((ca) => {
      const camp = ca.campaign;
      const spend = camp.costs.reduce((sum, c) => sum + Number(c.amount || 0), 0);
      const leadsCount = camp.leads.length;
      const cpl = leadsCount > 0 ? Math.round(spend / leadsCount) : 0;
      // نرخ تبدیل تقریبی بر مبنای لید به بودجه یا مقدار پیش‌فرض
      const conversionRate = spend > 0 && leadsCount > 0
        ? Number(((leadsCount / (spend / 10000)) * 100).toFixed(1))
        : 0;

      return {
        id: camp.id,
        campaignId: camp.id,
        name: camp.name,
        status: camp.status,
        channel: camp.channel,
        budget: Number(camp.budget || 0),
        spend,
        leadsCount,
        cpl,
        conversionRate,
        linkedAt: ca.createdAt,
      };
    });

    return {
      id: audience.id,
      name: audience.name,
      description: audience.description,
      ageMin: audience.ageMin,
      ageMax: audience.ageMax,
      gender: audience.gender || 'all',
      location: audience.location,
      interests: audience.interests,
      channel: audience.channel,
      campaignsCount: connectedCampaigns.length,
      connectedCampaigns,
      campaigns: connectedCampaigns,
      createdAt: audience.createdAt,
      updatedAt: audience.updatedAt,
    };
  }

  /**
   * ایجاد مخاطب جدید در سازمان
   */
  async create(dto: CreateAudienceDto, user?: CurrentUserPayload) {
    this.assertAccess(user, 'write');
    const organizationId = user?.organizationId || '00000000-0000-0000-0000-000000000001';

    const created = await this.prisma.targetAudience.create({
      data: {
        organizationId,
        name: dto.name.trim(),
        description: dto.description ? dto.description.trim() : null,
        ageMin: dto.ageMin ?? null,
        ageMax: dto.ageMax ?? null,
        gender: dto.gender || 'all',
        location: dto.location ? dto.location.trim() : null,
        interests: dto.interests ? dto.interests.trim() : null,
        channel: dto.channel ? dto.channel.trim() : null,
      },
    });

    this.logger.log(`Audience created: ${created.id} ("${created.name}") for org ${organizationId}`);

    return {
      id: created.id,
      name: created.name,
      description: created.description,
      ageMin: created.ageMin,
      ageMax: created.ageMax,
      gender: created.gender,
      location: created.location,
      interests: created.interests,
      channel: created.channel,
      campaignsCount: 0,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  }

  /**
   * ویرایش مشخصات مخاطب
   */
  async update(id: string, dto: UpdateAudienceDto, user?: CurrentUserPayload) {
    this.assertAccess(user, 'write');
    const organizationId = user?.organizationId || '00000000-0000-0000-0000-000000000001';

    const existing = await this.prisma.targetAudience.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new NotFoundException(`مخاطب با شناسه ${id} یافت نشد.`);
    }

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.description !== undefined) data.description = dto.description ? dto.description.trim() : null;
    if (dto.ageMin !== undefined) data.ageMin = dto.ageMin;
    if (dto.ageMax !== undefined) data.ageMax = dto.ageMax;
    if (dto.gender !== undefined) data.gender = dto.gender;
    if (dto.location !== undefined) data.location = dto.location ? dto.location.trim() : null;
    if (dto.interests !== undefined) data.interests = dto.interests ? dto.interests.trim() : null;
    if (dto.channel !== undefined) data.channel = dto.channel ? dto.channel.trim() : null;

    const updated = await this.prisma.targetAudience.update({
      where: { id },
      data,
      include: {
        _count: { select: { campaigns: true } },
      },
    });

    this.logger.log(`Audience updated: ${updated.id} ("${updated.name}")`);

    return {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      ageMin: updated.ageMin,
      ageMax: updated.ageMax,
      gender: updated.gender,
      location: updated.location,
      interests: updated.interests,
      channel: updated.channel,
      campaignsCount: updated._count.campaigns,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  /**
   * کپی کردن مخاطب (Duplicate/Clone) مطابق نیازمندی ص ۱۴ سند محصول
   */
  async duplicate(id: string, user?: CurrentUserPayload) {
    this.assertAccess(user, 'write');
    const organizationId = user?.organizationId || '00000000-0000-0000-0000-000000000001';

    const original = await this.prisma.targetAudience.findFirst({
      where: { id, organizationId },
    });

    if (!original) {
      throw new NotFoundException(`مخاطب با شناسه ${id} جهت کپی یافت نشد.`);
    }

    const duplicated = await this.prisma.targetAudience.create({
      data: {
        organizationId,
        name: `کپی از ${original.name}`,
        description: original.description,
        ageMin: original.ageMin,
        ageMax: original.ageMax,
        gender: original.gender,
        location: original.location,
        interests: original.interests,
        channel: original.channel,
      },
    });

    this.logger.log(`Audience duplicated: ${duplicated.id} from original ${id}`);

    return {
      id: duplicated.id,
      name: duplicated.name,
      description: duplicated.description,
      ageMin: duplicated.ageMin,
      ageMax: duplicated.ageMax,
      gender: duplicated.gender,
      location: duplicated.location,
      interests: duplicated.interests,
      channel: duplicated.channel,
      campaignsCount: 0,
      createdAt: duplicated.createdAt,
      updatedAt: duplicated.updatedAt,
    };
  }

  /**
   * حذف مخاطب — با اعمال شرط صریح سند محصول:
   * «حذف (فقط اگر استفاده نشده)» — p. 14
   */
  async delete(id: string, user?: CurrentUserPayload) {
    this.assertAccess(user, 'write');
    const organizationId = user?.organizationId || '00000000-0000-0000-0000-000000000001';

    const audience = await this.prisma.targetAudience.findFirst({
      where: { id, organizationId },
      include: {
        _count: { select: { campaigns: true } },
      },
    });

    if (!audience) {
      throw new NotFoundException(`مخاطب با شناسه ${id} یافت نشد.`);
    }

    if (audience._count.campaigns > 0) {
      throw new BadRequestException(
        `این مخاطب در ${audience._count.campaigns} کمپین استفاده شده است و طبق سند محصول (ص ۱۴) امکان حذف آن وجود ندارد.`,
      );
    }

    await this.prisma.targetAudience.delete({ where: { id } });
    this.logger.log(`Audience deleted: ${id} ("${audience.name}")`);

    return { success: true, message: `مخاطب «${audience.name}» با موفقیت حذف گردید.` };
  }
}
