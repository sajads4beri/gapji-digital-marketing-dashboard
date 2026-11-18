import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { LeadStatusGroup } from '@prisma/client';

export class UpdateTaxonomyItemDto {
  @ApiPropertyOptional({ description: 'عنوان نمایشی ویرایش‌شده', example: 'گوگل ادز پیشرفته' })
  @IsString({ message: 'عنوان گزینه باید از نوع متنی باشد' })
  @MaxLength(255, { message: 'عنوان گزینه حداکثر می‌تواند ۲۵۵ کاراکتر باشد' })
  @IsOptional()
  label?: string;

  @ApiPropertyOptional({ description: 'گروه وضعیت لید', enum: LeadStatusGroup, example: LeadStatusGroup.open })
  @IsEnum(LeadStatusGroup, { message: 'گروه وضعیت لید نامعتبر است' })
  @IsOptional()
  group?: LeadStatusGroup;

  @ApiPropertyOptional({ description: 'رنگ برچسب', example: 'indigo' })
  @IsString({ message: 'رنگ باید از نوع متنی باشد' })
  @MaxLength(50, { message: 'رنگ حداکثر می‌تواند ۵۰ کاراکتر باشد' })
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ description: 'ترتیب نمایش گزینه', example: 2 })
  @IsInt({ message: 'ترتیب نمایش باید عدد صحیح باشد' })
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({ description: 'وضعیت فعال/غیرفعال بودن', example: true })
  @IsBoolean({ message: 'وضعیت باید بولین باشد' })
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'توضیحات تکمیلی (مخصوص سرفصل‌های هزینه)' })
  @IsString({ message: 'توضیحات باید متنی باشد' })
  @IsOptional()
  description?: string;
}
