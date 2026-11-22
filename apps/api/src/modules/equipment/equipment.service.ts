import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateEquipmentItemDto } from './dto/create-equipment-item.dto';
import { UpdateEquipmentItemDto } from './dto/update-equipment-item.dto';
import { ApplyEquipmentTemplateDto } from './dto/apply-template.dto';
import { UpdateReadinessStatusDto } from './dto/update-readiness.dto';
import { EquipmentReadinessStatus } from '@prisma/client';

export interface CurrentUserPayload {
  id: string;
  email: string;
  mobile?: string;
  fullName?: string;
  organizationId: string | null;
  role?: string;
}

const DEFAULT_STARTER_ITEMS = [
  { name: 'میکروفون بی‌سیم یقه‌ای Rode', category: 'صوت', description: 'مناسب ضبط مصاحبه و اجرای وبینار' },
  { name: 'دوربین و وبکم 4K لاجیتک', category: 'تصویر', description: 'وبکم استریم و وبینارهای آنلاین' },
  { name: 'رینگ لایت ۱۸ اینچ با سه‌پایه', category: 'نورپردازی', description: 'نورپردازی چهره مجری و سخنران' },
  { name: 'سافت باکس دوقلو با لامپ استودیویی', category: 'نورپردازی', description: 'نورپردازی اصلی صحنه و استودیو' },
  { name: 'کپچر کارت Elgato Cam Link', category: 'استریم و رایانه', description: 'اتصال خروجی HDMI دوربین به رایانه' },
  { name: 'کابل HDMI و تبدیل‌های Type-C', category: 'استریم و رایانه', description: 'اتصالات ویدیو و مانیتورینگ' },
];

@Injectable()
export class EquipmentService {
  constructor(private readonly prisma: PrismaService) {}

  private getOrgId(currentUser: CurrentUserPayload): string {
    if (!currentUser.organizationId) {
      throw new BadRequestException('شناسه سازمان برای دسترسی به تجهیزات نامعتبر است');
    }
    return currentUser.organizationId;
  }

  /**
   * واکشی کسری‌های تجهیزات گروه‌بندی‌شده بر اساس تاریخ رویداد و هشدار ۳ روزه
   */
  async getShortages(
    currentUser: CurrentUserPayload,
    query?: { search?: string; status?: string; urgentOnly?: boolean },
  ) {
    const orgId = this.getOrgId(currentUser);

    const where: any = {
      organizationId: orgId,
    };

    if (query?.status && query.status !== 'all') {
      where.status = query.status as EquipmentReadinessStatus;
    } else {
      // به طور پیش‌فرض، موارد آماده‌شده در کسری‌ها نمایش داده نمی‌شوند
      where.status = { in: [EquipmentReadinessStatus.not_procured, EquipmentReadinessStatus.incomplete] };
    }

    const items = await this.prisma.eventEquipment.findMany({
      where,
      include: {
        equipmentItem: true,
        campaign: { select: { id: true, name: true, startDate: true, endDate: true } },
        webinar: { select: { id: true, title: true, webinarDate: true } },
        responsible: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const enriched = items.map((item: any) => {
      let targetDate: Date | null = null;
      if (item.dueDate) {
        targetDate = new Date(item.dueDate);
      } else if (item.webinar?.webinarDate) {
        targetDate = new Date(item.webinar.webinarDate);
      } else if (item.campaign?.startDate) {
        targetDate = new Date(item.campaign.startDate);
      }

      let daysRemaining: number | null = null;
      let isUrgent = false;
      let isOverdue = false;

      if (targetDate) {
        targetDate.setHours(0, 0, 0, 0);
        const diffMs = targetDate.getTime() - now.getTime();
        daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        isUrgent = daysRemaining >= 0 && daysRemaining < 3;
        isOverdue = daysRemaining < 0;
      }

      return {
        ...item,
        targetDate,
        daysRemaining,
        isUrgent,
        isOverdue,
        eventName: item.webinar?.title || item.campaign?.name || 'رویداد عمومی',
        eventType: item.webinar ? 'webinar' : item.campaign ? 'campaign' : 'general',
      };
    });

    const filtered = query?.urgentOnly ? enriched.filter((i) => i.isUrgent || i.isOverdue) : enriched;

    // گروه‌بندی بر اساس تاریخ اجرای رویداد
    const groupsMap = new Map<string, typeof filtered>();
    filtered.forEach((item) => {
      const dateKey = item.targetDate ? item.targetDate.toISOString().split('T')[0] : 'بدون تاریخ مشخص';
      if (!groupsMap.has(dateKey)) {
        groupsMap.set(dateKey, []);
      }
      groupsMap.get(dateKey)!.push(item);
    });

    const groups = Array.from(groupsMap.entries()).map(([date, eventItems]) => ({
      date,
      hasUrgent: eventItems.some((i) => i.isUrgent || i.isOverdue),
      items: eventItems,
    }));

    return {
      totalShortages: filtered.length,
      urgentCount: filtered.filter((i) => i.isUrgent).length,
      overdueCount: filtered.filter((i) => i.isOverdue).length,
      groups,
      items: filtered,
    };
  }

  /**
   * دریافت فهرست تمام اقلام تجهیزات سازمان همراه با قابلیت ایجاد داده اولیه
   */
  async getItems(
    currentUser: CurrentUserPayload,
    query?: { search?: string; category?: string; isActive?: boolean },
  ) {
    const orgId = this.getOrgId(currentUser);

    const where: any = { organizationId: orgId };
    if (query?.search?.trim()) {
      where.name = { contains: query.search.trim(), mode: 'insensitive' };
    }
    if (query?.category && query.category !== 'all') {
      where.category = query.category;
    }
    if (typeof query?.isActive === 'boolean') {
      where.isActive = query.isActive;
    }

    let items = await this.prisma.equipmentItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // اگر سازمان تازه تاسیس است و هیچ تجهیزی ندارد، اقلام پیش‌فرض را ایجاد کن
    if (items.length === 0 && !query?.search && !query?.category) {
      await this.prisma.equipmentItem.createMany({
        data: DEFAULT_STARTER_ITEMS.map((item) => ({
          ...item,
          organizationId: orgId,
          isActive: true,
        })),
      });

      items = await this.prisma.equipmentItem.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: 'desc' },
      });
    }

    return items;
  }

  /**
   * ایجاد قلم تجهیز جدید
   */
  async createItem(dto: CreateEquipmentItemDto, currentUser: CurrentUserPayload) {
    const orgId = this.getOrgId(currentUser);
    return this.prisma.equipmentItem.create({
      data: {
        organizationId: orgId,
        name: dto.name.trim(),
        category: dto.category.trim(),
        description: dto.description?.trim() || null,
        isActive: true,
      },
    });
  }

  /**
   * ویرایش مشخصات قلم تجهیز
   */
  async updateItem(id: string, dto: UpdateEquipmentItemDto, currentUser: CurrentUserPayload) {
    const orgId = this.getOrgId(currentUser);

    const existing = await this.prisma.equipmentItem.findFirst({
      where: { id, organizationId: orgId },
    });

    if (!existing) {
      throw new NotFoundException('تجهیز مورد نظر در این سازمان یافت نشد');
    }

    return this.prisma.equipmentItem.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.category ? { category: dto.category.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description?.trim() || null } : {}),
        ...(typeof dto.isActive === 'boolean' ? { isActive: dto.isActive } : {}),
      },
    });
  }

  /**
   * حذف یا غیرفعال‌سازی قلم تجهیز
   */
  async deleteItem(id: string, currentUser: CurrentUserPayload) {
    const orgId = this.getOrgId(currentUser);

    const existing = await this.prisma.equipmentItem.findFirst({
      where: { id, organizationId: orgId },
      include: { eventInstances: true },
    });

    if (!existing) {
      throw new NotFoundException('تجهیز مورد نظر یافت نشد');
    }

    // اگر در رویدادی استفاده شده است، به جای حذف سخت، غیرفعال کن
    if (existing.eventInstances.length > 0) {
      await this.prisma.equipmentItem.update({
        where: { id },
        data: { isActive: false },
      });
      return { message: 'تجهیز به دلیل وابستگی به رویدادها غیرفعال گردید', softDeleted: true };
    }

    await this.prisma.equipmentItem.delete({
      where: { id },
    });

    return { message: 'تجهیز با موفقیت حذف شد', softDeleted: false };
  }

  /**
   * دریافت فهرست قالب‌های آماده تجهیزات
   */
  async getTemplates(currentUser: CurrentUserPayload) {
    const orgId = this.getOrgId(currentUser);

    let templates = await this.prisma.equipmentTemplate.findMany({
      where: { organizationId: orgId },
      include: {
        items: {
          include: { equipmentItem: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // در صورت نبود قالب، قالب‌های پایه استودیویی و وبینار را بساز
    if (templates.length === 0) {
      const allItems = await this.getItems(currentUser);
      if (allItems.length > 0) {
        const webinarTemplate = await this.prisma.equipmentTemplate.create({
          data: {
            organizationId: orgId,
            name: 'پکیج استاندارد وبینار و استریم زنده',
            description: 'شامل وبکم 4K، رینگ لایت و میکروفون بی‌سیم',
          },
        });

        const itemsToAdd = allItems.slice(0, 3);
        for (const item of itemsToAdd) {
          await this.prisma.equipmentTemplateItem.create({
            data: {
              organizationId: orgId,
              templateId: webinarTemplate.id,
              equipmentItemId: item.id,
              quantity: 1,
            },
          });
        }

        templates = await this.prisma.equipmentTemplate.findMany({
          where: { organizationId: orgId },
          include: {
            items: {
              include: { equipmentItem: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
      }
    }

    return templates;
  }

  /**
   * اعمال دسته‌ای یک قالب تجهیزات روی یک کمپین یا وبینار
   */
  async applyTemplate(dto: ApplyEquipmentTemplateDto, currentUser: CurrentUserPayload) {
    const orgId = this.getOrgId(currentUser);

    const template = await this.prisma.equipmentTemplate.findFirst({
      where: { id: dto.templateId, organizationId: orgId },
      include: { items: true },
    });

    if (!template) {
      throw new NotFoundException('قالب تجهیزات یافت نشد');
    }

    if (template.items.length === 0) {
      throw new BadRequestException('این قالب شامل هیچ قلم تجهیزی نیست');
    }

    const dueDate = dto.dueDate ? new Date(dto.dueDate) : null;

    const createdRecords = await this.prisma.$transaction(
      template.items.map((item) =>
        this.prisma.eventEquipment.create({
          data: {
            organizationId: orgId,
            equipmentItemId: item.equipmentItemId,
            campaignId: dto.campaignId || null,
            webinarId: dto.webinarId || null,
            status: EquipmentReadinessStatus.not_procured,
            dueDate,
            responsibleId: dto.responsibleId || null,
            notes: `اعمال‌شده از روی قالب «${template.name}»`,
          },
          include: { equipmentItem: true },
        }),
      ),
    );

    return {
      success: true,
      appliedCount: createdRecords.length,
      templateName: template.name,
      records: createdRecords,
    };
  }

  /**
   * به‌روزرسانی وضعیت آمادگی تجهیز در رویداد (آماده، ناقص، تهیه نشده)
   */
  async updateReadiness(
    id: string,
    dto: UpdateReadinessStatusDto,
    currentUser: CurrentUserPayload,
  ) {
    const orgId = this.getOrgId(currentUser);

    const existing = await this.prisma.eventEquipment.findFirst({
      where: { id, organizationId: orgId },
    });

    if (!existing) {
      throw new NotFoundException('رکورد تجهیز رویداد یافت نشد');
    }

    return this.prisma.eventEquipment.update({
      where: { id },
      data: {
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.responsibleId !== undefined ? { responsibleId: dto.responsibleId || null } : {}),
        ...(dto.dueDate ? { dueDate: new Date(dto.dueDate) } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      },
      include: {
        equipmentItem: true,
        responsible: { select: { id: true, fullName: true, email: true } },
      },
    });
  }
}
