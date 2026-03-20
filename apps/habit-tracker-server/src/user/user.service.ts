import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  }): Promise<void> {
    await this.prisma.discordUser.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
      update: {
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
    });
  }
}
