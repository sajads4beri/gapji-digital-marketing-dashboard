import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateAudienceDto {
  @ApiProperty({ description: 'نام پرسونا / گروه مخاطب', example: 'خریداران اینترنتی پرمصرف' })
  @IsString({ message: 'نام مخاطب باید رشته متنی باشد' })
  @IsNotEmpty({ message: 'نام مخاطب الزامی است' })
  @MaxLength(255, { message: 'نام مخاطب حداکثر ۲۵۵ کاراکتر است' })
  name: string;

  @ApiPropertyOptional({ description: 'توضیحات تکمیلی پرسونا', example: 'کاربران فعال فروشگاه‌های آنلاین' })
  @IsString({ message: 'توضیحات باید رشته متنی باشد' })
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'حداقل سن مخاطب', example: 22 })
  @IsInt({ message: 'حداقل سن باید عدد صحیح باشد' })
  @Min(0, { message: 'حداقل سن نمی‌تواند منفی باشد' })
  @Max(120, { message: 'حداقل سن نامعتبر است' })
  @IsOptional()
  @Type(() => Number)
  ageMin?: number;

  @ApiPropertyOptional({ description: 'حداکثر سن مخاطب', example: 40 })
  @IsInt({ message: 'حداکثر سن باید عدد صحیح باشد' })
  @Min(0, { message: 'حداکثر سن نمی‌تواند منفی باشد' })
  @Max(120, { message: 'حداکثر سن نامعتبر است' })
  @IsOptional()
  @Type(() => Number)
  ageMax?: number;

  @ApiPropertyOptional({ description: 'جنسیت (all, male, female)', example: 'all' })
  @IsString({ message: 'جنسیت باید رشته متنی باشد' })
  @IsOptional()
  @MaxLength(20)
  gender?: string;

  @ApiPropertyOptional({ description: 'شهرها و موقعیت‌های جغرافیایی', example: 'تهران، اصفهان، مشهد' })
  @IsString({ message: 'موقعیت باید رشته متنی باشد' })
  @IsOptional()
  @MaxLength(255)
  location?: string;

  @ApiPropertyOptional({ description: 'علایق و تگ‌های موضوعی (کاما-جداشده)', example: 'فناوری، خرید آنلاین، هوش مصنوعی' })
  @IsString({ message: 'علایق باید رشته متنی باشد' })
  @IsOptional()
  interests?: string;

  @ApiPropertyOptional({ description: 'کانال مناسب تبلیغاتی (PRD p. 14)', example: 'گوگل ادز، اینستاگرام' })
  @IsString({ message: 'کانال باید رشته متنی باشد' })
  @IsOptional()
  @MaxLength(100)
  channel?: string;
}
