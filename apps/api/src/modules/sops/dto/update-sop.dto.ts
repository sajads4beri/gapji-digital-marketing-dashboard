import { IsString, IsOptional, IsEnum, IsUUID, IsBoolean } from 'class-validator';
import { SopStatus } from '@prisma/client';

export class UpdateSopDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsEnum(SopStatus)
  status?: SopStatus;

  @IsOptional()
  @IsUUID()
  approverId?: string;

  @IsOptional()
  @IsString()
  changeSummary?: string;

  @IsOptional()
  @IsBoolean()
  bumpMajor?: boolean;
}
