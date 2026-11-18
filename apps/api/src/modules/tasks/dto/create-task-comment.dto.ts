import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTaskCommentDto {
  @ApiProperty({
    example: 'طرح‌های اولیه در درایو بارگذاری شدند، لطفاً بررسی شود.',
    description: 'متن دیدگاه / کامنت',
  })
  @IsString({ message: 'متن دیدگاه باید متن باشد' })
  @IsNotEmpty({ message: 'متن دیدگاه الزامی است' })
  content: string;
}
