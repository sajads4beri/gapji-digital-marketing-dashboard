import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ValidateFormulaDto {
  @ApiProperty({ description: 'متن فرمول جهت ارزیابی نحوی', example: '(cost / lead) * 100' })
  @IsString({ message: 'فرمول باید رشته متنی باشد.' })
  @IsNotEmpty({ message: 'فرمول نمی‌تواند خالی باشد.' })
  formula: string;

  @ApiPropertyOptional({ description: 'شناسه کمپین اختیاری جهت محاسبه پیش‌نمایش زنده' })
  @IsOptional()
  @IsUUID('4', { message: 'شناسه کمپین باید UUID معتبر باشد.' })
  campaignId?: string;
}
