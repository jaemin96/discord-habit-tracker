import { Injectable } from '@nestjs/common';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { ICommand } from './command.interface';

@Injectable()
export class HelloCommand implements ICommand {
  name = 'hello';
  description = '봇이 인사합니다';

  toJSON() {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addStringOption((option) =>
        option
          .setName('name')
          .setDescription('이름을 입력하세요')
          .setRequired(false),
      )
      .toJSON();
  }

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const name = interaction.options.getString('name');

    if (name) {
      await interaction.reply(`👋 안녕하세요, ${name}님!`);
    } else {
      await interaction.reply(`👋 안녕하세요!`);
    }
  }
}
