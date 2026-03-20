import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../database/prisma.service';

const mockPrisma = {
  statisticsCache: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
  },
  checkin: {
    findMany: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  discordUser: {
    findMany: jest.fn(),
  },
};

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    jest.clearAllMocks();
  });

  // ── 캐시 ────────────────────────────────────────────────

  describe('cache', () => {
    it('캐시 히트 시 DB 조회 없이 반환', async () => {
      const cachedData = {
        period: 'weekly',
        startDate: new Date(),
        endDate: new Date(),
        total: 5,
        camera_out: 2,
        work_disconnect: 1,
        workout: 1,
        report: { daily: 1, weekly: 0, monthly: 0, total: 1 },
      };
      // 캐시가 방금 생성된 것처럼 (TTL 내)
      mockPrisma.statisticsCache.findUnique.mockResolvedValue({
        startDate: new Date(), // 현재 시각 = 0ms 경과
        data: cachedData,
      });

      const result = await service.getWeeklyStats('user1');
      expect(result).toEqual(cachedData);
      expect(mockPrisma.checkin.findMany).not.toHaveBeenCalled();
    });

    it('캐시 만료(30분 초과) 시 DB 재조회', async () => {
      const expiredDate = new Date(Date.now() - 31 * 60 * 1000); // 31분 전
      mockPrisma.statisticsCache.findUnique.mockResolvedValue({
        startDate: expiredDate,
        data: {},
      });
      mockPrisma.checkin.findMany.mockResolvedValue([]);
      mockPrisma.statisticsCache.upsert.mockResolvedValue({});

      await service.getWeeklyStats('user1');
      expect(mockPrisma.checkin.findMany).toHaveBeenCalled();
    });

    it('캐시 없으면 DB 조회 후 캐시 저장', async () => {
      mockPrisma.statisticsCache.findUnique.mockResolvedValue(null);
      mockPrisma.checkin.findMany.mockResolvedValue([]);
      mockPrisma.statisticsCache.upsert.mockResolvedValue({});

      await service.getWeeklyStats('user1');
      expect(mockPrisma.checkin.findMany).toHaveBeenCalled();
      expect(mockPrisma.statisticsCache.upsert).toHaveBeenCalled();
    });
  });

  // ── getWeeklyStats ───────────────────────────────────────

  describe('getWeeklyStats', () => {
    beforeEach(() => {
      mockPrisma.statisticsCache.findUnique.mockResolvedValue(null);
      mockPrisma.statisticsCache.upsert.mockResolvedValue({});
    });

    it('타입별 집계 반환', async () => {
      mockPrisma.checkin.findMany.mockResolvedValue([
        { type: 'camera_out', customFields: null },
        { type: 'workout', customFields: null },
        { type: 'report', customFields: { reportType: 'daily' } },
      ]);

      const result = await service.getWeeklyStats('user1');
      expect(result.total).toBe(3);
      expect(result.camera_out).toBe(1);
      expect(result.workout).toBe(1);
      expect(result.report.daily).toBe(1);
      expect(result.period).toBe('weekly');
    });

    it('체크인 없으면 0 반환', async () => {
      mockPrisma.checkin.findMany.mockResolvedValue([]);
      const result = await service.getWeeklyStats('user1');
      expect(result.total).toBe(0);
    });
  });

  // ── getMonthlyStats ──────────────────────────────────────

  describe('getMonthlyStats', () => {
    beforeEach(() => {
      mockPrisma.statisticsCache.findUnique.mockResolvedValue(null);
      mockPrisma.statisticsCache.upsert.mockResolvedValue({});
    });

    it('월간 통계 반환', async () => {
      mockPrisma.checkin.findMany.mockResolvedValue([
        { type: 'work_disconnect', customFields: null },
        { type: 'report', customFields: { reportType: 'monthly' } },
      ]);

      const result = await service.getMonthlyStats('user1');
      expect(result.total).toBe(2);
      expect(result.work_disconnect).toBe(1);
      expect(result.report.monthly).toBe(1);
      expect(result.period).toBe('monthly');
    });
  });

  // ── getOverviewStats ─────────────────────────────────────

  describe('getOverviewStats', () => {
    it('전체 오버뷰 통계 반환', async () => {
      mockPrisma.checkin.count
        .mockResolvedValueOnce(3)  // today
        .mockResolvedValueOnce(10) // week
        .mockResolvedValueOnce(25) // month
        .mockResolvedValueOnce(100); // total
      mockPrisma.checkin.findMany
        .mockResolvedValueOnce([{ userId: 'u1' }, { userId: 'u2' }]) // distinct users
        .mockResolvedValueOnce([]) // today checkins
        .mockResolvedValueOnce([]) // week checkins
        .mockResolvedValueOnce([]); // month checkins

      const result = await service.getOverviewStats();
      expect(result.today).toBe(3);
      expect(result.thisWeek).toBe(10);
      expect(result.thisMonth).toBe(25);
      expect(result.total).toBe(100);
      expect(result.userCount).toBe(2);
      expect(result.weeklyTrend).toHaveLength(7);
    });
  });

  // ── getReportMonthlyTrend ────────────────────────────────

  describe('getReportMonthlyTrend', () => {
    it('12개월 데이터 반환', async () => {
      mockPrisma.checkin.findMany.mockResolvedValue([]);
      const result = await service.getReportMonthlyTrend();
      expect(result).toHaveLength(12);
      expect(result[0]).toHaveProperty('month');
      expect(result[0]).toHaveProperty('일일');
      expect(result[0]).toHaveProperty('주간');
      expect(result[0]).toHaveProperty('월간');
    });

    it('보고서 타입별 월별 집계', async () => {
      const now = new Date();
      mockPrisma.checkin.findMany.mockResolvedValue([
        { date: now, customFields: { reportType: 'daily' } },
        { date: now, customFields: { reportType: 'weekly' } },
      ]);

      const result = await service.getReportMonthlyTrend();
      const thisMonth = result[result.length - 1];
      expect(thisMonth['일일']).toBe(1);
      expect(thisMonth['주간']).toBe(1);
      expect(thisMonth['월간']).toBe(0);
    });
  });

  // ── getCheckinList ───────────────────────────────────────

  describe('getCheckinList', () => {
    it('query 없이 전체 목록 반환', async () => {
      mockPrisma.checkin.findMany.mockResolvedValue([{ id: '1', userId: 'u1' }]);
      mockPrisma.checkin.count.mockResolvedValue(1);
      mockPrisma.discordUser.findMany.mockResolvedValue([]);

      const result = await service.getCheckinList(undefined, 50, 0);
      expect(result.total).toBe(1);
      expect(result.limit).toBe(50);
      expect(result.offset).toBe(0);
    });

    it('query로 유저 검색 후 필터링', async () => {
      mockPrisma.discordUser.findMany
        .mockResolvedValueOnce([{ id: 'u1' }]) // 유저 검색
        .mockResolvedValueOnce([]); // 체크인 유저 정보
      mockPrisma.checkin.findMany.mockResolvedValue([]);
      mockPrisma.checkin.count.mockResolvedValue(0);

      await service.getCheckinList('testuser', 50, 0);
      const userSearchCall = mockPrisma.discordUser.findMany.mock.calls[0][0];
      expect(userSearchCall.where.OR).toHaveLength(2);
    });

    it('매칭 유저 없으면 빈 배열 반환', async () => {
      mockPrisma.discordUser.findMany.mockResolvedValue([]);

      const result = await service.getCheckinList('nobody', 50, 0);
      expect(result.checkins).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  // ── getUserList ──────────────────────────────────────────

  describe('getUserList', () => {
    it('유저별 체크인 통계 반환', async () => {
      mockPrisma.checkin.groupBy.mockResolvedValue([
        { userId: 'u1', _count: { userId: 10 } },
      ]);
      mockPrisma.checkin.findMany
        .mockResolvedValueOnce([{ userId: 'u1' }]) // weekCheckins
        .mockResolvedValueOnce([{ userId: 'u1', date: new Date() }]); // lastCheckins
      mockPrisma.discordUser.findMany.mockResolvedValue([
        { id: 'u1', username: 'testuser', displayName: 'Test', avatarUrl: null },
      ]);

      const result = await service.getUserList();
      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe('u1');
      expect(result[0].totalCheckins).toBe(10);
      expect(result[0].weeklyCheckins).toBe(1);
      expect(result[0].username).toBe('testuser');
    });

    it('discordUser 없으면 null 반환', async () => {
      mockPrisma.checkin.groupBy.mockResolvedValue([
        { userId: 'unknown', _count: { userId: 3 } },
      ]);
      mockPrisma.checkin.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      mockPrisma.discordUser.findMany.mockResolvedValue([]);

      const result = await service.getUserList();
      expect(result[0].username).toBeNull();
      expect(result[0].displayName).toBeNull();
    });
  });
});
