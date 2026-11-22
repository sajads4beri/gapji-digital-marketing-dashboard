import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class LogActivityDto {
  @IsString()
  @IsNotEmpty()
  action: string;

  @IsString()
  @IsNotEmpty()
  entityType: string;

  @IsOptional()
  @IsUUID()
  entityId?: string;

  @IsOptional()
  @IsString()
  details?: string;
}
