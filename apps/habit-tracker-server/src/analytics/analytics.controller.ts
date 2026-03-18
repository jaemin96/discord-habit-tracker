import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('api/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('weekly')
  async weekly(@Query('userId') userId: string) {
    return this.analyticsService.getWeeklyStats(userId);
  }

  @Get('monthly')
  async monthly(@Query('userId') userId: string) {
    return this.analyticsService.getMonthlyStats(userId);
  }
}
