import { IsUUID, IsOptional, IsDateString, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApplyEquipmentTemplateDto {
  @ApiProperty({ description: 'شناسه قالب تجهیزات' })
  @IsUUID('4', { message: 'شناسه قالب باید UUID معتبر باشد' })
  @IsNotEmpty()
  templateId: string;

  @ApiPropertyOptional({ description: 'شناسه کمپین مرتبط' })
  @IsOptional()
  @IsUUID('4')
  campaignId?: string;

  @ApiPropertyOptional({ description: 'شناسه وبینار مرتبط' })
  @IsOptional()
  @IsUUID('4')
  webinarId?: string;

  @ApiPropertyOptional({ description: 'مهلت تهیه تجهیزات' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'شناسه مسئول تهیه' })
  @IsOptional()
  @IsUUID('4')
  responsibleId?: string;
}
