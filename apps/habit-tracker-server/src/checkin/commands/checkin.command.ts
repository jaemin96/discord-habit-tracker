import { Injectable } from '@nestjs/common';
import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
} from 'discord.js';
import { ICommand } from '../../discord/commands/command.interface';
import { CheckinService, CheckinType, ReportType } from '../checkin.service';

const TYPE_META: Record<CheckinType, { emoji: string; label: string }> = {
  camera_out: { emoji: '📸', label: '카메라외출' },
  work_disconnect: { emoji: '💼', label: '업무단절' },
  workout: { emoji: '🏋️', label: '운동' },
  report: { emoji: '📋', label: '보고서 작성' },
};

const REPORT_TYPE_META: Record<ReportType, { emoji: string; label: string }> = {
  daily: { emoji: '📝', label: '일일보고' },
  weekly: { emoji: '📊', label: '주간보고' },
  monthly: { emoji: '📅', label: '월간보고' },
};

@Injectable()
export class CheckinCommand implements ICommand {
  name = '체크인';
  description = '오늘의 습관을 체크인합니다';

  constructor(private readonly checkinService: CheckinService) {}

  toJSON() {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addStringOption((option) =>
        option
          .setName('타입')
          .setDescription('체크인 타입')
          .setRequired(true)
          .addChoices(
            { name: '📸 카메라외출', value: 'camera_out' },
            { name: '💼 업무단절', value: 'work_disconnect' },
            { name: '🏋️ 운동', value: 'workout' },
            { name: '📋 보고서 작성', value: 'report' },
          ),
      )
      .addStringOption((option) =>
        option
          .setName('보고서종류')
          .setDescription('📋 보고서 작성 타입 선택 시 필수 — 일일/주간/월간')
          .setRequired(false)
          .addChoices(
            { name: '📝 일일보고', value: 'daily' },
            { name: '📊 주간보고', value: 'weekly' },
            { name: '📅 월간보고', value: 'monthly' },
          ),
      )
      .addStringOption((option) =>
        option
          .setName('메모')
          .setDescription('메모 (선택사항)')
          .setRequired(false),
      )
      .toJSON();
  }

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();

    const type = interaction.options.getString('타입', true) as CheckinType;
    const reportType = interaction.options.getString('보고서종류') as ReportType | null;
    const memo = interaction.options.getString('메모') ?? undefined;
    const userId = interaction.user.id;

    if (type === 'report' && !reportType) {
      await interaction.editReply('📋 보고서 작성 체크인 시 **보고서종류** (일일/주간/월간)를 선택해주세요.');
      return;
    }

    const LIMITED_TYPES: CheckinType[] = ['work_disconnect', 'report'];
    if (LIMITED_TYPES.includes(type)) {
      const already = await this.checkinService.hasTodayCheckin(userId, type, reportType ?? undefined);
      if (already) {
        const label =
          type === 'report' && reportType
            ? REPORT_TYPE_META[reportType].label
            : TYPE_META[type].label;
        const period =
          reportType === 'weekly' ? '이번 주' :
          reportType === 'monthly' ? '이번 달' : '오늘';
        await interaction.editReply(`이미 ${period} **${label}** 체크인을 완료했습니다.`);
        return;
      }
    }

    const checkin = await this.checkinService.create(userId, type, memo, reportType ?? undefined);

    const { emoji, label } = TYPE_META[type];
    const timeStr = new Date(checkin.date).toLocaleString('ko-KR', {
      timeZone: 'Asia/Seoul',
    });

    const displayLabel =
      type === 'report' && reportType
        ? `${REPORT_TYPE_META[reportType].emoji} ${REPORT_TYPE_META[reportType].label}`
        : `${emoji} ${label}`;

    const embed = new EmbedBuilder()
      .setColor(0x00b894)
      .setTitle(`${emoji} 체크인 완료!`)
      .addFields(
        { name: '타입', value: displayLabel, inline: true },
        { name: '사용자', value: interaction.user.displayName, inline: true },
        { name: '시간', value: timeStr, inline: false },
      )
      .setTimestamp()
      .setFooter({ text: 'Habit Tracker' });

    if (memo) {
      embed.addFields({ name: '메모', value: memo });
    }

    await interaction.editReply({ embeds: [embed] });
  }
}
