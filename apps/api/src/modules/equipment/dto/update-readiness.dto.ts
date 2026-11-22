import { IsEnum, IsOptional, IsUUID, IsDateString, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EquipmentReadinessStatus } from '@prisma/client';

export class UpdateReadinessStatusDto {
  @ApiPropertyOptional({ enum: EquipmentReadinessStatus, description: 'وضعیت آمادگی' })
  @IsOptional()
  @IsEnum(EquipmentReadinessStatus)
  status?: EquipmentReadinessStatus;

  @ApiPropertyOptional({ description: 'شناسه مسئول تهیه' })
  @IsOptional()
  @IsUUID('4')
  responsibleId?: string;

  @ApiPropertyOptional({ description: 'مهلت تهیه' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'یادداشت یا توضیحات پیگیری' })
  @IsOptional()
  @IsString()
  notes?: string;
}
