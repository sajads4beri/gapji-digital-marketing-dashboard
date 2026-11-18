import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class ChangeRoleDto {
  @ApiPropertyOptional({ description: 'نقش سازمانی جدید', enum: Role, example: Role.campaign_manager })
  @IsEnum(Role, { message: 'نقش سازمانی نامعتبر است' })
  @IsOptional()
  role?: Role;

  @ApiPropertyOptional({ description: 'نقش سازمانی جدید (نام مستعار)', enum: Role, example: Role.campaign_manager })
  @IsEnum(Role, { message: 'نقش سازمانی نامعتبر است' })
  @IsOptional()
  newRole?: Role;
}
