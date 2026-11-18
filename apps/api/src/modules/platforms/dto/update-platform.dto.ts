import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PlatformRetrievalMethod } from '@prisma/client';
import { PlatformInputDefinitionDto } from './platform-input-definition.dto';
import { PlatformOutputColumnDto } from './platform-output-column.dto';

export class UpdatePlatformDto {
  @ApiPropertyOptional({ description: 'نام پلتفرم تبلیغاتی' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'دسته‌بندی یا نوع پلتفرم' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'روش دریافت داده (manual, import, api)',
    enum: PlatformRetrievalMethod,
  })
  @IsOptional()
  @IsEnum(PlatformRetrievalMethod)
  retrievalMethod?: PlatformRetrievalMethod;

  @ApiPropertyOptional({ description: 'وضعیت فعال/غیرفعال بودن پلتفرم' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'آیکون یا نشان پلتفرم' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({
    description: 'فیلدهای ورودی قابل پیکربندی پلتفرم',
    type: [PlatformInputDefinitionDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlatformInputDefinitionDto)
  inputs?: PlatformInputDefinitionDto[];

  @ApiPropertyOptional({
    description: 'ستون‌های قالب گزارش (خروجی‌ها)',
    type: [PlatformOutputColumnDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlatformOutputColumnDto)
  outputs?: PlatformOutputColumnDto[];
}
