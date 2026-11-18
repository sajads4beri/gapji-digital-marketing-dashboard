import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTaskSubtaskDto {
  @ApiProperty({
    example: 'آماده‌سازی فایل‌های گرافیکی اولیه',
    description: 'عنوان زیرتسک',
  })
  @IsString({ message: 'عنوان زیرتسک باید متن باشد' })
  @IsNotEmpty({ message: 'عنوان زیرتسک الزامی است' })
  @MaxLength(255, { message: 'عنوان زیرتسک حداکثر ۲۵۵ کاراکتر است' })
  title: string;
}
