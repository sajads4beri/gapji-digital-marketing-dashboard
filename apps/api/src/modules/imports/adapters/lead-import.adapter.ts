import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { LeadsService } from '../../leads/leads.service';
import {
  ImportAdapter,
  TargetFieldDef,
  FieldResolutionContext,
  RowValidationResult,
  BatchPersistResult,
} from './import-adapter.interface';
import { CurrentUserPayload } from '../dto/current-user-payload.interface';
import { Prisma } from '@prisma/client';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class LeadImportAdapter implements ImportAdapter {
  readonly dataType = 'leads' as const;
  private readonly logger = new Logger(LeadImportAdapter.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly leadsService: LeadsService,
  ) {}

  getTargetFields(): TargetFieldDef[] {
    return [
      {
        key: 'fullName',
        label: 'Full Name',
        labelFa: 'نام و نام خانوادگی',
        required: true,
        aliases: [
          'نام',
          'نام و نام خانوادگی',
          'نام خانوادگی',
          'نام لید',
          'نام مخاطب',
          'fullname',
          'name',
          'full_name',
          'lead_name',
        ],
        example: 'امیررضا علوی',
      },
      {
        key: 'mobile',
        label: 'Mobile Number',
        labelFa: 'شماره تلفن همراه',
        required: true,
        aliases: [
          'موبایل',
          'شماره همراه',
          'شماره تلفن',
          'تلفن همراه',
          'شماره تماس',
          'تلفن',
          'شماره',
          'mobile',
          'phone',
          'cellphone',
          'contact_number',
        ],
        example: '09123456789',
      },
      {
        key: 'email',
        label: 'Email',
        labelFa: 'پست الکترونیکی (ایمیل)',
        required: false,
        aliases: ['ایمیل', 'پست الکترونیک', 'پست الکترونیکی', 'رایانامه', 'email', 'e-mail', 'mail'],
        example: 'reza@example.com',
      },
      {
        key: 'city',
        label: 'City',
        labelFa: 'شهر',
        required: false,
        aliases: ['شهر', 'استان', 'محل سکونت', 'city', 'location', 'province'],
        example: 'تهران',
      },
      {
        key: 'source',
        label: 'Source',
        labelFa: 'منبع جذب',
        required: false,
        aliases: ['منبع', 'منبع جذب', 'کانال ورودی', 'روش جذب', 'source', 'lead_source', 'channel'],
        example: 'اینستاگرام / نمایشگاه',
      },
      {
        key: 'statusKey',
        label: 'Lead Status',
        labelFa: 'وضعیت در پایپ‌لاین',
        required: false,
        aliases: ['وضعیت', 'مرحله', 'وضعیت لید', 'مرحله پایپ لاین', 'status', 'stage', 'pipeline_status'],
        example: 'جدید / در حال مذاکره',
      },
      {
        key: 'campaignName',
        label: 'Campaign',
        labelFa: 'کمپین بازاریابی',
        required: false,
        aliases: ['کمپین', 'نام کمپین', 'شناسه کمپین', 'عنوان کمپین', 'campaign', 'campaign_name', 'campaign_id'],
        example: 'کمپین بلک فرایدی ۱۴۰۵',
      },
      {
        key: 'assignedToName',
        label: 'Assignee',
        labelFa: 'مسئول / کارشناس فروش',
        required: false,
        aliases: [
          'مسئول',
          'کارشناس',
          'کارشناس فروش',
          'تخصیص به',
          'نماینده فروش',
          'assigned_to',
          'assignee',
          'sales_agent',
          'owner',
        ],
        example: 'نیما باقری',
      },
      {
        key: 'salesValue',
        label: 'Deal Value',
        labelFa: 'ارزش معامله (تومان)',
        required: false,
        aliases: [
          'ارزش معامله',
          'ارزش فروش',
          'مبلغ فروش',
          'مبلغ معامله',
          'ارزش',
          'deal_value',
          'sales_value',
          'value',
          'amount',
        ],
        example: '25000000',
      },
      {
        key: 'lostReason',
        label: 'Lost Reason',
        labelFa: 'دلیل انصراف یا رد',
        required: false,
        aliases: ['دلیل انصراف', 'دلیل رد', 'علت لغو', 'lost_reason', 'rejection_reason'],
        example: 'قیمت بالا',
      },
      {
        key: 'nextFollowUpAt',
        label: 'Next Follow-up Date',
        labelFa: 'تاریخ پیگیری بعدی',
        required: false,
        aliases: [
          'تاریخ پیگیری',
          'پیگیری بعدی',
          'تاریخ پیگیری بعدی',
          'موعد پیگیری',
          'follow_up_date',
          'next_follow_up',
        ],
        example: '2026-11-20',
      },
      {
        key: 'nextFollowUpNote',
        label: 'Follow-up Note',
        labelFa: 'یادداشت پیگیری بعدی',
        required: false,
        aliases: ['یادداشت پیگیری', 'توضیحات پیگیری', 'شرح پیگیری', 'یادداشت', 'follow_up_note', 'note'],
        example: 'ارسال کاتالوگ سازمانی و پیش‌فاکتور',
      },
    ];
  }

  getSampleTemplate(): { headers: string[]; rows: string[][] } {
    return {
      headers: [
        'نام و نام خانوادگی',
        'شماره همراه',
        'ایمیل',
        'شهر',
        'منبع جذب',
        'وضعیت لید',
        'کمپین',
        'ارزش معامله',
        'یادداشت پیگیری',
      ],
      rows: [
        [
          'علیرضا صادقی',
          '09121112233',
          'alireza.s@example.com',
          'تهران',
          'نمایشگاه الکامپ',
          'جدید',
          'کمپین پاییزه',
          '20000000',
          'تماس جهت ارسال کاتالوگ',
        ],
        [
          'سارا محمدی',
          '09354445566',
          'sara.m@company.ir',
          'اصفهان',
          'گوگل ادز',
          'واجد شرایط',
          'کمپین سرچ گوگل',
          '45000000',
          'هماهنگی جلسه پرزنتیشن دوشنبه',
        ],
        [
          'محسن کریمی',
          '09187778899',
          '',
          'شیراز',
          'اینستاگرام',
          'جدید',
          '',
          '15000000',
          'ارسال پیامک خوش‌آمدگویی',
        ],
      ],
    };
  }

  assertAccess(user: CurrentUserPayload): void {
    if (!user.organizationId) {
      throw new BadRequestException('سازمان فعال برای کاربر مشخص نشده است');
    }

    // DEC-AUTH-11: campaign_manager can never access Leads
    if (user.role === 'campaign_manager') {
      throw new ForbiddenException(
        'مدیر کمپین طبق مصوبه DEC-AUTH-11 به صندوق و ماژول لید دسترسی ندارد',
      );
    }

    if (user.role === 'client' || user.role === 'content_creator') {
      throw new ForbiddenException('نقش کاربری شما مجوز ایمپورت لید را ندارد');
    }

    // admin, marketing_manager, sales_agent are allowed
  }

  async loadResolutionContext(
    organizationId: string,
    user: CurrentUserPayload,
  ): Promise<FieldResolutionContext> {
    // 1. بارگذاری کمپین‌های فعال سازمان
    const campaigns = await this.prisma.campaign.findMany({
      where: { organizationId },
      select: { id: true, name: true },
    });
    const campaignMap = new Map<string, string>();
    const campaignNames = new Map<string, string>();
    for (const c of campaigns) {
      campaignMap.set(c.id.toLowerCase(), c.id);
      campaignMap.set(c.name.trim().toLowerCase(), c.id);
      campaignNames.set(c.id, c.name);
    }

    // 2. بارگذاری وضعیت‌های لید فعال سازمان (B2.5.4)
    const statusConfigs = await this.prisma.leadStatusConfig.findMany({
      where: { organizationId, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    const statusMap = new Map<string, any>();
    let defaultStatus = statusConfigs.find((s) => s.key === 'new');
    if (!defaultStatus) {
      defaultStatus = statusConfigs.find((s) => s.group === 'open') || statusConfigs[0];
    }
    for (const s of statusConfigs) {
      statusMap.set(s.key.toLowerCase(), s);
      statusMap.set(s.label.trim().toLowerCase(), s);
      statusMap.set(s.id.toLowerCase(), s);
    }

    // 3. بارگذاری کارشناسان فعال سازمان
    const memberships = await this.prisma.organizationMembership.findMany({
      where: { organizationId, status: 'active' },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
    });
    const assigneeMap = new Map<string, string>();
    for (const m of memberships) {
      if (m.user) {
        assigneeMap.set(m.user.id.toLowerCase(), m.user.id);
        if (m.user.email) {
          assigneeMap.set(m.user.email.toLowerCase(), m.user.id);
        }
        if (m.user.fullName) {
          assigneeMap.set(m.user.fullName.trim().toLowerCase(), m.user.id);
        }
      }
    }

    return {
      organizationId,
      campaigns: campaignMap,
      campaignNames,
      leadStatuses: statusMap,
      defaultLeadStatus: defaultStatus,
      assignees: assigneeMap,
    };
  }

  async validateRow(
    row: Record<string, any>,
    rowNumber: number,
    context: FieldResolutionContext,
    user: CurrentUserPayload,
    seenBatchKeys: Set<string>,
  ): Promise<RowValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let isDuplicate = false;
    let duplicateReason: string | undefined;

    // ۱. بررسی نام و نام خانوادگی
    const rawFullName = row.fullName ? String(row.fullName).trim() : '';
    if (!rawFullName) {
      errors.push('نام و نام خانوادگی لید الزامی است');
    } else if (rawFullName.length < 2) {
      errors.push('نام و نام خانوادگی باید حداقل ۲ کاراکتر باشد');
    } else if (rawFullName.length > 255) {
      errors.push('نام و نام خانوادگی حداکثر می‌تواند ۲۵۵ کاراکتر باشد');
    }

    // ۲. بررسی و نرمال‌سازی شماره موبایل
    const rawMobile = row.mobile ? String(row.mobile).trim() : '';
    let normalizedMobile = '';
    if (!rawMobile) {
      errors.push('شماره تلفن همراه الزامی است');
    } else {
      try {
        normalizedMobile = this.leadsService.normalizePhone(rawMobile);
      } catch (err: any) {
        errors.push(err?.message || 'شماره تلفن همراه نامعتبر است (الگوی صحیح: ۰۹۱۲۳۴۵۶۷۸۹)');
      }
    }

    // ۳. بررسی تکراری بودن شماره موبایل در صورت صحت شماره
    if (normalizedMobile) {
      if (seenBatchKeys.has(normalizedMobile)) {
        isDuplicate = true;
        duplicateReason = 'این شماره موبایل در سطرهای قبلی همین فایل تکرار شده است';
      } else {
        // بررسی وجود شماره در PostgreSQL
        const existing = await this.prisma.lead.findFirst({
          where: {
            organizationId: context.organizationId,
            mobile: normalizedMobile,
          },
          select: { id: true, fullName: true },
        });
        if (existing) {
          isDuplicate = true;
          duplicateReason = `این شماره قبلاً با نام «${existing.fullName}» در سیستم ثبت شده است`;
        } else {
          seenBatchKeys.add(normalizedMobile);
        }
      }
    }

    // ۴. اعتبارسنجی ایمیل (اختیاری)
    const rawEmail = row.email ? String(row.email).trim() : '';
    if (rawEmail && !EMAIL_REGEX.test(rawEmail)) {
      errors.push('فرمت آدرس پست الکترونیکی (ایمیل) نامعتبر است');
    }

    // ۵. اعتبارسنجی وضعیت لید در پایپ‌لاین
    let resolvedStatusConfig = context.defaultLeadStatus;
    const rawStatus = row.statusKey ? String(row.statusKey).trim().toLowerCase() : '';
    if (rawStatus && context.leadStatuses) {
      const match = context.leadStatuses.get(rawStatus);
      if (match) {
        resolvedStatusConfig = match;
      } else {
        warnings.push(`وضعیت «${row.statusKey}» در سیستم یافت نشد؛ وضعیت پیش‌فرض «${context.defaultLeadStatus?.label || 'جدید'}» تخصیص داده شد`);
      }
    }

    // ۶. انتساب به کمپین (اختیاری)
    let resolvedCampaignId: string | null = null;
    let resolvedCampaignName: string | null = null;
    const rawCampaign = row.campaignName ? String(row.campaignName).trim() : '';
    if (rawCampaign) {
      const cId = context.campaigns.get(rawCampaign.toLowerCase());
      if (cId) {
        resolvedCampaignId = cId;
        resolvedCampaignName = context.campaignNames.get(cId) || rawCampaign;
      } else {
        warnings.push(`کمپین «${rawCampaign}» در این سازمان یافت نشد؛ لید بدون انتساب به کمپین ذخیره خواهد شد`);
      }
    }

    // ۷. تعیین کارشناس مسئول
    let resolvedAssignedToId: string | null = null;
    if (user.role === 'sales_agent') {
      // کارشناس فروش طبق قانون فقط می‌تواند لید تخصیص‌یافته به خود را وارد کند
      resolvedAssignedToId = user.id;
    } else {
      const rawAssignee = row.assignedToName ? String(row.assignedToName).trim() : '';
      if (rawAssignee && context.assignees) {
        const uId = context.assignees.get(rawAssignee.toLowerCase());
        if (uId) {
          resolvedAssignedToId = uId;
        } else {
          warnings.push(`کارشناس «${rawAssignee}» در اعضای فعال سازمان یافت نشد؛ لید بدون تخصیص ثبت خواهد شد`);
        }
      }
    }

    // ۸. ارزش معامله (اختیاری)
    let resolvedSalesValue: number | null = null;
    if (row.salesValue !== undefined && row.salesValue !== null && String(row.salesValue).trim() !== '') {
      const cleanVal = String(row.salesValue).replace(/,/g, '').trim();
      const num = Number(cleanVal);
      if (isNaN(num) || num < 0) {
        errors.push('ارزش معامله باید عددی مثبت یا صفر باشد');
      } else {
        resolvedSalesValue = num;
      }
    }

    // ۹. تاریخ پیگیری بعدی (اختیاری)
    let resolvedFollowUpDate: Date | null = null;
    if (row.nextFollowUpAt && String(row.nextFollowUpAt).trim() !== '') {
      const d = new Date(String(row.nextFollowUpAt).trim());
      if (isNaN(d.getTime())) {
        warnings.push('فرمت تاریخ پیگیری نامعتبر بود و نادیده گرفته شد');
      } else {
        resolvedFollowUpDate = d;
      }
    }

    const normalizedData = {
      fullName: rawFullName,
      mobile: normalizedMobile,
      email: rawEmail || null,
      city: row.city ? String(row.city).trim().slice(0, 100) : null,
      source: row.source ? String(row.source).trim().slice(0, 100) : 'manual',
      statusKey: resolvedStatusConfig?.key || 'new',
      statusConfigId: resolvedStatusConfig?.id || null,
      statusLabel: resolvedStatusConfig?.label || 'جدید',
      campaignId: resolvedCampaignId,
      campaignName: resolvedCampaignName,
      assignedToId: resolvedAssignedToId,
      salesValue: resolvedSalesValue,
      lostReason: row.lostReason ? String(row.lostReason).trim().slice(0, 255) : null,
      nextFollowUpAt: resolvedFollowUpDate ? resolvedFollowUpDate.toISOString() : null,
      nextFollowUpNote: row.nextFollowUpNote ? String(row.nextFollowUpNote).trim().slice(0, 500) : null,
    };

    let status: 'valid' | 'invalid' | 'duplicate' = 'valid';
    if (errors.length > 0) {
      status = 'invalid';
    } else if (isDuplicate) {
      status = 'duplicate';
    }

    return {
      rowNumber,
      originalData: row,
      normalizedData,
      status,
      errors,
      warnings,
      duplicateReason,
    };
  }

  async persistBatch(
    validRows: any[],
    organizationId: string,
    user: CurrentUserPayload,
    importJobId: string,
  ): Promise<BatchPersistResult> {
    let importedCount = 0;
    let failedCount = 0;
    const errors: Array<{ row: number; reason: string }> = [];

    const CHUNK_SIZE = 50;
    for (let i = 0; i < validRows.length; i += CHUNK_SIZE) {
      const chunk = validRows.slice(i, i + CHUNK_SIZE);

      for (let j = 0; j < chunk.length; j++) {
        const item = chunk[j];
        const currentRowNumber = i + j + 1;

        try {
          // درج تک‌به‌تک یا تراکنشی ایمن برای جلوگیری از شکست کل دسته در صورت خطای یک سطر
          await this.prisma.$transaction(async (tx) => {
            // قفل مشاوره‌ای تراکنش جهت ممانعت قطعی از ثبت همزمان شماره تکراری در شرایط رقابتی
            const lockKey = `lead:${organizationId}:${item.mobile}`;
            await tx.$executeRaw`
              SELECT pg_advisory_xact_lock(hashtext(${lockKey}))
            `;

            // اعتبارسنجی نهایی شماره تکراری
            const exists = await tx.lead.findFirst({
              where: {
                organizationId,
                mobile: item.mobile,
              },
              select: { id: true },
            });
            if (exists) {
              // بررسی اینکه آیا این رکورد قبلاً در تلاش قبلی همین Job با موفقیت ثبت شده است یا خیر (P1-2.2.2)
              const priorJobActivity = await tx.leadActivity.findFirst({
                where: {
                  organizationId,
                  leadId: exists.id,
                  OR: [
                    { details: { contains: `[importJobId:${importJobId}]` } },
                    { details: { contains: importJobId } },
                    { details: { contains: importJobId.slice(0, 8) } },
                  ],
                },
              });

              if (priorJobActivity) {
                // این لید قبلاً در همین جاب ایجاد شده است؛ از ایجاد مجدد صرف‌نظر شده و به عنوان سطر موفق لحاظ می‌شود
                return;
              }

              throw new Error(`شماره همراه ${item.mobile} قبلاً در سازمان ثبت شده است`);
            }

            const createdLead = await tx.lead.create({
              data: {
                organizationId,
                fullName: item.fullName,
                mobile: item.mobile,
                email: item.email || null,
                city: item.city || null,
                source: item.source || 'manual',
                statusKey: item.statusKey || 'new',
                statusConfigId: item.statusConfigId || null,
                campaignId: item.campaignId || null,
                assignedToId: user.role === 'sales_agent' ? user.id : (item.assignedToId || null),
                salesValue: item.salesValue !== null && item.salesValue !== undefined
                  ? new Prisma.Decimal(item.salesValue)
                  : null,
                lostReason: item.lostReason || null,
                nextFollowUpAt: item.nextFollowUpAt ? new Date(item.nextFollowUpAt) : null,
                nextFollowUpNote: item.nextFollowUpNote || null,
              },
            });

            // ثبت فعالیت اولیه در تاریخچه لید (LeadActivity) با برچسب یکتای جاب
            await tx.leadActivity.create({
              data: {
                leadId: createdLead.id,
                organizationId,
                type: 'form_submit',
                title: 'ایمپورت لید از فایل',
                details: `لید از طریق فایل اکسل/CSV ایمپورت گردید [importJobId:${importJobId}]`,
                actorUserId: user.id,
              },
            });
          });

          importedCount++;
        } catch (err: any) {
          failedCount++;
          errors.push({
            row: currentRowNumber,
            reason: err?.message || 'خطا در ثبت رکورد لید در پایگاه داده',
          });
        }
      }
    }

    return { importedCount, failedCount, errors };
  }
}
