import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SmsResultRowDto {
  @IsString()
  mobile: string;

  @IsOptional()
  @IsString()
  status?: string; // delivered, failed, pending

  @IsOptional()
  @IsString()
  deliveredAt?: string;

  @IsOptional()
  @IsString()
  replyText?: string;

  @IsOptional()
  @IsString()
  repliedAt?: string;
}

export class ImportSmsResultsDto {
  @ApiPropertyOptional({ description: 'محتوای فایل CSV' })
  @IsOptional()
  @IsString()
  csvContent?: string;

  @ApiPropertyOptional({ description: 'آرایه‌ای از ردیف‌های نتایج ارسال پیامک', type: [SmsResultRowDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SmsResultRowDto)
  rows?: SmsResultRowDto[];
}
