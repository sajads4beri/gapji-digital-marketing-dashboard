import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryAttendeesDto {
  @ApiPropertyOptional({ description: 'جستجو در نام، شماره یا ایمیل' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'فیلتر حضور (all, attended, registered)' })
  @IsOptional()
  @IsString()
  attendanceStatus?: string;

  @ApiPropertyOptional({ description: 'فیلتر وضعیت تبدیل به لید (all, converted, not_converted)' })
  @IsOptional()
  @IsString()
  conversionStatus?: string;

  @ApiPropertyOptional({ description: 'شماره صفحه', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'تعداد در هر صفحه', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
