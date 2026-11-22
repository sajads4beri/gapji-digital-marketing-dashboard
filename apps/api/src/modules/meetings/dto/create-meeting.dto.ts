import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsUUID,
  IsArray,
  ValidateNested,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateActionItemDto } from './create-action-item.dto';

export class CreateMeetingDto {
  @ApiProperty({ description: 'عنوان صورتجلسه', example: 'جلسه هفتگی هماهنگی کمپین‌های فصلی' })
  @IsString()
  @IsNotEmpty({ message: 'عنوان صورتجلسه الزامی است' })
  @MaxLength(255)
  title: string;

  @ApiProperty({ description: 'تاریخ و ساعت برگزاری جلسه', example: '2026-11-20T10:00:00.000Z' })
  @IsDateString({}, { message: 'فرمت تاریخ و زمان جلسه نامعتبر است' })
  meetingDate: string;

  @ApiPropertyOptional({ description: 'محل برگزاری یا لینک اتاق آنلاین', example: 'اتاق جلسات ۱ / لینک گوگل میت' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @ApiPropertyOptional({ description: 'فهرست نام یا ایمیل حاضرین', example: 'علی رضایی، سارا راد، مدیر کمپین' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  attendeesSummary?: string;

  @ApiPropertyOptional({ description: 'خلاصه مباحث و نکات کلیدی جلسه' })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional({ description: 'مشروح مذاکرات و یادداشت‌ها' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'شناسه کمپین مرتبط در صورت وجود' })
  @IsOptional()
  @IsUUID('4')
  campaignId?: string;

  @ApiPropertyOptional({ type: [CreateActionItemDto], description: 'فهرست مصوبات و اقدام‌ها' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateActionItemDto)
  actionItems?: CreateActionItemDto[];
}
