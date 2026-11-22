import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QuerySmsCampaignsDto {
  @ApiPropertyOptional({ description: 'عبارت جستجو در نام، متن یا فرستنده' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'فیلتر بر اساس کمپین' })
  @IsOptional()
  @IsString()
  campaignId?: string;

  @ApiPropertyOptional({ description: 'فیلتر بر اساس وضعیت (draft, sent, failed, ...)' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'شماره صفحه', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'تعداد در هر صفحه', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
