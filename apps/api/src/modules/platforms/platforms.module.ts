import { Module } from '@nestjs/common';
import { PlatformsController } from './platforms.controller';
import { PlatformsService } from './platforms.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [PlatformsController],
  providers: [PlatformsService],
  exports: [PlatformsService],
})
export class PlatformsModule {}
