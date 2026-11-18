import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty({ description: 'شناسه منحصر‌به‌فرد کاربر' })
  id: string;

  @ApiPropertyOptional({ description: 'شناسه عضویت کاربر در سازمان جاری' })
  membershipId?: string;

  @ApiProperty({ description: 'نام و نام خانوادگی' })
  fullName: string;

  @ApiProperty({ description: 'نشانی ایمیل' })
  email: string;

  @ApiPropertyOptional({ description: 'شماره تماس' })
  phoneNumber?: string | null;

  @ApiProperty({ description: 'نقش سازمانی', enum: Role })
  role: Role;

  @ApiProperty({ description: 'وضعیت حساب (active | invited | disabled)' })
  status: 'active' | 'invited' | 'disabled';

  @ApiPropertyOptional({ description: 'نشانی آواتار کاربر' })
  avatarUrl?: string | null;

  @ApiPropertyOptional({ description: 'زمان آخرین ورود (ISO 8601)' })
  lastLoginAt?: string | null;

  @ApiPropertyOptional({ description: 'زمان ارسال دعوت‌نامه (ISO 8601)' })
  invitedAt?: string | null;

  @ApiProperty({ description: 'زمان ایجاد رکورد (ISO 8601)' })
  createdAt: string;

  @ApiProperty({ description: 'زمان آخرین به‌روزرسانی (ISO 8601)' })
  updatedAt: string;
}

export class InviteUserResponseDto {
  @ApiProperty({ description: 'مشخصات کاربر ایجاد یا دعوت‌شده', type: UserResponseDto })
  user: UserResponseDto;

  @ApiProperty({ description: 'پیام نتیجه عملیات' })
  message: string;

  @ApiPropertyOptional({ description: 'توکن یک‌بارمصرف دعوت (جهت تست و ارسال)' })
  invitationToken?: string;
}

export class ResendInvitationResponseDto {
  @ApiProperty({ description: 'وضعیت موفقیت' })
  success: boolean;

  @ApiProperty({ description: 'زمان ارسال مجدد' })
  sentAt: string;

  @ApiProperty({ description: 'پیام اطلاع‌رسانی' })
  message: string;

  @ApiPropertyOptional({ description: 'توکن یک‌بارمصرف جدید' })
  invitationToken?: string;
}
