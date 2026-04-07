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

  @Get('overview')
  async overview() {
    return this.analyticsService.getOverviewStats();
  }

  @Get('checkins')
  async checkins(
    @Query('query') query: string,
    @Query('limit') limit: string,
    @Query('offset') offset: string,
  ) {
    return this.analyticsService.getCheckinList(query || undefined, Number(limit) || 50, Number(offset) || 0);
  }

  @Get('users')
  async users() {
    return this.analyticsService.getUserList();
  }

  @Get('range')
  async range(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return this.analyticsService.getRangeStats(start, end);
  }

  @Get('report-monthly-trend')
  async reportMonthlyTrend() {
    return this.analyticsService.getReportMonthlyTrend();
  }
}
