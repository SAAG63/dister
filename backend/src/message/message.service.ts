import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginatedResult } from '../common/types/paginated-result';
import { Message } from '@prisma/client';

@Injectable()
export class MessageService {
  constructor(private readonly prisma: PrismaService) {}

  async send(channelId: string, authorId: string, content: string) {
    const member = await this.prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId, userId: authorId } },
    });
    if (!member) throw new ForbiddenException('Not a channel member');

    return this.prisma.message.create({
      data: { channelId, authorId, content },
      include: { author: true },
    });
  }

  async getByChannel(channelId: string, cursor?: string, limit = 20): Promise<PaginatedResult<Message>> {
    const channel = await this.prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel) throw new NotFoundException('Channel not found');

    const messages = await this.prisma.message.findMany({
      where: { channelId },
      include: { author: true },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });

    const hasMore = messages.length > limit;
    const data = hasMore ? messages.slice(0, limit) : messages;

    return {
      data,
      nextCursor: hasMore ? data[data.length - 1].id : null,
      hasMore,
    };
  }

  async delete(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!message) throw new NotFoundException('Message not found');
    if (message.authorId !== userId) throw new ForbiddenException('Not your message');

    return this.prisma.message.delete({ where: { id: messageId } });
  }

  async addReaction(messageId: string, userId: string, emoji: string) {
    const message = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!message) throw new NotFoundException('Message not found');

    const existing = await this.prisma.reaction.findUnique({
      where: {
        userId_targetType_targetId_emoji: {
          userId, targetType: 'MESSAGE', targetId: messageId, emoji,
        },
      },
    });
    if (existing) throw new ConflictException('Reaction already exists');

    return this.prisma.reaction.create({
      data: { userId, targetType: 'MESSAGE', targetId: messageId, emoji },
    });
  }

  async removeReaction(messageId: string, userId: string, emoji: string) {
    const existing = await this.prisma.reaction.findUnique({
      where: {
        userId_targetType_targetId_emoji: {
          userId, targetType: 'MESSAGE', targetId: messageId, emoji,
        },
      },
    });
    if (!existing) throw new NotFoundException('Reaction not found');

    return this.prisma.reaction.delete({ where: { id: existing.id } });
  }
}
