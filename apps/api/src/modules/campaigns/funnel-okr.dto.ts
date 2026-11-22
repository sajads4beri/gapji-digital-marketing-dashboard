import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsNumber,
  Min,
  IsEnum,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpsertFunnelObjectiveDto {
  @ApiProperty({
    example: 'افزایش نرخ تبدیل لیدهای مرحله توجه',
    description: 'Title of the objective for this funnel stage',
  })
  @IsString({ message: 'عنوان هدف باید متن باشد' })
  @IsNotEmpty({ message: 'عنوان هدف الزامی است' })
  @MaxLength(255, { message: 'عنوان هدف حداکثر ۲۵۵ کاراکتر است' })
  title: string;

  @ApiPropertyOptional({
    example: 'هدف‌گذاری برای بهبود تعامل کاربران و آماده‌سازی برای خرید',
    description: 'Description or notes for this objective',
  })
  @IsString({ message: 'توضیحات هدف باید متن باشد' })
  @IsOptional()
  description?: string;
}

export class CreateFunnelKeyResultDto {
  @ApiProperty({
    example: 'برقراری تماس پیگیری با ۵۰ لید علاقه‌مند',
    description: 'Title of the Key Result',
  })
  @IsString({ message: 'عنوان نتیجه کلیدی باید متن باشد' })
  @IsNotEmpty({ message: 'عنوان نتیجه کلیدی الزامی است' })
  @MaxLength(255, { message: 'عنوان نتیجه کلیدی حداکثر ۲۵۵ کاراکتر است' })
  title: string;

  @ApiPropertyOptional({
    example: 0,
    description: 'Current progress value',
    default: 0,
  })
  @IsNumber({}, { message: 'مقدار جاری باید عدد باشد' })
  @Type(() => Number)
  @IsOptional()
  currentValue?: number;

  @ApiProperty({
    example: 50,
    description: 'Target progress value',
  })
  @IsNumber({}, { message: 'مقدار هدف باید عدد باشد' })
  @Type(() => Number)
  @Min(0.01, { message: 'مقدار هدف باید بزرگتر از صفر باشد' })
  targetValue: number;

  @ApiPropertyOptional({
    example: 'تماس',
    description: 'Unit of measurement (e.g. عدد, %, تماس, فروش)',
    default: 'عدد',
  })
  @IsString({ message: 'واحد اندازه‌گیری باید متن باشد' })
  @IsOptional()
  @MaxLength(50, { message: 'واحد اندازه‌گیری حداکثر ۵۰ کاراکتر است' })
  unit?: string;
}

export class UpdateFunnelKeyResultDto {
  @ApiPropertyOptional({
    example: 'برقراری تماس پیگیری با ۵۰ لید علاقه‌مند',
    description: 'Updated title of the Key Result',
  })
  @IsString({ message: 'عنوان نتیجه کلیدی باید متن باشد' })
  @IsOptional()
  @MaxLength(255, { message: 'عنوان نتیجه کلیدی حداکثر ۲۵۵ کاراکتر است' })
  title?: string;

  @ApiPropertyOptional({
    example: 25,
    description: 'Current progress value',
  })
  @IsNumber({}, { message: 'مقدار جاری باید عدد باشد' })
  @Type(() => Number)
  @IsOptional()
  currentValue?: number;

  @ApiPropertyOptional({
    example: 50,
    description: 'Target progress value',
  })
  @IsNumber({}, { message: 'مقدار هدف باید عدد باشد' })
  @Type(() => Number)
  @Min(0.01, { message: 'مقدار هدف باید بزرگتر از صفر باشد' })
  @IsOptional()
  targetValue?: number;

  @ApiPropertyOptional({
    example: 'تماس',
    description: 'Unit of measurement',
  })
  @IsString({ message: 'واحد اندازه‌گیری باید متن باشد' })
  @IsOptional()
  @MaxLength(50, { message: 'واحد اندازه‌گیری حداکثر ۵۰ کاراکتر است' })
  unit?: string;
}

export enum OkrTaskPriority {
  urgent = 'urgent',
  high = 'high',
  medium = 'medium',
  low = 'low',
}

export class CreateOkrTaskDto {
  @ApiProperty({
    example: 'تماس با لیدهای ورودی روز دوشنبه',
    description: 'Task title',
  })
  @IsString({ message: 'عنوان تسک باید متن باشد' })
  @IsNotEmpty({ message: 'عنوان تسک الزامی است' })
  @MaxLength(255, { message: 'عنوان تسک حداکثر ۲۵۵ کاراکتر است' })
  title: string;

  @ApiPropertyOptional({
    example: 'توضیحات مربوط به نحوه پیگیری لیدها',
    description: 'Task description',
  })
  @IsString({ message: 'توضیحات تسک باید متن باشد' })
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 'medium',
    enum: OkrTaskPriority,
    default: OkrTaskPriority.medium,
  })
  @IsEnum(OkrTaskPriority, { message: 'اولویت نامعتبر است' })
  @IsOptional()
  priority?: OkrTaskPriority;

  @ApiPropertyOptional({
    example: '2026-11-25',
    description: 'Due date in ISO format or YYYY-MM-DD',
  })
  @IsDateString({}, { message: 'تاریخ سررسید نامعتبر است' })
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({
    example: '00000000-0000-0000-0000-000000000002',
    description: 'Assignee User UUID',
  })
  @IsUUID('4', { message: 'شناسه کاربر مسئول نامعتبر است' })
  @IsOptional()
  assigneeId?: string;
}
