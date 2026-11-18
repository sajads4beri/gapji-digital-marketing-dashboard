import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetTasksFilterDto {
  @ApiPropertyOptional({
    description: 'دامنه نمایش تسک‌ها (my: تسک‌های تخصیص‌یافته به من، team: تمام تسک‌های سازمان)',
    example: 'team',
  })
  @IsString()
  @IsOptional()
  scope?: 'my' | 'team';

  @ApiPropertyOptional({
    description: 'فیلتر وضعیت (تکی یا با کاما جدا شده: todo,in_progress یا overdue)',
    example: 'todo,in_progress',
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({
    description: 'فیلتر اولویت (تکی یا با کاما جدا شده: urgent,high)',
  })
  @IsString()
  @IsOptional()
  priority?: string;

  @ApiPropertyOptional({
    description: 'شناسه مسئول (یا unassigned جهت تسک‌های بدون مسئول)',
  })
  @IsString()
  @IsOptional()
  assigneeId?: string;

  @ApiPropertyOptional({
    description: 'نوع موجودیت مرتبط (campaign, webinar, lead, ...)',
  })
  @IsString()
  @IsOptional()
  relatedType?: string;

  @ApiPropertyOptional({
    description: 'شناسه موجودیت مرتبط',
  })
  @IsString()
  @IsOptional()
  relatedId?: string;

  @ApiPropertyOptional({
    description: 'جستجوی متنی در عنوان و توضیحات تسک',
  })
  @IsString()
  @IsOptional()
  search?: string;
}
