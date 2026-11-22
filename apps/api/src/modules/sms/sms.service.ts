import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateSmsCampaignDto } from './dto/create-sms-campaign.dto';
import { QuerySmsCampaignsDto } from './dto/query-sms-campaigns.dto';
import { QuerySmsRecipientsDto } from './dto/query-sms-recipients.dto';
import { ImportSmsResultsDto, SmsResultRowDto } from './dto/import-sms-results.dto';
import { maskPhoneNumber, normalizeMobileNumber } from './sms.utils';
import { CsvParser } from '../imports/utils/csv-parser';

export interface CurrentUserPayload {
  id: string;
  email?: string;
  role: string;
  organizationId: string;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * RBAC Enforcement (Product Document p. 17 §17)
   * Authorized: admin, marketing_manager, campaign_manager
   * Denied: sales_agent, content_creator, client
   */
  private assertAccess(user?: CurrentUserPayload) {
    if (!user) return;
    const allowedRoles = ['admin', 'marketing_manager', 'campaign_manager'];
    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenException(
        `نقش شما (${user.role}) مجوز دسترسی به ماژول پیامک (SMS) را ندارد (سند محصول ص ۱۷).`,
      );
    }
  }

  // ==============================================================================
  // 1. SMS SENDING HISTORY LIST (لیست تاریخچه ارسال پیامک - ص ۱۷)
  // ==============================================================================

  async findAll(query: QuerySmsCampaignsDto, user?: CurrentUserPayload) {
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
        { name: { contains: term, mode: 'insensitive' } },
        { messageText: { contains: term, mode: 'insensitive' } },
        { senderNumber: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [total, records] = await Promise.all([
      this.prisma.smsCampaign.count({ where }),
      this.prisma.smsCampaign.findMany({
        where,
        include: {
          campaign: { select: { id: true, name: true } },
          _count: {
            select: {
              recipients: {
                where: { replyText: { not: null } },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const items = records.map((r) => ({
      id: r.id,
      name: r.name,
      senderNumber: r.senderNumber,
      messageText: r.messageText,
      messagePreview: r.messageText.length > 60 ? r.messageText.slice(0, 60) + '...' : r.messageText,
      recipientCount: r.recipientCount,
      deliveredCount: r.deliveredCount,
      failedCount: r.failedCount,
      costAmount: Number(r.costAmount),
      unitCost: r.recipientCount > 0 ? Math.round(Number(r.costAmount) / r.recipientCount) : 0,
      replyCount: r._count?.recipients || 0,
      status: r.status,
      campaignId: r.campaignId,
      campaignName: r.campaign?.name || null,
      scheduledAt: r.scheduledAt ? r.scheduledAt.toISOString() : null,
      sentAt: r.sentAt ? r.sentAt.toISOString() : r.createdAt.toISOString(),
      createdAt: r.createdAt.toISOString(),
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
  // 2. CREATE SMS CAMPAIGN / BATCH
  // ==============================================================================

  async create(dto: CreateSmsCampaignDto, user?: CurrentUserPayload) {
    this.assertAccess(user);
    const organizationId = user?.organizationId || '00000000-0000-0000-0000-000000000001';

    // Verify campaign exists if provided
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

    const created = await this.prisma.smsCampaign.create({
      data: {
        organizationId,
        campaignId: dto.campaignId || null,
        name: dto.name.trim(),
        senderNumber: dto.senderNumber.trim(),
        messageText: dto.messageText.trim(),
        costAmount: dto.costAmount || 0,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        status: dto.scheduledAt ? 'scheduled' : 'draft',
      },
    });

    return {
      ...created,
      campaignName,
      costAmount: Number(created.costAmount),
    };
  }

  // ==============================================================================
  // 3. SMS CAMPAIGN DETAILS (جزئیات ارسال پیامک و خلاصه آمار - ص ۱۷)
  // ==============================================================================

  async findOne(id: string, user?: CurrentUserPayload) {
    this.assertAccess(user);
    const organizationId = user?.organizationId || '00000000-0000-0000-0000-000000000001';

    const sms = await this.prisma.smsCampaign.findFirst({
      where: { id, organizationId },
      include: {
        campaign: { select: { id: true, name: true } },
      },
    });

    if (!sms) {
      throw new NotFoundException('رکورد ارسال پیامک مورد نظر یافت نشد.');
    }

    // Accurate real counts directly from recipients table
    const [totalRecipients, deliveredCount, failedCount, repliesCount, convertedCount] =
      await Promise.all([
        this.prisma.smsRecipient.count({ where: { smsCampaignId: id, organizationId } }),
        this.prisma.smsRecipient.count({
          where: { smsCampaignId: id, organizationId, status: 'delivered' },
        }),
        this.prisma.smsRecipient.count({
          where: { smsCampaignId: id, organizationId, status: 'failed' },
        }),
        this.prisma.smsRecipient.count({
          where: { smsCampaignId: id, organizationId, replyText: { not: null } },
        }),
        this.prisma.smsRecipient.count({
          where: { smsCampaignId: id, organizationId, convertedLeadId: { not: null } },
        }),
      ]);

    // Use persisted or recipient count
    const totalCount = totalRecipients > 0 ? totalRecipients : sms.recipientCount;
    const delivered = totalRecipients > 0 ? deliveredCount : sms.deliveredCount;
    const failed = totalRecipients > 0 ? failedCount : sms.failedCount;
    const cost = Number(sms.costAmount);
    const unitCost = totalCount > 0 ? Math.round(cost / totalCount) : 0;

    return {
      id: sms.id,
      name: sms.name,
      senderNumber: sms.senderNumber,
      messageText: sms.messageText,
      status: sms.status,
      campaignId: sms.campaignId,
      campaignName: sms.campaign?.name || null,
      summary: {
        totalCount, // تعداد کل
        deliveredCount: delivered, // تعداد تحویل‌شده
        failedCount: failed, // تعداد ناموفق
        repliesCount, // تعداد پاسخ‌ها
        convertedLeadsCount: convertedCount, // لیدهای تبدیل‌شده
        costAmount: cost, // هزینه کل
        unitCost, // هزینه هر پیامک
      },
      scheduledAt: sms.scheduledAt ? sms.scheduledAt.toISOString() : null,
      sentAt: sms.sentAt ? sms.sentAt.toISOString() : sms.createdAt.toISOString(),
      createdAt: sms.createdAt.toISOString(),
      updatedAt: sms.updatedAt.toISOString(),
    };
  }

  // ==============================================================================
  // 4. SMS RECIPIENTS TABLE (جدول شماره‌ها با ماسک شماره تلفن - ص ۱۷)
  // ==============================================================================

  async findRecipients(id: string, query: QuerySmsRecipientsDto, user?: CurrentUserPayload) {
    this.assertAccess(user);
    const organizationId = user?.organizationId || '00000000-0000-0000-0000-000000000001';

    // Verify SMS campaign exists in this organization
    const sms = await this.prisma.smsCampaign.findFirst({
      where: { id, organizationId },
      select: { id: true },
    });
    if (!sms) {
      throw new NotFoundException('کمپین پیامکی یافت نشد.');
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Number(query.limit) || 20);
    const skip = (page - 1) * limit;

    const where: any = { smsCampaignId: id, organizationId };

    if (query.status && query.status !== 'all') {
      if (query.status === 'replied') {
        where.replyText = { not: null };
      } else {
        where.status = query.status;
      }
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      const normTerm = normalizeMobileNumber(term);
      where.OR = [
        { mobile: { contains: normTerm || term } },
        { replyText: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [total, recipients] = await Promise.all([
      this.prisma.smsRecipient.count({ where }),
      this.prisma.smsRecipient.findMany({
        where,
        include: {
          convertedLead: { select: { id: true, fullName: true, statusKey: true } },
        },
        orderBy: [{ replyText: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
    ]);

    const items = recipients.map((r) => ({
      id: r.id,
      mobileMasked: maskPhoneNumber(r.mobile), // شماره تلفن ماسک‌شده (الزام امنیتی ص ۱۷)
      status: r.status,
      deliveredAt: r.deliveredAt ? r.deliveredAt.toISOString() : null,
      replyText: r.replyText || null,
      repliedAt: r.repliedAt ? r.repliedAt.toISOString() : null,
      convertedLeadId: r.convertedLeadId,
      convertedLeadName: r.convertedLead?.fullName || null,
      createdAt: r.createdAt.toISOString(),
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
  // 5. ACTION A: IMPORT SENDING RESULTS (ایمپورت نتیجه ارسال - ص ۱۷)
  // ==============================================================================

  async importResults(id: string, dto: ImportSmsResultsDto, user?: CurrentUserPayload) {
    this.assertAccess(user);
    const organizationId = user?.organizationId || '00000000-0000-0000-0000-000000000001';

    const sms = await this.prisma.smsCampaign.findFirst({
      where: { id, organizationId },
    });
    if (!sms) {
      throw new NotFoundException('رکورد ارسال پیامک یافت نشد.');
    }

    let rows: Array<{
      mobile: string;
      status?: string;
      deliveredAt?: string;
      replyText?: string;
      repliedAt?: string;
    }> = [];

    // Parse CSV if provided
    if (dto.csvContent && dto.csvContent.trim()) {
      const parsed = CsvParser.parse(dto.csvContent);
      if (parsed.rows.length === 0) {
        throw new BadRequestException('فایل بارگذاری‌شده فاقد ردیف داده است.');
      }

      // Detect column indices based on Persian/English aliases
      const mobileIdx = parsed.headers.findIndex((h) =>
        ['شماره', 'تلفن', 'موبایل', 'شماره تلفن', 'mobile', 'phone', 'cellphone'].includes(
          h.toLowerCase().trim(),
        ),
      );
      const statusIdx = parsed.headers.findIndex((h) =>
        ['وضعیت', 'وضعیت ارسال', 'status', 'delivery_status', 'deliverystatus'].includes(
          h.toLowerCase().trim(),
        ),
      );
      const deliveredAtIdx = parsed.headers.findIndex((h) =>
        ['زمان', 'تاریخ', 'زمان تحویل', 'تاریخ تحویل', 'date', 'delivered_at'].includes(
          h.toLowerCase().trim(),
        ),
      );
      const replyIdx = parsed.headers.findIndex((h) =>
        ['پاسخ', 'متن پاسخ', 'جواب', 'reply', 'reply_text', 'response'].includes(
          h.toLowerCase().trim(),
        ),
      );
      const repliedAtIdx = parsed.headers.findIndex((h) =>
        ['زمان پاسخ', 'تاریخ پاسخ', 'replied_at'].includes(h.toLowerCase().trim()),
      );

      if (mobileIdx === -1) {
        throw new BadRequestException(
          'ستون شماره موبایل در فایل یافت نشد. عناوین مجاز: شماره، موبایل، تلفن، mobile، phone',
        );
      }

      rows = parsed.rows.map((r) => ({
        mobile: r[mobileIdx] || '',
        status: statusIdx !== -1 ? r[statusIdx] : undefined,
        deliveredAt: deliveredAtIdx !== -1 ? r[deliveredAtIdx] : undefined,
        replyText: replyIdx !== -1 ? r[replyIdx] : undefined,
        repliedAt: repliedAtIdx !== -1 ? r[repliedAtIdx] : undefined,
      }));
    } else if (dto.rows && Array.isArray(dto.rows)) {
      rows = dto.rows;
    } else {
      throw new BadRequestException('لطفاً محتوای CSV یا ردیف‌های نتایج را ارسال فرمایید.');
    }

    // Existing mobiles in this campaign for duplicate prevention
    const existingRecipients = await this.prisma.smsRecipient.findMany({
      where: { smsCampaignId: id, organizationId },
      select: { mobile: true },
    });
    const existingMobileSet = new Set(existingRecipients.map((r) => r.mobile));

    const seenBatchMobiles = new Set<string>();
    const validRecords: any[] = [];
    const errors: Array<{ row: number; reason: string }> = [];
    let duplicates = 0;
    let failed = 0;

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 1;
      const row = rows[i];
      const normMobile = normalizeMobileNumber(row.mobile);

      if (!normMobile || normMobile.length < 10) {
        errors.push({ row: rowNum, reason: `شماره موبایل نامعتبر است: ${row.mobile}` });
        failed++;
        continue;
      }

      // Check duplicates within batch or existing DB records
      if (seenBatchMobiles.has(normMobile) || existingMobileSet.has(normMobile)) {
        duplicates++;
        continue;
      }

      seenBatchMobiles.add(normMobile);

      // Parse status
      let deliveryStatus: 'delivered' | 'failed' | 'pending' = 'delivered';
      const st = (row.status || '').toLowerCase().trim();
      if (['failed', 'ناموفق', 'نرسیده', 'خطا', 'عدم تحویل'].includes(st)) {
        deliveryStatus = 'failed';
      } else if (['pending', 'در انتظار', 'ارسال شده'].includes(st)) {
        deliveryStatus = 'pending';
      }

      validRecords.push({
        organizationId,
        smsCampaignId: id,
        mobile: normMobile,
        status: deliveryStatus,
        deliveredAt: row.deliveredAt ? new Date(row.deliveredAt) : new Date(),
        replyText: row.replyText?.trim() || null,
        repliedAt: row.replyText?.trim() ? (row.repliedAt ? new Date(row.repliedAt) : new Date()) : null,
      });
    }

    // Persist valid records transactionally
    let successfullyImported = 0;
    if (validRecords.length > 0) {
      await this.prisma.$transaction(async (tx) => {
        await tx.smsRecipient.createMany({
          data: validRecords,
        });

        // Recalculate counters
        const total = await tx.smsRecipient.count({ where: { smsCampaignId: id, organizationId } });
        const deliv = await tx.smsRecipient.count({
          where: { smsCampaignId: id, organizationId, status: 'delivered' },
        });
        const fail = await tx.smsRecipient.count({
          where: { smsCampaignId: id, organizationId, status: 'failed' },
        });

        await tx.smsCampaign.update({
          where: { id },
          data: {
            recipientCount: total,
            deliveredCount: deliv,
            failedCount: fail,
            status: 'sent',
            sentAt: sms.sentAt || new Date(),
          },
        });
      });
      successfullyImported = validRecords.length;
    }

    return {
      totalRows: rows.length,
      successfullyImported,
      failed,
      duplicates,
      errors,
    };
  }

  // ==============================================================================
  // 6. ACTION B: CREATE LEADS FROM RESPONDENTS (ساخت لید از پاسخ‌دهندگان - ص ۱۷)
  // ==============================================================================

  /**
   * پیش‌نمایش تبدیل پاسخ‌دهندگان به لید و شناسایی موارد تکراری
   */
  async convertRepliesPreview(id: string, user?: CurrentUserPayload) {
    this.assertAccess(user);
    const organizationId = user?.organizationId || '00000000-0000-0000-0000-000000000001';

    const respondents = await this.prisma.smsRecipient.findMany({
      where: {
        smsCampaignId: id,
        organizationId,
        replyText: { not: null },
        convertedLeadId: null, // Still not converted
      },
      select: {
        id: true,
        mobile: true,
        replyText: true,
        repliedAt: true,
      },
    });

    if (respondents.length === 0) {
      return {
        totalRespondents: 0,
        eligibleCount: 0,
        duplicateCount: 0,
        respondents: [],
      };
    }

    // Check existing leads in this organization by mobile
    const mobiles = respondents.map((r) => r.mobile);
    const existingLeads = await this.prisma.lead.findMany({
      where: {
        organizationId,
        mobile: { in: mobiles },
      },
      select: { id: true, mobile: true, fullName: true },
    });

    const existingLeadMap = new Map<string, { id: string; fullName: string }>();
    for (const l of existingLeads) {
      existingLeadMap.set(l.mobile, { id: l.id, fullName: l.fullName });
    }

    const items = respondents.map((r) => {
      const existing = existingLeadMap.get(r.mobile);
      return {
        id: r.id,
        mobileMasked: maskPhoneNumber(r.mobile),
        replyText: r.replyText,
        repliedAt: r.repliedAt ? r.repliedAt.toISOString() : null,
        isDuplicate: Boolean(existing),
        existingLeadId: existing?.id || null,
        existingLeadName: existing?.fullName || null,
      };
    });

    const duplicateCount = items.filter((i) => i.isDuplicate).length;
    const eligibleCount = items.length - duplicateCount;

    return {
      totalRespondents: respondents.length,
      eligibleCount,
      duplicateCount,
      respondents: items,
    };
  }

  /**
   * تایید و ساخت تراکنشی لیدها از پاسخ‌دهندگان واجد شرایط
   */
  async convertRepliesConfirm(id: string, user?: CurrentUserPayload) {
    this.assertAccess(user);
    const organizationId = user?.organizationId || '00000000-0000-0000-0000-000000000001';

    const sms = await this.prisma.smsCampaign.findFirst({
      where: { id, organizationId },
    });
    if (!sms) {
      throw new NotFoundException('کمپین پیامکی یافت نشد.');
    }

    const respondents = await this.prisma.smsRecipient.findMany({
      where: {
        smsCampaignId: id,
        organizationId,
        replyText: { not: null },
        convertedLeadId: null,
      },
    });

    if (respondents.length === 0) {
      return {
        createdCount: 0,
        skippedDuplicates: 0,
        message: 'هیچ پاسخ‌دهنده جدیدی برای تبدیل به لید یافت نشد.',
      };
    }

    // Check existing leads to strictly avoid duplicates
    const mobiles = respondents.map((r) => r.mobile);
    const existingLeads = await this.prisma.lead.findMany({
      where: {
        organizationId,
        mobile: { in: mobiles },
      },
      select: { id: true, mobile: true },
    });
    const existingMobileSet = new Set(existingLeads.map((l) => l.mobile));

    const eligible = respondents.filter((r) => !existingMobileSet.has(r.mobile));
    const createdLeadIds: string[] = [];

    await this.prisma.$transaction(async (tx) => {
      for (const r of eligible) {
        const lead = await tx.lead.create({
          data: {
            organizationId,
            fullName: `مخاطب پیامک ${maskPhoneNumber(r.mobile)}`,
            mobile: r.mobile,
            source: 'sms',
            campaignId: sms.campaignId || null,
            statusKey: 'new',
            nextFollowUpNote: r.replyText ? `پاسخ پیامک: ${r.replyText}` : undefined,
          },
        });

        await tx.smsRecipient.update({
          where: { id: r.id },
          data: { convertedLeadId: lead.id },
        });

        createdLeadIds.push(lead.id);
      }
    });

    return {
      createdCount: createdLeadIds.length,
      skippedDuplicates: respondents.length - eligible.length,
      leadIds: createdLeadIds,
      message: `${createdLeadIds.length} لید جدید با موفقیت ایجاد گردید.`,
    };
  }

  // ==============================================================================
  // 7. ACTION C: EXCEL / CSV EXPORT (خروجی Excel با انکودینگ UTF-8 BOM - ص ۱۷)
  // ==============================================================================

  async exportRecipientsCsv(id: string, user?: CurrentUserPayload): Promise<string> {
    this.assertAccess(user);
    const organizationId = user?.organizationId || '00000000-0000-0000-0000-000000000001';

    const sms = await this.prisma.smsCampaign.findFirst({
      where: { id, organizationId },
      include: { campaign: { select: { name: true } } },
    });
    if (!sms) {
      throw new NotFoundException('کمپین پیامکی یافت نشد.');
    }

    const recipients = await this.prisma.smsRecipient.findMany({
      where: { smsCampaignId: id, organizationId },
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'شماره تلفن (ماسک‌شده)',
      'وضعیت ارسال',
      'زمان تحویل',
      'متن پاسخ',
      'زمان پاسخ',
      'شناسه لید تبدیل‌شده',
    ];

    const statusMapFa: Record<string, string> = {
      delivered: 'تحویل داده شد',
      failed: 'ناموفق',
      pending: 'در انتظار',
    };

    const rows = recipients.map((r) => [
      maskPhoneNumber(r.mobile),
      statusMapFa[r.status] || r.status,
      r.deliveredAt ? r.deliveredAt.toISOString() : '',
      r.replyText ? `"${r.replyText.replace(/"/g, '""')}"` : '',
      r.repliedAt ? r.repliedAt.toISOString() : '',
      r.convertedLeadId || '',
    ]);

    // Prepend UTF-8 BOM so Excel opens Persian text seamlessly without gibberish
    const csvContent =
      '\uFEFF' +
      headers.join(',') +
      '\n' +
      rows.map((row) => row.join(',')).join('\n');

    return csvContent;
  }
}
