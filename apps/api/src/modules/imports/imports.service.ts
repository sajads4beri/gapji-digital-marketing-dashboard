import {
  Injectable,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { LeadImportAdapter } from './adapters/lead-import.adapter';
import { CostImportAdapter } from './adapters/cost-import.adapter';
import { ImportAdapter, TargetFieldDef } from './adapters/import-adapter.interface';
import { CsvParser } from './utils/csv-parser';
import { InspectImportDto } from './dto/inspect-import.dto';
import { ValidateImportDto } from './dto/validate-import.dto';
import { ExecuteImportDto } from './dto/execute-import.dto';
import { CurrentUserPayload } from './dto/current-user-payload.interface';
import * as crypto from 'crypto';

@Injectable()
export class ImportsService {
  private readonly logger = new Logger(ImportsService.name);
  private readonly adapters: Map<string, ImportAdapter>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly leadAdapter: LeadImportAdapter,
    private readonly costAdapter: CostImportAdapter,
  ) {
    this.adapters = new Map();
    this.adapters.set('leads', this.leadAdapter);
    this.adapters.set('costs', this.costAdapter);
  }

  private getAdapter(dataType: string): ImportAdapter {
    const adapter = this.adapters.get(dataType);
    if (!adapter) {
      throw new BadRequestException(`نوع داده «${dataType}» پشتیبانی نمی‌شود`);
    }
    return adapter;
  }

  /**
   * دریافت فیلدهای مقصد و متادیتای نگاشت برای هر نوع داده
   */
  getTargetFields(dataType: string, user: CurrentUserPayload): TargetFieldDef[] {
    const adapter = this.getAdapter(dataType);
    adapter.assertAccess(user);
    return adapter.getTargetFields();
  }

  /**
   * بازرسی فایل CSV، استخراج هدرها و پیشنهاد خودکار نگاشت ستون‌ها (گام ۱ و ۲)
   */
  inspectFile(dto: InspectImportDto, user: CurrentUserPayload): {
    headers: string[];
    previewRows: Record<string, string>[];
    rowCount: number;
    suggestedMappings: Record<string, string>;
    targetFields: TargetFieldDef[];
  } {
    const adapter = this.getAdapter(dto.dataType);
    adapter.assertAccess(user);

    const parsed = CsvParser.parse(dto.csvContent);
    if (parsed.headers.length === 0) {
      throw new BadRequestException('فایل انتخابی فاقد هدر معتبر است یا محتوای آن خالی است');
    }

    const targetFields = adapter.getTargetFields();
    const suggestedMappings: Record<string, string> = {};

    // الگوریتم نگاشت خودکار بر اساس مترادف‌ها و پیش‌نام‌ها در فارسی و انگلیسی
    for (const header of parsed.headers) {
      const cleanHeader = header.trim().toLowerCase();
      let matchedKey: string | null = null;

      for (const field of targetFields) {
        if (field.aliases.some((alias) => cleanHeader === alias.toLowerCase() || cleanHeader.includes(alias.toLowerCase()))) {
          matchedKey = field.key;
          break;
        }
      }

      suggestedMappings[header] = matchedKey || '__ignore__';
    }

    // ساخت ۵ سطر نمونه جهت نمایش در مرحله نگاشت
    const samplePreviewCount = Math.min(5, parsed.rows.length);
    const previewRows: Record<string, string>[] = [];
    for (let r = 0; r < samplePreviewCount; r++) {
      const rowObj: Record<string, string> = {};
      parsed.headers.forEach((h, idx) => {
        rowObj[h] = parsed.rows[r][idx] || '';
      });
      previewRows.push(rowObj);
    }

    return {
      headers: parsed.headers,
      previewRows,
      rowCount: parsed.rowCount,
      suggestedMappings,
      targetFields,
    };
  }

  /**
   * اعتبارسنجی معتبر و خطایابی سمت سرور برای سطرهای نگاشت‌شده (گام ۳)
   */
  async validateRows(dto: ValidateImportDto, user: CurrentUserPayload): Promise<{
    dataType: string;
    totalRows: number;
    validRowsCount: number;
    invalidRowsCount: number;
    duplicateRowsCount: number;
    warningRowsCount: number;
    rows: any[];
  }> {
    const adapter = this.getAdapter(dto.dataType);
    adapter.assertAccess(user);

    const organizationId = user.organizationId!;
    const context = await adapter.loadResolutionContext(organizationId, user);
    const seenBatchKeys = new Set<string>();

    const targetFields = adapter.getTargetFields();
    const requiredFieldKeys = targetFields.filter((f) => f.required).map((f) => f.key);

    // اطمینان از اینکه فیلدهای اجباری حداقل در نگاشت مشخص شده باشند
    const mappedTargetKeys = new Set(Object.values(dto.mapping).filter((k) => k && k !== '__ignore__'));
    const missingRequiredFields = requiredFieldKeys.filter((k) => !mappedTargetKeys.has(k));
    if (missingRequiredFields.length > 0) {
      const missingLabels = targetFields
        .filter((f) => missingRequiredFields.includes(f.key))
        .map((f) => `«${f.labelFa}»`)
        .join('، ');
      throw new BadRequestException(`فیلدهای اجباری زیر نگاشت نشده‌اند: ${missingLabels}`);
    }

    const validatedRows: any[] = [];
    let validRowsCount = 0;
    let invalidRowsCount = 0;
    let duplicateRowsCount = 0;
    let warningRowsCount = 0;

    for (let i = 0; i < dto.rows.length; i++) {
      const rawRow = dto.rows[i];
      const rowNumber = i + 1;

      // تبدیل سطر خام به فیلدهای هدف بر اساس جدول نگاشت
      const mappedRow: Record<string, any> = {};
      for (const [sourceCol, targetKey] of Object.entries(dto.mapping)) {
        if (targetKey && targetKey !== '__ignore__') {
          mappedRow[targetKey] = rawRow[sourceCol];
        }
      }

      const result = await adapter.validateRow(mappedRow, rowNumber, context, user, seenBatchKeys);
      validatedRows.push(result);

      if (result.status === 'valid') validRowsCount++;
      else if (result.status === 'invalid') invalidRowsCount++;
      else if (result.status === 'duplicate') duplicateRowsCount++;

      if (result.warnings.length > 0) warningRowsCount++;
    }

    return {
      dataType: dto.dataType,
      totalRows: dto.rows.length,
      validRowsCount,
      invalidRowsCount,
      duplicateRowsCount,
      warningRowsCount,
      rows: validatedRows,
    };
  }

  /**
   * اجرای عملیات نهایی ایمپورت و درج در PostgreSQL با تضمین عدم تکرارپذیری (گام ۴)
   */
  async executeImport(dto: ExecuteImportDto, user: CurrentUserPayload): Promise<{
    importJobId: string;
    dataType: string;
    totalRows: number;
    importedCount: number;
    failedCount: number;
    errors: Array<{ row: number; reason: string }>;
    status: 'completed' | 'partial' | 'failed';
  }> {
    const adapter = this.getAdapter(dto.dataType);
    adapter.assertAccess(user);

    const organizationId = user.organizationId!;
    const idempotencyKey = dto.idempotencyKey || crypto.randomUUID();

    // بررسی عدم تکرارپذیری با جدول import_jobs
    const existingJob = await this.prisma.importJob.findFirst({
      where: {
        id: idempotencyKey,
        organizationId,
      },
    });

    if (existingJob) {
      if (existingJob.status === 'completed') {
        this.logger.log(`Idempotent hit for importJob ${idempotencyKey}`);
        return {
          importJobId: existingJob.id,
          dataType: existingJob.dataType,
          totalRows: existingJob.totalRows,
          importedCount: existingJob.successfulRows,
          failedCount: existingJob.failedRows,
          errors: existingJob.errorLog ? JSON.parse(existingJob.errorLog) : [],
          status: 'completed',
        };
      }
      if (existingJob.status === 'processing') {
        throw new ConflictException('این درخواست ایمپورت در حال حاضر در حال پردازش در پایگاه داده است');
      }
    }

    // ۱. ایجاد یا بازنشانی رکورد اولیه ImportJob در وضعیت processing
    let job: any;
    if (existingJob && existingJob.status === 'failed') {
      // در صورت تلاش مجدد برای جاب ناموفق، وضعیت جهت پردازش مجدد بازنشانی می‌شود
      job = await this.prisma.importJob.update({
        where: { id: idempotencyKey },
        data: {
          status: 'processing',
          totalRows: dto.validRows.length,
          successfulRows: 0,
          failedRows: 0,
          errorLog: null,
          fileName: dto.fileName.slice(0, 255),
        },
      });
    } else {
      try {
        job = await this.prisma.importJob.create({
          data: {
            id: idempotencyKey,
            organizationId,
            dataType: dto.dataType,
            fileName: dto.fileName.slice(0, 255),
            fieldMapping: dto.mapping ? JSON.stringify(dto.mapping) : null,
            duplicateHandling: dto.duplicateHandling || 'skip',
            totalRows: dto.validRows.length,
            successfulRows: 0,
            failedRows: 0,
            status: 'processing',
            createdById: user.id,
          },
        });
      } catch (err: any) {
        if (err.code === 'P2002') {
          throw new ConflictException('این درخواست ایمپورت در حال حاضر در حال پردازش در پایگاه داده است');
        }
        throw err;
      }
    }

    // ۲. اجرای پایدارسازی دسته‌ای توسط آداپتور مربوطه با مهار خطاهای غیرمنتظره جهت جلوگیری از قفل شدن وضعیت
    let result: any;
    try {
      result = await adapter.persistBatch(dto.validRows, organizationId, user, job.id);
    } catch (err: any) {
      this.logger.error(`Import execution crashed for job ${job.id}: ${err.message}`, err.stack);
      await this.prisma.importJob.update({
        where: { id: job.id },
        data: {
          status: 'failed',
          errorLog: JSON.stringify([{ row: 0, reason: err.message || 'خطای غیرمنتظره در پردازش دسته‌ای داده‌ها' }]),
        },
      });
      throw err;
    }

    // ۳. به‌روزرسانی وضعیت نهایی Job (P1-2.2.2)
    // اگر تمام ردیف‌ها با موفقیت کامل و بدون خطا پردازش شده باشند: completed
    // اگر حداقل یک ردیف ناموفق باشد: failed تا امکان تلاش مجدد با همین idempotencyKey فراهم باشد
    const finalStatus = result.failedCount === 0 ? 'completed' : 'failed';

    await this.prisma.importJob.update({
      where: { id: job.id },
      data: {
        successfulRows: result.importedCount,
        failedRows: result.failedCount,
        status: finalStatus,
        errorLog: result.errors.length > 0 ? JSON.stringify(result.errors) : null,
      },
    });

    this.logger.log(
      `Import ${job.id} finished: ${result.importedCount} imported, ${result.failedCount} failed (${dto.dataType})`,
    );

    return {
      importJobId: job.id,
      dataType: dto.dataType,
      totalRows: dto.validRows.length,
      importedCount: result.importedCount,
      failedCount: result.failedCount,
      errors: result.errors,
      status: result.failedCount === 0 ? 'completed' : result.importedCount > 0 ? 'partial' : 'failed',
    };
  }

  /**
   * تولید فایل نمونه استاندارد CSV با کاراکتر BOM به همراه سطرهای الگو
   */
  getSampleTemplate(dataType: string, user: CurrentUserPayload): {
    fileName: string;
    content: string;
  } {
    const adapter = this.getAdapter(dataType);
    adapter.assertAccess(user);

    const template = adapter.getSampleTemplate();
    const csvContent = CsvParser.stringify(template.headers, template.rows);
    return {
      fileName: `sample_${dataType}_import.csv`,
      content: csvContent,
    };
  }

  /**
   * دریافت تاریخچه عملیات‌های ایمپورت سازمان
   */
  async getRecentJobs(dataType: string | undefined, user: CurrentUserPayload): Promise<any[]> {
    const organizationId = user.organizationId!;
    const where: any = { organizationId };
    if (dataType && (dataType === 'leads' || dataType === 'costs')) {
      where.dataType = dataType;
    }

    const jobs = await this.prisma.importJob.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        createdBy: { select: { id: true, fullName: true, email: true } },
      },
    });

    return jobs.map((job) => ({
      id: job.id,
      dataType: job.dataType,
      fileName: job.fileName,
      totalRows: job.totalRows,
      successfulRows: job.successfulRows,
      failedRows: job.failedRows,
      status: job.status,
      createdAt: job.createdAt.toISOString(),
      createdByName: job.createdBy?.fullName || job.createdBy?.email || 'کاربر سیستم',
    }));
  }
}
