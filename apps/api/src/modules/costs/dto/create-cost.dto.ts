import {
  IsNotEmpty,
  IsString,
  IsNumber,
  Min,
  IsOptional,
  IsDateString,
  IsUUID,
  Length,
  IsInt,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateCostDto {
  @ApiProperty({ description: 'عنوان یا شرح هزینه', example: 'شارژ ادوردز کمپین بلک فرایدی' })
  @IsNotEmpty({ message: 'عنوان یا شرح هزینه الزامی است' })
  @IsString({ message: 'عنوان هزینه باید رشته متنی باشد' })
  @Length(2, 120, { message: 'عنوان هزینه باید بین ۲ تا ۱۲۰ کاراکتر باشد' })
  title: string;

  @ApiProperty({ description: 'دسته‌بندی هزینه', example: 'ad_media' })
  @IsNotEmpty({ message: 'دسته‌بندی هزینه الزامی است' })
  @IsString({ message: 'دسته‌بندی باید رشته متنی معتبر باشد' })
  category: string;

  @ApiPropertyOptional({ description: 'کانال یا پلتفرم انتشار', example: 'google_ads' })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  @IsString()
  channel?: string | null;

  @ApiPropertyOptional({ description: 'شناسه کمپین مرتبط', example: '10000000-0000-0000-0000-000000000001' })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  @IsUUID(undefined, { message: 'شناسه کمپین باید UUID معتبر باشد' })
  campaignId?: string | null;

  @ApiPropertyOptional({ description: 'نام کمپین مرتبط' })
  @IsOptional()
  @IsString()
  campaignName?: string | null;

  @ApiProperty({ description: 'مبلغ هزینه به واحد ارز ثبت‌شده', example: 15000000 })
  @IsNumber({}, { message: 'مبلغ هزینه باید یک عدد معتبر باشد' })
  @Min(0, { message: 'مبلغ هزینه نمی‌تواند منفی باشد' })
  amount: number;

  @ApiPropertyOptional({ description: 'واحد پول', default: 'TOMAN', example: 'TOMAN' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'نرخ تبدیل به تومان', default: 1, example: 1 })
  @IsOptional()
  @IsNumber({}, { message: 'نرخ تبدیل باید عدد باشد' })
  @Min(0, { message: 'نرخ تبدیل نمی‌تواند منفی باشد' })
  exchangeRate?: number;

  @ApiProperty({ description: 'تاریخ وقوع هزینه (ISO format)', example: '2026-11-10' })
  @IsNotEmpty({ message: 'تاریخ وقوع هزینه الزامی است' })
  @IsDateString({}, { message: 'فرمت تاریخ باید به صورت YYYY-MM-DD یا ISO باشد' })
  date: string;

  @ApiPropertyOptional({ description: 'نام فروشنده یا مجری تبلیغات' })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  @IsString()
  vendor?: string | null;

  @ApiPropertyOptional({ description: 'شماره فاکتور یا کد پیگیری مالی' })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  @IsString()
  invoiceNumber?: string | null;

  @ApiPropertyOptional({ description: 'وضعیت پرداخت', default: 'paid', example: 'paid' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'یادداشت یا توضیحات تکمیلی' })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  @IsString()
  notes?: string | null;

  @ApiPropertyOptional({ description: 'حجم یا تعداد کلیک/نمایش' })
  @IsOptional()
  @IsInt()
  @Min(0)
  count?: number | null;
}
