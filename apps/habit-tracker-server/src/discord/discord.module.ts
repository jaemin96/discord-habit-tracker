import { Module } from '@nestjs/common';
import { Client } from 'discord.js';
import { DiscordService } from './discord.service';
import { DiscordGateway } from './discord.gateway';
import { ReadyEventHandler } from './events/ready.event';
import { InteractionEventHandler } from './events/interaction.event';
import { PingCommand } from './commands/ping.command';
import { HelloCommand } from './commands/hello.command';
import { CheckinTestCommand } from './commands/checkin-test.command';

@Module({
  providers: [
    DiscordService,
    {
      provide: Client,
      useFactory: (discordService: DiscordService) =>
        discordService.getClient(),
      inject: [DiscordService],
    },
    DiscordGateway,
    ReadyEventHandler,
    InteractionEventHandler,
    PingCommand,
    HelloCommand,
    CheckinTestCommand,
  ],
  exports: [DiscordService],
})
export class DiscordModule {}
