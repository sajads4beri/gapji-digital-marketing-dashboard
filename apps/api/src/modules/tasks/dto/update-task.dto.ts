import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TaskStatus, TaskPriority, TaskRelatedType } from '@prisma/client';

export class UpdateTaskDto {
  @ApiPropertyOptional({ description: 'عنوان تسک' })
  @IsString({ message: 'عنوان تسک باید متن باشد' })
  @MinLength(2, { message: 'عنوان تسک باید حداقل ۲ کاراکتر باشد' })
  @MaxLength(255, { message: 'عنوان تسک حداکثر ۲۵۵ کاراکتر است' })
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: 'توضیحات تسک' })
  @IsString({ message: 'توضیحات باید متن باشد' })
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: TaskPriority, description: 'سطح اولویت تسک' })
  @IsEnum(TaskPriority, { message: 'اولویت تسک نامعتبر است' })
  @IsOptional()
  priority?: TaskPriority;

  @ApiPropertyOptional({ enum: TaskStatus, description: 'وضعیت تسک' })
  @IsEnum(TaskStatus, { message: 'وضعیت تسک نامعتبر است' })
  @IsOptional()
  status?: TaskStatus;

  @ApiPropertyOptional({ description: 'تاریخ سررسید' })
  @IsDateString({}, { message: 'فرمت تاریخ سررسید نامعتبر است' })
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'شناسه کاربر مسئول انجام' })
  @IsOptional()
  assigneeId?: string | null;

  @ApiPropertyOptional({ enum: TaskRelatedType, description: 'نوع موجودیت مرتبط' })
  @IsEnum(TaskRelatedType, { message: 'نوع موجودیت نامعتبر است' })
  @IsOptional()
  relatedType?: TaskRelatedType | null;

  @ApiPropertyOptional({ description: 'شناسه موجودیت مرتبط' })
  @IsOptional()
  relatedId?: string | null;

  @ApiPropertyOptional({ description: 'شناسه SOP' })
  @IsOptional()
  sopId?: string | null;
}
