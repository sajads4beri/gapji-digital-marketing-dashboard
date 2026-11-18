import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlatformRetrievalMethod } from '@prisma/client';
import { PlatformInputDefinitionDto } from './platform-input-definition.dto';
import { PlatformOutputColumnDto } from './platform-output-column.dto';

export class CreatePlatformDto {
  @ApiProperty({ description: 'نام پلتفرم تبلیغاتی', example: 'گوگل ادز (Google Ads)' })
  @IsString()
  @IsNotEmpty({ message: 'نام پلتفرم الزامی است' })
  name: string;

  @ApiProperty({
    description: 'دسته‌بندی یا نوع پلتفرم (digital, social, sms, ad_network, search_ads, etc.)',
    example: 'digital',
  })
  @IsString()
  @IsNotEmpty({ message: 'نوع پلتفرم الزامی است' })
  category: string;

  @ApiProperty({
    description: 'روش جمع‌آوری داده‌ها (manual, import, api)',
    enum: PlatformRetrievalMethod,
    example: PlatformRetrievalMethod.api,
  })
  @IsEnum(PlatformRetrievalMethod, {
    message: 'روش دریافت داده باید یکی از مقادیر manual, import یا api باشد',
  })
  retrievalMethod: PlatformRetrievalMethod;

  @ApiPropertyOptional({ description: 'کد یکتای پلتفرم در سازمان (در صورت عدم ارسال خودکار تولید می‌شود)', example: 'google_ads' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: 'آیکون یا نشان پلتفرم', example: 'google_ads' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ description: 'شناسه قالب آماده در صورت ساخت بر مبنای قالب', example: 'tpl_google_ads' })
  @IsOptional()
  @IsString()
  templateId?: string;

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
