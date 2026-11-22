import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UserQueryDto {
  @ApiPropertyOptional({ description: 'فیلتر نقش کاربری' })
  @IsString()
  @IsOptional()
  role?: string;

  @ApiPropertyOptional({ description: 'فیلتر وضعیت کاربری (active | invited | disabled | inactive)' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'جستجوی متنی در نام، ایمیل یا شماره تماس' })
  @IsString()
  @IsOptional()
  search?: string;
}
