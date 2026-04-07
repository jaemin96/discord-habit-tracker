import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface ReportStats {
  daily: number;
  weekly: number;
  monthly: number;
  total: number;
}

export interface LanguageStudyStats {
  total: number;
  [lang: string]: number;
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
  language_study: LanguageStudyStats;
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

    const langCheckins = checkins.filter((c) => c.type === 'language_study');
    const language_study: LanguageStudyStats = { total: langCheckins.length };
    for (const c of langCheckins) {
      const lang = (c.customFields as any)?.languageType;
      if (lang) language_study[lang] = (language_study[lang] || 0) + 1;
    }

    const result: PeriodStats = {
      period,
      startDate,
      endDate,
      total: checkins.length,
      camera_out,
      work_disconnect,
      workout,
      report,
      language_study,
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

  // ── 전체 오버뷰 (userId 없이 전체 집계) ──────────────────
  async getOverviewStats() {
    const now = new Date();

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [todayCount, weekCount, monthCount, totalCount, userList] = await Promise.all([
      this.prisma.checkin.count({ where: { date: { gte: todayStart, lte: todayEnd } } }),
      this.prisma.checkin.count({ where: { date: { gte: weekStart, lte: weekEnd } } }),
      this.prisma.checkin.count({ where: { date: { gte: monthStart, lte: monthEnd } } }),
      this.prisma.checkin.count(),
      this.prisma.checkin.findMany({
        distinct: ['userId'],
        select: { userId: true },
      }),
    ]);

    // 오늘 / 이번 주 / 이번 달 타입별 분포 (주간은 일별 트렌드에도 재사용)
    const [todayCheckins, weekCheckins, monthCheckins] = await Promise.all([
      this.prisma.checkin.findMany({
        where: { date: { gte: todayStart, lte: todayEnd } },
        select: { type: true, customFields: true },
      }),
      this.prisma.checkin.findMany({
        where: { date: { gte: weekStart, lte: weekEnd } },
        select: { date: true, type: true, customFields: true },
        orderBy: { date: 'asc' },
      }),
      this.prisma.checkin.findMany({
        where: { date: { gte: monthStart, lte: monthEnd } },
        select: { type: true, customFields: true },
      }),
    ]);

    // 주간 일별 집계
    const dailyMap: Record<string, { total: number; camera_out: number; work_disconnect: number; workout: number; report: number; language_study: number }> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const key = d.toISOString().split('T')[0];
      dailyMap[key] = { total: 0, camera_out: 0, work_disconnect: 0, workout: 0, report: 0, language_study: 0 };
    }
    for (const c of weekCheckins) {
      const key = new Date(c.date).toISOString().split('T')[0];
      if (dailyMap[key]) {
        dailyMap[key].total++;
        if (c.type in dailyMap[key]) {
          (dailyMap[key] as any)[c.type]++;
        }
      }
    }

    const buildBreakdown = (checkins: { type: string; customFields: any }[]) => {
      const reports = checkins.filter((c) => c.type === 'report');
      const langCheckins = checkins.filter((c) => c.type === 'language_study');
      const language_study: LanguageStudyStats = { total: langCheckins.length };
      for (const c of langCheckins) {
        const lang = (c.customFields as any)?.languageType;
        if (lang) language_study[lang] = (language_study[lang] || 0) + 1;
      }
      return {
        camera_out: checkins.filter((c) => c.type === 'camera_out').length,
        work_disconnect: checkins.filter((c) => c.type === 'work_disconnect').length,
        workout: checkins.filter((c) => c.type === 'workout').length,
        report: {
          total: reports.length,
          daily: reports.filter((c) => (c.customFields as any)?.reportType === 'daily').length,
          weekly: reports.filter((c) => (c.customFields as any)?.reportType === 'weekly').length,
          monthly: reports.filter((c) => (c.customFields as any)?.reportType === 'monthly').length,
        },
        language_study,
      };
    };

    return {
      today: todayCount,
      thisWeek: weekCount,
      thisMonth: monthCount,
      total: totalCount,
      userCount: userList.length,
      weeklyTrend: Object.entries(dailyMap).map(([date, counts]) => ({ date, ...counts })),
      typeBreakdown: buildBreakdown(monthCheckins),
      dailyBreakdown: buildBreakdown(todayCheckins),
      weeklyBreakdown: buildBreakdown(weekCheckins),
    };
  }

  // ── 기간 범위 통계 (startDate ~ endDate) ──────────────────
  async getRangeStats(startDate: Date, endDate: Date) {
    const checkins = await this.prisma.checkin.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      select: { date: true, type: true, customFields: true },
      orderBy: { date: 'asc' },
    });

    const buildBreakdown = (items: { type: string; customFields: any }[]) => {
      const reports = items.filter((c) => c.type === 'report');
      const langCheckins = items.filter((c) => c.type === 'language_study');
      const language_study: LanguageStudyStats = { total: langCheckins.length };
      for (const c of langCheckins) {
        const lang = (c.customFields as any)?.languageType;
        if (lang) language_study[lang] = (language_study[lang] || 0) + 1;
      }
      return {
        camera_out: items.filter((c) => c.type === 'camera_out').length,
        work_disconnect: items.filter((c) => c.type === 'work_disconnect').length,
        workout: items.filter((c) => c.type === 'workout').length,
        report: {
          total: reports.length,
          daily: reports.filter((c) => (c.customFields as any)?.reportType === 'daily').length,
          weekly: reports.filter((c) => (c.customFields as any)?.reportType === 'weekly').length,
          monthly: reports.filter((c) => (c.customFields as any)?.reportType === 'monthly').length,
        },
        language_study,
      };
    };

    // 일별 트렌드
    const dailyMap: Record<string, { total: number; camera_out: number; work_disconnect: number; workout: number; report: number; language_study: number }> = {};
    const cur = new Date(startDate);
    while (cur <= endDate) {
      const key = cur.toISOString().split('T')[0];
      dailyMap[key] = { total: 0, camera_out: 0, work_disconnect: 0, workout: 0, report: 0, language_study: 0 };
      cur.setDate(cur.getDate() + 1);
    }
    for (const c of checkins) {
      const key = new Date(c.date).toISOString().split('T')[0];
      if (dailyMap[key]) {
        dailyMap[key].total++;
        if (c.type in dailyMap[key]) (dailyMap[key] as any)[c.type]++;
      }
    }

    return {
      startDate,
      endDate,
      total: checkins.length,
      breakdown: buildBreakdown(checkins),
      dailyTrend: Object.entries(dailyMap).map(([date, counts]) => ({ date, ...counts })),
    };
  }

  // ── 리포트 월별 추이 (최근 12개월) ──────────────────────────
  async getReportMonthlyTrend() {
    const now = new Date();
    const months: { label: string; start: Date; end: Date }[] = [];

    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
      const label = `${start.getFullYear().toString().slice(2)}/${String(start.getMonth() + 1).padStart(2, '0')}`;
      months.push({ label, start, end });
    }

    const startDate = months[0].start;
    const endDate = months[months.length - 1].end;

    const reports = await this.prisma.checkin.findMany({
      where: {
        type: 'report',
        date: { gte: startDate, lte: endDate },
      },
      select: { date: true, customFields: true },
    });

    return months.map(({ label, start, end }) => {
      const inMonth = reports.filter((r) => r.date >= start && r.date <= end);
      return {
        month: label,
        일일: inMonth.filter((r) => (r.customFields as any)?.reportType === 'daily').length,
        주간: inMonth.filter((r) => (r.customFields as any)?.reportType === 'weekly').length,
        월간: inMonth.filter((r) => (r.customFields as any)?.reportType === 'monthly').length,
      };
    });
  }

  // ── 체크인 목록 조회 ──────────────────────────────────────
  // query: username 또는 displayName으로 부분검색 → 해당 userId로 필터링
  async getCheckinList(query: string | undefined, limit: number, offset: number) {
    let filterUserIds: string[] | undefined;

    if (query) {
      const matched = await this.prisma.discordUser.findMany({
        where: {
          OR: [
            { username: { contains: query, mode: 'insensitive' } },
            { displayName: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: { id: true },
      });
      filterUserIds = matched.map((u) => u.id);
      // 매칭 유저 없으면 빈 결과 반환
      if (filterUserIds.length === 0) {
        return { checkins: [], total: 0, limit, offset };
      }
    }

    const where = filterUserIds ? { userId: { in: filterUserIds } } : {};
    const [checkins, total] = await Promise.all([
      this.prisma.checkin.findMany({
        where,
        orderBy: { date: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.checkin.count({ where }),
    ]);

    const userIds = [...new Set(checkins.map((c) => c.userId))];
    const discordUsers = await this.prisma.discordUser.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true, displayName: true, avatarUrl: true },
    });
    const userMap: Record<string, { username: string; displayName: string; avatarUrl: string | null }> = {};
    for (const u of discordUsers) {
      userMap[u.id] = { username: u.username, displayName: u.displayName, avatarUrl: u.avatarUrl };
    }

    const enriched = checkins.map((c) => ({
      ...c,
      user: userMap[c.userId] ?? null,
    }));

    return { checkins: enriched, total, limit, offset };
  }

  // ── 사용자 목록 ──────────────────────────────────────────
  async getUserList() {
    const users = await this.prisma.checkin.groupBy({
      by: ['userId'],
      _count: { userId: true },
      orderBy: { _count: { userId: 'desc' } },
    });

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    weekStart.setHours(0, 0, 0, 0);

    const userIds = users.map((u) => u.userId);

    const [weekCheckins, lastCheckins, discordUsers] = await Promise.all([
      this.prisma.checkin.findMany({
        where: { date: { gte: weekStart } },
        select: { userId: true },
      }),
      this.prisma.checkin.findMany({
        where: { userId: { in: userIds } },
        orderBy: { date: 'desc' },
        distinct: ['userId'],
        select: { userId: true, date: true },
      }),
      this.prisma.discordUser.findMany({
        where: { id: { in: userIds } },
        select: { id: true, username: true, displayName: true, avatarUrl: true },
      }),
    ]);

    const weekCountMap: Record<string, number> = {};
    for (const c of weekCheckins) {
      weekCountMap[c.userId] = (weekCountMap[c.userId] || 0) + 1;
    }

    const lastCheckinMap: Record<string, Date> = {};
    for (const c of lastCheckins) {
      lastCheckinMap[c.userId] = c.date;
    }

    const discordUserMap: Record<string, { username: string; displayName: string; avatarUrl: string | null }> = {};
    for (const u of discordUsers) {
      discordUserMap[u.id] = { username: u.username, displayName: u.displayName, avatarUrl: u.avatarUrl };
    }

    return users.map((u) => ({
      userId: u.userId,
      username: discordUserMap[u.userId]?.username ?? null,
      displayName: discordUserMap[u.userId]?.displayName ?? null,
      avatarUrl: discordUserMap[u.userId]?.avatarUrl ?? null,
      totalCheckins: u._count.userId,
      weeklyCheckins: weekCountMap[u.userId] || 0,
      lastCheckin: lastCheckinMap[u.userId] || null,
    }));
  }
}
