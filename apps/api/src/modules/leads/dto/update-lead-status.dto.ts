import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateLeadStatusDto {
  @ApiProperty({
    example: 'in_progress',
    description: 'شناسه یکتا (UUID) یا کلید وضعیت جدید لید در پایپ‌لاین فروش',
  })
  @IsString({ message: 'وضعیت لید باید رشته متنی باشد' })
  @IsNotEmpty({ message: 'وضعیت لید الزامی است' })
  @MaxLength(100, { message: 'شناسه یا کلید وضعیت حداکثر می‌تواند ۱۰۰ کاراکتر باشد' })
  status: string;

  @ApiPropertyOptional({
    example: 15000000,
    description: 'ارزش نهایی معامله (در صورت تبدیل به مشتری/won) به تومان',
  })
  @IsOptional()
  @IsNumber({}, { message: 'ارزش معامله باید مقدار عددی باشد' })
  @Min(0, { message: 'ارزش معامله نمی‌تواند منفی باشد' })
  dealValue?: number;

  @ApiPropertyOptional({
    example: 'محدودیت بودجه در این فصل مالی',
    description: 'علت انصراف یا رد لید (در صورت انتقال به lost)',
  })
  @IsOptional()
  @IsString({ message: 'علت انصراف باید رشته متنی باشد' })
  @MaxLength(255, { message: 'علت انصراف حداکثر می‌تواند ۲۵۵ کاراکتر باشد' })
  lostReason?: string;

  @ApiPropertyOptional({
    example: 'مشتری درخواست تخفیف بیشتر داشت',
    description: 'یادداشت تکمیلی تغییر وضعیت',
  })
  @IsOptional()
  @IsString({ message: 'یادداشت باید رشته متنی باشد' })
  @MaxLength(500, { message: 'یادداشت حداکثر می‌تواند ۵۰۰ کاراکتر باشد' })
  note?: string;
}
