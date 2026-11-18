import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TaskRelatedType, EquipmentReadinessStatus, Prisma } from '@prisma/client';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { UpdateCalendarEventDto } from './dto/update-calendar-event.dto';
import { QueryCalendarEventsDto } from './dto/query-calendar-events.dto';

export const DEFAULT_ORGANIZATION_ID = '00000000-0000-0000-0000-000000000001';

export interface CurrentUserPayload {
  id: string;
  email: string;
  fullName?: string;
  organizationId: string | null;
  role: string;
}

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * استخراج شناسه معتبر سازمان کاربر با تضمین ایزولاسیون سازمانی
   */
  private resolveOrganizationId(user: CurrentUserPayload): string {
    const orgId = user.organizationId || DEFAULT_ORGANIZATION_ID;
    if (!orgId) {
      throw new BadRequestException('شناسه سازمان فعال برای کاربر مشخص نشده است');
    }
    return orgId;
  }

  /**
   * بررسی مجوز خواندن: کلیه ۶ نقش مستند سازمانی حق مشاهده تقویم را دارند (ص ۱۸ بند ۲۰)
   */
  private assertReadAccess(user: CurrentUserPayload) {
    if (!user) {
      throw new ForbiddenException('کاربر احراز هویت نشده است');
    }
    const allowedRoles = [
      'admin',
      'owner',
      'marketing_manager',
      'campaign_manager',
      'sales_agent',
      'content_creator',
      'client',
    ];
    if (!allowedRoles.includes(user.role)) {
      this.logger.warn(`User ${user.id} with role ${user.role} denied read access to Calendar`);
      throw new ForbiddenException('نقش کاربری شما مجوز دسترسی به تقویم را ندارد');
    }
  }

  /**
   * بررسی مجوز ایجاد/ویرایش/حذف رویدادها
   * نقش کارفرما (client) صرفاً فقط‌خواندنی است.
   */
  private assertWriteAccess(user: CurrentUserPayload, existingEvent?: any) {
    if (!user) {
      throw new ForbiddenException('کاربر احراز هویت نشده است');
    }

    if (user.role === 'client') {
      throw new ForbiddenException('نقش کارفرما دسترسی فقط مشاهده دارد و امکان ایجاد، ویرایش یا حذف رویدادها را ندارد');
    }

    const fullRoles = ['admin', 'owner', 'marketing_manager', 'campaign_manager'];
    if (fullRoles.includes(user.role)) {
      return;
    }

    // کاربران اجرایی (تولید محتوا و فروش) رویدادهای ایجادشده توسط خود را می‌توانند مدیریت کنند
    if (existingEvent && existingEvent.createdById !== user.id && existingEvent.assigneeId !== user.id) {
      throw new ForbiddenException('شما فقط مجاز به ویرایش یا حذف رویدادهای متعلق به خود هستید');
    }
  }

  /**
   * پارس و اعتبارسنجی تاریخ‌های شروع و پایان
   */
  private parseEventDates(
    startDateStr: string,
    endDateStr?: string,
    isAllDay = false,
    startTime?: string,
    endTime?: string,
  ): { startDate: Date; endDate: Date } {
    let startIso = startDateStr.slice(0, 10);
    let endIso = (endDateStr || startDateStr).slice(0, 10);

    let startObj: Date;
    let endObj: Date;

    if (isAllDay) {
      startObj = new Date(`${startIso}T00:00:00.000Z`);
      endObj = new Date(`${endIso}T23:59:59.999Z`);
    } else {
      const sTime = startTime && /^\d{1,2}:\d{2}$/.test(startTime) ? startTime : '09:00';
      const eTime = endTime && /^\d{1,2}:\d{2}$/.test(endTime) ? endTime : '10:00';

      const sHour = sTime.split(':')[0].padStart(2, '0');
      const sMin = sTime.split(':')[1].padStart(2, '0');
      const eHour = eTime.split(':')[0].padStart(2, '0');
      const eMin = eTime.split(':')[1].padStart(2, '0');

      startObj = new Date(`${startIso}T${sHour}:${sMin}:00.000Z`);
      endObj = new Date(`${endIso}T${eHour}:${eMin}:00.000Z`);
    }

    if (isNaN(startObj.getTime()) || isNaN(endObj.getTime())) {
      throw new BadRequestException('فرمت تاریخ‌های شروع یا پایان نامعتبر است');
    }

    if (endObj < startObj) {
      throw new BadRequestException('تاریخ و زمان پایان نمی‌تواند قبل از تاریخ و زمان شروع باشد');
    }

    return { startDate: startObj, endDate: endObj };
  }

  /**
   * اعتبارسنجی موجودیت مرتبط در صورت مشخص شدن
   */
  private async validateRelatedEntity(
    orgId: string,
    relatedType?: TaskRelatedType,
    relatedId?: string,
  ): Promise<{ title?: string; url?: string }> {
    if (!relatedType || !relatedId) return {};

    switch (relatedType) {
      case TaskRelatedType.campaign: {
        const campaign = await this.prisma.campaign.findFirst({
          where: { id: relatedId, organizationId: orgId },
          select: { id: true, name: true },
        });
        if (!campaign) {
          throw new BadRequestException('کمپین مرتبط با شناسه مشخص‌شده در این سازمان یافت نشد');
        }
        return {
          title: campaign.name,
          url: `/campaigns/${campaign.id}`,
        };
      }
      case TaskRelatedType.webinar: {
        const webinar = await this.prisma.webinar.findFirst({
          where: { id: relatedId, organizationId: orgId },
          select: { id: true, title: true },
        });
        if (!webinar) {
          throw new BadRequestException('وبینار مرتبط با شناسه مشخص‌شده در این سازمان یافت نشد');
        }
        return {
          title: webinar.title,
          url: `/leads/webinars/${webinar.id}`,
        };
      }
      case TaskRelatedType.sop:
      case TaskRelatedType.lead:
      case TaskRelatedType.meeting:
      case TaskRelatedType.equipment: {
        return {
          title: `پرونده مرتبط (${relatedType})`,
          url: relatedType === 'sop' ? '/work/tasks' : relatedType === 'lead' ? `/leads/${relatedId}` : '/performance/dashboard',
        };
      }
      default:
        return {};
    }
  }

  /**
   * تبدیل رکورد دیتابیس پریزما به خروجی منطبق بر مشخصات کامل فرانت‌اند تقویم
   */
  private formatCalendarEvent(event: any) {
    const startDateIso = event.startDate ? event.startDate.toISOString().slice(0, 10) : '';
    const endDateIso = event.endDate ? event.endDate.toISOString().slice(0, 10) : startDateIso;

    // استخراج ساعت شروع و پایان
    let startTime = event.startTime;
    let endTime = event.endTime;

    if (!startTime && event.startDate && !event.isAllDay) {
      startTime = event.startDate.toISOString().slice(11, 16);
    }
    if (!endTime && event.endDate && !event.isAllDay) {
      endTime = event.endDate.toISOString().slice(11, 16);
    }

    // نگاشت مسئول رویداد
    const assigneeUser = event.assignee || event.createdBy;
    const assignee = assigneeUser
      ? {
          id: assigneeUser.id,
          name: assigneeUser.fullName || assigneeUser.email,
          avatar: assigneeUser.avatarUrl || undefined,
          role: assigneeUser.memberships?.[0]?.role || undefined,
        }
      : undefined;

    // نگاشت موجودیت مرتبط
    let relatedEntity: any = undefined;
    if (event.relatedType && event.relatedId) {
      let title = event.relatedTitle || `پرونده ${event.relatedType}`;
      let url = `/work/tasks`;
      if (event.relatedType === 'campaign') {
        url = `/campaigns/${event.relatedId}`;
        title = event.campaign?.name || title;
      } else if (event.relatedType === 'webinar') {
        url = `/leads/webinars/${event.relatedId}`;
        title = event.webinar?.title || title;
      } else if (event.relatedType === 'lead') {
        url = `/leads/${event.relatedId}`;
      } else if (event.relatedType === 'meeting') {
        url = `/performance/dashboard`;
      }

      relatedEntity = {
        type: event.relatedType,
        id: event.relatedId,
        title,
        url,
      };
    }

    // نگاشت وضعیت تجهیزات (ص ۱۹ §۲۰)
    const equipment: any[] = [];
    if (event.equipmentStatus) {
      const statusLabel =
        event.equipmentStatus === 'ready'
          ? 'آماده و تست‌شده'
          : event.equipmentStatus === 'incomplete'
          ? 'ناقص'
          : 'تهیه‌نشده';

      equipment.push({
        name: 'تجهیزات رویداد',
        status: event.equipmentStatus,
        statusLabel,
      });
    }

    return {
      id: event.id,
      title: event.title,
      description: event.description || undefined,
      eventType: event.eventType,
      startDate: startDateIso,
      endDate: endDateIso,
      isAllDay: event.isAllDay,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      color: event.color || undefined,
      assignee,
      relatedEntity,
      equipment: equipment.length > 0 ? equipment : undefined,
      organizationId: event.organizationId,
      createdAt: event.createdAt ? event.createdAt.toISOString() : undefined,
      updatedAt: event.updatedAt ? event.updatedAt.toISOString() : undefined,
    };
  }

  /**
   * دریافت فهرست رویدادهای تقویم با فیلترهای تاریخی، نوع رویداد، و موجودیت مرتبط
   */
  async findAll(query: QueryCalendarEventsDto, user: CurrentUserPayload) {
    this.assertReadAccess(user);
    const orgId = this.resolveOrganizationId(user);

    const where: Prisma.CalendarEventWhereInput = {
      organizationId: orgId,
    };

    // فیلتر بازه تاریخی
    if (query.startDate && query.endDate) {
      const sDate = new Date(`${query.startDate.slice(0, 10)}T00:00:00.000Z`);
      const eDate = new Date(`${query.endDate.slice(0, 10)}T23:59:59.999Z`);
      where.OR = [
        {
          startDate: { gte: sDate, lte: eDate },
        },
        {
          endDate: { gte: sDate, lte: eDate },
        },
        {
          AND: [
            { startDate: { lte: sDate } },
            { endDate: { gte: eDate } },
          ],
        },
      ];
    } else if (query.startDate) {
      const sDate = new Date(`${query.startDate.slice(0, 10)}T00:00:00.000Z`);
      where.endDate = { gte: sDate };
    } else if (query.endDate) {
      const eDate = new Date(`${query.endDate.slice(0, 10)}T23:59:59.999Z`);
      where.startDate = { lte: eDate };
    }

    // فیلتر انواع رویداد
    if (query.eventType) {
      const types = query.eventType.split(',').map((t) => t.trim()).filter(Boolean);
      if (types.length === 1) {
        where.eventType = types[0];
      } else if (types.length > 1) {
        where.eventType = { in: types };
      }
    }

    // فیلتر موجودیت مرتبط
    if (query.relatedType) {
      where.relatedType = query.relatedType as TaskRelatedType;
    }
    if (query.relatedId) {
      where.relatedId = query.relatedId;
    }

    // جستجوی متنی
    if (query.search && query.search.trim()) {
      const q = query.search.trim();
      where.AND = [
        {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { assignee: { fullName: { contains: q, mode: 'insensitive' } } },
          ],
        },
      ];
    }

    const events = await this.prisma.calendarEvent.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
            memberships: {
              where: { organizationId: orgId },
              select: { role: true },
            },
          },
        },
        assignee: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
            memberships: {
              where: { organizationId: orgId },
              select: { role: true },
            },
          },
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    });

    return events.map((e) => this.formatCalendarEvent(e));
  }

  /**
   * دریافت مشخصات یک رویداد خاص
   */
  async findOne(id: string, user: CurrentUserPayload) {
    this.assertReadAccess(user);
    const orgId = this.resolveOrganizationId(user);

    const event = await this.prisma.calendarEvent.findFirst({
      where: { id, organizationId: orgId },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
            memberships: {
              where: { organizationId: orgId },
              select: { role: true },
            },
          },
        },
        assignee: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
            memberships: {
              where: { organizationId: orgId },
              select: { role: true },
            },
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException(`رویداد تقویم با شناسه ${id} یافت نشد`);
    }

    return this.formatCalendarEvent(event);
  }

  /**
   * ایجاد رویداد جدید در تقویم سازمان
   */
  async create(dto: CreateCalendarEventDto, user: CurrentUserPayload) {
    this.assertWriteAccess(user);
    const orgId = this.resolveOrganizationId(user);

    const { startDate, endDate } = this.parseEventDates(
      dto.startDate,
      dto.endDate,
      dto.isAllDay,
      dto.startTime,
      dto.endTime,
    );

    const relType = dto.relatedType || (dto as any).relatedEntityType;
    const relId = dto.relatedId || (dto as any).relatedEntityId;

    // اعتبارسنجی موجودیت مرتبط
    await this.validateRelatedEntity(orgId, relType, relId);

    // اعتبارسنجی مسئول رویداد
    let assigneeId: string | null = null;
    if (dto.assigneeId) {
      const userExists = await this.prisma.user.findFirst({
        where: {
          id: dto.assigneeId,
          isActive: true,
          memberships: { some: { organizationId: orgId, status: 'active' } },
        },
      });
      if (!userExists) {
        throw new BadRequestException('کاربر تعیین‌شده به عنوان مسئول در این سازمان عضو فعال نیست');
      }
      assigneeId = dto.assigneeId;
    } else {
      assigneeId = user.id;
    }

    const created = await this.prisma.calendarEvent.create({
      data: {
        organizationId: orgId,
        title: dto.title,
        description: dto.description || null,
        eventType: dto.eventType,
        startDate,
        endDate,
        isAllDay: dto.isAllDay ?? false,
        startTime: dto.startTime || null,
        endTime: dto.endTime || null,
        color: dto.color || null,
        relatedType: relType || null,
        relatedId: relId || null,
        createdById: user.id,
        assigneeId,
        equipmentStatus: dto.equipmentStatus || null,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
            memberships: {
              where: { organizationId: orgId },
              select: { role: true },
            },
          },
        },
        assignee: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
            memberships: {
              where: { organizationId: orgId },
              select: { role: true },
            },
          },
        },
      },
    });

    this.logger.log(`Created calendar event ${created.id} by user ${user.id} in org ${orgId}`);
    return this.formatCalendarEvent(created);
  }

  /**
   * ویرایش مشخصات یا زمان‌بندی رویداد تقویم
   */
  async update(id: string, dto: UpdateCalendarEventDto, user: CurrentUserPayload) {
    const orgId = this.resolveOrganizationId(user);

    const existing = await this.prisma.calendarEvent.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!existing) {
      throw new NotFoundException(`رویداد تقویم با شناسه ${id} یافت نشد`);
    }

    this.assertWriteAccess(user, existing);

    const updateData: Prisma.CalendarEventUpdateInput = {};

    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.eventType !== undefined) updateData.eventType = dto.eventType;
    if (dto.color !== undefined) updateData.color = dto.color;
    if (dto.isAllDay !== undefined) updateData.isAllDay = dto.isAllDay;
    if (dto.startTime !== undefined) updateData.startTime = dto.startTime;
    if (dto.endTime !== undefined) updateData.endTime = dto.endTime;
    if (dto.equipmentStatus !== undefined) updateData.equipmentStatus = dto.equipmentStatus;

    if (dto.startDate !== undefined || dto.endDate !== undefined) {
      const nextStartStr = dto.startDate || existing.startDate.toISOString().slice(0, 10);
      const nextEndStr = dto.endDate || existing.endDate.toISOString().slice(0, 10);
      const isAllDay = dto.isAllDay !== undefined ? dto.isAllDay : existing.isAllDay;
      const sTime = dto.startTime !== undefined ? dto.startTime : existing.startTime || undefined;
      const eTime = dto.endTime !== undefined ? dto.endTime : existing.endTime || undefined;

      const { startDate, endDate } = this.parseEventDates(nextStartStr, nextEndStr, isAllDay, sTime, eTime);
      updateData.startDate = startDate;
      updateData.endDate = endDate;
    }

    const incomingRelType = dto.relatedType !== undefined ? dto.relatedType : (dto as any).relatedEntityType;
    const incomingRelId = dto.relatedId !== undefined ? dto.relatedId : (dto as any).relatedEntityId;
    if (incomingRelType !== undefined || incomingRelId !== undefined) {
      const relType = incomingRelType !== undefined ? incomingRelType : existing.relatedType;
      const relId = incomingRelId !== undefined ? incomingRelId : existing.relatedId;
      if (relType && relId) {
        await this.validateRelatedEntity(orgId, relType, relId);
        updateData.relatedType = relType;
        updateData.relatedId = relId;
      } else {
        updateData.relatedType = null;
        updateData.relatedId = null;
      }
    }

    if (dto.assigneeId !== undefined) {
      if (dto.assigneeId) {
        const userExists = await this.prisma.user.findFirst({
          where: {
            id: dto.assigneeId,
            isActive: true,
            memberships: { some: { organizationId: orgId, status: 'active' } },
          },
        });
        if (!userExists) {
          throw new BadRequestException('کاربر تعیین‌شده در این سازمان عضو نیست');
        }
        updateData.assignee = { connect: { id: dto.assigneeId } };
      } else {
        updateData.assignee = { disconnect: true };
      }
    }

    const updated = await this.prisma.calendarEvent.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
            memberships: {
              where: { organizationId: orgId },
              select: { role: true },
            },
          },
        },
        assignee: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
            memberships: {
              where: { organizationId: orgId },
              select: { role: true },
            },
          },
        },
      },
    });

    this.logger.log(`Updated calendar event ${id} by user ${user.id}`);
    return this.formatCalendarEvent(updated);
  }

  /**
   * حذف رویداد تقویم
   */
  async delete(id: string, user: CurrentUserPayload) {
    const orgId = this.resolveOrganizationId(user);

    const existing = await this.prisma.calendarEvent.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!existing) {
      throw new NotFoundException(`رویداد تقویم با شناسه ${id} یافت نشد`);
    }

    this.assertWriteAccess(user, existing);

    await this.prisma.calendarEvent.delete({
      where: { id },
    });

    this.logger.log(`Deleted calendar event ${id} by user ${user.id}`);
    return { success: true, message: 'رویداد با موفقیت حذف شد' };
  }
}
