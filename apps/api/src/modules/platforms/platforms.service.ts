import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreatePlatformDto } from './dto/create-platform.dto';
import { UpdatePlatformDto } from './dto/update-platform.dto';
import { PlatformQueryDto } from './dto/platform-query.dto';
import { PlatformInputDefinitionDto } from './dto/platform-input-definition.dto';
import { PlatformOutputColumnDto } from './dto/platform-output-column.dto';
import {
  PREDEFINED_PLATFORM_TEMPLATES,
  PredefinedPlatformTemplate,
} from './constants/platform-templates';
import { Platform, PlatformRetrievalMethod, CampaignStatus } from '@prisma/client';

export interface CurrentUserPayload {
  id: string;
  email: string;
  organizationId: string | null;
  role: string;
}

const DEFAULT_ORGANIZATION_ID = '00000000-0000-0000-0000-000000000001';

export interface PlatformWithDetails extends Platform {
  activeCampaignsCount: number;
  totalCampaignsCount: number;
  inputs: PlatformInputDefinitionDto[];
  outputs: PlatformOutputColumnDto[];
}

@Injectable()
export class PlatformsService {
  private readonly logger = new Logger(PlatformsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * کنترل سخت‌گیرانه دسترسی نقشی طبق سند محصول (REQ-19, p. 11):
   * تنها نقش‌های admin و marketing_manager مجاز به دسترسی به پلتفرم‌ها هستند.
   */
  private enforceRoleAccess(user: CurrentUserPayload, mode: 'read' | 'write' = 'read') {
    if (!user || !user.role) {
      throw new ForbiddenException('اطلاعات احراز هویت یا نقش کاربر یافت نشد');
    }

    const allowedRoles = ['admin', 'owner', 'marketing_manager'];
    if (!allowedRoles.includes(user.role)) {
      this.logger.warn(`User ${user.id} with role ${user.role} denied ${mode} access to Platforms module`);
      throw new ForbiddenException('تنها مدیران ارشد و مدیران مارکتینگ به ماژول پلتفرم‌ها دسترسی دارند');
    }
  }

  private resolveOrgId(user: CurrentUserPayload): string {
    return user.organizationId || DEFAULT_ORGANIZATION_ID;
  }

  /**
   * دریافت فهرست قالب‌های آماده پلتفرم
   */
  getTemplates(): PredefinedPlatformTemplate[] {
    return PREDEFINED_PLATFORM_TEMPLATES;
  }

  /**
   * دریافت فهرست تمام پلتفرم‌های سازمان جاری همراه با تعداد کمپین‌های فعال، ورودی‌ها و خروجی‌ها
   */
  async findAll(query: PlatformQueryDto, user: CurrentUserPayload): Promise<PlatformWithDetails[]> {
    this.enforceRoleAccess(user, 'read');
    const organizationId = this.resolveOrgId(user);

    const where: any = { organizationId };

    if (query.status === 'active') {
      where.isActive = true;
    } else if (query.status === 'inactive') {
      where.isActive = false;
    }

    if (query.category) {
      where.category = query.category;
    }

    if (query.retrievalMethod) {
      where.retrievalMethod = query.retrievalMethod;
    }

    if (query.search) {
      const q = query.search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { code: { contains: q, mode: 'insensitive' } },
      ];
    }

    const platforms = await this.prisma.platform.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // بارگذاری فیلدهای ورودی و خروجی از دیتابیس بدون نیاز به تغییر اسکیمای اصلی
    const taxonomies = await this.prisma.organizationTaxonomy.findMany({
      where: {
        organizationId,
        taxonomyType: { in: ['platform_input', 'platform_output'] },
      },
      orderBy: { sortOrder: 'asc' },
    });

    const result: PlatformWithDetails[] = [];

    for (const p of platforms) {
      const counts = await this.calculatePlatformCampaignUsage(p.id, p.code, organizationId);
      const inputs = this.extractInputsForPlatform(p.id, taxonomies);
      const outputs = this.extractOutputsForPlatform(p.id, taxonomies);

      result.push({
        ...p,
        activeCampaignsCount: counts.activeCount,
        totalCampaignsCount: counts.totalCount,
        inputs,
        outputs,
      });
    }

    return result;
  }

  /**
   * دریافت مشخصات یک پلتفرم خاص به همراه آمار دقیق کمپین‌های مرتبط
   */
  async findOne(id: string, user: CurrentUserPayload): Promise<PlatformWithDetails> {
    this.enforceRoleAccess(user, 'read');
    const organizationId = this.resolveOrgId(user);

    const platform = await this.prisma.platform.findFirst({
      where: { id, organizationId },
    });

    if (!platform) {
      throw new NotFoundException(`پلتفرم با شناسه ${id} در این سازمان یافت نشد`);
    }

    const taxonomies = await this.prisma.organizationTaxonomy.findMany({
      where: {
        organizationId,
        taxonomyType: { in: ['platform_input', 'platform_output'] },
        key: { startsWith: `${id}:` },
      },
      orderBy: { sortOrder: 'asc' },
    });

    const counts = await this.calculatePlatformCampaignUsage(platform.id, platform.code, organizationId);
    const inputs = this.extractInputsForPlatform(platform.id, taxonomies);
    const outputs = this.extractOutputsForPlatform(platform.id, taxonomies);

    return {
      ...platform,
      activeCampaignsCount: counts.activeCount,
      totalCampaignsCount: counts.totalCount,
      inputs,
      outputs,
    };
  }

  /**
   * ایجاد پلتفرم جدید (از روی قالب آماده یا با پیکربندی خالی)
   */
  async create(dto: CreatePlatformDto, user: CurrentUserPayload): Promise<PlatformWithDetails> {
    this.enforceRoleAccess(user, 'write');
    const organizationId = this.resolveOrgId(user);

    // در صورت ارسال templateId، تنظیمات پیش‌فرض قالب در صورت عدم ارسال ورودی‌ها پر می‌شوند
    let template: PredefinedPlatformTemplate | undefined;
    if (dto.templateId) {
      template = PREDEFINED_PLATFORM_TEMPLATES.find((t) => t.id === dto.templateId);
    }

    // تولید کد یکتا برای پلتفرم
    let code = (dto.code || template?.code || this.slugify(dto.name)).trim().toLowerCase();
    code = await this.generateUniqueCode(code, organizationId);

    const inputs = dto.inputs && dto.inputs.length > 0
      ? dto.inputs
      : (template?.defaultInputs || []);

    const outputs = dto.outputs && dto.outputs.length > 0
      ? dto.outputs
      : (template?.defaultOutputs || []);

    const platform = await this.prisma.platform.create({
      data: {
        organizationId,
        name: dto.name.trim(),
        code,
        category: dto.category.trim(),
        retrievalMethod: dto.retrievalMethod,
        icon: dto.icon || template?.icon || null,
        isActive: true,
      },
    });

    this.logger.log(`Platform created: ${platform.id} ("${platform.name}") in org ${organizationId}`);

    // ذخیره فیلدهای ورودی و ستون‌های خروجی در organization_taxonomies
    await this.persistInputsAndOutputs(platform.id, organizationId, inputs, outputs);

    return {
      ...platform,
      activeCampaignsCount: 0,
      totalCampaignsCount: 0,
      inputs,
      outputs,
    };
  }

  /**
   * ویرایش مشخصات پلتفرم، فیلدهای ورودی و ستون‌های گزارش
   */
  async update(id: string, dto: UpdatePlatformDto, user: CurrentUserPayload): Promise<PlatformWithDetails> {
    this.enforceRoleAccess(user, 'write');
    const organizationId = this.resolveOrgId(user);

    const existing = await this.prisma.platform.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new NotFoundException(`پلتفرم با شناسه ${id} یافت نشد`);
    }

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.category !== undefined) data.category = dto.category.trim();
    if (dto.retrievalMethod !== undefined) data.retrievalMethod = dto.retrievalMethod;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.icon !== undefined) data.icon = dto.icon;

    const updated = await this.prisma.platform.update({
      where: { id },
      data,
    });

    this.logger.log(`Platform updated: ${updated.id} ("${updated.name}")`);

    // به‌روزرسانی ورودی‌ها و خروجی‌ها در صورت ارسال
    if (dto.inputs !== undefined || dto.outputs !== undefined) {
      const currentInputs = dto.inputs !== undefined
        ? dto.inputs
        : (await this.findOne(id, user)).inputs;

      const currentOutputs = dto.outputs !== undefined
        ? dto.outputs
        : (await this.findOne(id, user)).outputs;

      await this.persistInputsAndOutputs(id, organizationId, currentInputs, currentOutputs);
    }

    return this.findOne(id, user);
  }

  /**
   * غیرفعال‌سازی ایمن پلتفرم بدون حذف داده‌های تاریخی کمپین‌ها و هزینه‌ها
   */
  async deactivate(id: string, user: CurrentUserPayload): Promise<{
    platform: Platform;
    activeCampaignsCount: number;
    message: string;
  }> {
    this.enforceRoleAccess(user, 'write');
    const organizationId = this.resolveOrgId(user);

    const platform = await this.prisma.platform.findFirst({
      where: { id, organizationId },
    });

    if (!platform) {
      throw new NotFoundException(`پلتفرم با شناسه ${id} یافت نشد`);
    }

    const counts = await this.calculatePlatformCampaignUsage(platform.id, platform.code, organizationId);

    const updated = await this.prisma.platform.update({
      where: { id },
      data: { isActive: false },
    });

    this.logger.log(
      `Platform deactivated: ${platform.id} ("${platform.name}"). Was in use by ${counts.activeCount} active campaigns.`,
    );

    return {
      platform: updated,
      activeCampaignsCount: counts.activeCount,
      message: counts.activeCount > 0
        ? `این پلتفرم در ${counts.activeCount} کمپین در حال استفاده است و با موفقیت غیرفعال شد.`
        : 'پلتفرم با موفقیت غیرفعال شد.',
    };
  }

  /**
   * فعال‌سازی مجدد پلتفرم غیرفعال‌شده
   */
  async activate(id: string, user: CurrentUserPayload): Promise<Platform> {
    this.enforceRoleAccess(user, 'write');
    const organizationId = this.resolveOrgId(user);

    const platform = await this.prisma.platform.findFirst({
      where: { id, organizationId },
    });

    if (!platform) {
      throw new NotFoundException(`پلتفرم با شناسه ${id} یافت نشد`);
    }

    const updated = await this.prisma.platform.update({
      where: { id },
      data: { isActive: true },
    });

    this.logger.log(`Platform activated: ${platform.id} ("${platform.name}")`);
    return updated;
  }

  /**
   * دریافت اطلاعات میزان استفاده و کمپین‌های مرتبط با پلتفرم
   */
  async getUsage(id: string, user: CurrentUserPayload): Promise<{
    platformId: string;
    platformName: string;
    activeCampaignsCount: number;
    totalCampaignsCount: number;
    activeCampaigns: Array<{ id: string; name: string; status: string; budget: number }>;
  }> {
    this.enforceRoleAccess(user, 'read');
    const organizationId = this.resolveOrgId(user);

    const platform = await this.prisma.platform.findFirst({
      where: { id, organizationId },
    });

    if (!platform) {
      throw new NotFoundException(`پلتفرم با شناسه ${id} یافت نشد`);
    }

    const campaigns = await this.getCampaignsUsingPlatform(platform.id, platform.code, organizationId);
    const activeCampaigns = campaigns.filter((c) => c.status === CampaignStatus.active);

    return {
      platformId: platform.id,
      platformName: platform.name,
      activeCampaignsCount: activeCampaigns.length,
      totalCampaignsCount: campaigns.length,
      activeCampaigns: activeCampaigns.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        budget: Number(c.budget) || 0,
      })),
    };
  }

  // ==========================================
  // متدهای کمکی و محاسباتی داخلی
  // ==========================================

  /**
   * محاسبه تعداد کمپین‌های فعال و کل کمپین‌های در حال استفاده از پلتفرم
   */
  private async calculatePlatformCampaignUsage(
    platformId: string,
    platformCode: string,
    organizationId: string,
  ): Promise<{ activeCount: number; totalCount: number }> {
    const campaigns = await this.getCampaignsUsingPlatform(platformId, platformCode, organizationId);
    const activeCount = campaigns.filter((c) => c.status === CampaignStatus.active).length;
    return {
      activeCount,
      totalCount: campaigns.length,
    };
  }

  /**
   * استخراج لیست یکتای کمپین‌های متصل به پلتفرم از طریق allocations یا تطابق کانال
   */
  private async getCampaignsUsingPlatform(
    platformId: string,
    platformCode: string,
    organizationId: string,
  ) {
    // ۱. کمپین‌هایی که از طریق تخصیص صریح متصل هستند
    const allocations = await this.prisma.campaignPlatformAllocation.findMany({
      where: {
        platformId,
        organizationId,
      },
      include: {
        campaign: {
          select: { id: true, name: true, status: true, budget: true },
        },
      },
    });

    // ۲. کمپین‌هایی که فیلد channel آن‌ها با کد پلتفرم منطبق است
    const directCampaigns = await this.prisma.campaign.findMany({
      where: {
        organizationId,
        channel: platformCode,
      },
      select: { id: true, name: true, status: true, budget: true },
    });

    // ترکیب و یکتاکردن بر مبنای id
    const map = new Map<string, { id: string; name: string; status: string; budget: any }>();

    for (const a of allocations) {
      if (a.campaign) {
        map.set(a.campaign.id, a.campaign);
      }
    }

    for (const c of directCampaigns) {
      if (!map.has(c.id)) {
        map.set(c.id, c);
      }
    }

    return Array.from(map.values());
  }

  /**
   * ذخیره فیلدهای ورودی و خروجی‌ها در جدول organization_taxonomies
   */
  private async persistInputsAndOutputs(
    platformId: string,
    organizationId: string,
    inputs: PlatformInputDefinitionDto[],
    outputs: PlatformOutputColumnDto[],
  ) {
    // حذف رکوردهای قبلی ورودی و خروجی این پلتفرم
    await this.prisma.organizationTaxonomy.deleteMany({
      where: {
        organizationId,
        taxonomyType: { in: ['platform_input', 'platform_output'] },
        key: { startsWith: `${platformId}:` },
      },
    });

    // ذخیره ورودی‌های جدید
    for (let i = 0; i < inputs.length; i++) {
      const inp = inputs[i];
      const payload = {
        name: inp.name,
        dataType: inp.dataType,
        isRequired: !!inp.isRequired,
      };

      await this.prisma.organizationTaxonomy.create({
        data: {
          organizationId,
          taxonomyType: 'platform_input',
          key: `${platformId}:${inp.key}`,
          label: JSON.stringify(payload).slice(0, 250),
          sortOrder: i,
          isActive: true,
        },
      });
    }

    // ذخیره خروجی‌های جدید
    for (let i = 0; i < outputs.length; i++) {
      const out = outputs[i];
      await this.prisma.organizationTaxonomy.create({
        data: {
          organizationId,
          taxonomyType: 'platform_output',
          key: `${platformId}:${out.key}`,
          label: out.label.slice(0, 250),
          sortOrder: i,
          isActive: true,
        },
      });
    }
  }

  /**
   * استخراج ورودی‌های پلتفرم از رکوردهای تاکسونومی
   */
  private extractInputsForPlatform(
    platformId: string,
    taxonomies: any[],
  ): PlatformInputDefinitionDto[] {
    const prefix = `${platformId}:`;
    return taxonomies
      .filter((t) => t.taxonomyType === 'platform_input' && t.key.startsWith(prefix))
      .map((t) => {
        const fieldKey = t.key.slice(prefix.length);
        try {
          const parsed = JSON.parse(t.label);
          return {
            name: parsed.name || fieldKey,
            key: fieldKey,
            dataType: parsed.dataType || 'text',
            isRequired: !!parsed.isRequired,
          };
        } catch {
          return {
            name: t.label || fieldKey,
            key: fieldKey,
            dataType: 'text',
            isRequired: false,
          };
        }
      });
  }

  /**
   * استخراج خروجی‌های پلتفرم از رکوردهای تاکسونومی
   */
  private extractOutputsForPlatform(
    platformId: string,
    taxonomies: any[],
  ): PlatformOutputColumnDto[] {
    const prefix = `${platformId}:`;
    return taxonomies
      .filter((t) => t.taxonomyType === 'platform_output' && t.key.startsWith(prefix))
      .map((t) => ({
        key: t.key.slice(prefix.length),
        label: t.label || t.key.slice(prefix.length),
      }));
  }

  /**
   * تولید کد یکتا در محدوده سازمان
   */
  private async generateUniqueCode(baseCode: string, organizationId: string): Promise<string> {
    let candidate = baseCode || 'platform';
    let count = 1;

    while (true) {
      const existing = await this.prisma.platform.findUnique({
        where: {
          organizationId_code: {
            organizationId,
            code: candidate,
          },
        },
      });

      if (!existing) {
        return candidate;
      }

      candidate = `${baseCode}_${count++}`;
    }
  }

  /**
   * تبدیل رشته به اسلاگ استاندارد
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '_')
      .replace(/^-+|-+$/g, '') || 'platform';
  }
}
