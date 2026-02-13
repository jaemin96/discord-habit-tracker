import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export interface ICommand {
  name: string;
  description: string;
  toJSON(): ReturnType<SlashCommandBuilder['toJSON']>;
  execute(interaction: ChatInputCommandInteraction): Promise<void>;
}
