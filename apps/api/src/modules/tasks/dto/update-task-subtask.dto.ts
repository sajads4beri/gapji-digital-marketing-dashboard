import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTaskSubtaskDto {
  @ApiPropertyOptional({ description: 'عنوان زیرتسک' })
  @IsString({ message: 'عنوان زیرتسک باید متن باشد' })
  @MaxLength(255, { message: 'عنوان زیرتسک حداکثر ۲۵۵ کاراکتر است' })
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: 'وضعیت تکمیل زیرتسک' })
  @IsBoolean({ message: 'وضعیت تکمیل باید بولی باشد' })
  @IsOptional()
  isCompleted?: boolean;
}
