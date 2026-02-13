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
import { HelloCommand } from './commands/hello.command';
import { CheckinTestCommand } from './commands/checkin-test.command';

@Injectable()
export class DiscordGateway implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DiscordGateway.name);

  constructor(
    private readonly discordService: DiscordService,
    private readonly readyEventHandler: ReadyEventHandler,
    private readonly interactionEventHandler: InteractionEventHandler,
    private readonly pingCommand: PingCommand,
    private readonly helloCommand: HelloCommand,
    private readonly checkinTestCommand: CheckinTestCommand,
  ) {}

  async onModuleInit() {
    this.logger.log('🚀 Initializing Discord Gateway...');

    const client = this.discordService.getClient();

    // 이벤트 핸들러 등록
    this.readyEventHandler.register(client);

    // 커맨드 수집
    const commands = [
      this.pingCommand,
      this.helloCommand,
      this.checkinTestCommand,
    ];

    // Interaction 핸들러 등록
    this.interactionEventHandler.register(client, commands);

    // 봇 연결
    await this.discordService.connect();

    // Guild 커맨드 등록
    await this.discordService.registerGuildCommands(commands);

    this.logger.log('✅ Discord Gateway initialized');
  }

  async onModuleDestroy() {
    this.logger.log('🔌 Disconnecting Discord bot...');
    await this.discordService.disconnect();
    this.logger.log('👋 Discord bot disconnected');
  }
}
