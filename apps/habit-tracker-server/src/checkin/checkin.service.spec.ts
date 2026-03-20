import { Test, TestingModule } from '@nestjs/testing';
import { CheckinService } from './checkin.service';
import { PrismaService } from '../database/prisma.service';

const mockPrisma = {
  checkin: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
  },
};

describe('CheckinService', () => {
  let service: CheckinService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckinService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CheckinService>(CheckinService);
    jest.clearAllMocks();
  });

  // ── hasTodayCheckin ──────────────────────────────────────

  describe('hasTodayCheckin', () => {
    it('오늘 체크인이 있으면 true 반환', async () => {
      mockPrisma.checkin.findFirst.mockResolvedValue({ id: '1' });
      const result = await service.hasTodayCheckin('user1', 'work_disconnect');
      expect(result).toBe(true);
    });

    it('오늘 체크인이 없으면 false 반환', async () => {
      mockPrisma.checkin.findFirst.mockResolvedValue(null);
      const result = await service.hasTodayCheckin('user1', 'work_disconnect');
      expect(result).toBe(false);
    });

    it('weekly 보고서는 이번 주 범위로 조회', async () => {
      mockPrisma.checkin.findFirst.mockResolvedValue(null);
      await service.hasTodayCheckin('user1', 'report', 'weekly');

      const call = mockPrisma.checkin.findFirst.mock.calls[0][0];
      const { gte, lte } = call.where.date;
      // 월요일 00:00 ~ 일요일 23:59:59.999 = ~7일
      const diffDays = (lte.getTime() - gte.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeGreaterThanOrEqual(6);
      expect(diffDays).toBeLessThanOrEqual(7);
      expect(call.where.customFields).toEqual({ path: ['reportType'], equals: 'weekly' });
    });

    it('monthly 보고서는 이번 달 범위로 조회', async () => {
      mockPrisma.checkin.findFirst.mockResolvedValue(null);
      await service.hasTodayCheckin('user1', 'report', 'monthly');

      const call = mockPrisma.checkin.findFirst.mock.calls[0][0];
      const { gte, lte } = call.where.date;
      expect(gte.getDate()).toBe(1);
      expect(lte.getHours()).toBe(23);
    });

    it('일일 보고서는 오늘 하루 범위로 조회', async () => {
      mockPrisma.checkin.findFirst.mockResolvedValue(null);
      await service.hasTodayCheckin('user1', 'report', 'daily');

      const call = mockPrisma.checkin.findFirst.mock.calls[0][0];
      const { gte, lte } = call.where.date;
      const diffMs = lte.getTime() - gte.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      expect(diffHours).toBeCloseTo(24, 0);
    });
  });

  // ── create ──────────────────────────────────────────────

  describe('create', () => {
    it('기본 체크인 생성', async () => {
      const mockCheckin = { id: '1', userId: 'user1', type: 'workout' };
      mockPrisma.checkin.create.mockResolvedValue(mockCheckin);

      const result = await service.create('user1', 'workout');
      expect(result).toEqual(mockCheckin);
      expect(mockPrisma.checkin.create).toHaveBeenCalledWith({
        data: { userId: 'user1', type: 'workout', description: undefined, customFields: undefined },
      });
    });

    it('메모와 함께 체크인 생성', async () => {
      mockPrisma.checkin.create.mockResolvedValue({});
      await service.create('user1', 'camera_out', '오늘 외출');

      expect(mockPrisma.checkin.create).toHaveBeenCalledWith({
        data: { userId: 'user1', type: 'camera_out', description: '오늘 외출', customFields: undefined },
      });
    });

    it('reportType과 함께 보고서 체크인 생성', async () => {
      mockPrisma.checkin.create.mockResolvedValue({});
      await service.create('user1', 'report', undefined, 'daily');

      expect(mockPrisma.checkin.create).toHaveBeenCalledWith({
        data: { userId: 'user1', type: 'report', description: undefined, customFields: { reportType: 'daily' } },
      });
    });
  });

  // ── getTodayCheckins ─────────────────────────────────────

  describe('getTodayCheckins', () => {
    it('오늘 체크인 목록 반환', async () => {
      const checkins = [{ id: '1' }, { id: '2' }];
      mockPrisma.checkin.findMany.mockResolvedValue(checkins);

      const result = await service.getTodayCheckins('user1');
      expect(result).toEqual(checkins);
      expect(mockPrisma.checkin.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ userId: 'user1' }) }),
      );
    });
  });

  // ── getWeeklyCount ───────────────────────────────────────

  describe('getWeeklyCount', () => {
    it('타입별 집계 반환', async () => {
      mockPrisma.checkin.findMany.mockResolvedValue([
        { type: 'camera_out', date: new Date(), customFields: null },
        { type: 'workout', date: new Date(), customFields: null },
        { type: 'report', date: new Date(), customFields: { reportType: 'daily' } },
        { type: 'report', date: new Date(), customFields: { reportType: 'weekly' } },
      ]);

      const result = await service.getWeeklyCount('user1');
      expect(result.total).toBe(4);
      expect(result.camera_out).toBe(1);
      expect(result.workout).toBe(1);
      expect(result.report.total).toBe(2);
      expect(result.report.daily).toBe(1);
      expect(result.report.weekly).toBe(1);
      expect(result.report.monthly).toBe(0);
    });

    it('체크인 없으면 모두 0 반환', async () => {
      mockPrisma.checkin.findMany.mockResolvedValue([]);

      const result = await service.getWeeklyCount('user1');
      expect(result.total).toBe(0);
      expect(result.camera_out).toBe(0);
      expect(result.report).toEqual({ total: 0, daily: 0, weekly: 0, monthly: 0 });
    });

    it('dailyTypes에 중복 타입 없이 집계', async () => {
      const monday = new Date();
      monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
      monday.setHours(10, 0, 0, 0);

      mockPrisma.checkin.findMany.mockResolvedValue([
        { type: 'camera_out', date: monday, customFields: null },
        { type: 'camera_out', date: monday, customFields: null }, // 같은 날 중복
      ]);

      const result = await service.getWeeklyCount('user1');
      expect(result.dailyTypes[0]).toEqual(['camera_out']); // 중복 제거
    });
  });

  // ── getYearlyReportCount ─────────────────────────────────

  describe('getYearlyReportCount', () => {
    it('연간 보고서 타입별 카운트 반환', async () => {
      mockPrisma.checkin.findMany.mockResolvedValue([
        { customFields: { reportType: 'daily' } },
        { customFields: { reportType: 'daily' } },
        { customFields: { reportType: 'weekly' } },
        { customFields: { reportType: 'monthly' } },
      ]);

      const result = await service.getYearlyReportCount('user1', 2025);
      expect(result.total).toBe(4);
      expect(result.daily).toBe(2);
      expect(result.weekly).toBe(1);
      expect(result.monthly).toBe(1);
    });

    it('보고서 없으면 모두 0 반환', async () => {
      mockPrisma.checkin.findMany.mockResolvedValue([]);
      const result = await service.getYearlyReportCount('user1', 2025);
      expect(result).toEqual({ total: 0, daily: 0, weekly: 0, monthly: 0 });
    });

    it('해당 연도 범위로 조회', async () => {
      mockPrisma.checkin.findMany.mockResolvedValue([]);
      await service.getYearlyReportCount('user1', 2024);

      const call = mockPrisma.checkin.findMany.mock.calls[0][0];
      expect(call.where.date.gte.getFullYear()).toBe(2024);
      expect(call.where.date.lte.getFullYear()).toBe(2024);
    });
  });
});
