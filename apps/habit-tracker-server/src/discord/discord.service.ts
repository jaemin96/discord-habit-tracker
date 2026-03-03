import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';
import { ICommand } from './commands/command.interface';

@Injectable()
export class DiscordService {
  private readonly logger = new Logger(DiscordService.name);
  private client: Client;
  private rest: REST;

  constructor(private configService: ConfigService) {
    this.client = new Client({
      intents: [GatewayIntentBits.Guilds],
    });

    const token = this.configService.get<string>('discord.botToken');
    if (!token) {
      throw new Error('DISCORD_BOT_TOKEN is not configured');
    }
    this.rest = new REST({ version: '10' }).setToken(token);
  }

  async connect(): Promise<void> {
    const token = this.configService.get<string>('discord.botToken');

    try {
      await this.client.login(token);
      this.logger.log('🔌 Discord bot connected');
    } catch (error) {
      this.logger.error('❌ Failed to login to Discord', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.client.destroy();
    this.logger.log('🔌 Discord bot disconnected');
  }

  async registerGuildCommands(commands: ICommand[]): Promise<void> {
    const clientId = this.configService.get<string>('discord.clientId');
    const guildId = this.configService.get<string>('discord.guildId');

    if (!clientId || !guildId) {
      throw new Error('DISCORD_CLIENT_ID or DISCORD_GUILD_ID is not configured');
    }

    const commandsJSON = commands.map((cmd) => cmd.toJSON());

    try {
      this.logger.log(`📝 Registering ${commands.length} guild commands...`);

      await this.rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: commandsJSON,
      });

      this.logger.log(`✅ Successfully registered ${commands.length} guild commands`);
    } catch (error) {
      this.logger.error('❌ Failed to register guild commands', error);
      throw error;
    }
  }

  getClient(): Client {
    return this.client;
  }
}
