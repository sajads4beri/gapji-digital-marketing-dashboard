import { IsString, IsNotEmpty, IsOptional, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUtmLinkDto {
  @ApiPropertyOptional({ description: 'شناسه صفحه لندینگ انتخاب‌شده', example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  @IsOptional()
  @IsUUID('4', { message: 'شناسه لندینگ باید UUID معتبر باشد.' })
  landingPageId?: string;

  @ApiProperty({ description: 'آدرس اینترنتی مقصد (الزاماً HTTPS)', example: 'https://gapji.ir/landing/autumn' })
  @IsString({ message: 'آدرس مقصد باید رشته متنی باشد.' })
  @IsNotEmpty({ message: 'آدرس مقصد الزامی است.' })
  @MaxLength(1000)
  destinationUrl: string;

  @ApiPropertyOptional({ description: 'شناسه پلتفرم انتخاب‌شده', example: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22' })
  @IsOptional()
  @IsUUID('4', { message: 'شناسه پلتفرم باید UUID معتبر باشد.' })
  platformId?: string;

  @ApiProperty({ description: 'منبع ترافیک (utm_source)', example: 'google_ads' })
  @IsString({ message: 'منبع (utm_source) باید رشته متنی باشد.' })
  @IsNotEmpty({ message: 'منبع ترافیک الزامی است.' })
  @MaxLength(100)
  utmSource: string;

  @ApiProperty({ description: 'رسانه تبلیغاتی (utm_medium)', example: 'cpc' })
  @IsString({ message: 'رسانه (utm_medium) باید رشته متنی باشد.' })
  @IsNotEmpty({ message: 'رسانه تبلیغاتی الزامی است.' })
  @MaxLength(100)
  utmMedium: string;

  @ApiPropertyOptional({ description: 'شناسه کمپین در سیستم', example: '30000000-0000-0000-0000-000000000001' })
  @IsOptional()
  @IsUUID('4', { message: 'شناسه کمپین باید UUID معتبر باشد.' })
  campaignId?: string;

  @ApiProperty({ description: 'نام کمپین رهگیری (utm_campaign)', example: 'autumn_sale_search' })
  @IsString({ message: 'نام کمپین باید رشته متنی باشد.' })
  @IsNotEmpty({ message: 'کمپین رهگیری الزامی است.' })
  @MaxLength(100)
  utmCampaign: string;

  @ApiPropertyOptional({ description: 'کلمه کلیدی یا عبارت (utm_term)', example: 'خرید_نرم_افزار' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  utmTerm?: string;

  @ApiPropertyOptional({ description: 'محتوا یا مشخصه تبلیغ (utm_content)', example: 'cta_button_red' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  utmContent?: string;
}
