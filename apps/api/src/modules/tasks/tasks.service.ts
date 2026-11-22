import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TaskStatus, TaskPriority, TaskRelatedType } from '@prisma/client';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { GetTasksFilterDto } from './dto/get-tasks-filter.dto';
import { CreateTaskSubtaskDto } from './dto/create-task-subtask.dto';
import { UpdateTaskSubtaskDto } from './dto/update-task-subtask.dto';
import { CreateTaskCommentDto } from './dto/create-task-comment.dto';

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
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * بررسی دسترسی نقش کاربر به ماژول تسک‌ها بر اساس DEC-AUTH-11 و ماتریس مصوب
   * نقش client دسترسی ندارد.
   */
  private assertTasksAccess(user: CurrentUserPayload) {
    if (!user) {
      throw new ForbiddenException('کاربر احراز هویت نشده است');
    }
    if (user.role === 'client') {
      throw new ForbiddenException('نقش کارفرما به ماژول مدیریت تسک‌ها دسترسی ندارد');
    }
  }

  /**
   * ثبت لاگ عملیات در جدول UserActivityLog
   */
  private async logActivity(
    orgId: string,
    userId: string,
    action: string,
    taskId: string,
    details?: string,
  ) {
    try {
      await this.prisma.userActivityLog.create({
        data: {
          organizationId: orgId,
          userId,
          action,
          entityType: 'Task',
          entityId: taskId,
          details: details || null,
        },
      });
    } catch (err) {
      this.logger.warn(`Failed to log user activity for task ${taskId}: ${err}`);
    }
  }

  /**
   * تبدیل تاریخ به ابتدای روز تقویمی محلی
   */
  private toStartOfDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  }

  /**
   * فرمت‌بندی تسک پریزما به خروجی استاندارد مورد انتظار فرانت‌اند
   */
  private formatTaskResponse(task: any) {
    const formattedDueDate = task.dueDate
      ? task.dueDate instanceof Date
        ? task.dueDate.toISOString().slice(0, 10)
        : String(task.dueDate).slice(0, 10)
      : undefined;

    return {
      id: task.id,
      title: task.title,
      description: task.description || undefined,
      dueDate: formattedDueDate || '',
      priority: task.priority,
      status: task.status,
      assignee: task.assignee
        ? {
            id: task.assignee.id,
            name: task.assignee.fullName || task.assignee.email,
            email: task.assignee.email,
            role: task.assignee.memberships?.[0]?.role || undefined,
          }
        : undefined,
      relatedTo: task.relatedType && task.relatedId
        ? {
            type: task.relatedType,
            id: task.relatedId,
            title: task.relatedTitle || task.okrKeyResult?.objective?.campaign?.name || undefined,
          }
        : undefined,
      okr: task.okrKeyResult
        ? {
            keyResultId: task.okrKeyResult.id,
            keyResultTitle: task.okrKeyResult.title,
            currentValue:
              task.okrKeyResult.currentValue !== undefined && task.okrKeyResult.currentValue !== null
                ? Number(task.okrKeyResult.currentValue)
                : undefined,
            targetValue:
              task.okrKeyResult.targetValue !== undefined && task.okrKeyResult.targetValue !== null
                ? Number(task.okrKeyResult.targetValue)
                : undefined,
            unit: task.okrKeyResult.unit || undefined,
            objectiveId: task.okrKeyResult.objective?.id,
            objectiveTitle: task.okrKeyResult.objective?.title,
            stageKey: task.okrKeyResult.objective?.stageKey,
            campaignId: task.okrKeyResult.objective?.campaignId,
            campaignName: task.okrKeyResult.objective?.campaign?.name,
          }
        : undefined,
      sop: task.sop
        ? {
            id: task.sop.id,
            title: task.sop.title,
          }
        : undefined,
      subtasks: (task.subtasks || []).map((s: any) => ({
        id: s.id,
        title: s.title,
        completed: s.isCompleted,
        createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt,
      })),
      comments: (task.comments || []).map((c: any) => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
        author: {
          id: c.authorUser?.id || '',
          name: c.authorUser?.fullName || c.authorUser?.email || 'کاربر',
          email: c.authorUser?.email,
        },
      })),
      history: [],
      createdAt: task.createdAt instanceof Date ? task.createdAt.toISOString() : task.createdAt,
      updatedAt: task.updatedAt instanceof Date ? task.updatedAt.toISOString() : task.updatedAt,
      completedAt: task.status === 'done' ? (task.updatedAt instanceof Date ? task.updatedAt.toISOString() : task.updatedAt) : undefined,
    };
  }

  /**
   * دریافت فهرست تسک‌ها با فیلترهای چندگانه و اسکوپ سازمانی
   */
  async findAll(query: GetTasksFilterDto, currentUser: CurrentUserPayload) {
    this.assertTasksAccess(currentUser);
    const orgId = currentUser.organizationId || DEFAULT_ORGANIZATION_ID;

    const where: any = {
      organizationId: orgId,
    };

    // اسکوپ تسک‌های من در برابر تسک‌های تیم
    if (query.scope === 'my') {
      where.assigneeId = currentUser.id;
    }

    // فیلتر مسئول
    if (query.assigneeId) {
      if (query.assigneeId === 'unassigned') {
        where.assigneeId = null;
      } else {
        where.assigneeId = query.assigneeId;
      }
    }

    // فیلتر وضعیت
    if (query.status) {
      const statusTokens = query.status.split(',').map((s) => s.trim().toLowerCase());
      const hasOverdue = statusTokens.includes('overdue');
      const validStoredStatuses = statusTokens.filter(
        (s) => ['todo', 'in_progress', 'waiting', 'done'].includes(s),
      ) as TaskStatus[];

      const todayStart = this.toStartOfDay(new Date());

      if (hasOverdue && validStoredStatuses.length > 0) {
        where.OR = [
          { status: { in: validStoredStatuses } },
          {
            status: { not: TaskStatus.done },
            dueDate: { lt: todayStart },
          },
        ];
      } else if (hasOverdue) {
        where.status = { not: TaskStatus.done };
        where.dueDate = { lt: todayStart };
      } else if (validStoredStatuses.length > 0) {
        where.status = { in: validStoredStatuses };
      }
    }

    // فیلتر اولویت
    if (query.priority) {
      const priorityTokens = query.priority.split(',').map((p) => p.trim().toLowerCase());
      const validPriorities = priorityTokens.filter((p) =>
        ['urgent', 'high', 'medium', 'low'].includes(p),
      ) as TaskPriority[];
      if (validPriorities.length > 0) {
        where.priority = { in: validPriorities };
      }
    }

    // فیلتر بخش مرتبط
    if (query.relatedType) {
      where.relatedType = query.relatedType as TaskRelatedType;
    }
    if (query.relatedId) {
      where.relatedId = query.relatedId;
    }

    // فیلتر مرحله قیف فروش (OKR)
    if ((query as any).funnelStageKey) {
      where.okrKeyResult = {
        objective: {
          stageKey: (query as any).funnelStageKey,
        },
      };
    }

    // جستجوی متنی
    if (query.search && query.search.trim()) {
      const searchTerm = query.search.trim();
      const searchConditions = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ];
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchConditions }];
        delete where.OR;
      } else {
        where.OR = searchConditions;
      }
    }

    const tasks = await this.prisma.task.findMany({
      where,
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      include: {
        assignee: {
          select: {
            id: true,
            email: true,
            fullName: true,
            memberships: {
              where: { organizationId: orgId },
              select: { role: true },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        sop: {
          select: {
            id: true,
            title: true,
          },
        },
        subtasks: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            title: true,
            isCompleted: true,
            createdAt: true,
          },
        },
        comments: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            content: true,
            createdAt: true,
            authorUser: {
              select: {
                id: true,
                email: true,
                fullName: true,
              },
            },
          },
        },
        okrKeyResult: {
          select: {
            id: true,
            title: true,
            currentValue: true,
            targetValue: true,
            unit: true,
            objective: {
              select: {
                id: true,
                title: true,
                stageKey: true,
                campaignId: true,
                campaign: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
      },
    });

    // اضافه کردن نام موجودیت‌های مرتبط جهت نمایش بهینه در فرانت‌اند
    const enrichedTasks = await this.enrichRelatedTitles(tasks, orgId);

    return enrichedTasks.map((t) => this.formatTaskResponse(t));
  }

  /**
   * افزودن عنوان موجودیت مرتبط (کمپین یا لید)
   */
  private async enrichRelatedTitles(tasks: any[], orgId: string) {
    const campaignIds = tasks
      .filter((t) => t.relatedType === 'campaign' && t.relatedId)
      .map((t) => t.relatedId as string);
    const leadIds = tasks
      .filter((t) => t.relatedType === 'lead' && t.relatedId)
      .map((t) => t.relatedId as string);

    let campaignMap = new Map<string, string>();
    let leadMap = new Map<string, string>();

    if (campaignIds.length > 0) {
      const campaigns = await this.prisma.campaign.findMany({
        where: { id: { in: campaignIds }, organizationId: orgId },
        select: { id: true, name: true },
      });
      campaigns.forEach((c) => campaignMap.set(c.id, c.name));
    }

    if (leadIds.length > 0) {
      const leads = await this.prisma.lead.findMany({
        where: { id: { in: leadIds }, organizationId: orgId },
        select: { id: true, fullName: true },
      });
      leads.forEach((l) => leadMap.set(l.id, l.fullName));
    }

    return tasks.map((t) => {
      let relatedTitle: string | undefined;
      if (t.relatedType === 'campaign' && t.relatedId) {
        relatedTitle = campaignMap.get(t.relatedId);
      } else if (t.relatedType === 'lead' && t.relatedId) {
        relatedTitle = leadMap.get(t.relatedId);
      }
      return { ...t, relatedTitle };
    });
  }

  /**
   * دریافت مشخصات یک تسک با شناسه
   */
  async findOne(id: string, currentUser: CurrentUserPayload) {
    this.assertTasksAccess(currentUser);
    const orgId = currentUser.organizationId || DEFAULT_ORGANIZATION_ID;

    const task = await this.prisma.task.findFirst({
      where: {
        id,
        organizationId: orgId,
      },
      include: {
        assignee: {
          select: {
            id: true,
            email: true,
            fullName: true,
            memberships: {
              where: { organizationId: orgId },
              select: { role: true },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        sop: {
          select: {
            id: true,
            title: true,
          },
        },
        subtasks: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            title: true,
            isCompleted: true,
            createdAt: true,
          },
        },
        comments: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            content: true,
            createdAt: true,
            authorUser: {
              select: {
                id: true,
                email: true,
                fullName: true,
              },
            },
          },
        },
        okrKeyResult: {
          select: {
            id: true,
            title: true,
            currentValue: true,
            targetValue: true,
            unit: true,
            objective: {
              select: {
                id: true,
                title: true,
                stageKey: true,
                campaignId: true,
                campaign: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('تسک مورد نظر یافت نشد');
    }

    const [enriched] = await this.enrichRelatedTitles([task], orgId);
    return this.formatTaskResponse(enriched);
  }

  /**
   * ایجاد تسک جدید در دیتابیس
   */
  async create(dto: CreateTaskDto, currentUser: CurrentUserPayload) {
    this.assertTasksAccess(currentUser);
    const orgId = currentUser.organizationId || DEFAULT_ORGANIZATION_ID;

    // بررسی وجود کاربر مسئول در همان سازمان
    if (dto.assigneeId) {
      const membership = await this.prisma.organizationMembership.findFirst({
        where: {
          organizationId: orgId,
          userId: dto.assigneeId,
          status: 'active',
        },
      });
      if (!membership) {
        throw new BadRequestException('کاربر مسئول انتخاب‌شده در سازمان فعال نیست');
      }
    }

    // تاریخ سررسید (در صورت عدم ارسال، تاریخ پایان امروز تنظیم می‌شود)
    let parsedDueDate: Date | null = null;
    if (dto.dueDate) {
      parsedDueDate = new Date(dto.dueDate);
      if (isNaN(parsedDueDate.getTime())) {
        throw new BadRequestException('فرمت تاریخ سررسید نامعتبر است');
      }
    } else {
      parsedDueDate = new Date();
    }

    const task = await this.prisma.task.create({
      data: {
        organizationId: orgId,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        priority: dto.priority || TaskPriority.medium,
        status: dto.status || TaskStatus.todo,
        dueDate: parsedDueDate,
        assigneeId: dto.assigneeId || null,
        createdById: currentUser.id,
        relatedType: dto.relatedType || null,
        relatedId: dto.relatedId || null,
        sopId: dto.sopId || null,
        subtasks: dto.subtasks && dto.subtasks.length > 0
          ? {
              create: dto.subtasks.map((s) => ({
                organization: { connect: { id: orgId } },
                title: s.title.trim(),
                isCompleted: !!s.completed,
              })),
            }
          : undefined,
      },
      include: {
        assignee: {
          select: {
            id: true,
            email: true,
            fullName: true,
            memberships: {
              where: { organizationId: orgId },
              select: { role: true },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        sop: true,
        subtasks: { orderBy: { createdAt: 'asc' } },
        comments: true,
      },
    });

    await this.logActivity(orgId, currentUser.id, 'TASK_CREATED', task.id, `ایجاد تسک: ${task.title}`);

    const [enriched] = await this.enrichRelatedTitles([task], orgId);
    return this.formatTaskResponse(enriched);
  }

  /**
   * ویرایش تسک
   */
  async update(id: string, dto: UpdateTaskDto, currentUser: CurrentUserPayload) {
    this.assertTasksAccess(currentUser);
    const orgId = currentUser.organizationId || DEFAULT_ORGANIZATION_ID;

    const existing = await this.prisma.task.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!existing) {
      throw new NotFoundException('تسک مورد نظر یافت نشد');
    }

    const dataToUpdate: any = {};

    if (dto.title !== undefined) {
      dataToUpdate.title = dto.title.trim();
    }
    if (dto.description !== undefined) {
      dataToUpdate.description = dto.description?.trim() || null;
    }
    if (dto.priority !== undefined) {
      dataToUpdate.priority = dto.priority;
    }
    if (dto.status !== undefined) {
      dataToUpdate.status = dto.status;
    }
    if (dto.dueDate !== undefined) {
      if (dto.dueDate) {
        const d = new Date(dto.dueDate);
        if (isNaN(d.getTime())) {
          throw new BadRequestException('فرمت تاریخ سررسید نامعتبر است');
        }
        dataToUpdate.dueDate = d;
      } else {
        dataToUpdate.dueDate = null;
      }
    }
    if (dto.assigneeId !== undefined) {
      if (dto.assigneeId) {
        const membership = await this.prisma.organizationMembership.findFirst({
          where: { organizationId: orgId, userId: dto.assigneeId, status: 'active' },
        });
        if (!membership) {
          throw new BadRequestException('کاربر مسئول انتخاب‌شده در سازمان فعال نیست');
        }
        dataToUpdate.assigneeId = dto.assigneeId;
      } else {
        dataToUpdate.assigneeId = null;
      }
    }
    if (dto.relatedType !== undefined) {
      dataToUpdate.relatedType = dto.relatedType;
    }
    if (dto.relatedId !== undefined) {
      dataToUpdate.relatedId = dto.relatedId;
    }
    if (dto.sopId !== undefined) {
      dataToUpdate.sopId = dto.sopId;
    }

    const updated = await this.prisma.task.update({
      where: { id },
      data: dataToUpdate,
      include: {
        assignee: {
          select: {
            id: true,
            email: true,
            fullName: true,
            memberships: {
              where: { organizationId: orgId },
              select: { role: true },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        sop: true,
        subtasks: {
          orderBy: { createdAt: 'asc' },
        },
        comments: {
          orderBy: { createdAt: 'desc' },
          include: {
            authorUser: true,
          },
        },
        okrKeyResult: {
          select: {
            id: true,
            title: true,
            currentValue: true,
            targetValue: true,
            unit: true,
            objective: {
              select: {
                id: true,
                title: true,
                stageKey: true,
                campaignId: true,
                campaign: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
      },
    });

    await this.logActivity(orgId, currentUser.id, 'TASK_UPDATED', id, `به‌روزرسانی مشخصات تسک: ${updated.title}`);

    const [enriched] = await this.enrichRelatedTitles([updated], orgId);
    return this.formatTaskResponse(enriched);
  }

  /**
   * تغییر وضعیت تسک
   */
  async updateStatus(id: string, status: TaskStatus, currentUser: CurrentUserPayload) {
    this.assertTasksAccess(currentUser);
    const orgId = currentUser.organizationId || DEFAULT_ORGANIZATION_ID;

    const existing = await this.prisma.task.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!existing) {
      throw new NotFoundException('تسک مورد نظر یافت نشد');
    }

    const updated = await this.prisma.task.update({
      where: { id },
      data: { status },
      include: {
        assignee: {
          select: {
            id: true,
            email: true,
            fullName: true,
            memberships: {
              where: { organizationId: orgId },
              select: { role: true },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        sop: true,
        subtasks: { orderBy: { createdAt: 'asc' } },
        comments: {
          orderBy: { createdAt: 'desc' },
          include: { authorUser: true },
        },
      },
    });

    await this.logActivity(orgId, currentUser.id, 'TASK_STATUS_CHANGED', id, `تغییر وضعیت از ${existing.status} به ${status}`);

    const [enriched] = await this.enrichRelatedTitles([updated], orgId);
    return this.formatTaskResponse(enriched);
  }

  /**
   * تغییر وضعیت تیک تکمیل تسک
   */
  async toggleComplete(id: string, completed?: boolean, currentUser?: CurrentUserPayload) {
    if (currentUser) {
      this.assertTasksAccess(currentUser);
    }
    const orgId = currentUser?.organizationId || DEFAULT_ORGANIZATION_ID;

    const existing = await this.prisma.task.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!existing) {
      throw new NotFoundException('تسک مورد نظر یافت نشد');
    }

    let newStatus: TaskStatus;
    if (completed !== undefined) {
      newStatus = completed ? TaskStatus.done : TaskStatus.todo;
    } else {
      newStatus = existing.status === TaskStatus.done ? TaskStatus.todo : TaskStatus.done;
    }

    return this.updateStatus(id, newStatus, currentUser!);
  }

  /**
   * تغییر مسئول تسک
   */
  async updateAssignee(id: string, assigneeId: string | null, currentUser: CurrentUserPayload) {
    return this.update(id, { assigneeId }, currentUser);
  }

  /**
   * تغییر تاریخ سررسید تسک
   */
  async updateDueDate(id: string, dueDate: string, currentUser: CurrentUserPayload) {
    return this.update(id, { dueDate }, currentUser);
  }

  /**
   * حذف تسک
   */
  async remove(id: string, currentUser: CurrentUserPayload) {
    this.assertTasksAccess(currentUser);
    const orgId = currentUser.organizationId || DEFAULT_ORGANIZATION_ID;

    const existing = await this.prisma.task.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!existing) {
      throw new NotFoundException('تسک مورد نظر یافت نشد');
    }

    // بررسی دسترسی: فقط ادمین سازمان یا ایجادکننده تسک مجاز به حذف هستند
    if (currentUser.role !== 'admin' && existing.createdById !== currentUser.id) {
      throw new ForbiddenException('فقط ادمین سازمان یا ایجادکننده تسک مجاز به حذف آن هستند');
    }

    await this.prisma.task.delete({
      where: { id },
    });

    await this.logActivity(orgId, currentUser.id, 'TASK_DELETED', id, `حذف تسک: ${existing.title}`);

    return {
      success: true,
      message: 'تسک با موفقیت حذف شد',
    };
  }

  /**
   * افزودن زیرتسک به چک‌لیست
   */
  async addSubtask(taskId: string, dto: CreateTaskSubtaskDto, currentUser: CurrentUserPayload) {
    this.assertTasksAccess(currentUser);
    const orgId = currentUser.organizationId || DEFAULT_ORGANIZATION_ID;

    const task = await this.prisma.task.findFirst({
      where: { id: taskId, organizationId: orgId },
    });
    if (!task) {
      throw new NotFoundException('تسک مورد نظر یافت نشد');
    }

    const subtask = await this.prisma.taskSubtask.create({
      data: {
        organizationId: orgId,
        taskId,
        title: dto.title.trim(),
        isCompleted: false,
      },
    });

    await this.logActivity(orgId, currentUser.id, 'SUBTASK_ADDED', taskId, `افزودن زیرتسک: ${subtask.title}`);

    return {
      id: subtask.id,
      title: subtask.title,
      completed: subtask.isCompleted,
      createdAt: subtask.createdAt.toISOString(),
    };
  }

  /**
   * به‌روزرسانی زیرتسک
   */
  async updateSubtask(
    taskId: string,
    subtaskId: string,
    dto: UpdateTaskSubtaskDto,
    currentUser: CurrentUserPayload,
  ) {
    this.assertTasksAccess(currentUser);
    const orgId = currentUser.organizationId || DEFAULT_ORGANIZATION_ID;

    const subtask = await this.prisma.taskSubtask.findFirst({
      where: { id: subtaskId, taskId, organizationId: orgId },
    });
    if (!subtask) {
      throw new NotFoundException('زیرتسک مورد نظر یافت نشد');
    }

    const updated = await this.prisma.taskSubtask.update({
      where: { id: subtaskId },
      data: {
        title: dto.title !== undefined ? dto.title.trim() : undefined,
        isCompleted: dto.isCompleted !== undefined ? dto.isCompleted : undefined,
      },
    });

    await this.logActivity(orgId, currentUser.id, 'SUBTASK_UPDATED', taskId, `به‌روزرسانی زیرتسک: ${updated.title}`);

    return {
      id: updated.id,
      title: updated.title,
      completed: updated.isCompleted,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  /**
   * تغییر تیک وضعیت تکمیل زیرتسک
   */
  async toggleSubtask(
    taskId: string,
    subtaskId: string,
    completed?: boolean,
    currentUser?: CurrentUserPayload,
  ) {
    this.assertTasksAccess(currentUser!);
    const orgId = currentUser?.organizationId || DEFAULT_ORGANIZATION_ID;

    const subtask = await this.prisma.taskSubtask.findFirst({
      where: { id: subtaskId, taskId, organizationId: orgId },
    });
    if (!subtask) {
      throw new NotFoundException('زیرتسک مورد نظر یافت نشد');
    }

    const newCompleted = completed !== undefined ? completed : !subtask.isCompleted;

    return this.updateSubtask(taskId, subtaskId, { isCompleted: newCompleted }, currentUser!);
  }

  /**
   * افزودن کامنت جدید
   */
  async addComment(taskId: string, dto: CreateTaskCommentDto, currentUser: CurrentUserPayload) {
    this.assertTasksAccess(currentUser);
    const orgId = currentUser.organizationId || DEFAULT_ORGANIZATION_ID;

    const task = await this.prisma.task.findFirst({
      where: { id: taskId, organizationId: orgId },
    });
    if (!task) {
      throw new NotFoundException('تسک مورد نظر یافت نشد');
    }

    const comment = await this.prisma.taskComment.create({
      data: {
        organizationId: orgId,
        taskId,
        authorUserId: currentUser.id,
        content: dto.content.trim(),
      },
      include: {
        authorUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    await this.logActivity(orgId, currentUser.id, 'COMMENT_ADDED', taskId, `ثبت کامنت جدید در تسک`);

    return {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      author: {
        id: comment.authorUser.id,
        name: comment.authorUser.fullName || comment.authorUser.email,
        email: comment.authorUser.email,
      },
    };
  }

  /**
   * دریافت تاریخچه رویدادهای تسک از لاگ فعالیت‌ها
   */
  async getHistory(taskId: string, currentUser: CurrentUserPayload) {
    this.assertTasksAccess(currentUser);
    const orgId = currentUser.organizationId || DEFAULT_ORGANIZATION_ID;

    const logs = await this.prisma.userActivityLog.findMany({
      where: {
        organizationId: orgId,
        entityType: 'Task',
        entityId: taskId,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return logs.map((log) => ({
      id: log.id,
      taskId: log.entityId || taskId,
      type: log.action.toLowerCase(),
      actor: {
        id: log.user?.id || '',
        name: log.user?.fullName || log.user?.email || 'سیستم',
        email: log.user?.email,
      },
      title: log.action,
      description: log.details || undefined,
      createdAt: log.createdAt.toISOString(),
    }));
  }

  /**
   * دریافت لیست کاربران فعال سازمان جهت گزینه‌های تخصیص تسک
   */
  async getAssignees(currentUser: CurrentUserPayload) {
    this.assertTasksAccess(currentUser);
    const orgId = currentUser.organizationId || DEFAULT_ORGANIZATION_ID;

    const memberships = await this.prisma.organizationMembership.findMany({
      where: {
        organizationId: orgId,
        status: 'active',
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return memberships.map((m) => ({
      id: m.user.id,
      name: m.user.fullName || m.user.email,
      email: m.user.email,
      role: m.role,
    }));
  }
}
