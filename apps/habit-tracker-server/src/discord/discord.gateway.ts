import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { DiscordService } from './discord.service';
import { ReadyEventHandler } from './events/ready.event';
import { InteractionEventHandler } from './events/interaction.event';
import { PingCommand } from './commands/ping.command';
import { CheckinCommand } from '../checkin/commands/checkin.command';
import { TodayCheckinCommand } from '../checkin/commands/today-checkin.command';
import { WeeklyCheckinCommand } from '../checkin/commands/weekly-checkin.command';

@Injectable()
export class DiscordGateway implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DiscordGateway.name);

  constructor(
    private readonly discordService: DiscordService,
    private readonly readyEventHandler: ReadyEventHandler,
    private readonly interactionEventHandler: InteractionEventHandler,
    private readonly pingCommand: PingCommand,
    private readonly checkinCommand: CheckinCommand,
    private readonly todayCheckinCommand: TodayCheckinCommand,
    private readonly weeklyCheckinCommand: WeeklyCheckinCommand,
  ) {}

  async onModuleInit() {
    this.logger.log('🚀 Initializing Discord Gateway...');

    const client = this.discordService.getClient();

    this.readyEventHandler.register(client);

    const commands = [
      this.pingCommand,
      this.checkinCommand,
      this.todayCheckinCommand,
      this.weeklyCheckinCommand,
    ];

    this.interactionEventHandler.register(client, commands);

    await this.discordService.connect();
    await this.discordService.registerGuildCommands(commands);

    this.logger.log('✅ Discord Gateway initialized');
  }

  async onModuleDestroy() {
    this.logger.log('🔌 Disconnecting Discord bot...');
    await this.discordService.disconnect();
    this.logger.log('👋 Discord bot disconnected');
  }
}
