import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { PaginatedResult } from '../common/types/paginated-result';
import { USER_SELECT } from '../common/constants/user-select';

@Injectable()
export class FeedService {
  private readonly feedKeys = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async getFeed(userId: string, cursor?: string, limit = 20): Promise<PaginatedResult<any>> {
    if (!cursor) {
      const cacheKey = `feed:${userId}`;
      const cached = await this.cache.get<PaginatedResult<any>>(cacheKey);
      if (cached) return cached;
    }

    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map((f) => f.followingId);
    followingIds.push(userId);

    const posts = await this.prisma.post.findMany({
      where: {
        authorId: { in: followingIds },
        parentId: null,
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        authorId: true,
        parentId: true,
        reactionCounts: true,
        replyCount: true,
        author: { select: USER_SELECT },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });

    const hasMore = posts.length > limit;
    const data = hasMore ? posts.slice(0, limit) : posts;

    const result: PaginatedResult<any> = {
      data,
      nextCursor: hasMore ? data[data.length - 1].id : null,
      hasMore,
    };

    if (!cursor) {
      const cacheKey = `feed:${userId}`;
      this.feedKeys.add(cacheKey);
      await this.cache.set(cacheKey, result, 30_000);
    }

    return result;
  }

  async invalidateFeed(userId: string) {
    await this.cache.del(`feed:${userId}`);
    this.feedKeys.delete(`feed:${userId}`);
  }

  async invalidateAllFeeds() {
    const deletes = [...this.feedKeys].map((key) => this.cache.del(key));
    await Promise.all(deletes);
    this.feedKeys.clear();
  }
}
