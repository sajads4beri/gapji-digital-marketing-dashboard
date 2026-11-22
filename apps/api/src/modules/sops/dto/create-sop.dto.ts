import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { SopStatus } from '@prisma/client';

export class CreateSopDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsEnum(SopStatus)
  status?: SopStatus;

  @IsOptional()
  @IsUUID()
  approverId?: string;
}
