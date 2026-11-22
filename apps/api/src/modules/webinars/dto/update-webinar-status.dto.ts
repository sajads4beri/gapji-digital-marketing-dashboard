import { IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateWebinarStatusDto {
  @ApiProperty({
    description: 'وضعیت جدید وبینار',
    enum: ['draft', 'scheduled', 'live', 'completed', 'cancelled'],
  })
  @IsString()
  @IsIn(['draft', 'scheduled', 'live', 'completed', 'cancelled'], {
    message: 'وضعیت نامعتبر است. مقادیر مجاز: draft, scheduled, live, completed, cancelled',
  })
  status: string;
}
