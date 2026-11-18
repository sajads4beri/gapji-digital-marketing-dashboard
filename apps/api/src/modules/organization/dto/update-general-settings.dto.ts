import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateGeneralSettingsDto {
  @ApiPropertyOptional({ description: 'نام رسمی سازمان', example: 'شرکت دیجیتال مارکتینگ گپ‌جی' })
  @IsString({ message: 'نام سازمان باید از نوع متنی باشد' })
  @MinLength(2, { message: 'نام سازمان باید حداقل ۲ کاراکتر باشد' })
  @MaxLength(255, { message: 'نام سازمان حداکثر می‌تواند ۲۵۵ کاراکتر باشد' })
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'آدرس نماد یا لوگوی سازمان', example: 'https://example.com/logo.png' })
  @IsString({ message: 'آدرس لوگو باید از نوع متنی باشد' })
  @MaxLength(500, { message: 'آدرس لوگو حداکثر می‌تواند ۵۰۰ کاراکتر باشد' })
  @IsOptional()
  logoUrl?: string;

  @ApiPropertyOptional({ description: 'واحد پول پیش‌فرض سازمان (تومان یا ریال)', example: 'TOMAN' })
  @IsString({ message: 'واحد پول باید از نوع متنی باشد' })
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ description: 'منطقه زمانی سازمان', example: 'Asia/Tehran' })
  @IsString({ message: 'منطقه زمانی باید از نوع متنی باشد' })
  @MaxLength(50, { message: 'منطقه زمانی حداکثر می‌تواند ۵۰ کاراکتر باشد' })
  @IsOptional()
  timezone?: string;
}
