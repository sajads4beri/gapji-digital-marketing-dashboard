import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class AudienceQueryDto {
  @ApiPropertyOptional({ description: 'جستجو در نام، علایق یا موقعیت مخاطب' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'فیلتر بر اساس جنسیت' })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({ description: 'فیلتر بر اساس کانال مناسب' })
  @IsOptional()
  @IsString()
  channel?: string;

  @ApiPropertyOptional({ description: 'شماره صفحه', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'تعداد در هر صفحه', default: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 50;
}
