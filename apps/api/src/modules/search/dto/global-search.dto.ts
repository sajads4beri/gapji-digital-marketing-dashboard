import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GlobalSearchDto {
  @ApiProperty({
    description: 'عبارت جستجوی سریع سراسری (حداقل ۲ کاراکتر)',
    example: 'کمپین یلدا یا ۰۹۱۲',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'عبارت جستجو نمی‌تواند خالی باشد' })
  @MinLength(2, { message: 'حداقل ۲ کاراکتر برای جستجو الزامی است' })
  @MaxLength(100, { message: 'حداکثر ۱۰۰ کاراکتر مجاز است' })
  q: string;
}
