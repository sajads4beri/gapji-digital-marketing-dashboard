import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus } from '@prisma/client';

export class UpdateTaskStatusDto {
  @ApiProperty({
    enum: TaskStatus,
    description: 'وضعیت جدید تسک',
    example: TaskStatus.in_progress,
  })
  @IsEnum(TaskStatus, { message: 'وضعیت تسک نامعتبر است' })
  @IsNotEmpty({ message: 'وضعیت جدید الزامی است' })
  status: TaskStatus;
}
