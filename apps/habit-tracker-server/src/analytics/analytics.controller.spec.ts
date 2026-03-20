import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

const mockAnalyticsService = {
  getWeeklyStats: jest.fn(),
  getMonthlyStats: jest.fn(),
  getOverviewStats: jest.fn(),
  getCheckinList: jest.fn(),
  getUserList: jest.fn(),
  getReportMonthlyTrend: jest.fn(),
};

describe('AnalyticsController', () => {
  let controller: AnalyticsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [{ provide: AnalyticsService, useValue: mockAnalyticsService }],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
    jest.clearAllMocks();
  });

  it('weekly - userId 전달', async () => {
    mockAnalyticsService.getWeeklyStats.mockResolvedValue({ total: 5 });
    const result = await controller.weekly('user1');
    expect(mockAnalyticsService.getWeeklyStats).toHaveBeenCalledWith('user1');
    expect(result).toEqual({ total: 5 });
  });

  it('monthly - userId 전달', async () => {
    mockAnalyticsService.getMonthlyStats.mockResolvedValue({ total: 20 });
    await controller.monthly('user1');
    expect(mockAnalyticsService.getMonthlyStats).toHaveBeenCalledWith('user1');
  });

  it('overview - 파라미터 없음', async () => {
    mockAnalyticsService.getOverviewStats.mockResolvedValue({ today: 3 });
    await controller.overview();
    expect(mockAnalyticsService.getOverviewStats).toHaveBeenCalled();
  });

  it('checkins - 기본값(limit=50, offset=0) 적용', async () => {
    mockAnalyticsService.getCheckinList.mockResolvedValue({ checkins: [], total: 0 });
    await controller.checkins(undefined as any, undefined as any, undefined as any);
    expect(mockAnalyticsService.getCheckinList).toHaveBeenCalledWith(undefined, 50, 0);
  });

  it('checkins - query, limit, offset 파싱', async () => {
    mockAnalyticsService.getCheckinList.mockResolvedValue({ checkins: [] });
    await controller.checkins('testuser', '10', '20');
    expect(mockAnalyticsService.getCheckinList).toHaveBeenCalledWith('testuser', 10, 20);
  });

  it('checkins - 빈 query는 undefined로 처리', async () => {
    mockAnalyticsService.getCheckinList.mockResolvedValue({ checkins: [] });
    await controller.checkins('' as any, '10', '0');
    expect(mockAnalyticsService.getCheckinList).toHaveBeenCalledWith(undefined, 10, 0);
  });

  it('users - 서비스 호출', async () => {
    mockAnalyticsService.getUserList.mockResolvedValue([]);
    await controller.users();
    expect(mockAnalyticsService.getUserList).toHaveBeenCalled();
  });

  it('reportMonthlyTrend - 서비스 호출', async () => {
    mockAnalyticsService.getReportMonthlyTrend.mockResolvedValue([]);
    await controller.reportMonthlyTrend();
    expect(mockAnalyticsService.getReportMonthlyTrend).toHaveBeenCalled();
  });
});
