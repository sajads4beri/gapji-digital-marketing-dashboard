import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  Matches,
  IsDateString,
  IsArray,
  ValidateNested,
  MaxLength,
  MinLength,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskStatus, TaskPriority, TaskRelatedType } from '@prisma/client';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class CreateTaskSubtaskItemDto {
  @ApiProperty({ description: 'عنوان زیرتسک' })
  @IsString({ message: 'عنوان زیرتسک باید متن باشد' })
  @IsNotEmpty({ message: 'عنوان زیرتسک الزامی است' })
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ description: 'وضعیت تکمیل' })
  @IsBoolean()
  @IsOptional()
  completed?: boolean;
}

export class CreateTaskDto {
  @ApiProperty({
    example: 'طراحی بنرهای تبلیغاتی جشنواره یلدا',
    description: 'عنوان تسک',
  })
  @IsString({ message: 'عنوان تسک باید متن باشد' })
  @IsNotEmpty({ message: 'عنوان تسک الزامی است' })
  @MinLength(2, { message: 'عنوان تسک باید حداقل ۲ کاراکتر باشد' })
  @MaxLength(255, { message: 'عنوان تسک حداکثر می‌تواند ۲۵۵ کاراکتر باشد' })
  title: string;

  @ApiPropertyOptional({
    example: 'توضیحات تکمیلی و راهنمای اجرای تسک',
    description: 'توضیحات تسک',
  })
  @IsString({ message: 'توضیحات باید متن باشد' })
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    enum: TaskPriority,
    default: TaskPriority.medium,
    description: 'سطح اولویت تسک',
  })
  @IsEnum(TaskPriority, { message: 'اولویت تسک نامعتبر است' })
  @IsOptional()
  priority?: TaskPriority;

  @ApiPropertyOptional({
    enum: TaskStatus,
    default: TaskStatus.todo,
    description: 'وضعیت تسک',
  })
  @IsEnum(TaskStatus, { message: 'وضعیت تسک نامعتبر است' })
  @IsOptional()
  status?: TaskStatus;

  @ApiPropertyOptional({
    example: '2026-11-20',
    description: 'تاریخ سررسید (فرمت ISO یا YYYY-MM-DD)',
  })
  @IsDateString({}, { message: 'فرمت تاریخ سررسید نامعتبر است' })
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({
    example: '10000000-0000-0000-0000-000000000003',
    description: 'شناسه کاربر مسئول انجام',
  })
  @Matches(UUID_REGEX, { message: 'شناسه مسئول نامعتبر است' })
  @IsOptional()
  assigneeId?: string;

  @ApiPropertyOptional({
    enum: TaskRelatedType,
    description: 'نوع موجودیت مرتبط',
  })
  @IsEnum(TaskRelatedType, { message: 'نوع موجودیت مرتبط نامعتبر است' })
  @IsOptional()
  relatedType?: TaskRelatedType;

  @ApiPropertyOptional({
    example: '30000000-0000-0000-0000-000000000001',
    description: 'شناسه موجودیت مرتبط',
  })
  @Matches(UUID_REGEX, { message: 'شناسه موجودیت مرتبط نامعتبر است' })
  @IsOptional()
  relatedId?: string;

  @ApiPropertyOptional({
    description: 'شناسه دستورالعمل عملیاتی استاندارد (SOP)',
  })
  @Matches(UUID_REGEX, { message: 'شناسه SOP نامعتبر است' })
  @IsOptional()
  sopId?: string;

  @ApiPropertyOptional({
    type: [CreateTaskSubtaskItemDto],
    description: 'چک‌لیست زیرتسک‌های اولیه',
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateTaskSubtaskItemDto)
  subtasks?: CreateTaskSubtaskItemDto[];
}
