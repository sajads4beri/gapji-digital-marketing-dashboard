import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TransferAdminDto {
  @ApiProperty({ description: 'شناسه کاربری عضو جایگزین جهت ارتقا به نقش ادمین', example: '10000000-0000-0000-0000-000000000002' })
  @IsUUID('4', { message: 'شناسه کاربر جایگزین باید یک UUID معتبر باشد' })
  @IsNotEmpty({ message: 'شناسه کاربر جایگزین الزامی است' })
  replacementUserId: string;

  @ApiPropertyOptional({ description: 'کلمه عبور ادمین فعلی جهت تأیید هویت' })
  @IsString()
  @IsOptional()
  currentAdminPassword?: string;
}
