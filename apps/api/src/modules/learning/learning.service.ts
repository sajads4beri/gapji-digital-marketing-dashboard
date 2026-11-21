import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateLearningResourceDto } from './dto/create-learning-resource.dto';
import { UpdateLearningResourceDto } from './dto/update-learning-resource.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { AssignResourceDto } from './dto/assign-resource.dto';

export interface CurrentUserPayload {
  id: string;
  organizationId?: string;
  role?: string;
  email?: string;
}

@Injectable()
export class LearningService {
  constructor(private readonly prisma: PrismaService) {}

  private getOrgId(currentUser: CurrentUserPayload): string {
    const orgId = currentUser.organizationId;
    if (!orgId) {
      throw new BadRequestException('شناسه سازمان در نشست کاربر یافت نشد.');
    }
    return orgId;
  }

  /**
   * واکشی فهرست دوره‌ها و منابع آموزشی با وضعیت پیشرفت کاربر جاری
   */
  async findAll(
    currentUser: CurrentUserPayload,
    query?: { category?: string; software?: string; type?: string; search?: string }
  ) {
    const orgId = this.getOrgId(currentUser);
    const where: any = {
      organizationId: orgId,
      isActive: true,
    };

    if (query?.category && query.category !== 'all') {
      where.category = query.category;
    }

    if (query?.software && query.software !== 'all') {
      where.software = query.software;
    }

    if (query?.type && query.type !== 'all') {
      where.type = query.type;
    }

    if (query?.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { software: { contains: term, mode: 'insensitive' } },
        { category: { contains: term, mode: 'insensitive' } },
      ];
    }

    const resources = await this.prisma.learningResource.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      include: {
        userProgress: {
          where: {
            userId: currentUser.id,
          },
        },
        _count: {
          select: {
            userProgress: true,
          },
        },
      },
    });

    return resources.map((res) => ({
      ...res,
      myProgress: res.userProgress[0] || null,
      userProgress: undefined,
    }));
  }

  /**
   * دریافت مشخصات یک منبع آموزشی
   */
  async findById(currentUser: CurrentUserPayload, id: string) {
    const orgId = this.getOrgId(currentUser);
    const resource = await this.prisma.learningResource.findFirst({
      where: {
        id,
        organizationId: orgId,
      },
      include: {
        userProgress: {
          where: {
            userId: currentUser.id,
          },
        },
      },
    });

    if (!resource) {
      throw new NotFoundException('منبع آموزشی مورد نظر یافت نشد.');
    }

    return {
      ...resource,
      myProgress: resource.userProgress[0] || null,
      userProgress: undefined,
    };
  }

  /**
   * ایجاد منبع یا دوره آموزشی جدید
   */
  async create(currentUser: CurrentUserPayload, dto: CreateLearningResourceDto) {
    const orgId = this.getOrgId(currentUser);

    return this.prisma.learningResource.create({
      data: {
        organizationId: orgId,
        title: dto.title.trim(),
        category: dto.category.trim(),
        software: dto.software ? dto.software.trim() : null,
        type: dto.type.trim(),
        url: dto.url ? dto.url.trim() : null,
        durationMinutes: dto.durationMinutes || null,
        description: dto.description || null,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });
  }

  /**
   * ویرایش مشخصات منبع آموزشی
   */
  async update(currentUser: CurrentUserPayload, id: string, dto: UpdateLearningResourceDto) {
    const orgId = this.getOrgId(currentUser);
    await this.findById(currentUser, id);

    return this.prisma.learningResource.update({
      where: { id },
      data: {
        title: dto.title !== undefined ? dto.title.trim() : undefined,
        category: dto.category !== undefined ? dto.category.trim() : undefined,
        software: dto.software !== undefined ? (dto.software ? dto.software.trim() : null) : undefined,
        type: dto.type !== undefined ? dto.type.trim() : undefined,
        url: dto.url !== undefined ? (dto.url ? dto.url.trim() : null) : undefined,
        durationMinutes: dto.durationMinutes !== undefined ? dto.durationMinutes : undefined,
        description: dto.description !== undefined ? dto.description : undefined,
        isActive: dto.isActive !== undefined ? dto.isActive : undefined,
      },
    });
  }

  /**
   * حذف منبع آموزشی
   */
  async delete(currentUser: CurrentUserPayload, id: string) {
    const orgId = this.getOrgId(currentUser);
    await this.findById(currentUser, id);

    await this.prisma.learningResource.delete({
      where: { id },
    });

    return { success: true, message: 'منبع آموزشی با موفقیت حذف گردید.' };
  }

  /**
   * به‌روزرسانی وضعیت پیشرفت یادگیری کاربر (اتمام، امتیاز، یادداشت)
   */
  async updateUserProgress(
    currentUser: CurrentUserPayload,
    resourceId: string,
    dto: UpdateProgressDto
  ) {
    const orgId = this.getOrgId(currentUser);
    await this.findById(currentUser, resourceId);

    const isCompleted = dto.isCompleted !== undefined ? dto.isCompleted : undefined;
    const completedAt = isCompleted === true ? new Date() : isCompleted === false ? null : undefined;

    const progress = await this.prisma.userLearningProgress.upsert({
      where: {
        userId_resourceId: {
          userId: currentUser.id,
          resourceId,
        },
      },
      create: {
        organizationId: orgId,
        userId: currentUser.id,
        resourceId,
        isCompleted: dto.isCompleted || false,
        completedAt: dto.isCompleted ? new Date() : null,
        rating: dto.rating || null,
        notes: dto.notes || null,
      },
      update: {
        isCompleted,
        completedAt,
        rating: dto.rating !== undefined ? dto.rating : undefined,
        notes: dto.notes !== undefined ? dto.notes : undefined,
      },
    });

    return progress;
  }

  /**
   * ماتریس پیشرفت آموزش تیم (نمای مدیران منطبق بر REQ-087 و جدول کاربر × آموزش ص ۲۴)
   */
  async getTeamProgressMatrix(currentUser: CurrentUserPayload) {
    const orgId = this.getOrgId(currentUser);

    // ۱. دریافت تمامی اعضای فعال سازمان
    const memberships = await this.prisma.organizationMembership.findMany({
      where: { organizationId: orgId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            email: true,
          },
        },
      },
    });

    // ۲. دریافت کلیه منابع فعال
    const resources = await this.prisma.learningResource.findMany({
      where: { organizationId: orgId, isActive: true },
      orderBy: [{ category: 'asc' }, { title: 'asc' }],
      select: {
        id: true,
        title: true,
        category: true,
        software: true,
        type: true,
        durationMinutes: true,
      },
    });

    // ۳. دریافت سوابق پیشرفت
    const allProgress = await this.prisma.userLearningProgress.findMany({
      where: { organizationId: orgId },
    });

    const progressMap = new Map<string, any>();
    for (const p of allProgress) {
      progressMap.set(`${p.userId}_${p.resourceId}`, p);
    }

    // ۴. ساخت ماتریس
    const totalResourceCount = resources.length;

    const teamUsers = memberships.map((m) => {
      const user = m.user;
      let completedCount = 0;
      const progressRecord: Record<string, { isCompleted: boolean; rating?: number | null; completedAt?: Date | null }> = {};

      for (const res of resources) {
        const key = `${user.id}_${res.id}`;
        const p = progressMap.get(key);
        if (p?.isCompleted) {
          completedCount++;
        }
        progressRecord[res.id] = {
          isCompleted: p?.isCompleted || false,
          rating: p?.rating || null,
          completedAt: p?.completedAt || null,
        };
      }

      const progressPercentage =
        totalResourceCount > 0 ? Math.round((completedCount / totalResourceCount) * 100) : 0;

      return {
        userId: user.id,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        email: user.email,
        role: m.role,
        completedCount,
        totalResourceCount,
        progressPercentage,
        progressByResource: progressRecord,
      };
    });

    return {
      resources,
      teamUsers,
      totalResourceCount,
    };
  }

  /**
   * تخصیص دوره به اعضای تیم (ایجاد رکوردهای اولیه پیشرفت)
   */
  async assignResource(currentUser: CurrentUserPayload, dto: AssignResourceDto) {
    const orgId = this.getOrgId(currentUser);
    await this.findById(currentUser, dto.resourceId);

    let assignedCount = 0;
    for (const userId of dto.userIds) {
      await this.prisma.userLearningProgress.upsert({
        where: {
          userId_resourceId: {
            userId,
            resourceId: dto.resourceId,
          },
        },
        create: {
          organizationId: orgId,
          userId,
          resourceId: dto.resourceId,
          isCompleted: false,
        },
        update: {},
      });
      assignedCount++;
    }

    return {
      success: true,
      message: `دوره آموزشی با موفقیت به ${assignedCount} نفر از اعضای تیم تخصیص یافت.`,
      assignedCount,
    };
  }
}
