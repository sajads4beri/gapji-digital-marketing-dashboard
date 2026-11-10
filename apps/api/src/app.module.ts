import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configuration } from './config/configuration';
import { validateEnv } from './config/env.validation';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { AuthModule } from './modules/auth/auth.module';
import { LeadsModule } from './modules/leads/leads.module';
import { CostsModule } from './modules/costs/costs.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
      expandVariables: true,
    }),
    DatabaseModule,
    AuthModule,
    CampaignsModule,
    LeadsModule,
    CostsModule,
    DashboardModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
