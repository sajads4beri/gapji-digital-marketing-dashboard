import { IsString, IsNotEmpty, IsOptional, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLandingPageDto {
  @ApiProperty({ description: 'عنوان صفحه لندینگ', example: 'صفحه اصلی جشنواره پاییزه' })
  @IsString({ message: 'عنوان لندینگ باید رشته متنی باشد.' })
  @IsNotEmpty({ message: 'عنوان لندینگ الزامی است.' })
  @MaxLength(255, { message: 'عنوان لندینگ نمی‌تواند بیش از ۲۵۵ کاراکتر باشد.' })
  title: string;

  @ApiProperty({ description: 'آدرس اینترنتی معتبر صفحه لندینگ (الزاماً HTTPS)', example: 'https://gapji.ir/landing/autumn' })
  @IsString({ message: 'آدرس لندینگ باید رشته متنی باشد.' })
  @IsNotEmpty({ message: 'آدرس لندینگ الزامی است.' })
  @MaxLength(500, { message: 'آدرس لندینگ نمی‌تواند بیش از ۵۰۰ کاراکتر باشد.' })
  url: string;

  @ApiPropertyOptional({ description: 'شناسه کمپین مرتبط (در صورت وجود)', example: '30000000-0000-0000-0000-000000000001' })
  @IsOptional()
  @IsUUID('4', { message: 'شناسه کمپین باید UUID معتبر باشد.' })
  campaignId?: string;
}
