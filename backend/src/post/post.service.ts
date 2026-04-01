import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginatedResult } from '../common/types/paginated-result';
import { Post } from '@prisma/client';

@Injectable()
export class PostService {
  constructor(private readonly prisma: PrismaService) {}

  async create(authorId: string, content: string, parentId?: string) {
    if (parentId) {
      const parent = await this.prisma.post.findUnique({ where: { id: parentId } });
      if (!parent) throw new NotFoundException('Parent post not found');
    }

    return this.prisma.post.create({
      data: { authorId, content, parentId },
      include: { author: true },
    });
  }

  async getById(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: { author: true },
    });
    if (!post) throw new NotFoundException('Post not found');

    const reactions = await this.prisma.reaction.findMany({
      where: { targetType: 'POST', targetId: id },
    });

    return { ...post, reactions };
  }

  async getThread(postId: string, cursor?: string, limit = 20): Promise<PaginatedResult<Post>> {
    await this.getById(postId);

    const replies = await this.prisma.post.findMany({
      where: { parentId: postId },
      include: { author: true },
      orderBy: { createdAt: 'asc' },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });

    const hasMore = replies.length > limit;
    const data = hasMore ? replies.slice(0, limit) : replies;

    return {
      data,
      nextCursor: hasMore ? data[data.length - 1].id : null,
      hasMore,
    };
  }

  async delete(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== userId) throw new ForbiddenException('Not your post');

    return this.prisma.post.delete({ where: { id: postId } });
  }

  async addReaction(postId: string, userId: string, emoji: string) {
    await this.getById(postId);

    const existing = await this.prisma.reaction.findUnique({
      where: {
        userId_targetType_targetId_emoji: {
          userId, targetType: 'POST', targetId: postId, emoji,
        },
      },
    });
    if (existing) throw new ConflictException('Reaction already exists');

    return this.prisma.reaction.create({
      data: { userId, targetType: 'POST', targetId: postId, emoji },
    });
  }

  async removeReaction(postId: string, userId: string, emoji: string) {
    const existing = await this.prisma.reaction.findUnique({
      where: {
        userId_targetType_targetId_emoji: {
          userId, targetType: 'POST', targetId: postId, emoji,
        },
      },
    });
    if (!existing) throw new NotFoundException('Reaction not found');

    return this.prisma.reaction.delete({ where: { id: existing.id } });
  }
}
