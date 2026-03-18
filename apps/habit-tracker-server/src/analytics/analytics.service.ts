import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface ReportStats {
  daily: number;
  weekly: number;
  monthly: number;
  total: number;
}

export interface PeriodStats {
  period: 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  total: number;
  camera_out: number;
  work_disconnect: number;
  workout: number;
  report: ReportStats;
}

const CACHE_TTL_MS = 1000 * 60 * 30; // 30분

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── 캐시 조회 ──────────────────────────────────────────
  private async getCache(
    userId: string,
    period: string,
    startDate: Date,
  ): Promise<PeriodStats | null> {
    const cache = await this.prisma.statisticsCache.findUnique({
      where: { userId_period_startDate: { userId, period, startDate } },
    });
    if (!cache) return null;

    const age = Date.now() - new Date(cache.startDate).getTime();
    if (age > CACHE_TTL_MS) return null;

    return cache.data as unknown as PeriodStats;
  }

  private async setCache(
    userId: string,
    period: string,
    startDate: Date,
    data: PeriodStats,
  ): Promise<void> {
    await this.prisma.statisticsCache.upsert({
      where: { userId_period_startDate: { userId, period, startDate } },
      create: { userId, period, startDate, data: data as any },
      update: { data: data as any },
    });
  }

  // ── 공통 집계 ──────────────────────────────────────────
  private async calcStats(
    userId: string,
    period: 'weekly' | 'monthly',
    startDate: Date,
    endDate: Date,
  ): Promise<PeriodStats> {
    const cached = await this.getCache(userId, period, startDate);
    if (cached) return cached;

    const checkins = await this.prisma.checkin.findMany({
      where: { userId, date: { gte: startDate, lte: endDate } },
    });

    const camera_out = checkins.filter((c) => c.type === 'camera_out').length;
    const work_disconnect = checkins.filter((c) => c.type === 'work_disconnect').length;
    const workout = checkins.filter((c) => c.type === 'workout').length;
    const reports = checkins.filter((c) => c.type === 'report');

    const report: ReportStats = {
      daily: reports.filter((c) => (c.customFields as any)?.reportType === 'daily').length,
      weekly: reports.filter((c) => (c.customFields as any)?.reportType === 'weekly').length,
      monthly: reports.filter((c) => (c.customFields as any)?.reportType === 'monthly').length,
      total: reports.length,
    };

    const result: PeriodStats = {
      period,
      startDate,
      endDate,
      total: checkins.length,
      camera_out,
      work_disconnect,
      workout,
      report,
    };

    await this.setCache(userId, period, startDate, result);
    return result;
  }

  // ── 주간 통계 ──────────────────────────────────────────
  async getWeeklyStats(userId: string): Promise<PeriodStats> {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);

    return this.calcStats(userId, 'weekly', startDate, endDate);
  }

  // ── 월간 통계 ──────────────────────────────────────────
  async getMonthlyStats(userId: string): Promise<PeriodStats> {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    return this.calcStats(userId, 'monthly', startDate, endDate);
  }
}
