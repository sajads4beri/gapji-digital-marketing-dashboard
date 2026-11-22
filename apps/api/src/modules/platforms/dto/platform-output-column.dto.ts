import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PlatformOutputColumnDto {
  @ApiProperty({ description: 'شناسه یا کلید ستون گزارش', example: 'cost' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ description: 'عنوان نمایشی ستون در گزارش', example: 'هزینه کل' })
  @IsString()
  @IsNotEmpty()
  label: string;
}
