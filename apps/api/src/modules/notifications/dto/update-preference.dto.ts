import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EventPreferenceItemDto {
  @ApiProperty({ description: 'شناسه رویداد', example: 'lead_assigned' })
  @IsString()
  @IsNotEmpty()
  eventType: string;

  @ApiPropertyOptional({ description: 'فعال بودن اعلان درون‌برنامه‌ای' })
  @IsOptional()
  @IsBoolean()
  inAppEnabled?: boolean;

  @ApiPropertyOptional({ description: 'فعال بودن ارسال ایمیل' })
  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;
}

export class UpdateNotificationPreferencesDto {
  @ApiProperty({ type: [EventPreferenceItemDto], description: 'فهرست تنظیمات کانال‌های دریافت رویدادها' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventPreferenceItemDto)
  preferences: EventPreferenceItemDto[];
}
