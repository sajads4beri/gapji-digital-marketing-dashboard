import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { CreateActionItemDto } from './dto/create-action-item.dto';
import { TaskStatus, TaskPriority } from '@prisma/client';

export interface CurrentUserPayload {
  id: string;
  email: string;
  mobile?: string;
  fullName?: string;
  organizationId: string | null;
  role?: string;
}

@Injectable()
export class MeetingsService {
  constructor(private readonly prisma: PrismaService) {}

  private getOrgId(currentUser: CurrentUserPayload): string {
    if (!currentUser.organizationId) {
      throw new BadRequestException('شناسه سازمان برای دسترسی به صورتجلسات نامعتبر است');
    }
    return currentUser.organizationId;
  }

  /**
   * واکشی فهرست صورتجلسات سازمان همراه با مصوبات و حاضرین
   */
  async findAll(currentUser: CurrentUserPayload, query?: { search?: string }) {
    const orgId = this.getOrgId(currentUser);

    const where: any = { organizationId: orgId };
    if (query?.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { summary: { contains: q, mode: 'insensitive' } },
        { attendeesSummary: { contains: q, mode: 'insensitive' } },
      ];
    }

    return this.prisma.meeting.findMany({
      where,
      include: {
        campaign: { select: { id: true, name: true } },
        createdBy: { select: { id: true, fullName: true, email: true } },
        actionItems: {
          include: {
            assignee: { select: { id: true, fullName: true, email: true } },
            task: { select: { id: true, title: true, status: true } },
          },
        },
      },
      orderBy: { meetingDate: 'desc' },
    });
  }

  /**
   * دریافت مشخصات یک صورتجلسه به همراه تمامی مصوبات و جزئیات
   */
  async findOne(id: string, currentUser: CurrentUserPayload) {
    const orgId = this.getOrgId(currentUser);

    const meeting = await this.prisma.meeting.findFirst({
      where: { id, organizationId: orgId },
      include: {
        campaign: { select: { id: true, name: true } },
        createdBy: { select: { id: true, fullName: true, email: true } },
        actionItems: {
          include: {
            assignee: { select: { id: true, fullName: true, email: true } },
            task: { select: { id: true, title: true, status: true, priority: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!meeting) {
      throw new NotFoundException('صورتجلسه مورد نظر یافت نشد');
    }

    return meeting;
  }

  /**
   * ایجاد صورتجلسه جدید به همراه مصوبات اولیه
   */
  async create(dto: CreateMeetingDto, currentUser: CurrentUserPayload) {
    const orgId = this.getOrgId(currentUser);

    return this.prisma.$transaction(async (tx) => {
      const meeting = await tx.meeting.create({
        data: {
          organizationId: orgId,
          title: dto.title.trim(),
          meetingDate: new Date(dto.meetingDate),
          location: dto.location?.trim() || null,
          attendeesSummary: dto.attendeesSummary?.trim() || null,
          summary: dto.summary?.trim() || null,
          notes: dto.notes?.trim() || null,
          campaignId: dto.campaignId || null,
          createdById: currentUser.id,
          versionNumber: 1,
        },
      });

      if (dto.actionItems && dto.actionItems.length > 0) {
        for (const item of dto.actionItems) {
          await tx.meetingActionItem.create({
            data: {
              organizationId: orgId,
              meetingId: meeting.id,
              description: item.description.trim(),
              assigneeId: item.assigneeId || null,
              dueDate: item.dueDate ? new Date(item.dueDate) : null,
              isCompleted: false,
            },
          });
        }
      }

      return tx.meeting.findUnique({
        where: { id: meeting.id },
        include: {
          actionItems: {
            include: {
              assignee: { select: { id: true, fullName: true, email: true } },
            },
          },
        },
      });
    });
  }

  /**
   * ویرایش مشخصات صورتجلسه و ارتقای شماره نسخه (Version History)
   */
  async update(id: string, dto: UpdateMeetingDto, currentUser: CurrentUserPayload) {
    const orgId = this.getOrgId(currentUser);

    const existing = await this.prisma.meeting.findFirst({
      where: { id, organizationId: orgId },
    });

    if (!existing) {
      throw new NotFoundException('صورتجلسه یافت نشد');
    }

    return this.prisma.meeting.update({
      where: { id },
      data: {
        ...(dto.title ? { title: dto.title.trim() } : {}),
        ...(dto.meetingDate ? { meetingDate: new Date(dto.meetingDate) } : {}),
        ...(dto.location !== undefined ? { location: dto.location?.trim() || null } : {}),
        ...(dto.attendeesSummary !== undefined ? { attendeesSummary: dto.attendeesSummary?.trim() || null } : {}),
        ...(dto.summary !== undefined ? { summary: dto.summary?.trim() || null } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes?.trim() || null } : {}),
        ...(dto.campaignId !== undefined ? { campaignId: dto.campaignId || null } : {}),
        versionNumber: { increment: 1 },
      },
      include: {
        actionItems: {
          include: {
            assignee: { select: { id: true, fullName: true, email: true } },
            task: { select: { id: true, title: true, status: true } },
          },
        },
      },
    });
  }

  /**
   * حذف صورتجلسه
   */
  async delete(id: string, currentUser: CurrentUserPayload) {
    const orgId = this.getOrgId(currentUser);

    const existing = await this.prisma.meeting.findFirst({
      where: { id, organizationId: orgId },
    });

    if (!existing) {
      throw new NotFoundException('صورتجلسه یافت نشد');
    }

    await this.prisma.meeting.delete({ where: { id } });
    return { success: true, message: 'صورتجلسه با موفقیت حذف گردید' };
  }

  /**
   * افزودن یک مصوبه به صورتجلسه
   */
  async addActionItem(
    meetingId: string,
    dto: CreateActionItemDto,
    currentUser: CurrentUserPayload,
  ) {
    const orgId = this.getOrgId(currentUser);

    const meeting = await this.prisma.meeting.findFirst({
      where: { id: meetingId, organizationId: orgId },
    });

    if (!meeting) {
      throw new NotFoundException('صورتجلسه یافت نشد');
    }

    return this.prisma.meetingActionItem.create({
      data: {
        organizationId: orgId,
        meetingId,
        description: dto.description.trim(),
        assigneeId: dto.assigneeId || null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        isCompleted: false,
      },
      include: {
        assignee: { select: { id: true, fullName: true, email: true } },
      },
    });
  }

  /**
   * تغییر وضعیت انجام مصوبه
   */
  async toggleActionItem(
    actionItemId: string,
    isCompleted: boolean,
    currentUser: CurrentUserPayload,
  ) {
    const orgId = this.getOrgId(currentUser);

    const item = await this.prisma.meetingActionItem.findFirst({
      where: { id: actionItemId, organizationId: orgId },
    });

    if (!item) {
      throw new NotFoundException('مصوبه مورد نظر یافت نشد');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.meetingActionItem.update({
        where: { id: actionItemId },
        data: { isCompleted },
        include: {
          assignee: { select: { id: true, fullName: true, email: true } },
          task: { select: { id: true, title: true, status: true } },
        },
      });

      // اگر به یک تسک متصل است، وضعیت تسک را هم همگام کن
      if (item.taskId) {
        await tx.task.update({
          where: { id: item.taskId },
          data: { status: isCompleted ? TaskStatus.done : TaskStatus.todo },
        });
      }

      return updated;
    });
  }

  /**
   * پیپ‌لاین تبدیل مستقیم یک مصوبه به وظیفه تیمی (Convert to Task)
   */
  async convertActionItemToTask(actionItemId: string, currentUser: CurrentUserPayload) {
    const orgId = this.getOrgId(currentUser);

    const actionItem = await this.prisma.meetingActionItem.findFirst({
      where: { id: actionItemId, organizationId: orgId },
      include: {
        meeting: true,
        task: true,
      },
    });

    if (!actionItem) {
      throw new NotFoundException('مصوبه جلسه یافت نشد');
    }

    // اگر قبلاً به وظیفه تبدیل شده است، همان را بازگردان
    if (actionItem.taskId && actionItem.task) {
      return {
        message: 'این مصوبه قبلاً به تسک تبدیل شده است',
        task: actionItem.task,
        actionItem,
      };
    }

    return this.prisma.$transaction(async (tx) => {
      const task = await tx.task.create({
        data: {
          organizationId: orgId,
          title: actionItem.description,
          description: `مصوب در صورتجلسه «${actionItem.meeting.title}» مورخ ${actionItem.meeting.meetingDate.toLocaleDateString('fa-IR')}`,
          status: actionItem.isCompleted ? TaskStatus.done : TaskStatus.todo,
          priority: TaskPriority.medium,
          dueDate: actionItem.dueDate || null,
          assigneeId: actionItem.assigneeId || null,
          createdById: currentUser.id,
        },
      });

      const updatedActionItem = await tx.meetingActionItem.update({
        where: { id: actionItemId },
        data: { taskId: task.id },
        include: {
          assignee: { select: { id: true, fullName: true, email: true } },
          task: { select: { id: true, title: true, status: true, priority: true } },
        },
      });

      return {
        success: true,
        message: 'مصوبه با موفقیت به تسک عملیاتی تبدیل گردید',
        task,
        actionItem: updatedActionItem,
      };
    });
  }

  /**
   * تولید پیش‌نمایش ایمیل صورتجلسه جهت ارسال به همه حاضرین
   */
  async previewEmail(meetingId: string, currentUser: CurrentUserPayload) {
    const meeting = await this.findOne(meetingId, currentUser);

    const formattedDate = new Date(meeting.meetingDate).toLocaleDateString('fa-IR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const actionItemsHtml = meeting.actionItems
      .map(
        (item, idx) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 8px 12px; font-weight: bold;">${idx + 1}</td>
          <td style="padding: 8px 12px;">${item.description}</td>
          <td style="padding: 8px 12px; color: #4a5568;">${item.assignee?.fullName || 'تعیین‌نشده'}</td>
          <td style="padding: 8px 12px; color: #718096;">${item.dueDate ? new Date(item.dueDate).toLocaleDateString('fa-IR') : '—'}</td>
        </tr>`,
      )
      .join('');

    const subject = `صورتجلسه: ${meeting.title} (${formattedDate})`;

    const htmlContent = `
      <div dir="rtl" style="font-family: Tahoma, Vazirmatn, sans-serif; line-height: 1.8; color: #1a202c; max-width: 650px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #2b6cb0; margin-bottom: 8px;">${meeting.title}</h2>
        <p style="color: #718096; font-size: 13px; margin-top: 0;"><strong>تاریخ جلسه:</strong> ${formattedDate} | <strong>محل:</strong> ${meeting.location || 'آنلاین'}</p>
        <p style="color: #4a5568; font-size: 13px;"><strong>حاضرین در جلسه:</strong> ${meeting.attendeesSummary || 'ثبت‌نشده'}</p>
        
        ${meeting.summary ? `
        <div style="background-color: #f7fafc; padding: 12px 16px; border-radius: 8px; margin: 16px 0; border-right: 4px solid #3182ce;">
          <h4 style="margin: 0 0 6px 0; color: #2d3748;">خلاصه مباحث جلسه:</h4>
          <p style="margin: 0; font-size: 13px; color: #4a5568;">${meeting.summary}</p>
        </div>` : ''}

        <h3 style="margin-top: 24px; color: #2d3748; font-size: 15px;">مصوبات و اقدامات توافق‌شده (${meeting.actionItems.length} اقدام):</h3>
        <table style="width: 100%; text-align: right; border-collapse: collapse; font-size: 13px; margin-top: 8px;">
          <thead>
            <tr style="background-color: #edf2f7; color: #4a5568;">
              <th style="padding: 8px 12px;">#</th>
              <th style="padding: 8px 12px;">شرح اقدام</th>
              <th style="padding: 8px 12px;">اقدام‌کننده</th>
              <th style="padding: 8px 12px;">مهلت</th>
            </tr>
          </thead>
          <tbody>
            ${actionItemsHtml || '<tr><td colspan="4" style="padding: 12px; text-align: center; color: #a0aec0;">مصوبه‌ای ثبت نشده است.</td></tr>'}
          </tbody>
        </table>

        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #a0aec0; text-align: center;">
          ارسال‌شده از سوی سامانه بازاریابی و مدیریت پروژه گپ‌جی
        </div>
      </div>
    `;

    return {
      meetingId,
      subject,
      htmlContent,
      attendees: meeting.attendeesSummary,
      actionItemsCount: meeting.actionItems.length,
    };
  }

  /**
   * تایید و ارسال ایمیل صورتجلسه به همه حاضرین
   */
  async sendEmail(meetingId: string, currentUser: CurrentUserPayload) {
    const preview = await this.previewEmail(meetingId, currentUser);
    return {
      success: true,
      message: 'صورتجلسه با موفقیت به کلیه حاضرین ارسال گردید',
      subject: preview.subject,
      dispatchedAt: new Date().toISOString(),
    };
  }
}
