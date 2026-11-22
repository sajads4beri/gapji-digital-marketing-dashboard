import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryCalendarEventsDto {
  @ApiPropertyOptional({
    description: 'فیلتر تاریخ شروع بازه تقویم (ISO date string YYYY-MM-DD)',
    example: '2026-11-01',
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'فیلتر تاریخ پایان بازه تقویم (ISO date string YYYY-MM-DD)',
    example: '2026-11-30',
  })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'فیلتر نوع رویداد (یا چندین نوع با کاما)',
    example: 'campaign,webinar',
  })
  @IsOptional()
  @IsString()
  eventType?: string;

  @ApiPropertyOptional({
    description: 'فیلتر نوع موجودیت مرتبط (campaign, webinar, lead, meeting, sop)',
    example: 'campaign',
  })
  @IsOptional()
  @IsString()
  relatedType?: string;

  @ApiPropertyOptional({
    description: 'فیلتر شناسه یکتای موجودیت مرتبط',
    example: '30000000-0000-0000-0000-000000000001',
  })
  @IsOptional()
  @IsUUID('all')
  relatedId?: string;

  @ApiPropertyOptional({
    description: 'جستجوی متنی در عنوان، توضیحات یا نام مسئول رویداد',
    example: 'کمپین',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
