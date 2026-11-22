import { IsString, IsNotEmpty, IsOptional, IsUUID, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateActionItemDto {
  @ApiProperty({ description: 'شرح مصوبه یا اقدام توافق‌شده', example: 'تهیه نسخه نهایی بنرهای کمپین نوروز' })
  @IsString()
  @IsNotEmpty({ message: 'شرح اقدام الزامی است' })
  description: string;

  @ApiPropertyOptional({ description: 'شناسه مسئول انجام مصوبه' })
  @IsOptional()
  @IsUUID('4', { message: 'شناسه مسئول باید UUID معتبر باشد' })
  assigneeId?: string;

  @ApiPropertyOptional({ description: 'مهلت انجام مصوبه' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
