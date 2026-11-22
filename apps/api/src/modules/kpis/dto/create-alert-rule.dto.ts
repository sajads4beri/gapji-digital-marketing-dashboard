import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsUUID,
  IsIn,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAlertRuleDto {
  @ApiPropertyOptional({ description: 'شناسه KPI مرتبط (در صورت اتصال مستقیم)', example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  @IsOptional()
  @IsUUID('4', { message: 'شناسه KPI باید UUID معتبر باشد.' })
  kpiMetricId?: string;

  @ApiProperty({ description: 'نام شاخص مورد سنجش', example: 'CPL' })
  @IsString({ message: 'نام شاخص باید رشته باشد.' })
  @IsNotEmpty({ message: 'نام شاخص الزامی است.' })
  @MaxLength(100)
  metricName: string;

  @ApiProperty({
    description: 'شرط مقایسه (بزرگتر از، کوچکتر از، مساوی)',
    example: 'gt',
    enum: ['gt', 'lt', 'gte', 'lte', 'eq'],
  })
  @IsString()
  @IsNotEmpty({ message: 'شرط مقایسه الزامی است.' })
  @IsIn(['gt', 'lt', 'gte', 'lte', 'eq'], {
    message: 'شرط باید یکی از موارد gt (بزرگتر از)، lt (کوچکتر از)، gte، lte، یا eq باشد.',
  })
  condition: string;

  @ApiProperty({ description: 'مقدار آستانه تحریک هشدار', example: 75000 })
  @IsNumber({}, { message: 'مقدار آستانه باید عدد معتبر باشد.' })
  thresholdValue: number;

  @ApiPropertyOptional({
    description: 'سطح اهمیت هشدار',
    example: 'warning',
    enum: ['info', 'warning', 'critical'],
    default: 'warning',
  })
  @IsOptional()
  @IsString()
  @IsIn(['info', 'warning', 'critical'], {
    message: 'سطح اهمیت باید یکی از info, warning, critical باشد.',
  })
  severity?: string;

  @ApiProperty({ description: 'متن پیام هشدار', example: 'هزینه به ازای هر لید بیش از حد مجاز افزایش یافته است' })
  @IsString({ message: 'متن پیام باید رشته باشد.' })
  @IsNotEmpty({ message: 'متن پیام هشدار الزامی است.' })
  @MaxLength(500)
  message: string;

  @ApiPropertyOptional({ description: 'اقدام پیشنهادی به کاربر', example: 'کاهش بید روزانه یا بررسی هدف‌گذاری مخاطبان' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  suggestedAction?: string;

  @ApiPropertyOptional({ description: 'فعال / غیرفعال بودن قاعده', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
