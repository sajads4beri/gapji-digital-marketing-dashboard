import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PlatformRetrievalMethod } from '@prisma/client';

export class PlatformQueryDto {
  @ApiPropertyOptional({ description: 'جستجو در نام یا کد پلتفرم' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'فیلتر بر اساس دسته‌بندی' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'فیلتر بر اساس روش دریافت داده',
    enum: PlatformRetrievalMethod,
  })
  @IsOptional()
  @IsEnum(PlatformRetrievalMethod)
  retrievalMethod?: PlatformRetrievalMethod;

  @ApiPropertyOptional({
    description: 'فیلتر وضعیت: active, inactive, all',
    enum: ['active', 'inactive', 'all'],
  })
  @IsOptional()
  @IsString()
  status?: 'active' | 'inactive' | 'all';
}
