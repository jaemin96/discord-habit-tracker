import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { WeeklyReportCommand } from './commands/weekly-report.command';
import { MonthlyReportCommand } from './commands/monthly-report.command';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService, WeeklyReportCommand, MonthlyReportCommand],
  exports: [AnalyticsService, WeeklyReportCommand, MonthlyReportCommand],
})
export class AnalyticsModule {}
