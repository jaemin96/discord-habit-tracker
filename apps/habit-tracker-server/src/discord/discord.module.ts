import { Module } from '@nestjs/common';
import { Client } from 'discord.js';
import { DiscordService } from './discord.service';
import { DiscordGateway } from './discord.gateway';
import { ReadyEventHandler } from './events/ready.event';
import { InteractionEventHandler } from './events/interaction.event';
import { PingCommand } from './commands/ping.command';
import { CheckinModule } from '../checkin/checkin.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [CheckinModule, AnalyticsModule, UserModule],
  providers: [
    DiscordService,
    {
      provide: Client,
      useFactory: (discordService: DiscordService) => discordService.getClient(),
      inject: [DiscordService],
    },
    DiscordGateway,
    ReadyEventHandler,
    InteractionEventHandler,
    PingCommand,
  ],
  exports: [DiscordService],
})
export class DiscordModule {}
