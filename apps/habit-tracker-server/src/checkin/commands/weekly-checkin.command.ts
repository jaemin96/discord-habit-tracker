import { Injectable } from '@nestjs/common';
import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
} from 'discord.js';
import { ICommand } from '../../discord/commands/command.interface';
import { CheckinService } from '../checkin.service';

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

function formatDate(date: Date): string {
  return `${date.getFullYear()}. ${date.getMonth() + 1}/${date.getDate()}`;
}

function buildCalendarBlock(weekStart: Date, dailyTypes: Record<number, string[]>): string {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const todayIndex = (new Date().getDay() + 6) % 7;
  const dateRange = `${formatDate(weekStart)} ~ ${formatDate(weekEnd)}`;

  const blocks = Array.from({ length: 7 }, (_, i) => {
    const done = dailyTypes[i].length > 0;
    const isToday = i === todayIndex;
    if (isToday && done) return '🟢';
    if (isToday)         return '🟢';
    if (done)            return '🟩';
    return '⬜';
  });

  const blockRow = blocks.join('\u2006');
  return `${dateRange}\n${blockRow}`;
}

@Injectable()
export class WeeklyCheckinCommand implements ICommand {
  name = '주간체크인';
  description = '이번 주 체크인 통계를 조회합니다';

  constructor(private readonly checkinService: CheckinService) {}

  toJSON() {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .toJSON();
  }

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();

    const userId = interaction.user.id;
    const stats = await this.checkinService.getWeeklyCount(userId);

    const embed = new EmbedBuilder()
      .setColor(0x6c5ce7)
      .setTitle('📊 이번 주 체크인 통계')
      .setTimestamp()
      .setFooter({ text: 'Habit Tracker' });

    if (stats.total === 0) {
      embed.setDescription('이번 주 체크인 기록이 없습니다.');
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    const calendar = buildCalendarBlock(stats.weekStart, stats.dailyTypes);

    const LANGUAGE_META: Record<string, { emoji: string; label: string }> = {
      japanese: { emoji: '🇯🇵', label: '일본어' },
      english: { emoji: '🇺🇸', label: '영어' },
    };
    const langLines = stats.language_study.total > 0
      ? [
          `🌐 외국어 공부 · ${stats.language_study.total}회`,
          ...Object.entries(stats.language_study)
            .filter(([k, v]) => k !== 'total' && v > 0)
            .map(([lang, cnt]) => {
              const m = LANGUAGE_META[lang] ?? { emoji: '🌐', label: lang };
              return `　${m.emoji} ${m.label} · ${cnt}회`;
            }),
        ].join('\n')
      : null;

    const typeStats = [
      stats.camera_out > 0 ? `📸 카메라외출 · ${stats.camera_out}회` : null,
      stats.work_disconnect > 0 ? `📚 업무 외 학습 · ${stats.work_disconnect}회` : null,
      stats.workout > 0 ? `🏋️ 운동 · ${stats.workout}회` : null,
      stats.report.total > 0
        ? [
            `📋 보고서 · ${stats.report.total}회`,
            stats.report.daily > 0 ? `　📝 일일 · ${stats.report.daily}회` : null,
            stats.report.weekly > 0 ? `　📊 주간 · ${stats.report.weekly}회` : null,
            stats.report.monthly > 0 ? `　📅 월간 · ${stats.report.monthly}회` : null,
          ]
            .filter(Boolean)
            .join('\n')
        : null,
      langLines,
    ]
      .filter(Boolean)
      .join('\n\n');

    embed.addFields(
      { name: '\u200b', value: calendar, inline: false },
      { name: '\u200b', value: '\u200b', inline: false },
      { name: `✦ 총 ${stats.total}회`, value: typeStats, inline: false },
    );

    await interaction.editReply({ embeds: [embed] });
  }
}
