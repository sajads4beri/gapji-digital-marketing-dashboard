import { Module } from '@nestjs/common';
import { SopsService } from './sops.service';
import { SopsController } from './sops.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [SopsController],
  providers: [SopsService],
  exports: [SopsService],
})
export class SopsModule {}
