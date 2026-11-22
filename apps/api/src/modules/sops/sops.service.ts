import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateSopDto } from './dto/create-sop.dto';
import { UpdateSopDto } from './dto/update-sop.dto';
import { CreateTaskFromSopDto } from './dto/create-task-from-sop.dto';
import { SopStatus, TaskPriority } from '@prisma/client';

export interface CurrentUserPayload {
  id: string;
  organizationId?: string;
  role?: string;
  email?: string;
}

@Injectable()
export class SopsService {
  constructor(private readonly prisma: PrismaService) {}

  private getOrgId(currentUser: CurrentUserPayload): string {
    const orgId = currentUser.organizationId;
    if (!orgId) {
      throw new BadRequestException('شناسه سازمان در نشست کاربر یافت نشد.');
    }
    return orgId;
  }

  /**
   * دریافت لیست دستورالعمل‌های استاندارد (SOP) با پشتیبانی از فیلتر دسته‌بندی و جستجو
   */
  async findAll(
    user: CurrentUserPayload,
    query?: { category?: string; status?: string; search?: string }
  ) {
    const orgId = this.getOrgId(user);
    const where: any = {
      organizationId: orgId,
    };

    if (query?.category && query.category !== 'all') {
      where.category = query.category;
    }

    if (query?.status && query.status !== 'all') {
      where.status = query.status as SopStatus;
    }

    if (query?.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { code: { contains: term, mode: 'insensitive' } },
        { content: { contains: term, mode: 'insensitive' } },
      ];
    }

    const sops = await this.prisma.sop.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }],
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        approver: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            versions: true,
            tasksUsingSop: true,
          },
        },
      },
    });

    return sops;
  }

  /**
   * دریافت جزئیات یک دستورالعمل به همراه تاریخچه نسخه‌ها
   */
  async findById(user: CurrentUserPayload, id: string) {
    const orgId = this.getOrgId(user);
    const sop = await this.prisma.sop.findFirst({
      where: {
        id,
        organizationId: orgId,
      },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        approver: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        versions: {
          orderBy: { createdAt: 'desc' },
          include: {
            createdBy: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            tasksUsingSop: true,
          },
        },
      },
    });

    if (!sop) {
      throw new NotFoundException('دستورالعمل مورد نظر یافت نشد.');
    }

    return sop;
  }

  /**
   * ایجاد دستورالعمل استاندارد جدید و ثبت نگارش اولیه (v1.0)
   */
  async create(user: CurrentUserPayload, dto: CreateSopDto) {
    const orgId = this.getOrgId(user);

    // بررسی تکراری نبودن کد دستورالعمل در سازمان
    const existingCode = await this.prisma.sop.findFirst({
      where: {
        organizationId: orgId,
        code: dto.code.trim().toUpperCase(),
      },
    });

    if (existingCode) {
      throw new BadRequestException(`دستورالعملی با شناسه «${dto.code}» قبلاً ثبت شده است.`);
    }

    const sop = await this.prisma.sop.create({
      data: {
        organizationId: orgId,
        title: dto.title.trim(),
        code: dto.code.trim().toUpperCase(),
        category: dto.category.trim(),
        content: dto.content,
        status: dto.status || SopStatus.draft,
        authorId: user.id,
        approverId: dto.approverId || null,
        currentVersion: '1.0',
        versions: {
          create: {
            versionNumber: '1.0',
            changeSummary: 'نگارش و ایجاد اولیه دستورالعمل',
            content: dto.content,
            createdById: user.id,
          },
        },
      },
      include: {
        author: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
        versions: true,
      },
    });

    return sop;
  }

  /**
   * ویرایش دستورالعمل با پشتیبانی از سیستم نسخه‌بندی خودکار
   */
  async update(user: CurrentUserPayload, id: string, dto: UpdateSopDto) {
    const orgId = this.getOrgId(user);
    const existing = await this.findById(user, id);

    let nextVersion = existing.currentVersion;
    const contentChanged = dto.content !== undefined && dto.content !== existing.content;

    if (contentChanged || dto.changeSummary || dto.bumpMajor) {
      const parts = existing.currentVersion.split('.');
      const major = parseInt(parts[0], 10) || 1;
      const minor = parseInt(parts[1], 10) || 0;

      if (dto.bumpMajor) {
        nextVersion = `${major + 1}.0`;
      } else {
        nextVersion = `${major}.${minor + 1}`;
      }
    }

    const updated = await this.prisma.$transaction(async (tx: any) => {
      // اگر شماره نسخه ارتقا پیدا کرده، رکورد نسخه جدید ثبت شود
      if (nextVersion !== existing.currentVersion) {
        await tx.sopVersion.create({
          data: {
            organizationId: orgId,
            sopId: existing.id,
            versionNumber: nextVersion,
            changeSummary: dto.changeSummary || (dto.bumpMajor ? 'ارتقای نسخه اصلی' : 'ویرایش و اصلاح محتوای دستورالعمل'),
            content: dto.content !== undefined ? dto.content : existing.content,
            createdById: user.id,
          },
        });
      }

      return tx.sop.update({
        where: { id: existing.id },
        data: {
          title: dto.title !== undefined ? dto.title.trim() : undefined,
          code: dto.code !== undefined ? dto.code.trim().toUpperCase() : undefined,
          category: dto.category !== undefined ? dto.category.trim() : undefined,
          content: dto.content !== undefined ? dto.content : undefined,
          status: dto.status !== undefined ? dto.status : undefined,
          approverId: dto.approverId !== undefined ? dto.approverId : undefined,
          currentVersion: nextVersion,
        },
        include: {
          author: { select: { id: true, fullName: true, avatarUrl: true } },
          approver: { select: { id: true, fullName: true, avatarUrl: true } },
          versions: {
            orderBy: { createdAt: 'desc' },
            include: {
              createdBy: { select: { id: true, fullName: true, avatarUrl: true } },
            },
          },
        },
      });
    });

    return updated;
  }

  /**
   * حذف دستورالعمل
   */
  async delete(user: CurrentUserPayload, id: string) {
    const existing = await this.findById(user, id);

    await this.prisma.sop.delete({
      where: { id: existing.id },
    });

    return { success: true, message: 'دستورالعمل استاندارد با موفقیت حذف شد.' };
  }

  /**
   * دریافت تاریخچه نسخه‌های یک دستورالعمل
   */
  async getVersions(user: CurrentUserPayload, id: string) {
    const orgId = this.getOrgId(user);
    await this.findById(user, id);

    return this.prisma.sopVersion.findMany({
      where: {
        sopId: id,
        organizationId: orgId,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
      },
    });
  }

  /**
   * بازگشت (Rollback) به یکی از نسخه‌های تاریخی
   */
  async rollbackVersion(
    user: CurrentUserPayload,
    sopId: string,
    targetVersionNumber: string
  ) {
    const orgId = this.getOrgId(user);
    const existing = await this.findById(user, sopId);

    const historical = await this.prisma.sopVersion.findFirst({
      where: {
        sopId,
        versionNumber: targetVersionNumber,
        organizationId: orgId,
      },
    });

    if (!historical) {
      throw new NotFoundException(`نسخه «${targetVersionNumber}» برای این دستورالعمل یافت نشد.`);
    }

    const parts = existing.currentVersion.split('.');
    const major = parseInt(parts[0], 10) || 1;
    const minor = parseInt(parts[1], 10) || 0;
    const newVersionNumber = `${major}.${minor + 1}`;

    const updated = await this.prisma.$transaction(async (tx: any) => {
      await tx.sopVersion.create({
        data: {
          organizationId: orgId,
          sopId: existing.id,
          versionNumber: newVersionNumber,
          changeSummary: `بازگشت به نسخه تاریخی ${targetVersionNumber}`,
          content: historical.content,
          createdById: user.id,
        },
      });

      return tx.sop.update({
        where: { id: existing.id },
        data: {
          content: historical.content,
          currentVersion: newVersionNumber,
        },
        include: {
          versions: {
            orderBy: { createdAt: 'desc' },
            include: {
              createdBy: { select: { id: true, fullName: true, avatarUrl: true } },
            },
          },
        },
      });
    });

    return updated;
  }

  /**
   * تبدیل مستقیم و ایجاد وظیفه عملیاتی (Task) از روی دستورالعمل
   * گام‌ها و چک‌لیست‌های موجود در متن SOP به عنوان Subtask در وظیفه ثبت می‌شوند.
   */
  async createTaskFromSop(
    user: CurrentUserPayload,
    id: string,
    dto: CreateTaskFromSopDto
  ) {
    const orgId = this.getOrgId(user);
    const sop = await this.findById(user, id);

    // استخراج چک‌لیست‌ها و گام‌های اجرایی از متن دستورالعمل
    const subtaskTitles: string[] = [];
    if (dto.parseChecklistAsSubtasks !== false && sop.content) {
      const lines = sop.content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        // چک‌باکس مارک‌داون مثل - [ ] گام اول
        const checkboxMatch = trimmed.match(/^[-*]\s*\[\s*[xX]?\s*\]\s+(.+)$/);
        if (checkboxMatch) {
          subtaskTitles.push(checkboxMatch[1].trim());
          continue;
        }
        // گام‌های شماره‌دار مثل 1. گام اول
        const numberedMatch = trimmed.match(/^\d+[\.\)]\s+(.+)$/);
        if (numberedMatch && numberedMatch[1].length > 3) {
          subtaskTitles.push(numberedMatch[1].trim());
        }
      }
    }

    const taskTitle =
      dto.title?.trim() || `[اجرای دستورالعمل] ${sop.title} (${sop.code})`;

    const description = `وظیفه عملیاتی ایجاد شده بر اساس دستورالعمل رسمی:\n` +
      `عنوان دستورالعمل: ${sop.title}\n` +
      `کد مرجع: ${sop.code}\n` +
      `نسخه معتبر: ${sop.currentVersion}\n\n` +
      `لطفاً مراحل مندرج در این وظیفه و دستورالعمل را به دقت دنبال نمایید.`;

    const task = await this.prisma.task.create({
      data: {
        organizationId: orgId,
        title: taskTitle,
        description,
        status: 'todo',
        priority: dto.priority || TaskPriority.medium,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        assigneeId: dto.assigneeId || user.id,
        createdById: user.id,
        relatedType: 'sop',
        relatedId: sop.id,
        sopId: sop.id,
        subtasks: subtaskTitles.length > 0 ? {
          create: subtaskTitles.map((title, idx) => ({
            organizationId: orgId,
            title: title.slice(0, 250),
            isCompleted: false,
            sortOrder: idx + 1,
          })),
        } : undefined,
      },
      include: {
        assignee: { select: { id: true, fullName: true, avatarUrl: true } },
        subtasks: true,
      },
    });

    return {
      success: true,
      message: 'وظیفه عملیاتی با موفقیت بر اساس این دستورالعمل ایجاد شد.',
      task,
    };
  }
}
