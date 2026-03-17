import { Injectable } from '@nestjs/common';
import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
} from 'discord.js';
import { ICommand } from '../../discord/commands/command.interface';
import { CheckinService } from '../checkin.service';

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
      .addFields(
        { name: '총 체크인', value: `${stats.total}회`, inline: true },
        { name: '📸 카메라외출', value: `${stats.camera_out}회`, inline: true },
        { name: '💼 업무단절', value: `${stats.work_disconnect}회`, inline: true },
      )
      .setTimestamp()
      .setFooter({ text: 'Habit Tracker' });

    if (stats.dates.length > 0) {
      embed.addFields({
        name: '체크인한 날',
        value: stats.dates.join(', '),
        inline: false,
      });
    } else {
      embed.setDescription('이번 주 체크인 기록이 없습니다.');
    }

    await interaction.editReply({ embeds: [embed] });
  }
}
