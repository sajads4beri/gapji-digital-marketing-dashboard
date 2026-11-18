import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MetricDirection } from '@prisma/client';

export class CreateKpiDto {
  @ApiProperty({ description: 'نام شاخص KPI', example: 'CPL هدف کمپین نوروز' })
  @IsString({ message: 'نام KPI باید رشته باشد.' })
  @IsNotEmpty({ message: 'نام KPI الزامی است.' })
  @MaxLength(100, { message: 'نام KPI نمی‌تواند بیش از ۱۰۰ کاراکتر باشد.' })
  name: string;

  @ApiProperty({ description: 'کد شاخص (پیش‌فرض یا سفارشی)', example: 'cpl' })
  @IsString({ message: 'کد شاخص باید رشته باشد.' })
  @IsNotEmpty({ message: 'کد شاخص الزامی است.' })
  @MaxLength(50, { message: 'کد شاخص نمی‌تواند بیش از ۵۰ کاراکتر باشد.' })
  code: string;

  @ApiPropertyOptional({ description: 'شناسه کمپین (در صورت دامنه کمپین)', example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  @IsOptional()
  @IsUUID('4', { message: 'شناسه کمپین باید UUID معتبر باشد.' })
  campaignId?: string;

  @ApiProperty({ description: 'مقدار هدف', example: 50000 })
  @IsNumber({}, { message: 'مقدار هدف باید یک عدد معتبر باشد.' })
  @Min(0, { message: 'مقدار هدف نمی‌تواند منفی باشد.' })
  targetValue: number;

  @ApiPropertyOptional({
    description: 'جهت بهینه‌سازی',
    enum: MetricDirection,
    default: MetricDirection.higher_is_better,
  })
  @IsOptional()
  @IsEnum(MetricDirection, { message: 'جهت مطلوب نامعتبر است (higher_is_better یا lower_is_better).' })
  direction?: MetricDirection;

  @ApiProperty({ description: 'واحد اندازه‌گیری', example: 'تومان' })
  @IsString({ message: 'واحد اندازه‌گیری باید رشته باشد.' })
  @IsNotEmpty({ message: 'واحد اندازه‌گیری الزامی است.' })
  @MaxLength(50)
  unit: string;

  @ApiProperty({ description: 'بازه زمانی', example: 'ماهانه' })
  @IsString({ message: 'بازه زمانی باید رشته باشد.' })
  @IsNotEmpty({ message: 'بازه زمانی الزامی است.' })
  @MaxLength(50)
  period: string;

  @ApiPropertyOptional({ description: 'فرمول اختصاصی محاسبه', example: 'cost / lead' })
  @IsOptional()
  @IsString()
  formula?: string;
}
