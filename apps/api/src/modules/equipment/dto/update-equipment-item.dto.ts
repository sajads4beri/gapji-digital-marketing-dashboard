import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateEquipmentItemDto {
  @ApiPropertyOptional({ description: 'نام تجهیز' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'دسته‌بندی تجهیز' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({ description: 'توضیحات و مشخصات تجهیز' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'وضعیت فعال/غیرفعال بودن' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
