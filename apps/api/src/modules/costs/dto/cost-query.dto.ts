import { IsOptional, IsString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CostQueryDto {
  @ApiPropertyOptional({ description: 'جستجوی متنی در عنوان، توضیحات، فاکتور، یا مجری' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'فیلتر دسته‌بندی' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'فیلتر کانال یا پلتفرم' })
  @IsOptional()
  @IsString()
  channel?: string;

  @ApiPropertyOptional({ description: 'فیلتر شناسه کمپین (یا unlinked)' })
  @IsOptional()
  @IsString()
  campaignId?: string;

  @ApiPropertyOptional({ description: 'فیلتر وضعیت پرداخت (paid, pending, draft)' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'شروع بازه تاریخ وقوع (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional({ description: 'پایان بازه تاریخ وقوع (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  to?: string;

  @ApiPropertyOptional({ description: 'مرتب‌سازی بر اساس فیلد', default: 'date' })
  @IsOptional()
  @IsString()
  sortBy?: 'date' | 'amount' | 'category' | 'channel' | 'title';

  @ApiPropertyOptional({ description: 'جهت مرتب‌سازی', default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
