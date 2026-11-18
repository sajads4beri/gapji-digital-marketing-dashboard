import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateWebinarDto } from './dto/create-webinar.dto';
import { QueryWebinarsDto } from './dto/query-webinars.dto';
import { QueryAttendeesDto } from './dto/query-attendees.dto';
import { ImportAttendeesDto, AttendeeRowDto } from './dto/import-attendees.dto';
import { UpdateWebinarStatusDto } from './dto/update-webinar-status.dto';
import { maskPhoneNumber, normalizeMobileNumber } from '../sms/sms.utils';
import { CsvParser } from '../imports/utils/csv-parser';

export interface CurrentUserPayload {
  id: string;
  email?: string;
  role: string;
  organizationId: string;
}

@Injectable()
export class WebinarsService {
  private readonly logger = new Logger(WebinarsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * RBAC Enforcement (Product Document p. 17 §18, p. 18 §18)
   * Authorized: admin, marketing_manager, content_creator (مسئول وبینار)
   * Denied: sales_agent, campaign_manager, client
   */
  private assertAccess(user?: CurrentUserPayload) {
    if (!user) return;
    const allowedRoles = ['admin', 'marketing_manager', 'content_creator'];
    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenException(
        `نقش شما (${user.role}) مجوز دسترسی به ماژول وبینار را ندارد (سند محصول ص ۱۷ و ۱۸).`,
      );
    }
  }

  // ==============================================================================
  // 1. WEBINAR LIST (فهرست وبینارها - ص ۱۷)
  // ==============================================================================

  async findAll(query: QueryWebinarsDto, user?: CurrentUserPayload) {
    this.assertAccess(user);
    const organizationId = user?.organizationId || '00000000-0000-0000-0000-000000000001';

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Number(query.limit) || 10);
    const skip = (page - 1) * limit;

    const where: any = { organizationId };

    if (query.campaignId) {
      where.campaignId = query.campaignId;
    }

    if (query.status && query.status !== 'all') {
      where.status = query.status;
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { presenterName: { contains: term, mode: 'insensitive' } },
        { platform: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [total, records] = await Promise.all([
      this.prisma.webinar.count({ where }),
      this.prisma.webinar.findMany({
        where,
        include: {
          campaign: { select: { id: true, name: true } },
          _count: {
            select: {
              attendees: true,
            },
          },
        },
        orderBy: { webinarDate: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const items = records.map((w) => ({
      id: w.id,
      title: w.title,
      description: w.description,
      presenterName: w.presenterName,
      platform: w.platform,
      webinarDate: w.webinarDate.toISOString(),
      durationMinutes: w.durationMinutes,
      status: w.status,
      isPublished: w.status !== 'draft',
      capacity: w.capacity,
      registeredCount: w.registeredCount,
      attendedCount: w.attendedCount,
      campaignId: w.campaignId,
      campaignName: w.campaign?.name || null,
      registrationUrl: w.registrationUrl,
      createdAt: w.createdAt.toISOString(),
      updatedAt: w.updatedAt.toISOString(),
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ==============================================================================
  // 2. CREATE WEBINAR (ساخت وبینار - ص ۱۷)
  // ==============================================================================

  async create(dto: CreateWebinarDto, user?: CurrentUserPayload) {
    this.assertAccess(user);
    const organizationId = user?.organizationId || '00000000-0000-0000-0000-000000000001';

    // Verify campaign if provided
    let campaignName: string | null = null;
    if (dto.campaignId) {
      const camp = await this.prisma.campaign.findFirst({
        where: { id: dto.campaignId, organizationId },
        select: { id: true, name: true },
      });
      if (!camp) {
        throw new NotFoundException('کمپین بازاریابی مرتبط یافت نشد.');
      }
      campaignName = camp.name;
    }

    // Validate meeting URL if provided
    if (dto.registrationUrl && dto.registrationUrl.trim()) {
      const trimmed = dto.registrationUrl.trim();
      if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
        throw new BadRequestException('نشانی جلسه یا ثبت‌نام باید با http:// یا https:// آغاز شود.');
      }
    }

    // Default status: draft (پیش‌نویس) until publication
    const created = await this.prisma.webinar.create({
      data: {
        organizationId,
        campaignId: dto.campaignId || null,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        presenterName: dto.presenterName.trim(),
        platform: dto.platform.trim(),
        webinarDate: new Date(dto.webinarDate),
        durationMinutes: dto.durationMinutes || 60,
        registrationUrl: dto.registrationUrl?.trim() || null,
        capacity: dto.capacity || null,
        status: 'draft', // پیش‌نویس اولیه طبق سند محصول
      },
    });

    return {
      ...created,
      campaignName,
      isPublished: false,
    };
  }

  // ==============================================================================
  // 3. WEBINAR STATUS TRANSITIONS (مدیریت وضعیت و فرآیند انتشار)
  // ==============================================================================

  async updateStatus(id: string, dto: UpdateWebinarStatusDto, user?: CurrentUserPayload) {
    this.assertAccess(user);
    const organizationId = user?.organizationId || '00000000-0000-0000-0000-000000000001';

    const webinar = await this.prisma.webinar.findFirst({
      where: { id, organizationId },
    });
    if (!webinar) {
      throw new NotFoundException('وبینار مورد نظر یافت نشد.');
    }

    const updated = await this.prisma.webinar.update({
      where: { id },
      data: { status: dto.status as any },
    });

    return {
      id: updated.id,
      title: updated.title,
      status: updated.status,
      isPublished: updated.status !== 'draft',
      message: `وضعیت وبینار به «${dto.status}» تغییر یافت.`,
    };
  }

  // ==============================================================================
  // 4. WEBINAR DETAILS (۴ تب: اطلاعات، شرکت‌کنندگان، تجهیزات، تسک‌ها - ص ۱۸)
  // ==============================================================================

  async findOne(id: string, user?: CurrentUserPayload) {
    this.assertAccess(user);
    const organizationId = user?.organizationId || '00000000-0000-0000-0000-000000000001';

    const webinar = await this.prisma.webinar.findFirst({
      where: { id, organizationId },
      include: {
        campaign: { select: { id: true, name: true } },
        eventEquipments: {
          include: {
            equipmentItem: true,
            responsible: { select: { id: true, fullName: true, email: true } },
          },
        },
      },
    });

    if (!webinar) {
      throw new NotFoundException('وبینار مورد نظر یافت نشد.');
    }

    // 1. Participant & Funnel metrics directly from DB
    const [totalRegistered, totalAttended, totalConvertedLeads] = await Promise.all([
      this.prisma.webinarAttendee.count({ where: { webinarId: id, organizationId } }),
      this.prisma.webinarAttendee.count({
        where: { webinarId: id, organizationId, attended: true },
      }),
      this.prisma.webinarAttendee.count({
        where: { webinarId: id, organizationId, leadId: { not: null } },
      }),
    ]);

    const regCount = totalRegistered > 0 ? totalRegistered : webinar.registeredCount;
    const attCount = totalRegistered > 0 ? totalAttended : webinar.attendedCount;
    const attendanceRate = regCount > 0 ? Math.round((attCount / regCount) * 100) : 0;
    const conversionRate = attCount > 0 ? Math.round((totalConvertedLeads / attCount) * 100) : 0;

    // 2. Fetch associated Tasks (relatedType: webinar, relatedId: id)
    const tasks = await this.prisma.task.findMany({
      where: {
        organizationId,
        relatedType: 'webinar',
        relatedId: id,
      },
      include: {
        assignee: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 3. Format Equipments with readiness breakdown
    const equipments = webinar.eventEquipments.map((eq) => ({
      id: eq.id,
      equipmentItemId: eq.equipmentItemId,
      title: eq.equipmentItem.name,
      category: eq.equipmentItem.category,
      description: eq.equipmentItem.description,
      status: eq.status, // ready, incomplete, not_procured
      responsibleId: eq.responsibleId,
      responsibleName: eq.responsible?.fullName || eq.responsible?.email || null,
      dueDate: eq.dueDate ? eq.dueDate.toISOString() : null,
      notes: eq.notes,
    }));

    const equipmentSummary = {
      total: equipments.length,
      ready: equipments.filter((e) => e.status === 'ready').length,
      incomplete: equipments.filter((e) => e.status === 'incomplete').length,
      notProcured: equipments.filter((e) => e.status === 'not_procured').length,
    };

    return {
      // Tab 1: Information
      id: webinar.id,
      title: webinar.title,
      description: webinar.description,
      presenterName: webinar.presenterName,
      platform: webinar.platform,
      webinarDate: webinar.webinarDate.toISOString(),
      durationMinutes: webinar.durationMinutes,
      registrationUrl: webinar.registrationUrl,
      bannerUrl: webinar.bannerUrl,
      status: webinar.status,
      isPublished: webinar.status !== 'draft',
      capacity: webinar.capacity,
      campaignId: webinar.campaignId,
      campaignName: webinar.campaign?.name || null,
      createdAt: webinar.createdAt.toISOString(),
      updatedAt: webinar.updatedAt.toISOString(),

      // Tab 2: Funnel & Attendees Summary
      funnel: {
        registeredCount: regCount, // ثبت‌نام
        attendedCount: attCount, // حضور
        convertedLeadsCount: totalConvertedLeads, // لید
        attendanceRate, // درصد حضور
        conversionRate, // درصد تبدیل به لید
      },

      // Tab 3: Equipments (تجهیزات متصل)
      equipments,
      equipmentSummary,

      // Tab 4: Tasks (تسک‌های مرتبط)
      tasks: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate ? t.dueDate.toISOString() : null,
        assigneeId: t.assigneeId,
        assigneeName: t.assignee?.fullName || t.assignee?.email || null,
        createdAt: t.createdAt.toISOString(),
      })),
    };
  }

  // ==============================================================================
  // 5. ATTENDEES LIST (جدول شرکت‌کنندگان با ماسک شماره تلفن - ص ۱۸)
  // ==============================================================================

  async findAttendees(id: string, query: QueryAttendeesDto, user?: CurrentUserPayload) {
    this.assertAccess(user);
    const organizationId = user?.organizationId || '00000000-0000-0000-0000-000000000001';

    const webinar = await this.prisma.webinar.findFirst({
      where: { id, organizationId },
      select: { id: true },
    });
    if (!webinar) {
      throw new NotFoundException('وبینار یافت نشد.');
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Number(query.limit) || 20);
    const skip = (page - 1) * limit;

    const where: any = { webinarId: id, organizationId };

    if (query.attendanceStatus && query.attendanceStatus !== 'all') {
      where.attended = query.attendanceStatus === 'attended';
    }

    if (query.conversionStatus && query.conversionStatus !== 'all') {
      if (query.conversionStatus === 'converted') {
        where.leadId = { not: null };
      } else if (query.conversionStatus === 'not_converted') {
        where.leadId = null;
      }
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      const normMobile = normalizeMobileNumber(term);
      where.OR = [
        { fullName: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
        { mobile: { contains: normMobile || term } },
      ];
    }

    const [total, attendees] = await Promise.all([
      this.prisma.webinarAttendee.count({ where }),
      this.prisma.webinarAttendee.findMany({
        where,
        include: {
          lead: { select: { id: true, fullName: true, statusKey: true } },
        },
        orderBy: [{ attended: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
    ]);

    const items = attendees.map((a) => ({
      id: a.id,
      fullName: a.fullName,
      mobileMasked: maskPhoneNumber(a.mobile), // شماره تلفن ماسک‌شده (الزام امنیتی ص ۱۸)
      email: a.email,
      attended: a.attended, // وضعیت حضور
      joinedAt: a.joinedAt ? a.joinedAt.toISOString() : null,
      isConvertedToLead: Boolean(a.leadId), // وضعیت تبدیل به لید
      leadId: a.leadId,
      leadName: a.lead?.fullName || null,
      createdAt: a.createdAt.toISOString(),
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ==============================================================================
  // 6. ACTION: IMPORT REGISTRATION & ATTENDANCE (ایمپورت ثبت‌نام و حضور - ص ۱۸)
  // ==============================================================================

  async importAttendees(id: string, dto: ImportAttendeesDto, user?: CurrentUserPayload) {
    this.assertAccess(user);
    const organizationId = user?.organizationId || '00000000-0000-0000-0000-000000000001';

    const webinar = await this.prisma.webinar.findFirst({
      where: { id, organizationId },
    });
    if (!webinar) {
      throw new NotFoundException('وبینار یافت نشد.');
    }

    let rows: AttendeeRowDto[] = [];

    // Parse CSV if provided
    if (dto.csvContent && dto.csvContent.trim()) {
      const parsed = CsvParser.parse(dto.csvContent);
      if (parsed.rows.length === 0) {
        throw new BadRequestException('فایل بارگذاری‌شده فاقد داده است.');
      }

      const nameIdx = parsed.headers.findIndex((h) =>
        ['نام', 'نام و نام خانوادگی', 'نام کاربر', 'fullname', 'name'].includes(h.toLowerCase().trim()),
      );
      const mobileIdx = parsed.headers.findIndex((h) =>
        ['شماره', 'تلفن', 'موبایل', 'شماره تلفن', 'mobile', 'phone'].includes(h.toLowerCase().trim()),
      );
      const emailIdx = parsed.headers.findIndex((h) =>
        ['ایمیل', 'پست الکترونیک', 'email'].includes(h.toLowerCase().trim()),
      );
      const attendedIdx = parsed.headers.findIndex((h) =>
        ['حضور', 'وضعیت حضور', 'حاضر', 'attended', 'attendance', 'present'].includes(
          h.toLowerCase().trim(),
        ),
      );
      const joinedAtIdx = parsed.headers.findIndex((h) =>
        ['زمان ورود', 'تاریخ ورود', 'joined_at', 'join_time'].includes(h.toLowerCase().trim()),
      );

      if (mobileIdx === -1) {
        throw new BadRequestException('ستون شماره موبایل در فایل یافت نشد.');
      }

      rows = parsed.rows.map((r) => ({
        fullName: nameIdx !== -1 ? r[nameIdx] : 'شرکت‌کننده وبینار',
        mobile: r[mobileIdx] || '',
        email: emailIdx !== -1 ? r[emailIdx] : undefined,
        attended: attendedIdx !== -1 ? r[attendedIdx] : undefined,
        joinedAt: joinedAtIdx !== -1 ? r[joinedAtIdx] : undefined,
      }));
    } else if (dto.rows && Array.isArray(dto.rows)) {
      rows = dto.rows;
    } else {
      throw new BadRequestException('لطفاً محتوای فایل CSV یا ردیف‌ها را ارسال فرمایید.');
    }

    // Existing attendees in this webinar
    const existingAttendees = await this.prisma.webinarAttendee.findMany({
      where: { webinarId: id, organizationId },
      select: { id: true, mobile: true, attended: true },
    });
    const existingMap = new Map(existingAttendees.map((a) => [a.mobile, a]));

    const seenBatchMobiles = new Set<string>();
    const toCreate: any[] = [];
    const toUpdateAttendedIds: string[] = [];
    const errors: Array<{ row: number; reason: string }> = [];
    let duplicates = 0;
    let failed = 0;

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 1;
      const r = rows[i];
      const normMobile = normalizeMobileNumber(r.mobile);

      if (!normMobile || normMobile.length < 10) {
        errors.push({ row: rowNum, reason: `شماره تلفن نامعتبر: ${r.mobile}` });
        failed++;
        continue;
      }

      // Check attended flag
      let isAttended = false;
      if (r.attended !== undefined && r.attended !== null) {
        const atStr = String(r.attended).toLowerCase().trim();
        if (['true', '1', 'بله', 'حاضر', 'yes', 'attended'].includes(atStr)) {
          isAttended = true;
        }
      }

      // If mobile already seen in batch
      if (seenBatchMobiles.has(normMobile)) {
        duplicates++;
        continue;
      }
      seenBatchMobiles.add(normMobile);

      // If already exists in DB
      const existing = existingMap.get(normMobile);
      if (existing) {
        duplicates++;
        // If imported record marks attendance and existing is not attended, update attendance
        if (isAttended && !existing.attended) {
          toUpdateAttendedIds.push(existing.id);
        }
        continue;
      }

      toCreate.push({
        organizationId,
        webinarId: id,
        fullName: r.fullName?.trim() || `شرکت‌کننده ${maskPhoneNumber(normMobile)}`,
        mobile: normMobile,
        email: r.email?.trim() || null,
        attended: isAttended,
        joinedAt: isAttended ? (r.joinedAt ? new Date(r.joinedAt) : new Date()) : null,
      });
    }

    // Transactional persist
    let successfullyImported = 0;
    await this.prisma.$transaction(async (tx) => {
      if (toCreate.length > 0) {
        await tx.webinarAttendee.createMany({ data: toCreate });
      }

      if (toUpdateAttendedIds.length > 0) {
        await tx.webinarAttendee.updateMany({
          where: { id: { in: toUpdateAttendedIds } },
          data: { attended: true, joinedAt: new Date() },
        });
      }

      // Recalculate webinar counters
      const totalReg = await tx.webinarAttendee.count({ where: { webinarId: id, organizationId } });
      const totalAtt = await tx.webinarAttendee.count({
        where: { webinarId: id, organizationId, attended: true },
      });

      await tx.webinar.update({
        where: { id },
        data: {
          registeredCount: totalReg,
          attendedCount: totalAtt,
        },
      });
    });

    successfullyImported = toCreate.length;

    return {
      totalRows: rows.length,
      successfullyImported,
      failed,
      duplicates,
      attendanceUpdatedCount: toUpdateAttendedIds.length,
      errors,
    };
  }

  // ==============================================================================
  // 7. ACTION: CONVERT ATTENDEES TO LEADS (تبدیل حاضران به لید - ص ۱۸)
  // ==============================================================================

  /**
   * پیش‌نمایش تبدیل حاضران به لید با شمارش دقیق موارد واجد شرایط و تکراری
   */
  async convertAttendeesPreview(id: string, user?: CurrentUserPayload) {
    this.assertAccess(user);
    const organizationId = user?.organizationId || '00000000-0000-0000-0000-000000000001';

    const attendees = await this.prisma.webinarAttendee.findMany({
      where: {
        webinarId: id,
        organizationId,
        attended: true,
        leadId: null, // Still not converted
      },
      select: {
        id: true,
        fullName: true,
        mobile: true,
        email: true,
        joinedAt: true,
      },
    });

    if (attendees.length === 0) {
      return {
        totalEligibleAttendees: 0,
        eligibleCount: 0,
        duplicateCount: 0,
        attendees: [],
      };
    }

    // Check existing leads in organization by mobile
    const mobiles = attendees.map((a) => a.mobile);
    const existingLeads = await this.prisma.lead.findMany({
      where: {
        organizationId,
        mobile: { in: mobiles },
      },
      select: { id: true, mobile: true, fullName: true },
    });

    const existingMap = new Map(existingLeads.map((l) => [l.mobile, l]));

    const items = attendees.map((a) => {
      const existing = existingMap.get(a.mobile);
      return {
        id: a.id,
        fullName: a.fullName,
        mobileMasked: maskPhoneNumber(a.mobile),
        email: a.email,
        isDuplicate: Boolean(existing),
        existingLeadId: existing?.id || null,
        existingLeadName: existing?.fullName || null,
      };
    });

    const duplicateCount = items.filter((i) => i.isDuplicate).length;
    const eligibleCount = items.length - duplicateCount;

    return {
      totalEligibleAttendees: attendees.length,
      eligibleCount,
      duplicateCount,
      attendees: items,
    };
  }

  /**
   * تایید و ساخت تراکنشی لیدها از حاضران وبینار
   */
  async convertAttendeesConfirm(id: string, user?: CurrentUserPayload) {
    this.assertAccess(user);
    const organizationId = user?.organizationId || '00000000-0000-0000-0000-000000000001';

    const webinar = await this.prisma.webinar.findFirst({
      where: { id, organizationId },
    });
    if (!webinar) {
      throw new NotFoundException('وبینار یافت نشد.');
    }

    const attendees = await this.prisma.webinarAttendee.findMany({
      where: {
        webinarId: id,
        organizationId,
        attended: true,
        leadId: null,
      },
    });

    if (attendees.length === 0) {
      return {
        createdCount: 0,
        skippedDuplicates: 0,
        message: 'هیچ حاضر جدیدی برای تبدیل به لید یافت نشد.',
      };
    }

    // Check existing leads to avoid duplication
    const mobiles = attendees.map((a) => a.mobile);
    const existingLeads = await this.prisma.lead.findMany({
      where: { organizationId, mobile: { in: mobiles } },
      select: { id: true, mobile: true },
    });
    const existingMobileSet = new Set(existingLeads.map((l) => l.mobile));

    const eligible = attendees.filter((a) => !existingMobileSet.has(a.mobile));
    const createdLeadIds: string[] = [];

    await this.prisma.$transaction(async (tx) => {
      for (const a of eligible) {
        const lead = await tx.lead.create({
          data: {
            organizationId,
            fullName: a.fullName,
            mobile: a.mobile,
            email: a.email || null,
            source: 'webinar',
            campaignId: webinar.campaignId || null,
            statusKey: 'new',
            nextFollowUpNote: `شرکت‌کننده در وبینار: ${webinar.title}`,
          },
        });

        await tx.webinarAttendee.update({
          where: { id: a.id },
          data: { leadId: lead.id },
        });

        createdLeadIds.push(lead.id);
      }
    });

    return {
      createdCount: createdLeadIds.length,
      skippedDuplicates: attendees.length - eligible.length,
      leadIds: createdLeadIds,
      message: `${createdLeadIds.length} لید جدید از حاضران وبینار با موفقیت ساخته شد.`,
    };
  }

  // ==============================================================================
  // 8. LINK EQUIPMENT & TASKS TO WEBINAR (اتصال به تجهیزات و تسک‌ها - ص ۱۸)
  // ==============================================================================

  async addEquipment(
    id: string,
    data: { equipmentItemId: string; responsibleId?: string; dueDate?: string; notes?: string },
    user?: CurrentUserPayload,
  ) {
    this.assertAccess(user);
    const organizationId = user?.organizationId || '00000000-0000-0000-0000-000000000001';

    const webinar = await this.prisma.webinar.findFirst({
      where: { id, organizationId },
    });
    if (!webinar) throw new NotFoundException('وبینار یافت نشد.');

    const created = await this.prisma.eventEquipment.create({
      data: {
        organizationId,
        webinarId: id,
        equipmentItemId: data.equipmentItemId,
        campaignId: webinar.campaignId || null,
        responsibleId: data.responsibleId || null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        notes: data.notes?.trim() || null,
        status: 'not_procured',
      },
      include: { equipmentItem: true },
    });

    return created;
  }

  async addTask(
    id: string,
    data: { title: string; description?: string; priority?: any; dueDate?: string; assigneeId?: string },
    user?: CurrentUserPayload,
  ) {
    this.assertAccess(user);
    const organizationId = user?.organizationId || '00000000-0000-0000-0000-000000000001';

    const webinar = await this.prisma.webinar.findFirst({
      where: { id, organizationId },
    });
    if (!webinar) throw new NotFoundException('وبینار یافت نشد.');

    let creatorId = user?.id;
    if (creatorId) {
      const exists = await this.prisma.user.findUnique({
        where: { id: creatorId },
        select: { id: true },
      });
      if (!exists) creatorId = undefined;
    }
    if (!creatorId) {
      const fallbackUser =
        (await this.prisma.user.findFirst({
          where: { memberships: { some: { organizationId } } },
          select: { id: true },
        })) || (await this.prisma.user.findFirst({ select: { id: true } }));
      creatorId = fallbackUser?.id;
    }
    if (!creatorId) {
      throw new BadRequestException('کاربری برای ثبت تسک یافت نشد.');
    }

    const created = await this.prisma.task.create({
      data: {
        organizationId,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        priority: data.priority || 'medium',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        assigneeId: data.assigneeId || null,
        createdById: creatorId,
        relatedType: 'webinar',
        relatedId: id,
      },
      include: {
        assignee: { select: { id: true, fullName: true, email: true } },
      },
    });

    return created;
  }
}
