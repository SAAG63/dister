import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FeedService } from '../feed/feed.service';
import { PaginatedResult } from '../common/types/paginated-result';
import { USER_SELECT } from '../common/constants/user-select';

@Injectable()
export class PostService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly feedService: FeedService,
  ) {}

  private readonly postSelect = {
    id: true,
    content: true,
    createdAt: true,
    authorId: true,
    parentId: true,
    reactionCounts: true,
    replyCount: true,
    author: { select: USER_SELECT },
  };

  async create(authorId: string, content: string, parentId?: string) {
    if (parentId) {
      const parent = await this.prisma.post.findUnique({ where: { id: parentId } });
      if (!parent) throw new NotFoundException('Parent post not found');
    }

    const [post] = await this.prisma.$transaction([
      this.prisma.post.create({
        data: { authorId, content, parentId },
        select: this.postSelect,
      }),
      ...(parentId
        ? [this.prisma.post.update({
            where: { id: parentId },
            data: { replyCount: { increment: 1 } },
          })]
        : []),
    ]);

    await this.feedService.invalidateAllFeeds();

    return post;
  }

  async getById(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      select: this.postSelect,
    });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async getByAuthor(
    authorId: string,
    cursor?: string,
    limit = 20,
  ): Promise<PaginatedResult<any>> {
    const posts = await this.prisma.post.findMany({
      where: { authorId, parentId: null },
      select: this.postSelect,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });

    const hasMore = posts.length > limit;
    const data = hasMore ? posts.slice(0, limit) : posts;

    return {
      data,
      nextCursor: hasMore ? data[data.length - 1].id : null,
      hasMore,
    };
  }

  async getThread(postId: string, cursor?: string, limit = 20): Promise<PaginatedResult<any>> {
    const exists = await this.prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
    if (!exists) throw new NotFoundException('Post not found');

    const replies = await this.prisma.post.findMany({
      where: { parentId: postId },
      select: this.postSelect,
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
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true, parentId: true },
    });
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== userId) throw new ForbiddenException('Not your post');

    const allDescendantIds: string[] = [];
    const queue = [postId];
    while (queue.length > 0) {
      const parentIds = queue.splice(0, queue.length);
      const children = await this.prisma.post.findMany({
        where: { parentId: { in: parentIds } },
        select: { id: true },
      });
      for (const child of children) {
        allDescendantIds.push(child.id);
        queue.push(child.id);
      }
    }

    const allTargetIds = [postId, ...allDescendantIds];

    await this.prisma.$transaction([
      this.prisma.reaction.deleteMany({
        where: { targetType: 'POST', targetId: { in: allTargetIds } },
      }),
      this.prisma.post.delete({ where: { id: postId } }),
      ...(post.parentId
        ? [this.prisma.post.update({
            where: { id: post.parentId },
            data: { replyCount: { decrement: 1 } },
          })]
        : []),
    ]);

    await this.feedService.invalidateAllFeeds();
  }

  async addReaction(postId: string, userId: string, emoji: string) {
    try {
      const [reaction] = await this.prisma.$transaction([
        this.prisma.reaction.create({
          data: { userId, targetType: 'POST', targetId: postId, emoji },
        }),
        this.prisma.$queryRaw(Prisma.sql`
          UPDATE "Post"
          SET "reactionCounts" = jsonb_set(
            COALESCE("reactionCounts", '{}')::jsonb,
            ARRAY[${emoji}]::text[],
            (COALESCE(("reactionCounts"->>CAST(${emoji} AS text))::int, 0) + 1)::text::jsonb
          )
          WHERE id = ${postId}
        `),
      ]);
      return reaction;
    } catch (e: any) {
      if (e.code === 'P2002') throw new ConflictException('Reaction already exists');
      if (e.code === 'P2003') throw new NotFoundException('Post not found');
      throw e;
    }
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

    await this.prisma.$transaction([
      this.prisma.reaction.delete({ where: { id: existing.id } }),
      this.prisma.$queryRaw(Prisma.sql`
        UPDATE "Post"
        SET "reactionCounts" = jsonb_set(
          COALESCE("reactionCounts", '{}')::jsonb,
          ARRAY[${emoji}]::text[],
          (GREATEST(COALESCE(("reactionCounts"->>CAST(${emoji} AS text))::int, 0) - 1, 0))::text::jsonb
        )
        WHERE id = ${postId}
      `),
    ]);
  }

  async getMyReactions(userId: string, postIds: string[]) {
    if (postIds.length === 0) return [];
    return this.prisma.reaction.findMany({
      where: {
        userId,
        targetType: 'POST',
        targetId: { in: postIds },
      },
      select: { targetId: true, emoji: true },
    });
  }
}
