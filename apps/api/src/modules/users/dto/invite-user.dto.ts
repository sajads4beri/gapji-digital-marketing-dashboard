import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class InviteUserDto {
  @ApiProperty({ description: 'نشانی ایمیل کاربر جهت ارسال دعوت‌نامه', example: 'colleague@example.com' })
  @IsEmail({}, { message: 'فرمت نشانی ایمیل نامعتبر است' })
  @IsNotEmpty({ message: 'نشانی ایمیل الزامی است' })
  email: string;

  @ApiProperty({ description: 'نقش سازمانی تعیین‌شده', enum: Role, example: Role.sales_agent })
  @IsEnum(Role, { message: 'نقش سازمانی نامعتبر است' })
  @IsNotEmpty({ message: 'تعیین نقش الزامی است' })
  role: Role;

  @ApiPropertyOptional({ description: 'نام و نام خانوادگی کاربر', example: 'علی رضایی' })
  @IsString({ message: 'نام باید از نوع متنی باشد' })
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({ description: 'شماره تماس کاربر', example: '09121234567' })
  @IsString({ message: 'شماره تماس باید متنی باشد' })
  @IsOptional()
  phoneNumber?: string;
}
