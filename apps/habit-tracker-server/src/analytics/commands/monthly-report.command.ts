import { Injectable } from '@nestjs/common';
import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { ICommand } from '../../discord/commands/command.interface';
import { AnalyticsService, PeriodStats } from '../analytics.service';

function formatDate(date: Date): string {
  return `${date.getFullYear()}. ${date.getMonth() + 1}/${date.getDate()}`;
}

function buildStatsEmbed(stats: PeriodStats, title: string): EmbedBuilder {
  const dateRange = `${formatDate(stats.startDate)} ~ ${formatDate(stats.endDate)}`;

  const lines: string[] = [];
  if (stats.camera_out > 0)      lines.push(`📸 카메라외출 · ${stats.camera_out}회`);
  if (stats.work_disconnect > 0) lines.push(`💼 업무단절 · ${stats.work_disconnect}회`);
  if (stats.workout > 0)         lines.push(`🏋️ 운동 · ${stats.workout}회`);
  if (stats.report.total > 0) {
    lines.push(`📋 보고서 · ${stats.report.total}회`);
    if (stats.report.daily > 0)   lines.push(`　📝 일일 · ${stats.report.daily}회`);
    if (stats.report.weekly > 0)  lines.push(`　📊 주간 · ${stats.report.weekly}회`);
    if (stats.report.monthly > 0) lines.push(`　📅 월간 · ${stats.report.monthly}회`);
  }

  return new EmbedBuilder()
    .setColor(0x00b894)
    .setTitle(title)
    .addFields(
      { name: '\u200b', value: dateRange, inline: false },
      { name: `✦ 총 ${stats.total}회`, value: lines.join('\n') || '체크인 기록 없음', inline: false },
    )
    .setTimestamp()
    .setFooter({ text: 'Habit Tracker' });
}

@Injectable()
export class MonthlyReportCommand implements ICommand {
  name = '월간리포트';
  description = '이번 달 체크인 통계 리포트';

  constructor(private readonly analyticsService: AnalyticsService) {}

  toJSON() {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .toJSON();
  }

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();
    const stats = await this.analyticsService.getMonthlyStats(interaction.user.id);

    if (stats.total === 0) {
      await interaction.editReply('이번 달 체크인 기록이 없습니다.');
      return;
    }

    const embed = buildStatsEmbed(stats, '📅 월간 리포트');
    await interaction.editReply({ embeds: [embed] });
  }
}
