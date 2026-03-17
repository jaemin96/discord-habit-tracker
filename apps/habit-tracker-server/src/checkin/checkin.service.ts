import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Checkin } from '@prisma/client';

export type CheckinType = 'camera_out' | 'work_disconnect';

@Injectable()
export class CheckinService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    type: CheckinType,
    memo?: string,
  ): Promise<Checkin> {
    return this.prisma.checkin.create({
      data: {
        userId,
        type,
        description: memo,
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
    dates: string[];
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
        date: {
          gte: startOfWeek,
          lte: endOfWeek,
        },
      },
      orderBy: { date: 'asc' },
    });

    const camera_out = checkins.filter((c) => c.type === 'camera_out').length;
    const work_disconnect = checkins.filter(
      (c) => c.type === 'work_disconnect',
    ).length;

    const uniqueDates = [
      ...new Set(
        checkins.map((c) =>
          new Date(c.date).toLocaleDateString('ko-KR', {
            timeZone: 'Asia/Seoul',
            month: 'numeric',
            day: 'numeric',
          }),
        ),
      ),
    ];

    return {
      total: checkins.length,
      camera_out,
      work_disconnect,
      dates: uniqueDates,
    };
  }
}
