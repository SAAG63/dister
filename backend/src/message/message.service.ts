import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaginatedResult } from '../common/types/paginated-result';
import { USER_SELECT } from '../common/constants/user-select';

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
      select: {
        id: true,
        content: true,
        createdAt: true,
        channelId: true,
        authorId: true,
        reactionCounts: true,
        author: { select: USER_SELECT },
      },
    });
  }

  async getByChannel(channelId: string, cursor?: string, limit = 20): Promise<PaginatedResult<any>> {
    const messages = await this.prisma.message.findMany({
      where: { channelId },
      select: {
        id: true,
        content: true,
        createdAt: true,
        channelId: true,
        authorId: true,
        reactionCounts: true,
        author: { select: USER_SELECT },
      },
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

    if (message.authorId !== userId) {
      const member = await this.prisma.channelMember.findUnique({
        where: { channelId_userId: { channelId: message.channelId, userId } },
      });
      if (!member || (member.role !== 'OWNER' && member.role !== 'MODERATOR')) {
        throw new ForbiddenException('Not your message');
      }
    }

    await this.prisma.$transaction([
      this.prisma.reaction.deleteMany({
        where: { targetType: 'MESSAGE', targetId: messageId },
      }),
      this.prisma.message.delete({ where: { id: messageId } }),
    ]);
  }

  private async verifyMembership(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: {
        channelId: true,
        channel: {
          select: { members: { where: { userId }, select: { role: true } } },
        },
      },
    });
    if (!message) throw new NotFoundException('Message not found');
    if (message.channel.members.length === 0) throw new ForbiddenException('Not a channel member');
    return message;
  }

  async addReaction(messageId: string, userId: string, emoji: string) {
    await this.verifyMembership(messageId, userId);

    try {
      const [reaction] = await this.prisma.$transaction([
        this.prisma.reaction.create({
          data: { userId, targetType: 'MESSAGE', targetId: messageId, emoji },
        }),
        this.prisma.$queryRaw(Prisma.sql`
          UPDATE "Message"
          SET "reactionCounts" = jsonb_set(
            COALESCE("reactionCounts", '{}')::jsonb,
            ARRAY[${emoji}]::text[],
            (COALESCE(("reactionCounts"->>CAST(${emoji} AS text))::int, 0) + 1)::text::jsonb
          )
          WHERE id = ${messageId}
        `),
      ]);
      return reaction;
    } catch (e: any) {
      if (e.code === 'P2002') throw new ConflictException('Reaction already exists');
      if (e.code === 'P2003') throw new NotFoundException('Message not found');
      throw e;
    }
  }

  async removeReaction(messageId: string, userId: string, emoji: string) {
    await this.verifyMembership(messageId, userId);

    const existing = await this.prisma.reaction.findUnique({
      where: {
        userId_targetType_targetId_emoji: {
          userId, targetType: 'MESSAGE', targetId: messageId, emoji,
        },
      },
    });
    if (!existing) throw new NotFoundException('Reaction not found');

    await this.prisma.$transaction([
      this.prisma.reaction.delete({ where: { id: existing.id } }),
      this.prisma.$queryRaw(Prisma.sql`
        UPDATE "Message"
        SET "reactionCounts" = jsonb_set(
          COALESCE("reactionCounts", '{}')::jsonb,
          ARRAY[${emoji}]::text[],
          (GREATEST(COALESCE(("reactionCounts"->>CAST(${emoji} AS text))::int, 0) - 1, 0))::text::jsonb
        )
        WHERE id = ${messageId}
      `),
    ]);
  }

  async getMyReactions(userId: string, messageIds: string[]) {
    if (messageIds.length === 0) return [];
    return this.prisma.reaction.findMany({
      where: {
        userId,
        targetType: 'MESSAGE',
        targetId: { in: messageIds },
      },
      select: { targetId: true, emoji: true },
    });
  }
}
