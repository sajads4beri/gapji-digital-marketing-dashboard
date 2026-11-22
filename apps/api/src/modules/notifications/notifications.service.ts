import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-preference.dto';
import { NotificationType } from '@prisma/client';

export interface CurrentUserPayload {
  id: string;
  email: string;
  mobile?: string;
  fullName?: string;
  organizationId: string | null;
  role?: string;
}

export interface SystemEventTypeDefinition {
  eventType: string;
  title: string;
  category: string;
  description: string;
  defaultInApp: boolean;
  defaultEmail: boolean;
}

export const SYSTEM_EVENT_TYPES: SystemEventTypeDefinition[] = [
  {
    eventType: 'lead_assigned',
    title: 'تخصیص سرنخ جدید',
    category: 'فروش و سرنخ‌ها',
    description: 'اعلان تخصیص لید جدید به کارشناس فروش',
    defaultInApp: true,
    defaultEmail: true,
  },
  {
    eventType: 'lead_status_changed',
    title: 'تغییر وضعیت سرنخ',
    category: 'فروش و سرنخ‌ها',
    description: 'اطلاع‌رسانی تغییر مرحله لید در پایپ‌لاین فروش',
    defaultInApp: true,
    defaultEmail: false,
  },
  {
    eventType: 'task_due',
    title: 'سررسید وظایف و اقدامات',
    category: 'فعالیت‌ها و تقویم',
    description: 'یادآوری سررسید تسک‌ها، پیگیری‌ها و جلسات امروز',
    defaultInApp: true,
    defaultEmail: true,
  },
  {
    eventType: 'campaign_alert',
    title: 'هشدار افت شاخص کمپین',
    category: 'پرفورمنس مارکتینگ',
    description: 'اخطار افت نرخ تبدیل یا افزایش نامتعارف CPL',
    defaultInApp: true,
    defaultEmail: true,
  },
  {
    eventType: 'cost_threshold',
    title: 'مصرف بیش از ۸۰٪ بودجه',
    category: 'پرفورمنس مارکتینگ',
    description: 'هشدار عبور هزینه‌های کمپین از آستانه بودجه مصوب',
    defaultInApp: true,
    defaultEmail: true,
  },
  {
    eventType: 'system_alert',
    title: 'اعلان‌های امنیتی و سیستمی',
    category: 'عمومی و حساب کاربری',
    description: 'ورود به حساب، دعوت کاربران جدید و بروزرسانی‌های سامانه',
    defaultInApp: true,
    defaultEmail: true,
  },
];

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * واکشی فهرست اعلان‌های کاربر جاری با صفحه‌بندی و فیلتر
   */
  async findAll(query: NotificationQueryDto, user: CurrentUserPayload) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      userId: user.id,
    };

    if (user.organizationId) {
      where.organizationId = user.organizationId;
    }

    if (typeof query.isRead === 'boolean') {
      where.isRead = query.isRead;
    }

    if (query.type) {
      where.type = query.type;
    }

    const [items, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: {
          userId: user.id,
          ...(user.organizationId ? { organizationId: user.organizationId } : {}),
          isRead: false,
        },
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      unreadCount,
      displayCount: unreadCount > 99 ? '+99' : String(unreadCount),
    };
  }

  /**
   * دریافت سریع تعداد اعلان‌های خوانده‌نشده
   */
  async getUnreadCount(user: CurrentUserPayload) {
    const count = await this.prisma.notification.count({
      where: {
        userId: user.id,
        ...(user.organizationId ? { organizationId: user.organizationId } : {}),
        isRead: false,
      },
    });

    return {
      unreadCount: count,
      displayCount: count > 99 ? '+99' : String(count),
    };
  }

  /**
   * علامت‌گذاری یک اعلان مشخص به عنوان خوانده‌شده
   */
  async markAsRead(id: string, user: CurrentUserPayload) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!notification) {
      throw new NotFoundException('اعلان مورد نظر یافت نشد');
    }

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  /**
   * علامت‌گذاری همه اعلان‌های کاربر به عنوان خوانده‌شده
   */
  async markAllAsRead(user: CurrentUserPayload) {
    const where: any = {
      userId: user.id,
      isRead: false,
    };

    if (user.organizationId) {
      where.organizationId = user.organizationId;
    }

    const result = await this.prisma.notification.updateMany({
      where,
      data: { isRead: true },
    });

    return {
      success: true,
      count: result.count,
    };
  }

  /**
   * دریافت ماتریس تنظیمات کانال‌های دریافت اعلان‌ها برای رویدادهای شش‌گانه
   */
  async getPreferences(user: CurrentUserPayload) {
    if (!user.organizationId) {
      throw new BadRequestException('شناسه سازمان برای تنظیمات اعلان الزامی است');
    }

    const saved = await this.prisma.notificationPreference.findMany({
      where: {
        userId: user.id,
        organizationId: user.organizationId,
      },
    });

    const savedMap = new Map<string, { inAppEnabled: boolean; emailEnabled: boolean }>();
    saved.forEach((pref) => {
      savedMap.set(pref.eventType, {
        inAppEnabled: pref.inAppEnabled,
        emailEnabled: pref.emailEnabled,
      });
    });

    return SYSTEM_EVENT_TYPES.map((evt) => {
      const userPref = savedMap.get(evt.eventType);
      return {
        eventType: evt.eventType,
        title: evt.title,
        category: evt.category,
        description: evt.description,
        inAppEnabled: userPref ? userPref.inAppEnabled : evt.defaultInApp,
        emailEnabled: userPref ? userPref.emailEnabled : evt.defaultEmail,
      };
    });
  }

  /**
   * بروزرسانی و ذخیره تنظیمات کانال‌های اعلان
   */
  async updatePreferences(dto: UpdateNotificationPreferencesDto, user: CurrentUserPayload) {
    if (!user.organizationId) {
      throw new BadRequestException('شناسه سازمان برای تنظیمات اعلان الزامی است');
    }

    const orgId = user.organizationId;
    const userId = user.id;

    for (const item of dto.preferences) {
      await this.prisma.notificationPreference.upsert({
        where: {
          organizationId_userId_eventType: {
            organizationId: orgId,
            userId,
            eventType: item.eventType,
          },
        },
        update: {
          ...(typeof item.inAppEnabled === 'boolean' ? { inAppEnabled: item.inAppEnabled } : {}),
          ...(typeof item.emailEnabled === 'boolean' ? { emailEnabled: item.emailEnabled } : {}),
        },
        create: {
          organizationId: orgId,
          userId,
          eventType: item.eventType,
          inAppEnabled: item.inAppEnabled ?? true,
          emailEnabled: item.emailEnabled ?? true,
        },
      });
    }

    return this.getPreferences(user);
  }

  /**
   * ایجاد اعلان سیستمی جدید برای کاربر مشخص
   */
  async createNotification(params: {
    userId: string;
    organizationId?: string | null;
    title: string;
    message: string;
    type?: NotificationType;
    linkUrl?: string;
  }) {
    return this.prisma.notification.create({
      data: {
        userId: params.userId,
        organizationId: params.organizationId || null,
        title: params.title,
        message: params.message,
        type: params.type || NotificationType.info,
        linkUrl: params.linkUrl || null,
        isRead: false,
      },
    });
  }
}
