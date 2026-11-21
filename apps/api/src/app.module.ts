import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configuration } from './config/configuration';
import { validateEnv } from './config/env.validation';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { AuthModule } from './modules/auth/auth.module';
import { LeadsModule } from './modules/leads/leads.module';
import { CostsModule } from './modules/costs/costs.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { UsersModule } from './modules/users/users.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { ImportsModule } from './modules/imports/imports.module';
import { PlatformsModule } from './modules/platforms/platforms.module';
import { AudiencesModule } from './modules/audiences/audiences.module';
import { KpisModule } from './modules/kpis/kpis.module';
import { LandingModule } from './modules/landing/landing.module';
import { SmsModule } from './modules/sms/sms.module';
import { WebinarsModule } from './modules/webinars/webinars.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { SearchModule } from './modules/search/search.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { EquipmentModule } from './modules/equipment/equipment.module';
import { MeetingsModule } from './modules/meetings/meetings.module';
import { SopsModule } from './modules/sops/sops.module';
import { LearningModule } from './modules/learning/learning.module';
import { IdeasModule } from './modules/ideas/ideas.module';
import { ActivityModule } from './modules/activity/activity.module';
import { WordpressModule } from './modules/wordpress/wordpress.module';
import { HealthModule } from './modules/health/health.module';
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
    UsersModule,
    TasksModule,
    OrganizationModule,
    ImportsModule,
    PlatformsModule,
    AudiencesModule,
    KpisModule,
    LandingModule,
    SmsModule,
    WebinarsModule,
    CalendarModule,
    SearchModule,
    NotificationsModule,
    EquipmentModule,
    MeetingsModule,
    SopsModule,
    LearningModule,
    IdeasModule,
    ActivityModule,
    WordpressModule,
    HealthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
