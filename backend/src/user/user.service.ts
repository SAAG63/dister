import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FeedService } from '../feed/feed.service';
import { USER_SELECT } from '../common/constants/user-select';
import { PaginatedResult } from '../common/types/paginated-result';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly feedService: FeedService,
  ) {}

  async getAll(cursor?: string, limit = 20, search?: string): Promise<PaginatedResult<any>> {
    const where = search
      ? { username: { contains: search, mode: 'insensitive' as const } }
      : undefined;

    const users = await this.prisma.user.findMany({
      where,
      select: USER_SELECT,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });

    const hasMore = users.length > limit;
    const data = hasMore ? users.slice(0, limit) : users;

    return {
      data,
      nextCursor: hasMore ? data[data.length - 1].id : null,
      hasMore,
    };
  }

  async getById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: USER_SELECT,
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getByUsername(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: USER_SELECT,
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getProfileWithCounts(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        ...USER_SELECT,
        email: true,
        _count: {
          select: {
            followers: true,
            following: true,
            posts: { where: { parentId: null } },
          },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(id: string, data: { username?: string; email?: string; avatarUrl?: string }) {
    const user = await this.prisma.user.update({
      where: { id },
      data,
      select: { ...USER_SELECT, email: true },
    });
    await this.feedService.invalidateAllFeeds();
    return user;
  }

  async follow(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new ConflictException('Cannot follow yourself');
    }

    try {
      const follow = await this.prisma.follow.create({
        data: { followerId, followingId },
      });
      await this.feedService.invalidateAllFeeds();
      return follow;
    } catch (e: any) {
      if (e.code === 'P2002') throw new ConflictException('Already following');
      if (e.code === 'P2003') throw new NotFoundException('User not found');
      throw e;
    }
  }

  async unfollow(followerId: string, followingId: string) {
    const { count } = await this.prisma.follow.deleteMany({
      where: { followerId, followingId },
    });
    if (count === 0) throw new NotFoundException('Not following this user');
    await this.feedService.invalidateAllFeeds();
  }

  async isFollowing(currentUserId: string, targetUserId: string): Promise<boolean> {
    const follow = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: currentUserId, followingId: targetUserId } },
    });
    return !!follow;
  }

  async isFollowingBatch(currentUserId: string, targetUserIds: string[]): Promise<Set<string>> {
    if (targetUserIds.length === 0) return new Set();
    const follows = await this.prisma.follow.findMany({
      where: { followerId: currentUserId, followingId: { in: targetUserIds } },
      select: { followingId: true },
    });
    return new Set(follows.map((f) => f.followingId));
  }

  async getFollowers(
    userId: string,
    cursor?: string,
    limit = 20,
  ): Promise<PaginatedResult<any>> {
    const follows = await this.prisma.follow.findMany({
      where: { followingId: userId },
      include: { follower: { select: USER_SELECT } },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && {
        cursor: { followerId_followingId: { followerId: cursor, followingId: userId } },
        skip: 1,
      }),
    });

    const hasMore = follows.length > limit;
    const data = hasMore ? follows.slice(0, limit) : follows;

    return {
      data: data.map((f) => f.follower),
      nextCursor: hasMore ? data[data.length - 1].followerId : null,
      hasMore,
    };
  }

  async getFollowing(
    userId: string,
    cursor?: string,
    limit = 20,
  ): Promise<PaginatedResult<any>> {
    const follows = await this.prisma.follow.findMany({
      where: { followerId: userId },
      include: { following: { select: USER_SELECT } },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && {
        cursor: { followerId_followingId: { followerId: userId, followingId: cursor } },
        skip: 1,
      }),
    });

    const hasMore = follows.length > limit;
    const data = hasMore ? follows.slice(0, limit) : follows;

    return {
      data: data.map((f) => f.following),
      nextCursor: hasMore ? data[data.length - 1].followingId : null,
      hasMore,
    };
  }
}
