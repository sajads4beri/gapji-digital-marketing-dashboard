import {
  IsString,
  IsOptional,
  IsDateString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMeetingDto {
  @ApiPropertyOptional({ description: 'عنوان صورتجلسه' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ description: 'تاریخ و ساعت برگزاری جلسه' })
  @IsOptional()
  @IsDateString()
  meetingDate?: string;

  @ApiPropertyOptional({ description: 'محل برگزاری یا لینک اتاق آنلاین' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @ApiPropertyOptional({ description: 'فهرست نام حاضرین' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  attendeesSummary?: string;

  @ApiPropertyOptional({ description: 'خلاصه مباحث' })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional({ description: 'مشروح مذاکرات' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'شناسه کمپین مرتبط' })
  @IsOptional()
  @IsUUID('4')
  campaignId?: string;
}
