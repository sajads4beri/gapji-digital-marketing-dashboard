import { IsOptional, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class UpdateTaskAssigneeDto {
  @ApiPropertyOptional({
    description: 'شناسه کاربر مسئول (در صورت ارسال null یا خالی، مسئول حذف می‌شود)',
    example: '10000000-0000-0000-0000-000000000003',
  })
  @Matches(UUID_REGEX, { message: 'شناسه مسئول نامعتبر است' })
  @IsOptional()
  assigneeId?: string | null;
}
