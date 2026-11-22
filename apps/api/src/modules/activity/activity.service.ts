import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { QueryActivityDto } from './dto/query-activity.dto';
import { LogActivityDto } from './dto/log-activity.dto';

export interface CurrentUserPayload {
  id: string;
  organizationId?: string;
  role?: string;
  email?: string;
}

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  private getOrgId(currentUser: CurrentUserPayload): string {
    const orgId = currentUser.organizationId;
    if (!orgId) {
      throw new BadRequestException('شناسه سازمان در نشست کاربر یافت نشد.');
    }
    return orgId;
  }

  /**
   * ثبت یک لاگ رویداد عملیاتی
   */
  async log(
    currentUser: CurrentUserPayload,
    dto: LogActivityDto,
    meta?: { ipAddress?: string; userAgent?: string }
  ) {
    const orgId = this.getOrgId(currentUser);

    return this.prisma.userActivityLog.create({
      data: {
        organizationId: orgId,
        userId: currentUser.id,
        action: dto.action.trim(),
        entityType: dto.entityType.trim(),
        entityId: dto.entityId || null,
        details: dto.details ? dto.details.trim() : null,
        ipAddress: meta?.ipAddress || null,
        userAgent: meta?.userAgent || null,
      },
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
  }

  /**
   * واکشی لاگ‌های رویداد با فیلتر ماژول، کاربر، تاریخ و صفحه‌بندی
   */
  async findAll(currentUser: CurrentUserPayload, query: QueryActivityDto) {
    const orgId = this.getOrgId(currentUser);
    const where: any = {
      organizationId: orgId,
    };

    if (query.entityType && query.entityType !== 'all') {
      where.entityType = query.entityType;
    }

    if (query.action && query.action !== 'all') {
      where.action = query.action;
    }

    if (query.userId && query.userId !== 'all') {
      where.userId = query.userId;
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate);
      }
    }

    if (query.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { details: { contains: term, mode: 'insensitive' } },
        { action: { contains: term, mode: 'insensitive' } },
        { entityType: { contains: term, mode: 'insensitive' } },
      ];
    }

    const limit = query.limit || 50;
    const page = query.page || 1;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.userActivityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
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
      }),
      this.prisma.userActivityLog.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * دریافت داشبورد و شاخص‌های آماری فعالیت تیم
   */
  async getTeamSummary(currentUser: CurrentUserPayload) {
    const orgId = this.getOrgId(currentUser);

    const [total, byEntityRaw, logs] = await Promise.all([
      this.prisma.userActivityLog.count({
        where: { organizationId: orgId },
      }),
      this.prisma.userActivityLog.groupBy({
        by: ['entityType'],
        where: { organizationId: orgId },
        _count: { _all: true },
      }),
      this.prisma.userActivityLog.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: 'desc' },
        take: 300,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
            },
          },
        },
      }),
    ]);

    // محاسبه برترین کاربران از نظر تعداد فعالیت
    const userCountMap = new Map<string, { count: number; user: any }>();
    for (const log of logs) {
      if (!log.userId || !log.user) continue;
      const existing = userCountMap.get(log.userId);
      if (existing) {
        existing.count++;
      } else {
        userCountMap.set(log.userId, {
          count: 1,
          user: log.user,
        });
      }
    }

    const topUsers = Array.from(userCountMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const byEntityType = byEntityRaw.map((b) => ({
      entityType: b.entityType,
      count: b._count._all,
    }));

    return {
      total,
      byEntityType,
      topUsers,
    };
  }

  /**
   * خروجی اکسل / CSV با پشتیبانی کامل از کاراکترهای فارسی (UTF-8 BOM)
   */
  async exportCsv(currentUser: CurrentUserPayload, query: QueryActivityDto): Promise<string> {
    const orgId = this.getOrgId(currentUser);
    const where: any = { organizationId: orgId };

    if (query.entityType && query.entityType !== 'all') where.entityType = query.entityType;
    if (query.action && query.action !== 'all') where.action = query.action;
    if (query.userId && query.userId !== 'all') where.userId = query.userId;

    const logs = await this.prisma.userActivityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 1000,
      include: {
        user: { select: { fullName: true, email: true } },
      },
    });

    const header = ['تاریخ و زمان', 'کاربر', 'عملیات', 'ماژول مربوطه', 'توضیحات و جزئیات', 'شناسه لاگ'];
    const rows = logs.map((l) => [
      l.createdAt.toISOString(),
      l.user?.fullName || 'کاربر سیستم',
      l.action,
      l.entityType,
      (l.details || '').replace(/[\r\n",]/g, ' '),
      l.id,
    ]);

    // استفاده از UTF-8 BOM جهت باز شدن صحیح متون فارسی در Excel
    const bom = '\uFEFF';
    const csvContent =
      bom +
      [header.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\r\n');

    return csvContent;
  }
}
