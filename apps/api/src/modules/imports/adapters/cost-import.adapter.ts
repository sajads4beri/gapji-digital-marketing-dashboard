import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CostsService } from '../../costs/costs.service';
import {
  ImportAdapter,
  TargetFieldDef,
  FieldResolutionContext,
  RowValidationResult,
  BatchPersistResult,
} from './import-adapter.interface';
import { CurrentUserPayload } from '../dto/current-user-payload.interface';
import { Prisma } from '@prisma/client';

const COST_CATEGORIES: Record<string, string> = {
  ad_media: 'شارژ ادوردز و رسانه تبلیغاتی',
  content_production: 'تولید محتوا و گرافیک',
  agency_fee: 'کارمزد آژانس و خدمات',
  influencer: 'اینفلوئنسر مارکتینگ',
  software_tools: 'ابزارها و سرویس‌های نرم‌افزاری',
  events: 'رویداد و نمایشگاه',
  other: 'سایر هزینه‌های مارکتینگ',
};

const CATEGORY_SYNONYMS: Record<string, string> = {
  رسانه: 'ad_media',
  تبلیغات: 'ad_media',
  گوگل: 'ad_media',
  ادوردز: 'ad_media',
  'ad_media': 'ad_media',
  'گوگل ادز': 'ad_media',
  محتوا: 'content_production',
  'تولید محتوا': 'content_production',
  گرافیک: 'content_production',
  ویدیو: 'content_production',
  'content_production': 'content_production',
  آژانس: 'agency_fee',
  کارمزد: 'agency_fee',
  'agency_fee': 'agency_fee',
  اینفلوئنسر: 'influencer',
  بلاگر: 'influencer',
  'influencer': 'influencer',
  نرم‌افزار: 'software_tools',
  سرویس: 'software_tools',
  ابزار: 'software_tools',
  'software_tools': 'software_tools',
  رویداد: 'events',
  نمایشگاه: 'events',
  همایش: 'events',
  'events': 'events',
  سایر: 'other',
  متفرقه: 'other',
  'other': 'other',
};

@Injectable()
export class CostImportAdapter implements ImportAdapter {
  readonly dataType = 'costs' as const;
  private readonly logger = new Logger(CostImportAdapter.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly costsService: CostsService,
  ) {}

  getTargetFields(): TargetFieldDef[] {
    return [
      {
        key: 'title',
        label: 'Title',
        labelFa: 'عنوان یا شرح هزینه',
        required: true,
        aliases: [
          'عنوان',
          'عنوان هزینه',
          'شرح',
          'شرح هزینه',
          'شرح ردیف',
          'بابت',
          'title',
          'cost_title',
          'description',
          'name',
        ],
        example: 'شارژ دلاری اکانت گوگل ادز',
      },
      {
        key: 'category',
        label: 'Category',
        labelFa: 'دسته‌بندی هزینه',
        required: true,
        aliases: ['دسته‌بندی', 'دسته', 'نوع هزینه', 'گروه هزینه', 'category', 'cost_category', 'type'],
        example: 'ad_media یا تبلیغات',
      },
      {
        key: 'amount',
        label: 'Amount',
        labelFa: 'مبلغ هزینه',
        required: true,
        aliases: ['مبلغ', 'هزینه', 'قیمت', 'مقدار', 'مبلغ کل', 'amount', 'cost', 'price', 'value'],
        example: '15000000',
      },
      {
        key: 'date',
        label: 'Date',
        labelFa: 'تاریخ وقوع (YYYY-MM-DD)',
        required: true,
        aliases: ['تاریخ', 'تاریخ وقوع', 'تاریخ فاکتور', 'تاریخ پرداخت', 'date', 'cost_date', 'invoice_date'],
        example: '2026-11-10',
      },
      {
        key: 'channel',
        label: 'Channel',
        labelFa: 'کانال یا پلتفرم',
        required: false,
        aliases: ['کانال', 'پلتفرم', 'رسانه', 'محل انتشار', 'channel', 'platform'],
        example: 'google_ads یا instagram',
      },
      {
        key: 'campaignName',
        label: 'Campaign',
        labelFa: 'کمپین بازاریابی',
        required: false,
        aliases: ['کمپین', 'نام کمپین', 'شناسه کمپین', 'campaign', 'campaign_name', 'campaign_id'],
        example: 'کمپین شب یلدا',
      },
      {
        key: 'currency',
        label: 'Currency',
        labelFa: 'واحد پول',
        required: false,
        aliases: ['ارز', 'واحد پول', 'واحد ارز', 'currency'],
        example: 'TOMAN یا USD',
      },
      {
        key: 'exchangeRate',
        label: 'Exchange Rate',
        labelFa: 'نرخ تبدیل ارز به تومان',
        required: false,
        aliases: ['نرخ تبدیل', 'نرخ ارز', 'قیمت ارز', 'exchange_rate', 'rate'],
        example: '70000',
      },
      {
        key: 'vendor',
        label: 'Vendor',
        labelFa: 'فروشنده یا مجری',
        required: false,
        aliases: ['فروشنده', 'مجری', 'تأمین‌کننده', 'طرف حساب', 'vendor', 'supplier', 'provider'],
        example: 'پارتنر گوگل ادز',
      },
      {
        key: 'invoiceNumber',
        label: 'Invoice Number',
        labelFa: 'شماره فاکتور / کد رهگیری',
        required: false,
        aliases: ['شماره فاکتور', 'کد پیگیری', 'کد رهگیری', 'شماره سند', 'invoice_number', 'invoice_no', 'reference'],
        example: 'INV-10294',
      },
      {
        key: 'status',
        label: 'Status',
        labelFa: 'وضعیت پرداخت',
        required: false,
        aliases: ['وضعیت', 'وضعیت پرداخت', 'وضعیت مالی', 'status', 'payment_status'],
        example: 'paid یا pending',
      },
      {
        key: 'notes',
        label: 'Notes',
        labelFa: 'یادداشت یا توضیحات',
        required: false,
        aliases: ['توضیحات', 'یادداشت', 'توضیحات تکمیلی', 'ملاحظات', 'notes', 'memo'],
        example: 'فاکتور تسویه ماهانه',
      },
    ];
  }

  getSampleTemplate(): { headers: string[]; rows: string[][] } {
    return {
      headers: [
        'عنوان هزینه',
        'دسته‌بندی',
        'کانال',
        'کمپین',
        'مبلغ',
        'ارز',
        'نرخ تبدیل',
        'تاریخ',
        'فروشنده',
        'شماره فاکتور',
        'وضعیت',
        'توضیحات',
      ],
      rows: [
        [
          'شارژ دلاری کلمات کلیدی گوگل ادز',
          'ad_media',
          'google_ads',
          'کمپین سرچ پاییزه',
          '500',
          'USD',
          '70000',
          '2026-11-10',
          'پارتنر گوگل تهران',
          'INV-GGL-101',
          'paid',
          'شارژ ماهانه کمپین سرچ کلمات',
        ],
        [
          'بسته پیامک جشنواره پاییزه',
          'ad_media',
          'sms',
          'کمپین جشنواره',
          '15000000',
          'TOMAN',
          '1',
          '2026-11-11',
          'سامانه کاوه‌نگار',
          'KN-9921',
          'paid',
          'ارسال پیامک انبوه لیدها',
        ],
        [
          'تولید محتوا و طراحی تیزر',
          'content_production',
          'instagram',
          '',
          '18000000',
          'TOMAN',
          '1',
          '2026-11-12',
          'استودیو پویا',
          'STU-402',
          'pending',
          'تسویه قسط اول موشن‌گرافیک',
        ],
      ],
    };
  }

  assertAccess(user: CurrentUserPayload): void {
    if (!user.organizationId) {
      throw new BadRequestException('سازمان فعال برای کاربر مشخص نشده است');
    }

    // DEC-AUTH-11: client cannot execute write/import on costs
    if (user.role === 'client') {
      throw new ForbiddenException(
        'نقش کارفرما طبق مصوبه DEC-AUTH-11 دسترسی فقط‌خواندنی داشته و مجاز به ایمپورت هزینه‌ها نیست',
      );
    }

    if (user.role === 'sales_agent') {
      throw new ForbiddenException('نقش کارشناس فروش مجوز دسترسی به ماژول مدیریت هزینه‌ها را ندارد');
    }

    if (user.role === 'content_creator') {
      throw new ForbiddenException('نقش تولیدکننده محتوا مجوز ثبت یا ایمپورت هزینه‌ها را ندارد');
    }

    // admin, marketing_manager, campaign_manager are allowed
  }

  async loadResolutionContext(
    organizationId: string,
    user: CurrentUserPayload,
  ): Promise<FieldResolutionContext> {
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

    return {
      organizationId,
      campaigns: campaignMap,
      campaignNames,
      costCategories: new Set(Object.keys(COST_CATEGORIES)),
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

    // ۱. بررسی عنوان هزینه
    const rawTitle = row.title ? String(row.title).trim() : '';
    if (!rawTitle) {
      errors.push('عنوان یا شرح هزینه الزامی است');
    } else if (rawTitle.length < 2 || rawTitle.length > 120) {
      errors.push('عنوان هزینه باید بین ۲ تا ۱۲۰ کاراکتر باشد');
    }

    // ۲. بررسی دسته‌بندی
    const rawCategory = row.category ? String(row.category).trim().toLowerCase() : '';
    let resolvedCategory = 'ad_media';
    if (!rawCategory) {
      errors.push('دسته‌بندی هزینه الزامی است');
    } else {
      const mapped = CATEGORY_SYNONYMS[rawCategory] || (context.costCategories?.has(rawCategory) ? rawCategory : null);
      if (mapped) {
        resolvedCategory = mapped;
      } else {
        warnings.push(`دسته‌بندی «${row.category}» استاندارد نیست؛ پیش‌فرض «ad_media» تخصیص داده شد`);
        resolvedCategory = 'ad_media';
      }
    }

    // ۳. بررسی مبلغ
    let resolvedAmount = 0;
    if (row.amount === undefined || row.amount === null || String(row.amount).trim() === '') {
      errors.push('مبلغ هزینه الزامی است');
    } else {
      const cleanAmount = String(row.amount).replace(/,/g, '').trim();
      const num = Number(cleanAmount);
      if (isNaN(num) || num < 0) {
        errors.push('مبلغ هزینه باید عددی معتبر و مثبت یا صفر باشد');
      } else {
        resolvedAmount = num;
      }
    }

    // ۴. بررسی تاریخ وقوع
    let resolvedDateStr = '';
    const rawDate = row.date ? String(row.date).trim() : '';
    if (!rawDate) {
      errors.push('تاریخ وقوع هزینه الزامی است');
    } else {
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) {
        errors.push('فرمت تاریخ وقوع هزینه نامعتبر است (الگوی صحیح: YYYY-MM-DD)');
      } else {
        resolvedDateStr = d.toISOString().split('T')[0];
      }
    }

    // ۵. بررسی فاکتور تکراری
    const rawInvoice = row.invoiceNumber ? String(row.invoiceNumber).trim() : '';
    if (rawInvoice) {
      const invoiceKey = `inv:${rawInvoice.toLowerCase()}`;
      if (seenBatchKeys.has(invoiceKey)) {
        isDuplicate = true;
        duplicateReason = `شماره فاکتور «${rawInvoice}» در سطرهای قبلی همین فایل تکرار شده است`;
      } else {
        // جستجوی دقیق در PostgreSQL برای فاکتور تکراری با اعتبارسنجی فیلد JSON
        const candidates = await this.prisma.cost.findMany({
          where: {
            organizationId: context.organizationId,
            notes: { contains: rawInvoice, mode: 'insensitive' },
          },
          select: { id: true, notes: true },
          take: 50,
        });

        const exactMatch = candidates.find((c) => {
          try {
            const parsed = JSON.parse(c.notes || '{}');
            return (
              typeof parsed.invoiceNumber === 'string' &&
              parsed.invoiceNumber.trim().toLowerCase() === rawInvoice.toLowerCase()
            );
          } catch {
            return false;
          }
        });

        if (exactMatch) {
          isDuplicate = true;
          duplicateReason = `هزینه‌ای با شماره فاکتور «${rawInvoice}» قبلاً در سیستم ثبت شده است`;
        } else {
          seenBatchKeys.add(invoiceKey);
        }
      }
    }

    // ۶. بررسی نرخ تبدیل و ارز
    const currency = row.currency ? String(row.currency).trim().toUpperCase() : 'TOMAN';
    let exchangeRate = 1;
    if (row.exchangeRate !== undefined && row.exchangeRate !== null && String(row.exchangeRate).trim() !== '') {
      const rateNum = Number(String(row.exchangeRate).replace(/,/g, '').trim());
      if (!isNaN(rateNum) && rateNum > 0) {
        exchangeRate = rateNum;
      }
    }
    const normalizedAmountToman = Math.round(resolvedAmount * exchangeRate);

    // ۷. بررسی کمپین مرتبط
    let resolvedCampaignId: string | null = null;
    let resolvedCampaignName: string | null = null;
    const rawCampaign = row.campaignName ? String(row.campaignName).trim() : '';
    if (rawCampaign) {
      const cId = context.campaigns.get(rawCampaign.toLowerCase());
      if (cId) {
        resolvedCampaignId = cId;
        resolvedCampaignName = context.campaignNames.get(cId) || rawCampaign;
      } else {
        warnings.push(`کمپین «${rawCampaign}» در سازمان یافت نشد؛ هزینه به عنوان هزینه غیرمتصل ثبت می‌شود`);
      }
    }

    const normalizedData = {
      title: rawTitle,
      category: resolvedCategory,
      channel: row.channel ? String(row.channel).trim().slice(0, 100) : null,
      campaignId: resolvedCampaignId,
      campaignName: resolvedCampaignName,
      amount: resolvedAmount,
      currency,
      exchangeRate,
      normalizedAmountToman,
      date: resolvedDateStr,
      vendor: row.vendor ? String(row.vendor).trim().slice(0, 120) : null,
      invoiceNumber: rawInvoice || null,
      status: row.status ? String(row.status).trim().toLowerCase() : 'paid',
      notes: row.notes ? String(row.notes).trim().slice(0, 500) : null,
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
    const affectedCampaignIds = new Set<string>();

    const CHUNK_SIZE = 50;
    for (let i = 0; i < validRows.length; i += CHUNK_SIZE) {
      const chunk = validRows.slice(i, i + CHUNK_SIZE);

      for (let j = 0; j < chunk.length; j++) {
        const item = chunk[j];
        const currentRowNumber = i + j + 1;

        try {
          const effectiveRate = item.exchangeRate && item.exchangeRate > 0 ? item.exchangeRate : 1;
          const normalizedAmountToman = Math.round(item.amount * effectiveRate);

          const meta = {
            title: item.title,
            category: item.category,
            channel: item.channel || null,
            campaignName: item.campaignName || null,
            amount: item.amount,
            currency: item.currency || 'TOMAN',
            exchangeRate: effectiveRate,
            vendor: item.vendor || null,
            invoiceNumber: item.invoiceNumber || null,
            status: item.status || 'paid',
            notes: item.notes || null,
            importJobId,
            rowIndex: currentRowNumber,
          };

          const createdCost = await this.prisma.$transaction(async (tx) => {
            if (item.invoiceNumber) {
              const lockKey = `cost:inv:${organizationId}:${item.invoiceNumber.toLowerCase()}`;
              await tx.$executeRaw`
                SELECT pg_advisory_xact_lock(hashtext(${lockKey}))
              `;

              const candidates = await tx.cost.findMany({
                where: {
                  organizationId,
                  notes: { contains: item.invoiceNumber, mode: 'insensitive' },
                },
                select: { id: true, notes: true, importJobId: true, campaignId: true },
                take: 50,
              });

              const exactMatch = candidates.find((c) => {
                try {
                  const parsed = JSON.parse(c.notes || '{}');
                  return (
                    typeof parsed.invoiceNumber === 'string' &&
                    parsed.invoiceNumber.trim().toLowerCase() === item.invoiceNumber.toLowerCase()
                  );
                } catch {
                  return false;
                }
              });

              if (exactMatch) {
                if (exactMatch.importJobId === importJobId) {
                  // این رکورد هزینه قبلاً در همین Job با موفقیت ثبت شده است (P1-2.2.2)
                  return exactMatch;
                }
                throw new Error(`سند هزینه با شماره فاکتور «${item.invoiceNumber}» قبلاً در سازمان ثبت شده است`);
              }
            } else {
              // برای هزینه‌های بدون شماره فاکتور، بررسی بر اساس شناسه جاب و شماره سطر
              const priorCost = await tx.cost.findFirst({
                where: {
                  organizationId,
                  importJobId,
                  notes: { contains: `"rowIndex":${currentRowNumber}` },
                },
              });
              if (priorCost) {
                return priorCost;
              }
            }

            return await tx.cost.create({
              data: {
                organizationId,
                campaignId: item.campaignId || null,
                date: new Date(item.date),
                amount: new Prisma.Decimal(normalizedAmountToman),
                source: 'import',
                createdById: user.id,
                importJobId,
                notes: JSON.stringify(meta),
              },
            });
          });

          if (createdCost?.campaignId) {
            affectedCampaignIds.add(createdCost.campaignId);
          }

          importedCount++;
        } catch (err: any) {
          failedCount++;
          errors.push({
            row: currentRowNumber,
            reason: err?.message || 'خطا در ثبت رکورد هزینه در دیتابیس',
          });
        }
      }
    }

    // همگام‌سازی هزینه‌های کمپین‌های متأثر
    for (const cId of affectedCampaignIds) {
      try {
        const sumResult = await this.prisma.cost.aggregate({
          where: { campaignId: cId, organizationId },
          _sum: { amount: true },
        });
        const totalSpend = sumResult._sum.amount || new Prisma.Decimal(0);
        await this.prisma.campaign.update({
          where: { id: cId },
          data: { spend: totalSpend },
        });
      } catch (err) {
        this.logger.warn(`Failed to sync campaign spend for ${cId} after import: ${err}`);
      }
    }

    return { importedCount, failedCount, errors };
  }
}
