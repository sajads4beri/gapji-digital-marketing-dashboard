import { IsBoolean, IsIn, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PlatformInputDefinitionDto {
  @ApiProperty({ description: 'نام نمایشی فیلد ورودی', example: 'مبلغ هزینه' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'کلید یکتای فیلد', example: 'spend' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ description: 'نوع داده فیلد', enum: ['text', 'number', 'date', 'boolean'], example: 'number' })
  @IsIn(['text', 'number', 'date', 'boolean'])
  dataType: 'text' | 'number' | 'date' | 'boolean';

  @ApiProperty({ description: 'آیا ورود این فیلد اجباری است؟', example: true })
  @IsBoolean()
  isRequired: boolean;
}
