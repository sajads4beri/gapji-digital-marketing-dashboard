import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  Matches,
  IsDateString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class CreateLeadDto {
  @ApiProperty({
    example: 'امیررضا علوی',
    description: 'نام و نام خانوادگی لید',
  })
  @IsString({ message: 'نام و نام خانوادگی باید متن باشد' })
  @IsNotEmpty({ message: 'نام و نام خانوادگی الزامی است' })
  @MinLength(2, { message: 'نام و نام خانوادگی باید حداقل ۲ کاراکتر باشد' })
  @MaxLength(255, { message: 'نام و نام خانوادگی حداکثر می‌تواند ۲۵۵ کاراکتر باشد' })
  fullName: string;

  @ApiProperty({
    example: '09123456789',
    description: 'شماره تلفن همراه لید (پشتیبانی از ارقام فارسی/انگلیسی و فرمت استاندارد ایران)',
  })
  @IsString({ message: 'شماره موبایل باید رشته متنی باشد' })
  @IsNotEmpty({ message: 'شماره موبایل الزامی است' })
  @MaxLength(30, { message: 'شماره موبایل بیش از حد مجاز است' })
  mobile: string;

  @ApiPropertyOptional({
    example: 'reza@example.com',
    description: 'آدرس پست الکترونیکی لید',
  })
  @IsEmail({}, { message: 'فرمت ایمیل نامعتبر است' })
  @IsOptional()
  @MaxLength(255, { message: 'ایمیل حداکثر می‌تواند ۲۵۵ کاراکتر باشد' })
  email?: string;

  @ApiPropertyOptional({
    example: 'تهران',
    description: 'شهر محل سکونت یا فعالیت لید',
  })
  @IsString({ message: 'شهر باید متن باشد' })
  @IsOptional()
  @MaxLength(100, { message: 'نام شهر حداکثر می‌تواند ۱۰۰ کاراکتر باشد' })
  city?: string;

  @ApiPropertyOptional({
    example: 'manual',
    description: 'منبع جذب لید (پیش‌فرض manual/دستی)',
  })
  @IsString({ message: 'منبع جذب باید متن باشد' })
  @IsOptional()
  @MaxLength(100, { message: 'منبع جذب حداکثر ۱۰۰ کاراکتر است' })
  source?: string;

  @ApiPropertyOptional({
    example: '00000000-0000-0000-0000-000000000001',
    description: 'شناسه کمپین بازاریابی مرتبط',
  })
  @Matches(UUID_REGEX, { message: 'شناسه کمپین باید یک UUID معتبر باشد' })
  @IsOptional()
  campaignId?: string;

  @ApiPropertyOptional({
    example: '10000000-0000-0000-0000-000000000004',
    description: 'شناسه کارشناس فروش تخصیص‌یافته',
  })
  @Matches(UUID_REGEX, { message: 'شناسه کارشناس باید یک UUID معتبر باشد' })
  @IsOptional()
  assignedToId?: string;

  @ApiPropertyOptional({
    example: '2026-11-15T10:00:00.000Z',
    description: 'تاریخ و زمان پیگیری بعدی به صورت رشته ISO',
  })
  @IsDateString({}, { message: 'فرمت تاریخ پیگیری نامعتبر است' })
  @IsOptional()
  nextFollowUpAt?: string;

  @ApiPropertyOptional({
    example: 'تماس جهت معرفی پکیج سازمانی',
    description: 'یادداشت یا دستورالعمل پیگیری بعدی',
  })
  @IsString({ message: 'یادداشت پیگیری باید متن باشد' })
  @IsOptional()
  @MaxLength(500, { message: 'یادداشت پیگیری حداکثر ۵۰۰ کاراکتر است' })
  nextFollowUpNote?: string;

  @ApiPropertyOptional({
    example: 'new',
    description: 'کلید وضعیت لید (پیش‌فرض new)',
  })
  @IsString({ message: 'کلید وضعیت باید متن باشد' })
  @IsOptional()
  @MaxLength(100, { message: 'کلید وضعیت حداکثر ۱۰۰ کاراکتر است' })
  statusKey?: string;
}
