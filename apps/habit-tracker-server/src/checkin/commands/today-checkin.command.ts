import { Injectable } from '@nestjs/common';
import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
} from 'discord.js';
import { ICommand } from '../../discord/commands/command.interface';
import { CheckinService } from '../checkin.service';

@Injectable()
export class TodayCheckinCommand implements ICommand {
  name = '오늘체크인';
  description = '오늘의 체크인 내역을 조회합니다';

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
    const checkins = await this.checkinService.getTodayCheckins(userId);

    const embed = new EmbedBuilder()
      .setColor(0x0984e3)
      .setTitle('📋 오늘의 체크인')
      .setTimestamp()
      .setFooter({ text: 'Habit Tracker' });

    if (checkins.length === 0) {
      embed.setDescription('오늘 아직 체크인이 없습니다.');
    } else {
      const TYPE_META: Record<string, { emoji: string; label: string }> = {
        camera_out: { emoji: '📸', label: '카메라외출' },
        work_disconnect: { emoji: '📚', label: '업무 외 학습' },
        workout: { emoji: '🏋️', label: '운동' },
        report: { emoji: '📋', label: '보고서 작성' },
        language_study: { emoji: '🌐', label: '외국어 공부' },
      };
      const REPORT_LABEL: Record<string, string> = {
        daily: '일일보고',
        weekly: '주간보고',
        monthly: '월간보고',
      };
      const LANGUAGE_LABEL: Record<string, { emoji: string; label: string }> = {
        japanese: { emoji: '🇯🇵', label: '일본어' },
        english: { emoji: '🇺🇸', label: '영어' },
      };

      const lines = checkins.map((c) => {
        const meta = TYPE_META[c.type] ?? { emoji: '✅', label: c.type };
        const reportType = (c.customFields as any)?.reportType;
        const languageType = (c.customFields as any)?.languageType;
        const label =
          c.type === 'report' && reportType
            ? REPORT_LABEL[reportType] ?? meta.label
            : c.type === 'language_study' && languageType
              ? `${LANGUAGE_LABEL[languageType]?.emoji ?? '🌐'} ${LANGUAGE_LABEL[languageType]?.label ?? languageType}`
              : meta.label;
        const time = new Date(c.date).toLocaleTimeString('ko-KR', {
          timeZone: 'Asia/Seoul',
          hour: '2-digit',
          minute: '2-digit',
        });
        const memo = c.description ? ` — ${c.description}` : '';
        const displayLabel = c.type === 'language_study' && languageType
          ? label  // 이미 이모지+언어명 포함
          : `${meta.emoji} ${label}`;
        return `${displayLabel} ${time}${memo}`;
      });

      embed
        .setDescription(lines.join('\n'))
        .addFields({ name: '총 체크인', value: `${checkins.length}회`, inline: true });
    }

    await interaction.editReply({ embeds: [embed] });
  }
}
