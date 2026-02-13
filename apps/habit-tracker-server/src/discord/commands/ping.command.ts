import { Injectable } from '@nestjs/common';
import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  Client,
} from 'discord.js';
import { ICommand } from './command.interface';

@Injectable()
export class PingCommand implements ICommand {
  name = 'ping';
  description = '봇의 레이턴시를 측정합니다';

  constructor(private client: Client) {}

  toJSON() {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .toJSON();
  }

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const sent = await interaction.reply({
      content: '🏓 Pong! 측정중...',
      fetchReply: true,
    });

    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const apiLatency = Math.round(this.client.ws.ping);

    await interaction.editReply(
      `🏓 Pong!\n` +
        `📡 레이턴시: ${latency}ms\n` +
        `💓 API 레이턴시: ${apiLatency}ms`,
    );
  }
}
