import { IsNotEmpty, IsString, IsIn, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InspectImportDto {
  @ApiProperty({ description: 'نوع داده جهت ایمپورت', enum: ['leads', 'costs'], example: 'leads' })
  @IsNotEmpty({ message: 'نوع داده الزامی است' })
  @IsIn(['leads', 'costs'], { message: 'نوع داده باید leads یا costs باشد' })
  dataType: 'leads' | 'costs';

  @ApiProperty({ description: 'محتوای متنی فایل CSV', example: 'نام,موبایل\nعلی رضایی,09121112233' })
  @IsNotEmpty({ message: 'محتوای فایل CSV الزامی است' })
  @IsString({ message: 'محتوای CSV باید به صورت رشته متنی باشد' })
  @MaxLength(10 * 1024 * 1024, { message: 'حجم فایل CSV بیش از حد مجاز (حداکثر ۱۰ مگابایت) است' })
  csvContent: string;
}
