import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AttendeeRowDto {
  @IsString()
  fullName: string;

  @IsString()
  mobile: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  attended?: boolean | string | number;

  @IsOptional()
  @IsString()
  joinedAt?: string;
}

export class ImportAttendeesDto {
  @ApiPropertyOptional({ description: 'محتوای فایل CSV' })
  @IsOptional()
  @IsString()
  csvContent?: string;

  @ApiPropertyOptional({ description: 'آرایه‌ای از شرکت‌کنندگان', type: [AttendeeRowDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendeeRowDto)
  rows?: AttendeeRowDto[];
}
