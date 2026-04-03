import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Checkin } from '@prisma/client';

export type CheckinType = 'camera_out' | 'work_disconnect' | 'workout' | 'report' | 'language_study';
export type ReportType = 'daily' | 'weekly' | 'monthly';
export type LanguageType = string; // 추후 언어 추가 가능: 'japanese' | 'english' | ...

@Injectable()
export class CheckinService {
  constructor(private readonly prisma: PrismaService) {}

  async hasTodayCheckin(
    userId: string,
    type: CheckinType,
    reportType?: ReportType,
    languageType?: LanguageType,
  ): Promise<boolean> {
    const now = new Date();

    let rangeStart: Date;
    let rangeEnd: Date;

    if (reportType === 'weekly') {
      // 이번 주 월~일
      rangeStart = new Date(now);
      rangeStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
      rangeStart.setHours(0, 0, 0, 0);
      rangeEnd = new Date(rangeStart);
      rangeEnd.setDate(rangeStart.getDate() + 6);
      rangeEnd.setHours(23, 59, 59, 999);
    } else if (reportType === 'monthly') {
      // 이번 달 1일~말일
      rangeStart = new Date(now.getFullYear(), now.getMonth(), 1);
      rangeEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else {
      // 오늘 하루
      rangeStart = new Date(now);
      rangeStart.setHours(0, 0, 0, 0);
      rangeEnd = new Date(now);
      rangeEnd.setHours(23, 59, 59, 999);
    }

    if (type === 'report' && reportType) {
      const existing = await this.prisma.checkin.findFirst({
        where: {
          userId,
          type,
          date: { gte: rangeStart, lte: rangeEnd },
          customFields: { path: ['reportType'], equals: reportType },
        },
      });
      return !!existing;
    }

    if (type === 'language_study' && languageType) {
      const existing = await this.prisma.checkin.findFirst({
        where: {
          userId,
          type,
          date: { gte: rangeStart, lte: rangeEnd },
          customFields: { path: ['languageType'], equals: languageType },
        },
      });
      return !!existing;
    }

    const existing = await this.prisma.checkin.findFirst({
      where: {
        userId,
        type,
        date: { gte: rangeStart, lte: rangeEnd },
      },
    });

    return !!existing;
  }

  async create(
    userId: string,
    type: CheckinType,
    memo?: string,
    reportType?: ReportType,
    languageType?: LanguageType,
  ): Promise<Checkin> {
    const customFields = reportType
      ? { reportType }
      : languageType
        ? { languageType }
        : undefined;
    return this.prisma.checkin.create({
      data: {
        userId,
        type,
        description: memo,
        customFields,
      },
    });
  }

  async getTodayCheckins(userId: string): Promise<Checkin[]> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.checkin.findMany({
      where: {
        userId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  async getWeeklyCount(userId: string): Promise<{
    total: number;
    camera_out: number;
    work_disconnect: number;
    workout: number;
    report: { total: number; daily: number; weekly: number; monthly: number };
    language_study: { total: number; [lang: string]: number };
    // 월(0)~일(6) 인덱스, 해당 날에 체크인한 타입 목록
    dailyTypes: Record<number, CheckinType[]>;
    weekStart: Date;
  }> {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1); // 월요일
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // 일요일
    endOfWeek.setHours(23, 59, 59, 999);

    const checkins = await this.prisma.checkin.findMany({
      where: {
        userId,
        date: { gte: startOfWeek, lte: endOfWeek },
      },
      orderBy: { date: 'asc' },
    });

    const camera_out = checkins.filter((c) => c.type === 'camera_out').length;
    const work_disconnect = checkins.filter((c) => c.type === 'work_disconnect').length;
    const workout = checkins.filter((c) => c.type === 'workout').length;

    const reports = checkins.filter((c) => c.type === 'report');
    const reportCount = {
      total: reports.length,
      daily: reports.filter((c) => (c.customFields as any)?.reportType === 'daily').length,
      weekly: reports.filter((c) => (c.customFields as any)?.reportType === 'weekly').length,
      monthly: reports.filter((c) => (c.customFields as any)?.reportType === 'monthly').length,
    };

    const languageCheckins = checkins.filter((c) => c.type === 'language_study');
    const languageCount: { total: number; [lang: string]: number } = { total: languageCheckins.length };
    for (const c of languageCheckins) {
      const lang = (c.customFields as any)?.languageType;
      if (lang) languageCount[lang] = (languageCount[lang] || 0) + 1;
    }

    // 요일별 체크인 타입 집계 (0=월 ~ 6=일)
    const dailyTypes: Record<number, CheckinType[]> = {
      0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [],
    };
    for (const c of checkins) {
      const date = new Date(c.date);
      // getDay(): 0=일,1=월..6=토 → 월=0 기준으로 변환
      const dayIndex = (date.getDay() + 6) % 7;
      if (!dailyTypes[dayIndex].includes(c.type as CheckinType)) {
        dailyTypes[dayIndex].push(c.type as CheckinType);
      }
    }

    return {
      total: checkins.length,
      camera_out,
      work_disconnect,
      workout,
      report: reportCount,
      language_study: languageCount,
      dailyTypes,
      weekStart: startOfWeek,
    };
  }

  async getYearlyReportCount(
    userId: string,
    year: number,
  ): Promise<{ daily: number; weekly: number; monthly: number; total: number }> {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

    const reports = await this.prisma.checkin.findMany({
      where: {
        userId,
        type: 'report',
        date: {
          gte: startOfYear,
          lte: endOfYear,
        },
      },
    });

    return {
      total: reports.length,
      daily: reports.filter((c) => (c.customFields as any)?.reportType === 'daily').length,
      weekly: reports.filter((c) => (c.customFields as any)?.reportType === 'weekly').length,
      monthly: reports.filter((c) => (c.customFields as any)?.reportType === 'monthly').length,
    };
  }
}
