import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PreviewUtmDto {
  @ApiProperty({ description: 'آدرس اینترنتی مقصد (الزاماً HTTPS)', example: 'https://gapji.ir/landing/autumn' })
  @IsString({ message: 'آدرس مقصد باید رشته متنی باشد.' })
  @IsNotEmpty({ message: 'آدرس مقصد الزامی است.' })
  destinationUrl: string;

  @ApiProperty({ description: 'منبع ترافیک (utm_source)', example: 'google' })
  @IsString({ message: 'منبع ترافیک الزامی است.' })
  @IsNotEmpty({ message: 'منبع ترافیک الزامی است.' })
  utmSource: string;

  @ApiProperty({ description: 'رسانه تبلیغاتی (utm_medium)', example: 'cpc' })
  @IsString({ message: 'رسانه تبلیغاتی الزامی است.' })
  @IsNotEmpty({ message: 'رسانه تبلیغاتی الزامی است.' })
  utmMedium: string;

  @ApiProperty({ description: 'نام کمپین رهگیری (utm_campaign)', example: 'autumn_sale' })
  @IsString({ message: 'نام کمپین الزامی است.' })
  @IsNotEmpty({ message: 'نام کمپین الزامی است.' })
  utmCampaign: string;

  @ApiPropertyOptional({ description: 'کلمه کلیدی (utm_term)', example: 'کلمات_کلیدی' })
  @IsOptional()
  @IsString()
  utmTerm?: string;

  @ApiPropertyOptional({ description: 'محتوا (utm_content)', example: 'بنر_قرمز' })
  @IsOptional()
  @IsString()
  utmContent?: string;
}
