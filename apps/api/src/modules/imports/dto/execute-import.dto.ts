import {
  IsNotEmpty,
  IsIn,
  IsString,
  IsArray,
  IsOptional,
  IsUUID,
  ArrayMaxSize,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExecuteImportDto {
  @ApiProperty({ description: 'نوع داده جهت ایمپورت', enum: ['leads', 'costs'], example: 'leads' })
  @IsNotEmpty({ message: 'نوع داده الزامی است' })
  @IsIn(['leads', 'costs'], { message: 'نوع داده باید leads یا costs باشد' })
  dataType: 'leads' | 'costs';

  @ApiProperty({ description: 'نام فایل ورودی', example: 'leads_export_autumn_2026.csv' })
  @IsNotEmpty({ message: 'نام فایل ورودی الزامی است' })
  @IsString({ message: 'نام فایل باید رشته متنی باشد' })
  fileName: string;

  @ApiProperty({
    description: 'لیست رکوردهای معتبر جهت ذخیره‌سازی نهایی در PostgreSQL',
    example: [{ fullName: 'علی حسینی', mobile: '09123456789' }],
  })
  @IsNotEmpty({ message: 'لیست رکوردهای معتبر الزامی است' })
  @IsArray({ message: 'رکوردهای معتبر باید به صورت آرایه ارسال شوند' })
  @ArrayMaxSize(5000, { message: 'حداکثر تعداد رکوردها در هر درخواست ۵۰۰۰ سطر است' })
  validRows: Record<string, any>[];

  @ApiPropertyOptional({
    description: 'کلید عدم تکرارپذیری (Idempotency Key) جهت جلوگیری از ثبت تکراری حین کلیک‌های مجدد یا اختلال شبکه',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID(undefined, { message: 'کلید عدم تکرارپذیری باید یک UUID معتبر باشد' })
  idempotencyKey?: string;

  @ApiPropertyOptional({
    description: 'سیاست مواجهه با داده‌های تکراری',
    default: 'skip',
    example: 'skip',
  })
  @IsOptional()
  @IsIn(['skip'], { message: 'تنها سیاست مجاز skip (عدم درج و گزارش تکرار) است' })
  duplicateHandling?: string;

  @ApiPropertyOptional({
    description: 'نگاشت ستون‌های استفاده‌شده در این سشن ایمپورت',
  })
  @IsOptional()
  @IsObject()
  mapping?: Record<string, string>;
}
