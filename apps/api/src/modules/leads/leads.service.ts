import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { GetLeadsFilterDto } from './dto/get-leads-filter.dto';
import { UpdateLeadStatusDto } from './dto/update-lead-status.dto';

export interface CurrentUserPayload {
  id: string;
  email: string;
  mobile?: string;
  fullName?: string;
  organizationId: string | null;
  role: string;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * نرمال‌سازی شماره تلفن همراه ایران و تبدیل کاراکترهای فارسی و عربی به ارقام انگلیسی
   */
  public normalizePhone(raw: string): string {
    if (!raw || typeof raw !== 'string') {
      throw new BadRequestException('شماره موبایل الزامی است');
    }

    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

    let clean = raw.trim();
    for (let i = 0; i < 10; i++) {
      clean = clean.replaceAll(persianDigits[i], String(i)).replaceAll(arabicDigits[i], String(i));
    }

    const hasPlus = clean.startsWith('+');
    clean = clean.replace(/\D/g, '');

    if (hasPlus || clean.startsWith('98') || clean.startsWith('0098')) {
      if (clean.startsWith('0098')) {
        clean = clean.substring(4);
      } else if (clean.startsWith('98')) {
        clean = clean.substring(2);
      }
    }

    if (clean.length === 10 && clean.startsWith('9')) {
      clean = '0' + clean;
    }

    if (!/^09\d{9}$/.test(clean)) {
      throw new BadRequestException(
        'شماره موبایل وارد شده معتبر نیست. شماره باید ۱۱ رقمی و با ۰۹ آغاز شود.',
      );
    }

    return clean;
  }

  /**
   * بررسی اولیه مجوزهای نقش کاربری بر اساس قوانین تغییرناپذیر سیستم (DEC-AUTH-11)
   */
  private assertLeadModuleAccess(user: CurrentUserPayload): void {
    if (!user.organizationId) {
      throw new BadRequestException('سازمان فعال برای کاربر مشخص نشده است');
    }

    if (user.role === 'campaign_manager') {
      this.logger.warn(`Access denied to Leads for campaign_manager ${user.id}`);
      throw new ForbiddenException(
        'مدیر کمپین مجوز دسترسی به صندوق و ماژول لید را ندارد (DEC-AUTH-11)',
      );
    }

    if (user.role === 'client' || user.role === 'content_creator') {
      this.logger.warn(`Access denied to Leads for role ${user.role} (user: ${user.id})`);
      throw new ForbiddenException('نقش کاربری شما مجوز دسترسی به ماژول لید را ندارد');
    }
  }

  /**
   * تبدیل رکورد دیتابیس لید به مدل استاندارد پاسخ API
   */
  public serializeLead(lead: any): any {
    const canonicalKey = lead.statusConfig ? lead.statusConfig.key : (lead.statusKey || 'new');
    return {
      id: lead.id,
      fullName: lead.fullName,
      phoneNumber: lead.mobile,
      mobile: lead.mobile,
      email: lead.email || undefined,
      city: lead.city || undefined,
      source: lead.source || 'manual',
      status: canonicalKey,
      statusKey: canonicalKey,
      statusConfigId: lead.statusConfigId || lead.statusConfig?.id || undefined,
      statusConfig: lead.statusConfig
        ? {
            id: lead.statusConfig.id,
            key: lead.statusConfig.key,
            label: lead.statusConfig.label,
            group: lead.statusConfig.group,
            color: lead.statusConfig.color || undefined,
            isActive: lead.statusConfig.isActive,
            sortOrder: lead.statusConfig.sortOrder,
          }
        : undefined,
      campaignId: lead.campaignId || undefined,
      campaignName: lead.campaign?.name || undefined,
      adName: lead.utmCampaign || undefined,
      utm: (lead.utmSource || lead.utmMedium || lead.utmCampaign) ? {
        source: lead.utmSource,
        medium: lead.utmMedium,
        campaign: lead.utmCampaign,
        term: lead.utmTerm,
        content: lead.utmContent,
      } : undefined,
      assignedToId: lead.assignedToId || undefined,
      assignedTo: lead.assignedTo ? {
        id: lead.assignedTo.id,
        name: lead.assignedTo.fullName || lead.assignedTo.email,
        email: lead.assignedTo.email,
      } : undefined,
      estimatedValue: lead.salesValue !== null && lead.salesValue !== undefined ? Number(lead.salesValue) : undefined,
      dealValue: lead.salesValue !== null && lead.salesValue !== undefined ? Number(lead.salesValue) : undefined,
      lostReason: lead.lostReason || undefined,
      nextFollowUpDate: lead.nextFollowUpAt ? lead.nextFollowUpAt.toISOString() : undefined,
      nextFollowUpNote: lead.nextFollowUpNote || undefined,
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
    };
  }

  /**
   * ایجاد دستی لید جدید در دیتابیس با تضمین ایزولاسیون سازمانی و امنیت بازپخش/تکراری
   */
  async create(dto: CreateLeadDto, user: CurrentUserPayload): Promise<any> {
    this.assertLeadModuleAccess(user);
    const organizationId = user.organizationId!;

    // اعتبارسنجی و نرمال‌سازی شماره موبایل
    const normalizedMobile = this.normalizePhone(dto.mobile);

    // تعیین کارشناس مسئول مطابق با قوانین مالکیت لید
    let assignedToId: string | null = null;

    if (user.role === 'sales_agent') {
      // کارشناس فروش فقط می‌تواند لید تخصیص‌یافته به خود را ثبت نماید
      assignedToId = user.id;
    } else if (['admin', 'owner', 'marketing_manager'].includes(user.role)) {
      if (dto.assignedToId) {
        // تأیید اینکه کارشناس انتخاب‌شده عضو فعال در همان سازمان است
        const membership = await this.prisma.organizationMembership.findFirst({
          where: {
            organizationId,
            userId: dto.assignedToId,
            status: 'active',
          },
        });
        if (!membership) {
          throw new BadRequestException('کارشناس انتخاب‌شده عضو فعال این سازمان نیست');
        }
        assignedToId = dto.assignedToId;
      }
    }

    // اعتبارسنجی کمپین (در صورت ارسال)
    if (dto.campaignId) {
      const campaign = await this.prisma.campaign.findFirst({
        where: {
          id: dto.campaignId,
          organizationId,
        },
      });
      if (!campaign) {
        throw new BadRequestException('کمپین انتخاب‌شده در این سازمان یافت نشد');
      }
    }

    // اجرای تراکنش با قفل مشاوره‌ای جهت جلوگیری قطعی از شرایط رقابتی شماره تکراری
    return await this.prisma.$transaction(async (tx) => {
      const lockKey = `${organizationId}:${normalizedMobile}`;
      await tx.$executeRaw`
        SELECT pg_advisory_xact_lock(hashtext(${lockKey}))
      `;

      // بررسی شماره تلفن تکراری در سازمان جاری (صفحه ۱۵ سند محصول)
      const existingLead = await tx.lead.findFirst({
        where: {
          organizationId,
          mobile: normalizedMobile,
        },
        select: {
          id: true,
          fullName: true,
          mobile: true,
          statusKey: true,
          createdAt: true,
        },
      });

      if (existingLead) {
        this.logger.warn(
          `Duplicate lead creation prevented for mobile ${normalizedMobile} in org ${organizationId}. Existing lead: ${existingLead.id}`,
        );
        throw new ConflictException({
          statusCode: 409,
          error: 'DUPLICATE_PHONE',
          message: 'این شماره قبلاً ثبت شده',
          existingLead: {
            id: existingLead.id,
            fullName: existingLead.fullName,
            mobile: existingLead.mobile,
            statusKey: existingLead.statusKey,
            createdAt: existingLead.createdAt.toISOString(),
          },
        });
      }

      // اعتبارسنجی و نگاشت وضعیت اولیه لید با جدول LeadStatusConfig (B2.5.4)
      let initialStatusConfig: any = null;
      if (dto.statusKey && dto.statusKey.trim()) {
        const inputKey = dto.statusKey.trim();
        const isUuid = UUID_REGEX.test(inputKey);
        initialStatusConfig = await tx.leadStatusConfig.findFirst({
          where: {
            organizationId,
            isActive: true,
            OR: isUuid ? [{ id: inputKey }, { key: inputKey }] : [{ key: inputKey }],
          },
        });
        if (!initialStatusConfig) {
          throw new BadRequestException('وضعیت اولیه لید نامعتبر یا غیرفعال است');
        }
      } else {
        // یافتن وضعیت پیش‌فرض فعال سازمان (ابتدا کلید new، سپس اولین وضعیت در گروه open)
        initialStatusConfig = await tx.leadStatusConfig.findFirst({
          where: {
            organizationId,
            key: 'new',
            isActive: true,
          },
        });
        if (!initialStatusConfig) {
          initialStatusConfig = await tx.leadStatusConfig.findFirst({
            where: {
              organizationId,
              group: 'open',
              isActive: true,
            },
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          });
        }
        if (!initialStatusConfig) {
          throw new BadRequestException(
            'هیچ وضعیت اولیه فعالی در گروه باز (open) برای ایجاد لید در این سازمان یافت نشد',
          );
        }
      }

      // درج لید جدید با تضمین انطباق statusKey و statusConfigId
      const lead = await tx.lead.create({
        data: {
          organizationId,
          fullName: dto.fullName.trim(),
          mobile: normalizedMobile,
          email: dto.email ? dto.email.trim().toLowerCase() : null,
          city: dto.city ? dto.city.trim() : null,
          source: dto.source?.trim() || 'manual',
          campaignId: dto.campaignId || null,
          assignedToId,
          nextFollowUpAt: dto.nextFollowUpAt ? new Date(dto.nextFollowUpAt) : null,
          nextFollowUpNote: dto.nextFollowUpNote ? dto.nextFollowUpNote.trim() : null,
          statusKey: initialStatusConfig.key,
          statusConfigId: initialStatusConfig.id,
        },
        include: {
          campaign: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, fullName: true, email: true } },
          statusConfig: true,
        },
      });

      // ثبت رویداد اولیه در تایم‌لاین فعالیت لید
      await tx.leadActivity.create({
        data: {
          organizationId,
          leadId: lead.id,
          type: 'form_submit',
          title: 'ثبت لید دستی جدید',
          details: JSON.stringify({
            source: lead.source,
            assignedToId,
            createdById: user.id,
          }),
          actorUserId: user.id,
        },
      });

      this.logger.log(`Lead created successfully: ${lead.id} (${lead.fullName}) by user ${user.id}`);
      return this.serializeLead(lead);
    });
  }

  /**
   * دریافت لیست لیدهای سازمان با اعمال فیلترها و اعمال قانون مالکیت کارشناس فروش
   */
  async findAll(filter: GetLeadsFilterDto, user: CurrentUserPayload): Promise<any[]> {
    this.assertLeadModuleAccess(user);
    const organizationId = user.organizationId!;

    const where: any = {
      organizationId,
    };

    // محدودیت اختصاصی کارشناس فروش: فقط لیدهای تخصیص‌یافته به خود
    if (user.role === 'sales_agent') {
      where.assignedToId = user.id;
    } else if (filter.assignedToId) {
      where.assignedToId = filter.assignedToId === 'unassigned' ? null : filter.assignedToId;
    }

    // فیلتر وضعیت
    if (filter.status) {
      const statuses = filter.status.split(',').map((s) => s.trim()).filter(Boolean);
      if (statuses.length > 0) {
        const uuids = statuses.filter((s) => UUID_REGEX.test(s));
        where.OR = [
          { statusKey: { in: statuses } },
          ...(uuids.length > 0 ? [{ statusConfigId: { in: uuids } }] : []),
        ];
      }
    }

    // فیلتر کمپین
    if (filter.campaignId) {
      where.campaignId = filter.campaignId;
    }

    // فیلتر منبع
    if (filter.source) {
      where.source = filter.source;
    }

    // فیلتر بازه تاریخ ورود
    if (filter.from || filter.to) {
      where.createdAt = {};
      if (filter.from) where.createdAt.gte = new Date(filter.from);
      if (filter.to) where.createdAt.lte = new Date(filter.to);
    }

    // فیلتر متنی جستجو
    if (filter.search && filter.search.trim()) {
      const term = filter.search.trim();
      where.OR = [
        { fullName: { contains: term, mode: 'insensitive' } },
        { mobile: { contains: term } },
        { email: { contains: term, mode: 'insensitive' } },
      ];
    }

    const leads = await this.prisma.lead.findMany({
      where,
      include: {
        campaign: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, fullName: true, email: true } },
        statusConfig: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return leads.map((lead) => this.serializeLead(lead));
  }

  /**
   * دریافت جزئیات یک لید با شناسه
   */
  async findOne(id: string, user: CurrentUserPayload): Promise<any> {
    this.assertLeadModuleAccess(user);
    const organizationId = user.organizationId!;

    const lead = await this.prisma.lead.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        campaign: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, fullName: true, email: true } },
        statusConfig: true,
      },
    });

    if (!lead) {
      throw new NotFoundException('لید مورد نظر یافت نشد');
    }

    // کنترل مالکیت برای کارشناس فروش
    if (user.role === 'sales_agent' && lead.assignedToId !== user.id) {
      throw new ForbiddenException('شما فقط به لیدهای تخصیص‌یافته به خود دسترسی دارید');
    }

    return this.serializeLead(lead);
  }

  /**
   * دریافت لیست کارشناسان و اعضای فعال سازمان جهت گزینه‌های تخصیص لید
   */
  async getAssignees(user: CurrentUserPayload): Promise<Array<{ id: string; name: string; role?: string }>> {
    this.assertLeadModuleAccess(user);
    const organizationId = user.organizationId!;

    const members = await this.prisma.organizationMembership.findMany({
      where: {
        organizationId,
        status: 'active',
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            mobile: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return members.map((m: any) => ({
      id: m.user.id,
      name: m.user.fullName || m.user.email,
      role: m.role,
    }));
  }

  /**
   * تبدیل رکورد دیتابیس لاگ فعالیت لید به مدل استاندارد پاسخ
   */
  public serializeActivity(act: any): any {
    let metadata: any = undefined;
    if (act.details) {
      try {
        metadata = JSON.parse(act.details);
      } catch {
        metadata = { note: act.details };
      }
    }
    return {
      id: act.id,
      leadId: act.leadId,
      type: act.type,
      title: act.title,
      timestamp: act.createdAt.toISOString(),
      actorType: act.actorUserId ? 'user' : 'system',
      actor: act.actorUser ? {
        id: act.actorUser.id,
        name: act.actorUser.fullName || act.actorUser.email,
      } : undefined,
      note: metadata?.note || undefined,
      metadata,
    };
  }

  /**
   * به‌روزرسانی وضعیت لید در پایپ‌لاین فروش همراه با ثبت تراکنشی رویداد تغییر وضعیت در تاریخچه
   */
  async updateStatus(id: string, dto: UpdateLeadStatusDto, user: CurrentUserPayload): Promise<any> {
    this.assertLeadModuleAccess(user);
    const organizationId = user.organizationId!;

    const lead = await this.prisma.lead.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!lead) {
      throw new NotFoundException('لید مورد نظر یافت نشد');
    }

    // کنترل محدودیت دسترسی و مالکیت لید برای کارشناس فروش (ص ۱۵ سند محصول)
    if (user.role === 'sales_agent' && lead.assignedToId !== user.id) {
      throw new ForbiddenException('شما فقط مجاز به تغییر وضعیت لیدهای تخصیص‌یافته به خود هستید');
    }

    const fromStatus = lead.statusKey || 'new';
    const toStatusInput = dto.status.trim();
    const isUuid = UUID_REGEX.test(toStatusInput);

    // اعتبارسنجی داینامیک وضعیت مقصد از جدول LeadStatusConfig متعلق به سازمان کاربر (B2.5.4)
    const targetStatus = await this.prisma.leadStatusConfig.findFirst({
      where: {
        organizationId,
        OR: isUuid ? [{ id: toStatusInput }, { key: toStatusInput }] : [{ key: toStatusInput }],
      },
    });

    if (!targetStatus) {
      throw new BadRequestException('وضعیت انتخاب‌شده در این سازمان یافت نشد');
    }

    if (!targetStatus.isActive) {
      throw new BadRequestException('وضعیت انتخاب‌شده غیرفعال است و امکان تخصیص به لید را ندارد');
    }

    const toStatus = targetStatus.key;

    return await this.prisma.$transaction(async (tx) => {
      const updateData: any = {
        statusKey: targetStatus.key,
        statusConfigId: targetStatus.id,
      };

      if (targetStatus.group === 'won' || targetStatus.key === 'won') {
        if (dto.dealValue !== undefined) {
          updateData.salesValue = dto.dealValue;
        }
      } else if (targetStatus.group === 'lost' || targetStatus.key === 'lost') {
        if (dto.lostReason) {
          updateData.lostReason = dto.lostReason.trim();
        }
      }

      const updatedLead = await tx.lead.update({
        where: { id: lead.id },
        data: updateData,
        include: {
          campaign: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, fullName: true, email: true } },
          statusConfig: true,
        },
      });

      const toStatusLabel = targetStatus.label || toStatus;

      const activity = await tx.leadActivity.create({
        data: {
          organizationId,
          leadId: lead.id,
          type: 'status_change',
          title: `تغییر وضعیت به ${toStatusLabel}`,
          details: JSON.stringify({
            fromStatus,
            toStatus: targetStatus.key,
            statusConfigId: targetStatus.id,
            toStatusLabel,
            group: targetStatus.group,
            dealValue: dto.dealValue,
            lostReason: dto.lostReason,
            note: dto.note,
            actorUserId: user.id,
          }),
          actorUserId: user.id,
        },
        include: {
          actorUser: { select: { id: true, fullName: true, email: true } },
        },
      });

      const serializedLead = this.serializeLead(updatedLead);
      const serializedActivity = this.serializeActivity(activity);

      this.logger.log(
        `Lead ${lead.id} status changed from ${fromStatus} to ${toStatus} (${targetStatus.id}) by user ${user.id} in org ${organizationId}`,
      );

      return {
        ...serializedLead,
        lead: serializedLead,
        event: serializedActivity,
        activity: serializedActivity,
      };
    });
  }

  /**
   * دریافت تاریخچه رخدادها و فعالیت‌های یک لید
   */
  async getActivities(id: string, user: CurrentUserPayload): Promise<any[]> {
    this.assertLeadModuleAccess(user);
    const organizationId = user.organizationId!;

    const lead = await this.prisma.lead.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!lead) {
      throw new NotFoundException('لید مورد نظر یافت نشد');
    }

    if (user.role === 'sales_agent' && lead.assignedToId !== user.id) {
      throw new ForbiddenException('شما فقط به لیدهای تخصیص‌یافته به خود دسترسی دارید');
    }

    const activities = await this.prisma.leadActivity.findMany({
      where: {
        leadId: id,
        organizationId,
      },
      include: {
        actorUser: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return activities.map((act) => this.serializeActivity(act));
  }
}
