import { Injectable } from '@nestjs/common';
import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
} from 'discord.js';
import { ICommand } from './command.interface';

@Injectable()
export class CheckinTestCommand implements ICommand {
  name = 'checkin-test';
  description = '습관 체크인 테스트';

  toJSON() {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addStringOption((option) =>
        option
          .setName('type')
          .setDescription('체크인 타입')
          .setRequired(true)
          .addChoices(
            { name: '📸 카메라외출', value: 'camera_out' },
            { name: '📚 업무 외 학습', value: 'work_disconnect' },
          ),
      )
      .addStringOption((option) =>
        option
          .setName('memo')
          .setDescription('메모 (선택사항)')
          .setRequired(false),
      )
      .toJSON();
  }

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const type = interaction.options.getString('type', true);
    const memo = interaction.options.getString('memo');

    const typeEmoji = type === 'camera_out' ? '📸' : '💼';
    const typeName =
      type === 'camera_out' ? '카메라외출' : '업무 외 학습';

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle(`${typeEmoji} 체크인 완료!`)
      .setDescription(`**타입:** ${typeName}`)
      .addFields(
        {
          name: '사용자',
          value: interaction.user.tag,
          inline: true,
        },
        {
          name: '시간',
          value: new Date().toLocaleString('ko-KR', {
            timeZone: 'Asia/Seoul',
          }),
          inline: true,
        },
      )
      .setTimestamp()
      .setFooter({ text: 'Habit Tracker Bot' });

    if (memo) {
      embed.addFields({ name: '메모', value: memo });
    }

    await interaction.reply({ embeds: [embed] });
  }
}
