import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AcceptInvitationDto {
  @ApiProperty({ description: 'توکن یک‌بارمصرف دعوت‌نامه', example: 'e7f8a9...' })
  @IsString({ message: 'توکن باید رشته متنی باشد' })
  @IsNotEmpty({ message: 'توکن دعوت الزامی است' })
  token: string;

  @ApiPropertyOptional({ description: 'کلمه عبور انتخابی کاربر جدید (حداقل ۸ نویسه)', example: 'SecurePassword123!' })
  @IsString()
  @IsOptional()
  @MinLength(8, { message: 'کلمه عبور باید حداقل ۸ کاراکتر باشد' })
  password?: string;

  @ApiPropertyOptional({ description: 'نام و نام خانوادگی کاربر', example: 'علیرضا حسینی' })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({ description: 'شماره تماس کاربر', example: '09121234567' })
  @IsString()
  @IsOptional()
  mobile?: string;
}
