import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  IsNumber,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const VALID_LEAD_STATUSES = [
  'new',
  'in_progress',
  'qualified',
  'proposal',
  'won',
  'lost',
] as const;

export type ValidLeadStatus = (typeof VALID_LEAD_STATUSES)[number];

export class UpdateLeadStatusDto {
  @ApiProperty({
    example: 'in_progress',
    enum: VALID_LEAD_STATUSES,
    description: 'وضعیت جدید لید در قیف فروش',
  })
  @IsString({ message: 'وضعیت لید باید رشته متنی باشد' })
  @IsNotEmpty({ message: 'وضعیت لید الزامی است' })
  @IsIn(VALID_LEAD_STATUSES, {
    message: 'وضعیت لید نامعتبر است. وضعیت‌های مجاز: new, in_progress, qualified, proposal, won, lost',
  })
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
