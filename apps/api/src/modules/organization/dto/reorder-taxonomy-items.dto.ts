import { IsArray, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReorderTaxonomyItemsDto {
  @ApiProperty({
    description: 'لیست مرتب‌شده شناسه‌های آیتم‌ها بر مبنای ترتیب جدید',
    example: ['11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222'],
  })
  @IsArray({ message: 'فهرست شناسه‌ها باید به صورت آرایه ارسال شود' })
  @IsString({ each: true, message: 'هر شناسه در آرایه باید متنی باشد' })
  @IsNotEmpty({ message: 'آرایه شناسه‌ها نمی‌تواند خالی باشد' })
  orderedIds: string[];
}
