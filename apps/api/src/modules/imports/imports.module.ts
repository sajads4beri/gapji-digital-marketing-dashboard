import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { LeadsModule } from '../leads/leads.module';
import { CostsModule } from '../costs/costs.module';
import { ImportsController } from './imports.controller';
import { ImportsService } from './imports.service';
import { LeadImportAdapter } from './adapters/lead-import.adapter';
import { CostImportAdapter } from './adapters/cost-import.adapter';

@Module({
  imports: [DatabaseModule, LeadsModule, CostsModule],
  controllers: [ImportsController],
  providers: [ImportsService, LeadImportAdapter, CostImportAdapter],
  exports: [ImportsService],
})
export class ImportsModule {}
