import { Injectable, Logger } from '@nestjs/common';
import { Client, Events } from 'discord.js';
import { ICommand } from '../commands/command.interface';
import { UserService } from '../../user/user.service';

@Injectable()
export class InteractionEventHandler {
  private readonly logger = new Logger(InteractionEventHandler.name);
  private commandMap = new Map<string, ICommand>();

  constructor(private readonly userService: UserService) {}

  register(client: Client, commands: ICommand[]): void {
    // Command Map 초기화
    commands.forEach((command) => {
      this.commandMap.set(command.name, command);
      this.logger.log(`📝 Registered command: /${command.name}`);
    });

    // Interaction 이벤트 리스너
    client.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isChatInputCommand()) return;

      const command = this.commandMap.get(interaction.commandName);

      if (!command) {
        this.logger.warn(
          `❌ Unknown command: /${interaction.commandName}`,
        );
        return;
      }

      try {
        this.logger.log(
          `⚡ Executing command: /${interaction.commandName} by ${interaction.user.tag}`,
        );

        // Discord 사용자 정보 upsert (최신 이름/아바타 유지)
        await this.userService.upsert({
          id: interaction.user.id,
          username: interaction.user.username,
          displayName: interaction.user.displayName,
          avatarUrl: interaction.user.avatarURL() ?? null,
        });

        await command.execute(interaction);
      } catch (error) {
        this.logger.error(
          `❌ Error executing command: /${interaction.commandName}`,
          error,
        );

        const errorMessage = '❌ 명령어 실행 중 오류가 발생했습니다.';

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: errorMessage,
            ephemeral: true,
          });
        } else {
          await interaction.reply({
            content: errorMessage,
            ephemeral: true,
          });
        }
      }
    });
  }
}
