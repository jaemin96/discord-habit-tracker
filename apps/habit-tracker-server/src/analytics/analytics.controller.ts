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
    @Query('userId') userId: string,
    @Query('limit') limit: string,
    @Query('offset') offset: string,
  ) {
    return this.analyticsService.getCheckinList(userId, Number(limit) || 50, Number(offset) || 0);
  }

  @Get('users')
  async users() {
    return this.analyticsService.getUserList();
  }
}
