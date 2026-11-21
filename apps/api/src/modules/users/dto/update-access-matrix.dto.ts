import { IsObject, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAccessMatrixDto {
  @ApiProperty({
    description: 'ماتریس دسترسی نقش‌ها به عملیات سیستم',
    example: {
      admin: { dashboard_view: true, campaigns_manage: true },
      marketing_manager: { dashboard_view: true, campaigns_manage: true },
    },
  })
  @IsObject()
  @IsNotEmpty({ message: 'داده‌های ماتریس دسترسی الزامی است' })
  matrix: Record<string, Record<string, boolean>>;
}
