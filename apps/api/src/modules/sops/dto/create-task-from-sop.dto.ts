import { IsString, IsOptional, IsUUID, IsEnum, IsBoolean } from 'class-validator';
import { TaskPriority } from '@prisma/client';

export class CreateTaskFromSopDto {
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

  @IsOptional()
  @IsBoolean()
  parseChecklistAsSubtasks?: boolean;
}
