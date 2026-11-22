import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MetricDirection } from '@prisma/client';

export class CreateCustomMetricDto {
  @ApiProperty({ description: 'نام شاخص اختصاصی', example: 'درآمد به ازای هر کلیک' })
  @IsString({ message: 'نام شاخص باید رشته باشد.' })
  @IsNotEmpty({ message: 'نام شاخص الزامی است.' })
  @MaxLength(100, { message: 'نام شاخص نمی‌تواند بیش از ۱۰۰ کاراکتر باشد.' })
  name: string;

  @ApiProperty({ description: 'شناسه لاتین شاخص', example: 'revenue_per_click' })
  @IsString({ message: 'کد شاخص باید رشته باشد.' })
  @IsNotEmpty({ message: 'کد شاخص الزامی است.' })
  @MaxLength(50, { message: 'کد شاخص نمی‌تواند بیش از ۵۰ کاراکتر باشد.' })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'کد شاخص تنها می‌تواند شامل حروف انگلیسی، اعداد، خط فاصله و زیرخط باشد.',
  })
  code: string;

  @ApiPropertyOptional({ description: 'توضیحات شاخص', example: 'محاسبه بازدهی هر کلیک بر مبنای درآمد نهایی' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'فرمول شاخص', example: 'revenue / clicks' })
  @IsString({ message: 'فرمول باید رشته باشد.' })
  @IsNotEmpty({ message: 'فرمول شاخص الزامی است.' })
  formula: string;

  @ApiPropertyOptional({
    description: 'جهت مطلوب شاخص',
    enum: MetricDirection,
    default: MetricDirection.higher_is_better,
  })
  @IsOptional()
  @IsEnum(MetricDirection, { message: 'جهت مطلوب نامعتبر است (higher_is_better یا lower_is_better).' })
  direction?: MetricDirection;

  @ApiPropertyOptional({ description: 'واحد اندازه‌گیری', example: 'تومان', default: 'تومان' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  unit?: string;
}
