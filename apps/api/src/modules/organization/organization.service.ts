import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Currency, LeadStatusGroup, Role } from '@prisma/client';
import {
  DEFAULT_ORGANIZATION_ID,
  OrgListType,
  TAXONOMY_TYPE_MAP,
  INITIAL_DEFAULT_SEED,
} from './organization.constants';
import { UpdateGeneralSettingsDto } from './dto/update-general-settings.dto';
import { CreateTaxonomyItemDto } from './dto/create-taxonomy-item.dto';
import { UpdateTaxonomyItemDto } from './dto/update-taxonomy-item.dto';
import { ReorderTaxonomyItemsDto } from './dto/reorder-taxonomy-items.dto';

export interface CurrentUserPayload {
  id: string;
  email: string;
  role: string;
  organizationId?: string | null;
}

export interface FormattedOrgListItem {
  id: string;
  key: string;
  label: string;
  order: number;
  isActive: boolean;
  isSystem: boolean;
  group?: LeadStatusGroup;
  color?: string;
  description?: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FormattedGeneralSettings {
  id: string;
  name: string;
  logoUrl?: string;
  currency: 'TOMAN' | 'IRR';
  timezone: string;
  updatedAt: string;
}

@Injectable()
export class OrganizationService {
  private readonly logger = new Logger(OrganizationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * استخراج امن شناسه سازمان با جلوگیری از نقض مرز مستأجر (Tenant Boundary)
   */
  public resolveOrganizationId(currentUser?: CurrentUserPayload): string {
    return currentUser?.organizationId || DEFAULT_ORGANIZATION_ID;
  }

  /**
   * کنترل سطح دسترسی: فقط ادمین سازمان مجاز به ویرایش تنظیمات و دسته‌بندی‌هاست (DEC-AUTH-07, DEC-AUTH-08)
   */
  public assertAdminAccess(currentUser?: CurrentUserPayload): void {
    if (!currentUser) {
      throw new ForbiddenException('کاربر احراز هویت نشده است.');
    }
    if (currentUser.role !== Role.admin && currentUser.role !== 'admin' && currentUser.role !== 'owner') {
      throw new ForbiddenException('فقط ادمین سازمان مجاز به ویرایش تنظیمات و دسته‌بندی‌های سازمان است (DEC-AUTH-07)');
    }
  }

  /**
   * ثبت رویداد امنیتی در جدول UserActivityLog
   */
  private async logActivity(
    orgId: string,
    userId: string,
    action: string,
    details?: string,
  ): Promise<void> {
    try {
      await this.prisma.userActivityLog.create({
        data: {
          organizationId: orgId,
          userId,
          action,
          entityType: 'Organization',
          entityId: orgId,
          details: details || null,
        },
      });
    } catch (err: any) {
      this.logger.warn(`Failed to write UserActivityLog: ${err.message}`);
    }
  }

  // ============================================================================
  // ۱. تنظیمات عمومی سازمان (GENERAL SETTINGS)
  // ============================================================================

  /**
   * دریافت مشخصات تنظیمات عمومی سازمان
   */
  async getGeneralSettings(currentUser?: CurrentUserPayload): Promise<FormattedGeneralSettings> {
    const orgId = this.resolveOrganizationId(currentUser);

    let org = await this.prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      // ایجاد ایمن سازمان پیش‌فرض در صورت عدم وجود
      org = await this.prisma.organization.create({
        data: {
          id: orgId,
          name: 'آژانس دیجیتال مارکتینگ گپ‌جی',
          slug: `org-${orgId.slice(0, 8)}`,
          currency: Currency.TOMAN,
          timezone: 'Asia/Tehran',
        },
      });
    }

    return {
      id: org.id,
      name: org.name,
      logoUrl: org.logoUrl || '',
      currency: org.currency === Currency.RIAL ? 'IRR' : 'TOMAN',
      timezone: org.timezone || 'Asia/Tehran',
      updatedAt: org.updatedAt.toISOString(),
    };
  }

  /**
   * به‌روزرسانی تنظیمات عمومی سازمان (نام، لوگو، واحد پول، منطقه زمانی)
   */
  async updateGeneralSettings(
    dto: UpdateGeneralSettingsDto,
    currentUser: CurrentUserPayload,
  ): Promise<FormattedGeneralSettings> {
    this.assertAdminAccess(currentUser);
    const orgId = this.resolveOrganizationId(currentUser);

    const updateData: any = {};
    if (dto.name !== undefined) {
      const trimmed = dto.name.trim();
      if (!trimmed) {
        throw new BadRequestException('نام سازمان نمی‌تواند خالی باشد.');
      }
      updateData.name = trimmed;
    }

    if (dto.logoUrl !== undefined) {
      updateData.logoUrl = dto.logoUrl ? dto.logoUrl.trim() : null;
    }

    if (dto.currency !== undefined) {
      const curr = dto.currency.toUpperCase();
      if (curr === 'TOMAN') {
        updateData.currency = Currency.TOMAN;
      } else if (curr === 'IRR' || curr === 'RIAL') {
        updateData.currency = Currency.RIAL;
      } else {
        throw new BadRequestException('واحد پول نامعتبر است. فقط تومان یا ریال مجاز می‌باشد.');
      }
    }

    if (dto.timezone !== undefined) {
      updateData.timezone = dto.timezone.trim() || 'Asia/Tehran';
    }

    const updated = await this.prisma.organization.update({
      where: { id: orgId },
      data: updateData,
    });

    await this.logActivity(
      orgId,
      currentUser.id,
      'ORGANIZATION_SETTINGS_UPDATED',
      `به‌روزرسانی تنظیمات عمومی سازمان: ${updated.name}`,
    );

    return {
      id: updated.id,
      name: updated.name,
      logoUrl: updated.logoUrl || '',
      currency: updated.currency === Currency.RIAL ? 'IRR' : 'TOMAN',
      timezone: updated.timezone || 'Asia/Tehran',
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  // ============================================================================
  // ۲. گزینه‌ها و دسته‌بندی‌های سازمانی (ORGANIZATION TAXONOMIES)
  // ============================================================================

  /**
   * اطمینان از مقداردهی اولیه دسته‌بندی‌های پیش‌فرض در صورت خالی بودن دیتابیس
   */
  public async ensureSeeded(orgId: string, listType: OrgListType): Promise<void> {
    if (listType === 'lead_statuses') {
      const count = await this.prisma.leadStatusConfig.count({ where: { organizationId: orgId } });
      if (count === 0) {
        await this.prisma.$transaction(
          INITIAL_DEFAULT_SEED.lead_statuses.map((item) =>
            this.prisma.leadStatusConfig.create({
              data: {
                organizationId: orgId,
                key: item.key,
                label: item.label,
                group: item.group,
                color: item.color,
                sortOrder: item.order,
                isSystem: item.isSystem,
                isActive: true,
              },
            }),
          ),
        );
      }
    } else if (listType === 'cost_categories') {
      const count = await this.prisma.costCategory.count({ where: { organizationId: orgId } });
      if (count === 0) {
        await this.prisma.$transaction(
          INITIAL_DEFAULT_SEED.cost_categories.map((item) =>
            this.prisma.costCategory.create({
              data: {
                organizationId: orgId,
                code: item.code,
                name: item.name,
                description: item.description,
                isActive: item.isActive,
              },
            }),
          ),
        );
      }
    } else {
      const taxonomyType = TAXONOMY_TYPE_MAP[listType];
      if (taxonomyType) {
        const count = await this.prisma.organizationTaxonomy.count({
          where: { organizationId: orgId, taxonomyType },
        });
        if (count === 0) {
          const seedItems = (INITIAL_DEFAULT_SEED as any)[listType] || [];
          await this.prisma.$transaction(
            seedItems.map((item: any) =>
              this.prisma.organizationTaxonomy.create({
                data: {
                  organizationId: orgId,
                  taxonomyType,
                  key: item.key,
                  label: item.label,
                  sortOrder: item.order,
                  isSystem: item.isSystem,
                  isActive: true,
                },
              }),
            ),
          );
        }
      }
    }
  }

  /**
   * دریافت تمامی گزینه‌های یک فهرست سازمانی با ترتیب و تعداد استفاده محاسبه‌شده
   */
  async getListItems(
    listType: OrgListType,
    currentUser?: CurrentUserPayload,
  ): Promise<FormattedOrgListItem[]> {
    const orgId = this.resolveOrganizationId(currentUser);
    await this.ensureSeeded(orgId, listType);

    if (listType === 'lead_statuses') {
      const items = await this.prisma.leadStatusConfig.findMany({
        where: { organizationId: orgId },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      });

      // محاسبه داینامیک تعداد استفاده لیدها
      return Promise.all(
        items.map(async (item: any) => {
          const usageCount = await this.prisma.lead.count({
            where: {
              organizationId: orgId,
              OR: [{ statusConfigId: item.id }, { statusKey: item.key }],
            },
          });

          return {
            id: item.id,
            key: item.key,
            label: item.label,
            order: item.sortOrder,
            isActive: item.isActive,
            isSystem: item.isSystem,
            group: item.group,
            color: item.color || undefined,
            usageCount,
            createdAt: item.createdAt.toISOString(),
            updatedAt: item.updatedAt.toISOString(),
          };
        }),
      );
    }

    if (listType === 'cost_categories') {
      const items = await this.prisma.costCategory.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: 'asc' },
      });

      return Promise.all(
        items.map(async (item: any, idx: number) => {
          const usageCount = await this.prisma.cost.count({
            where: {
              organizationId: orgId,
              categoryId: item.id,
            },
          });

          return {
            id: item.id,
            key: item.code,
            label: item.name,
            order: idx + 1,
            isActive: item.isActive,
            isSystem: ['ad_media', 'content_production', 'agency_fee'].includes(item.code),
            description: item.description || undefined,
            usageCount,
            createdAt: item.createdAt.toISOString(),
            updatedAt: item.updatedAt.toISOString(),
          };
        }),
      );
    }

    const taxonomyType = TAXONOMY_TYPE_MAP[listType];
    if (!taxonomyType) {
      throw new BadRequestException(`فهرست نامعتبر: ${listType}`);
    }

    const items = await this.prisma.organizationTaxonomy.findMany({
      where: { organizationId: orgId, taxonomyType },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return Promise.all(
      items.map(async (item: any) => {
        let usageCount = 0;

        if (listType === 'campaign_types') {
          usageCount = await this.prisma.campaign.count({
            where: {
              organizationId: orgId,
              OR: [{ type: item.key }, { type: item.label }, { channel: item.key }, { channel: item.label }],
            },
          });
        } else if (listType === 'lead_sources') {
          usageCount = await this.prisma.lead.count({
            where: {
              organizationId: orgId,
              OR: [{ source: item.key }, { source: item.label }],
            },
          });
        } else if (listType === 'lost_reasons') {
          usageCount = await this.prisma.lead.count({
            where: {
              organizationId: orgId,
              OR: [{ lostReason: item.label }, { lostReason: item.key }],
            },
          });
        }

        return {
          id: item.id,
          key: item.key,
          label: item.label,
          order: item.sortOrder,
          isActive: item.isActive,
          isSystem: item.isSystem,
          usageCount,
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
        };
      }),
    );
  }

  /**
   * دریافت یک گزینه خاص با شناسه یکتا
   */
  async getListItemById(
    listType: OrgListType,
    id: string,
    currentUser?: CurrentUserPayload,
  ): Promise<FormattedOrgListItem> {
    const items = await this.getListItems(listType, currentUser);
    const item = items.find((i) => i.id === id);
    if (!item) {
      throw new NotFoundException(`گزینه مورد نظر با شناسه ${id} در فهرست ${listType} یافت نشد.`);
    }
    return item;
  }

  /**
   * ایجاد گزینه جدید در فهرست سازمانی
   */
  async createListItem(
    listType: OrgListType,
    dto: CreateTaxonomyItemDto,
    currentUser: CurrentUserPayload,
  ): Promise<FormattedOrgListItem> {
    this.assertAdminAccess(currentUser);
    const orgId = this.resolveOrganizationId(currentUser);

    const label = dto.label.trim();
    if (!label) {
      throw new BadRequestException('عنوان گزینه نمی‌تواند خالی باشد.');
    }

    // تولید کلید سیستمی در صورت عدم ارسال
    let key = dto.key?.trim();
    if (!key) {
      key = `custom_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    }

    if (listType === 'lead_statuses') {
      const existing = await this.prisma.leadStatusConfig.findFirst({
        where: { organizationId: orgId, key },
      });
      if (existing) {
        throw new BadRequestException(`کلید سیستمی «${key}» قبلاً برای وضعیت دیگری ثبت شده است.`);
      }

      const count = await this.prisma.leadStatusConfig.count({ where: { organizationId: orgId } });
      const created = await this.prisma.leadStatusConfig.create({
        data: {
          organizationId: orgId,
          key,
          label,
          group: dto.group || LeadStatusGroup.open,
          color: dto.color || 'blue',
          sortOrder: dto.order ?? count + 1,
          isSystem: false,
          isActive: dto.isActive !== undefined ? dto.isActive : true,
        },
      });

      await this.logActivity(orgId, currentUser.id, 'LEAD_STATUS_CREATED', `ایجاد وضعیت لید: ${label}`);

      return {
        id: created.id,
        key: created.key,
        label: created.label,
        order: created.sortOrder,
        isActive: created.isActive,
        isSystem: created.isSystem,
        group: created.group,
        color: created.color || undefined,
        usageCount: 0,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      };
    }

    if (listType === 'cost_categories') {
      const existing = await this.prisma.costCategory.findFirst({
        where: { organizationId: orgId, code: key },
      });
      if (existing) {
        throw new BadRequestException(`کد سرفصل هزینه «${key}» قبلاً ثبت شده است.`);
      }

      const created = await this.prisma.costCategory.create({
        data: {
          organizationId: orgId,
          code: key,
          name: label,
          description: dto.description || null,
          isActive: dto.isActive !== undefined ? dto.isActive : true,
        },
      });

      await this.logActivity(orgId, currentUser.id, 'COST_CATEGORY_CREATED', `ایجاد سرفصل هزینه: ${label}`);

      return {
        id: created.id,
        key: created.code,
        label: created.name,
        order: 1,
        isActive: created.isActive,
        isSystem: false,
        description: created.description || undefined,
        usageCount: 0,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      };
    }

    const taxonomyType = TAXONOMY_TYPE_MAP[listType];
    if (!taxonomyType) {
      throw new BadRequestException(`نوع فهرست نامعتبر است: ${listType}`);
    }

    const existing = await this.prisma.organizationTaxonomy.findUnique({
      where: {
        organizationId_taxonomyType_key: {
          organizationId: orgId,
          taxonomyType,
          key,
        },
      },
    });
    if (existing) {
      throw new BadRequestException(`گزینه‌ای با کلید «${key}» در این دسته‌بندی از قبل موجود است.`);
    }

    const count = await this.prisma.organizationTaxonomy.count({
      where: { organizationId: orgId, taxonomyType },
    });

    const created = await this.prisma.organizationTaxonomy.create({
      data: {
        organizationId: orgId,
        taxonomyType,
        key,
        label,
        sortOrder: dto.order ?? count + 1,
        isSystem: false,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });

    await this.logActivity(orgId, currentUser.id, 'TAXONOMY_ITEM_CREATED', `ایجاد گزینه در ${listType}: ${label}`);

    return {
      id: created.id,
      key: created.key,
      label: created.label,
      order: created.sortOrder,
      isActive: created.isActive,
      isSystem: created.isSystem,
      usageCount: 0,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  /**
   * ویرایش عنوان و خصوصیات یک گزینه در فهرست سازمانی
   */
  async updateListItem(
    listType: OrgListType,
    id: string,
    dto: UpdateTaxonomyItemDto,
    currentUser: CurrentUserPayload,
  ): Promise<FormattedOrgListItem> {
    this.assertAdminAccess(currentUser);
    const orgId = this.resolveOrganizationId(currentUser);

    if (listType === 'lead_statuses') {
      const existing = await this.prisma.leadStatusConfig.findFirst({
        where: { id, organizationId: orgId },
      });
      if (!existing) {
        throw new NotFoundException(`وضعیت لید با شناسه ${id} یافت نشد.`);
      }

      const updateData: any = {};
      if (dto.label !== undefined) updateData.label = dto.label.trim();
      if (dto.group !== undefined) updateData.group = dto.group;
      if (dto.color !== undefined) updateData.color = dto.color.trim();
      if (dto.order !== undefined) updateData.sortOrder = dto.order;
      if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

      const updated = await this.prisma.leadStatusConfig.update({
        where: { id },
        data: updateData,
      });

      await this.logActivity(orgId, currentUser.id, 'LEAD_STATUS_UPDATED', `ویرایش وضعیت لید: ${updated.label}`);

      return this.getListItemById(listType, id, currentUser);
    }

    if (listType === 'cost_categories') {
      const existing = await this.prisma.costCategory.findFirst({
        where: { id, organizationId: orgId },
      });
      if (!existing) {
        throw new NotFoundException(`سرفصل هزینه با شناسه ${id} یافت نشد.`);
      }

      const updateData: any = {};
      if (dto.label !== undefined) updateData.name = dto.label.trim();
      if (dto.description !== undefined) updateData.description = dto.description.trim();
      if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

      const updated = await this.prisma.costCategory.update({
        where: { id },
        data: updateData,
      });

      await this.logActivity(orgId, currentUser.id, 'COST_CATEGORY_UPDATED', `ویرایش سرفصل هزینه: ${updated.name}`);

      return this.getListItemById(listType, id, currentUser);
    }

    const taxonomyType = TAXONOMY_TYPE_MAP[listType];
    const existing = await this.prisma.organizationTaxonomy.findFirst({
      where: { id, organizationId: orgId, taxonomyType },
    });
    if (!existing) {
      throw new NotFoundException(`گزینه مورد نظر در ${listType} یافت نشد.`);
    }

    const updateData: any = {};
    if (dto.label !== undefined) updateData.label = dto.label.trim();
    if (dto.order !== undefined) updateData.sortOrder = dto.order;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    const updated = await this.prisma.organizationTaxonomy.update({
      where: { id },
      data: updateData,
    });

    await this.logActivity(orgId, currentUser.id, 'TAXONOMY_ITEM_UPDATED', `ویرایش گزینه در ${listType}: ${updated.label}`);

    return this.getListItemById(listType, id, currentUser);
  }

  /**
   * تغییر وضعیت فعال / غیرفعال بودن گزینه
   */
  async toggleListItemStatus(
    listType: OrgListType,
    id: string,
    currentUser: CurrentUserPayload,
  ): Promise<FormattedOrgListItem> {
    this.assertAdminAccess(currentUser);
    const orgId = this.resolveOrganizationId(currentUser);

    if (listType === 'lead_statuses') {
      const existing = await this.prisma.leadStatusConfig.findFirst({
        where: { id, organizationId: orgId },
      });
      if (!existing) {
        throw new NotFoundException(`وضعیت لید با شناسه ${id} یافت نشد.`);
      }

      const updated = await this.prisma.leadStatusConfig.update({
        where: { id },
        data: { isActive: !existing.isActive },
      });

      await this.logActivity(
        orgId,
        currentUser.id,
        'LEAD_STATUS_STATUS_TOGGLED',
        `تغییر وضعیت فعال‌سازی ${updated.label} به ${updated.isActive ? 'فعال' : 'غیرفعال'}`,
      );

      return this.getListItemById(listType, id, currentUser);
    }

    if (listType === 'cost_categories') {
      const existing = await this.prisma.costCategory.findFirst({
        where: { id, organizationId: orgId },
      });
      if (!existing) {
        throw new NotFoundException(`سرفصل هزینه با شناسه ${id} یافت نشد.`);
      }

      const updated = await this.prisma.costCategory.update({
        where: { id },
        data: { isActive: !existing.isActive },
      });

      await this.logActivity(
        orgId,
        currentUser.id,
        'COST_CATEGORY_STATUS_TOGGLED',
        `تغییر وضعیت فعال‌سازی ${updated.name} به ${updated.isActive ? 'فعال' : 'غیرفعال'}`,
      );

      return this.getListItemById(listType, id, currentUser);
    }

    const taxonomyType = TAXONOMY_TYPE_MAP[listType];
    const existing = await this.prisma.organizationTaxonomy.findFirst({
      where: { id, organizationId: orgId, taxonomyType },
    });
    if (!existing) {
      throw new NotFoundException(`گزینه مورد نظر در ${listType} یافت نشد.`);
    }

    const updated = await this.prisma.organizationTaxonomy.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });

    await this.logActivity(
      orgId,
      currentUser.id,
      'TAXONOMY_ITEM_STATUS_TOGGLED',
      `تغییر وضعیت ${updated.label} به ${updated.isActive ? 'فعال' : 'غیرفعال'}`,
    );

    return this.getListItemById(listType, id, currentUser);
  }

  /**
   * مرتب‌سازی گزینه‌های یک فهرست (Drag & Drop)
   */
  async reorderListItems(
    listType: OrgListType,
    dto: ReorderTaxonomyItemsDto,
    currentUser: CurrentUserPayload,
  ): Promise<FormattedOrgListItem[]> {
    this.assertAdminAccess(currentUser);
    const orgId = this.resolveOrganizationId(currentUser);

    if (listType === 'lead_statuses') {
      await this.prisma.$transaction(
        dto.orderedIds.map((id, index) =>
          this.prisma.leadStatusConfig.updateMany({
            where: { id, organizationId: orgId },
            data: { sortOrder: index + 1 },
          }),
        ),
      );
    } else if (listType === 'cost_categories') {
      // CostCategory مدل sortOrder ندارد، ترتیب با ترتیب شناسه‌ها یا درج حفظ می‌شود
    } else {
      const taxonomyType = TAXONOMY_TYPE_MAP[listType];
      if (taxonomyType) {
        await this.prisma.$transaction(
          dto.orderedIds.map((id, index) =>
            this.prisma.organizationTaxonomy.updateMany({
              where: { id, organizationId: orgId, taxonomyType },
              data: { sortOrder: index + 1 },
            }),
          ),
        );
      }
    }

    await this.logActivity(orgId, currentUser.id, 'TAXONOMY_ITEMS_REORDERED', `مرتب‌سازی گزینه‌های ${listType}`);

    return this.getListItems(listType, currentUser);
  }

  /**
   * حذف فیزیکی یک گزینه با تضمین محافظت در صورت استفاده شدن (Foreign-key / Usage protection)
   */
  async deleteListItem(
    listType: OrgListType,
    id: string,
    currentUser: CurrentUserPayload,
  ): Promise<{ success: boolean; message: string }> {
    this.assertAdminAccess(currentUser);
    const orgId = this.resolveOrganizationId(currentUser);

    const item = await this.getListItemById(listType, id, currentUser);

    // گارد محافظت در برابر حذف فیزیکی موارد متصل به داده‌های عملیاتی
    if (item.usageCount > 0) {
      throw new BadRequestException(
        `امکان حذف فیزیکی گزینه «${item.label}» وجود ندارد زیرا در ${item.usageCount} رکورد ثبت‌شده سیستم استفاده شده است. می‌توانید آن را غیرفعال فرمایید.`,
      );
    }

    if (listType === 'lead_statuses') {
      await this.prisma.leadStatusConfig.delete({
        where: { id },
      });
    } else if (listType === 'cost_categories') {
      await this.prisma.costCategory.delete({
        where: { id },
      });
    } else {
      await this.prisma.organizationTaxonomy.delete({
        where: { id },
      });
    }

    await this.logActivity(orgId, currentUser.id, 'TAXONOMY_ITEM_DELETED', `حذف گزینه از ${listType}: ${item.label}`);

    return {
      success: true,
      message: `گزینه «${item.label}» با موفقیت حذف شد.`,
    };
  }
}
