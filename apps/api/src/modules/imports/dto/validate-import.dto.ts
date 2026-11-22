import { IsNotEmpty, IsIn, IsObject, IsArray, ArrayMaxSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateImportDto {
  @ApiProperty({ description: 'نوع داده جهت ایمپورت', enum: ['leads', 'costs'], example: 'leads' })
  @IsNotEmpty({ message: 'نوع داده الزامی است' })
  @IsIn(['leads', 'costs'], { message: 'نوع داده باید leads یا costs باشد' })
  dataType: 'leads' | 'costs';

  @ApiProperty({
    description: 'نگاشت ستون‌های فایل ورودی به فیلدهای سامانه',
    example: { 'نام و نام خانوادگی': 'fullName', 'شماره همراه': 'mobile' },
  })
  @IsNotEmpty({ message: 'نگاشت ستون‌ها الزامی است' })
  @IsObject({ message: 'ساختار نگاشت باید یک شیء معتبر باشد' })
  mapping: Record<string, string>;

  @ApiProperty({
    description: 'سطرهای خام یا نگاشت‌شده استخراج شده از فایل',
    example: [{ 'نام و نام خانوادگی': 'علی حسینی', 'شماره همراه': '09123456789' }],
  })
  @IsNotEmpty({ message: 'لیست سطرها الزامی است' })
  @IsArray({ message: 'سطرها باید به صورت آرایه ارسال شوند' })
  @ArrayMaxSize(5000, { message: 'تعداد سطرهای ارسالی در هر مرحله اعتبارسنجی حداکثر ۵۰۰۰ سطر است' })
  rows: Record<string, any>[];
}
