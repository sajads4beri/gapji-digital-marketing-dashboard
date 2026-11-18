import { IsString, IsNotEmpty, IsOptional, IsUUID, IsNumber, Min, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSmsCampaignDto {
  @ApiProperty({ description: 'عنوان یا نام کمپین پیامکی' })
  @IsString()
  @IsNotEmpty({ message: 'عنوان کمپین پیامکی الزامی است' })
  name: string;

  @ApiProperty({ description: 'شماره خط ارسال‌کننده (سرشماره)' })
  @IsString()
  @IsNotEmpty({ message: 'شماره فرستنده الزامی است' })
  senderNumber: string;

  @ApiProperty({ description: 'متن پیامک' })
  @IsString()
  @IsNotEmpty({ message: 'متن پیامک الزامی است' })
  messageText: string;

  @ApiPropertyOptional({ description: 'شناسه کمپین بازاریابی مرتبط' })
  @IsOptional()
  @IsUUID('4', { message: 'شناسه کمپین نامعتبر است' })
  campaignId?: string;

  @ApiPropertyOptional({ description: 'هزینه کل ارسال (تومان)' })
  @IsOptional()
  @IsNumber({}, { message: 'هزینه باید عدد باشد' })
  @Min(0, { message: 'هزینه نمی‌تواند منفی باشد' })
  costAmount?: number;

  @ApiPropertyOptional({ description: 'زمان‌بندی ارسال' })
  @IsOptional()
  @IsDateString({}, { message: 'فرمت تاریخ نامعتبر است' })
  scheduledAt?: string;
}
