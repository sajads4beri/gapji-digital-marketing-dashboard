import { IsOptional, IsString, Matches, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class GetLeadsFilterDto {
  @ApiPropertyOptional({ description: 'جستجو در نام، شماره تماس و ایمیل لید' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'فیلتر وضعیت لید (یا لیست جداشده با کاما)' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'فیلتر کارشناس مسئول' })
  @IsString()
  @IsOptional()
  assignedToId?: string;

  @ApiPropertyOptional({ description: 'فیلتر کمپین مرتبط' })
  @Matches(UUID_REGEX, { message: 'شناسه کمپین نامعتبر است' })
  @IsOptional()
  campaignId?: string;

  @ApiPropertyOptional({ description: 'فیلتر منبع ورودی لید' })
  @IsString()
  @IsOptional()
  source?: string;

  @ApiPropertyOptional({ description: 'تاریخ شروع بازه ورود لید (ISO)' })
  @IsDateString()
  @IsOptional()
  from?: string;

  @ApiPropertyOptional({ description: 'تاریخ پایان بازه ورود لید (ISO)' })
  @IsDateString()
  @IsOptional()
  to?: string;
}
