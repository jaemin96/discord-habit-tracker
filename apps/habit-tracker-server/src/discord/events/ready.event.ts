import { Injectable, Logger } from '@nestjs/common';
import { Client, Events, ActivityType } from 'discord.js';

@Injectable()
export class ReadyEventHandler {
  private readonly logger = new Logger(ReadyEventHandler.name);

  register(client: Client): void {
    client.once(Events.ClientReady, (readyClient) => {
      this.logger.log(
        `✅ Discord bot logged in as ${readyClient.user.tag}`,
      );

      // 봇 상태 설정
      readyClient.user.setPresence({
        activities: [
          {
            name: 'your habits 📊',
            type: ActivityType.Watching,
          },
        ],
        status: 'online',
      });

      this.logger.log(`🤖 Bot status set to "Watching your habits 📊"`);
    });
  }
}
