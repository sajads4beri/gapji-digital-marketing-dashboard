import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskRelatedType, EquipmentReadinessStatus } from '@prisma/client';

export class CreateCalendarEventDto {
  @ApiProperty({
    example: 'جلسه برنامه‌ریزی کمپین فصلی',
    description: 'عنوان رویداد تقویم',
  })
  @IsString({ message: 'عنوان رویداد باید متنی باشد' })
  @IsNotEmpty({ message: 'عنوان رویداد الزامی است' })
  @MinLength(2, { message: 'عنوان رویداد باید حداقل ۲ نویسه باشد' })
  @MaxLength(255, { message: 'عنوان رویداد حداکثر می‌تواند ۲۵۵ نویسه باشد' })
  title: string;

  @ApiPropertyOptional({
    example: 'بررسی متریک‌های کلیدی و تخصیص بودجه',
    description: 'توضیحات اختیاری رویداد',
  })
  @IsString({ message: 'توضیحات رویداد باید متنی باشد' })
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 'meeting',
    description: 'نوع رویداد: campaign, webinar, meeting, task',
  })
  @IsString({ message: 'نوع رویداد باید متنی باشد' })
  @IsNotEmpty({ message: 'نوع رویداد الزامی است' })
  eventType: string;

  @ApiProperty({
    example: '2026-11-20',
    description: 'تاریخ شروع (ISO date/datetime)',
  })
  @IsString({ message: 'تاریخ شروع باید رشته معتبر باشد' })
  @IsNotEmpty({ message: 'تاریخ شروع الزامی است' })
  startDate: string;

  @ApiPropertyOptional({
    example: '2026-11-20',
    description: 'تاریخ پایان اختیاری (پیش‌فرض همان تاریخ شروع)',
  })
  @IsString({ message: 'تاریخ پایان باید رشته معتبر باشد' })
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'آیا رویداد تمام‌روز است؟',
  })
  @IsBoolean({ message: 'مقدار isAllDay باید بولی باشد' })
  @IsOptional()
  isAllDay?: boolean;

  @ApiPropertyOptional({
    example: '10:30',
    description: 'ساعت شروع رویداد',
  })
  @IsString({ message: 'ساعت شروع باید رشته باشد' })
  @IsOptional()
  startTime?: string;

  @ApiPropertyOptional({
    example: '12:00',
    description: 'ساعت پایان رویداد',
  })
  @IsString({ message: 'ساعت پایان باید رشته باشد' })
  @IsOptional()
  endTime?: string;

  @ApiPropertyOptional({
    example: '#38BDF8',
    description: 'کد رنگ اختصاصی رویداد',
  })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({
    example: '10000000-0000-0000-0000-000000000002',
    description: 'شناسه کاربر مسئول رویداد',
  })
  @IsUUID('all', { message: 'شناسه مسئول باید یک UUID معتبر باشد' })
  @IsOptional()
  assigneeId?: string;

  @ApiPropertyOptional({
    enum: TaskRelatedType,
    example: 'campaign',
    description: 'نوع موجودیت مرتبط (campaign, webinar, lead, sop, meeting)',
  })
  @IsEnum(TaskRelatedType, { message: 'نوع موجودیت مرتبط نامعتبر است' })
  @IsOptional()
  relatedType?: TaskRelatedType;

  @IsEnum(TaskRelatedType, { message: 'نوع موجودیت مرتبط نامعتبر است' })
  @IsOptional()
  relatedEntityType?: TaskRelatedType;

  @ApiPropertyOptional({
    example: '30000000-0000-0000-0000-000000000001',
    description: 'شناسه موجودیت مرتبط',
  })
  @IsUUID('all', { message: 'شناسه موجودیت مرتبط باید یک UUID معتبر باشد' })
  @IsOptional()
  relatedId?: string;

  @IsUUID('all', { message: 'شناسه موجودیت مرتبط باید یک UUID معتبر باشد' })
  @IsOptional()
  relatedEntityId?: string;

  @ApiPropertyOptional({
    enum: EquipmentReadinessStatus,
    example: 'ready',
    description: 'وضعیت آمادگی تجهیزات (ready, incomplete, not_procured)',
  })
  @IsEnum(EquipmentReadinessStatus, { message: 'وضعیت تجهیزات نامعتبر است' })
  @IsOptional()
  equipmentStatus?: EquipmentReadinessStatus;
}
