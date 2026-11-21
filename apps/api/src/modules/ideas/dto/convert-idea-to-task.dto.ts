import { IsString, IsOptional, IsUUID, IsEnum } from 'class-validator';
import { TaskPriority } from '@prisma/client';

export class ConvertIdeaToTaskDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @IsOptional()
  @IsString()
  dueDate?: string;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;
}
