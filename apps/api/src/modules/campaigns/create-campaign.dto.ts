import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsInt,
  IsOptional,
  IsUrl,
  IsUUID,
  IsDateString,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CampaignStatus, CampaignHealth } from './campaign.entity';

export class CreateCampaignDto {
  @ApiPropertyOptional({
    example: '00000000-0000-0000-0000-000000000001',
    description: 'Organization ID (tenant identifier). Falls back to default organization if omitted.',
  })
  @IsUUID()
  @IsOptional()
  organizationId?: string;

  @ApiProperty({ example: 'Summer Campaign', description: 'Campaign name' })
  @IsString({ message: 'نام کمپین باید رشته متنی باشد' })
  @IsNotEmpty({ message: 'نام کمپین الزامی است' })
  @MaxLength(255, { message: 'نام کمپین حداکثر ۲۵۵ کاراکتر است' })
  name: string;

  @ApiPropertyOptional({
    example: 'Promotional discount campaign',
    description: 'Campaign description',
  })
  @IsString()
  @IsOptional()
  description?: string | null;

  @ApiProperty({ example: 'instagram', description: 'Marketing channel' })
  @IsString({ message: 'کانال بازاریابی باید رشته متنی باشد' })
  @IsNotEmpty({ message: 'انتخاب کانال بازاریابی الزامی است' })
  channel: string;

  @ApiPropertyOptional({ example: 'lead_generation', description: 'Campaign type' })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ example: 'increase_sales', description: 'Campaign objective' })
  @IsString()
  @IsOptional()
  objective?: string;

  @ApiPropertyOptional({
    enum: CampaignStatus,
    default: CampaignStatus.DRAFT,
    description: 'Campaign status',
  })
  @IsEnum(CampaignStatus, { message: 'وضعیت کمپین نامعتبر است' })
  @IsOptional()
  status?: CampaignStatus;

  @ApiPropertyOptional({
    enum: CampaignHealth,
    default: CampaignHealth.HEALTHY,
    description: 'Campaign health indicator',
  })
  @IsEnum(CampaignHealth, { message: 'شاخص سلامت کمپین نامعتبر است' })
  @IsOptional()
  health?: CampaignHealth;

  @ApiProperty({
    example: 50000000,
    description:
      'Campaign budget (integer, non-negative, in monetary units without decimals)',
  })
  @Transform(({ value }) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const cleaned = value
        .trim()
        .replace(/[٬,\s_]/g, '')
        .replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1776 + 48))
        .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1632 + 48));
      if (cleaned === '') return value;
      const num = Number(cleaned);
      return isNaN(num) ? value : num;
    }
    return value;
  })
  @IsInt({ message: 'budget must be an integer number' })
  @Min(0, { message: 'budget must not be less than 0' })
  budget: number;

  @ApiPropertyOptional({
    example: 'https://example.com/landing',
    description: 'Landing page URL',
  })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsUrl({}, { message: 'آدرس صفحه فرود باید یک URL معتبر باشد' })
  @IsOptional()
  landingPageUrl?: string;

  @ApiPropertyOptional({ example: '2026-06-01', description: 'Campaign start date' })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsDateString({}, { message: 'فرمت تاریخ شروع نامعتبر است' })
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-08-31', description: 'Campaign end date' })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsDateString({}, { message: 'فرمت تاریخ پایان نامعتبر است' })
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ example: 500, description: 'Target leads count' })
  @IsInt()
  @Min(0)
  @IsOptional()
  targetLeads?: number;

  @ApiPropertyOptional({ example: 50, description: 'Target sales count' })
  @IsInt()
  @Min(0)
  @IsOptional()
  targetSales?: number;

  @ApiPropertyOptional({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', description: 'Owner User ID' })
  @IsUUID()
  @IsOptional()
  ownerId?: string;

  @ApiPropertyOptional({ description: 'Campaign owner name' })
  @IsString()
  @IsOptional()
  ownerName?: string;

  @ApiPropertyOptional({ description: 'Target audience settings from wizard step 2' })
  @IsOptional()
  targetAudience?: any;

  @ApiPropertyOptional({ description: 'Platform allocations from wizard step 3' })
  @IsOptional()
  platforms?: any;

  @ApiPropertyOptional({ description: 'Target KPIs from wizard step 4' })
  @IsOptional()
  targetKpis?: any;

  @ApiPropertyOptional({ description: 'Tracking UTM from wizard step 5' })
  @IsOptional()
  trackingUtm?: any;
}
