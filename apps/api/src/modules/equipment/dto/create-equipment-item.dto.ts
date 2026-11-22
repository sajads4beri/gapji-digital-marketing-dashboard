import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEquipmentItemDto {
  @ApiProperty({ description: 'نام تجهیز', example: 'میکروفون بی‌سیم رود (Rode Wireless GO)' })
  @IsString()
  @IsNotEmpty({ message: 'نام تجهیز الزامی است' })
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'دسته‌بندی تجهیز', example: 'صوت' })
  @IsString()
  @IsNotEmpty({ message: 'دسته‌بندی الزامی است' })
  @MaxLength(100)
  category: string;

  @ApiPropertyOptional({ description: 'توضیحات و مشخصات تجهیز' })
  @IsOptional()
  @IsString()
  description?: string;
}
