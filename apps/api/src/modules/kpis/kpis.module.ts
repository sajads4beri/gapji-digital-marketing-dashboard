import { Module } from '@nestjs/common';
import { KpisController } from './kpis.controller';
import { KpisService } from './kpis.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [KpisController],
  providers: [KpisService],
  exports: [KpisService],
})
export class KpisModule {}
