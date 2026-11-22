import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsInt,
  Min,
  IsDateString,
  IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWebinarDto {
  @ApiProperty({ description: 'عنوان و موضوع وبینار' })
  @IsString()
  @IsNotEmpty({ message: 'عنوان وبینار الزامی است' })
  title: string;

  @ApiPropertyOptional({ description: 'توضیحات تکمیلی وبینار' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'مسئول یا ارائه‌دهنده وبینار' })
  @IsString()
  @IsNotEmpty({ message: 'نام مسئول/ارائه‌دهنده وبینار الزامی است' })
  presenterName: string;

  @ApiProperty({ description: 'بستر یا پلتفرم برگزاری (اسکای‌روم، گوگل میت، زوم، ...)' })
  @IsString()
  @IsNotEmpty({ message: 'پلتفرم برگزاری الزامی است' })
  platform: string;

  @ApiProperty({ description: 'تاریخ و ساعت برگزاری وبینار' })
  @IsDateString({}, { message: 'فرمت تاریخ و ساعت برگزاری نامعتبر است' })
  webinarDate: string;

  @ApiPropertyOptional({ description: 'مدت زمان به دقیقه', default: 60 })
  @IsOptional()
  @IsInt({ message: 'مدت زمان باید عدد صحیح باشد' })
  @Min(15, { message: 'مدت زمان وبینار حداقل ۱۵ دقیقه است' })
  durationMinutes?: number = 60;

  @ApiPropertyOptional({ description: 'نشانی اینترنتی جلسه یا لینک ثبت‌نام' })
  @IsOptional()
  @IsString()
  registrationUrl?: string;

  @ApiPropertyOptional({ description: 'شناسه کمپین بازاریابی مرتبط' })
  @IsOptional()
  @IsUUID('4', { message: 'شناسه کمپین نامعتبر است' })
  campaignId?: string;

  @ApiPropertyOptional({ description: 'ظرفیت وبینار (نفر)' })
  @IsOptional()
  @IsInt({ message: 'ظرفیت باید عدد صحیح باشد' })
  @Min(1, { message: 'ظرفیت نمی‌تواند کمتر از ۱ باشد' })
  capacity?: number;
}
