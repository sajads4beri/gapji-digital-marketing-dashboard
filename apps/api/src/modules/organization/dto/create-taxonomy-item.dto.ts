import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeadStatusGroup } from '@prisma/client';

export class CreateTaxonomyItemDto {
  @ApiProperty({ description: 'عنوان نمایشی گزینه به زبان فارسی', example: 'گوگل ادز' })
  @IsString({ message: 'عنوان گزینه باید از نوع متنی باشد' })
  @IsNotEmpty({ message: 'عنوان گزینه الزامی است' })
  @MaxLength(255, { message: 'عنوان گزینه حداکثر می‌تواند ۲۵۵ کاراکتر باشد' })
  label: string;

  @ApiPropertyOptional({ description: 'کلید یکتای سیستمی (انگلیسی)', example: 'google_ads' })
  @IsString({ message: 'کلید سیستمی باید از نوع متنی باشد' })
  @MaxLength(100, { message: 'کلید سیستمی حداکثر می‌تواند ۱۰۰ کاراکتر باشد' })
  @IsOptional()
  key?: string;

  @ApiPropertyOptional({ description: 'گروه وضعیت لید (مخصوص وضعیت‌های لید)', enum: LeadStatusGroup, example: LeadStatusGroup.open })
  @IsEnum(LeadStatusGroup, { message: 'گروه وضعیت لید باید یکی از مقادیر open, won یا lost باشد' })
  @IsOptional()
  group?: LeadStatusGroup;

  @ApiPropertyOptional({ description: 'رنگ برچسب جهت نمایش در کانبان و جداول', example: 'blue' })
  @IsString({ message: 'رنگ باید از نوع متنی باشد' })
  @MaxLength(50, { message: 'کد یا نام رنگ حداکثر می‌تواند ۵۰ کاراکتر باشد' })
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ description: 'ترتیب نمایش گزینه', example: 1 })
  @IsInt({ message: 'ترتیب نمایش باید عدد صحیح باشد' })
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({ description: 'وضعیت فعال/غیرفعال بودن گزینه', example: true, default: true })
  @IsBoolean({ message: 'وضعیت باید بولین باشد' })
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'توضیحات اختیاری (مخصوص سرفصل‌های هزینه)', example: 'هزینه‌های مربوط به کمپین‌های کلیکی' })
  @IsString({ message: 'توضیحات باید متنی باشد' })
  @IsOptional()
  description?: string;
}
