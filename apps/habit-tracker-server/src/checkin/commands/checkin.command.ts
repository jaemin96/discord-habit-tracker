import { Injectable } from '@nestjs/common';
import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
} from 'discord.js';
import { ICommand } from '../../discord/commands/command.interface';
import { CheckinService, CheckinType } from '../checkin.service';

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
    const memo = interaction.options.getString('메모') ?? undefined;
    const userId = interaction.user.id;

    const checkin = await this.checkinService.create(userId, type, memo);

    const typeEmoji = type === 'camera_out' ? '📸' : '💼';
    const typeName = type === 'camera_out' ? '카메라외출' : '업무단절';
    const timeStr = new Date(checkin.date).toLocaleString('ko-KR', {
      timeZone: 'Asia/Seoul',
    });

    const embed = new EmbedBuilder()
      .setColor(0x00b894)
      .setTitle(`${typeEmoji} 체크인 완료!`)
      .addFields(
        { name: '타입', value: typeName, inline: true },
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
