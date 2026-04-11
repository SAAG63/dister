import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { USER_SELECT } from '../common/constants/user-select';
import { PaginatedResult } from '../common/types/paginated-result';

const CHANNELS_CACHE_KEY = 'channels:public';
const CHANNELS_CACHE_TTL = 300_000;

@Injectable()
export class ChannelService {
  private readonly channelCacheKeys = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async create(ownerId: string, name: string, description?: string, isPublic = true) {
    const channelId = crypto.randomUUID();

    const [channel] = await this.prisma.$transaction([
      this.prisma.channel.create({
        data: { id: channelId, name, description, isPublic, ownerId, memberCount: 1 },
      }),
      this.prisma.channelMember.create({
        data: { channelId, userId: ownerId, role: 'OWNER' },
      }),
    ]);

    await this.invalidateChannelsCache();
    return channel;
  }

  async getById(id: string) {
    const channel = await this.prisma.channel.findUnique({
      where: { id },
      include: { owner: { select: USER_SELECT } },
    });
    if (!channel) throw new NotFoundException('Channel not found');
    return channel;
  }

  async getPublicChannels(cursor?: string, limit = 20): Promise<PaginatedResult<any>> {
    if (!cursor) {
      const cacheKey = `${CHANNELS_CACHE_KEY}:${limit}`;
      const cached = await this.cache.get<PaginatedResult<any>>(cacheKey);
      if (cached) return cached;
    }

    const channels = await this.prisma.channel.findMany({
      where: { isPublic: true },
      include: {
        owner: { select: USER_SELECT },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });

    const hasMore = channels.length > limit;
    const data = hasMore ? channels.slice(0, limit) : channels;

    const result: PaginatedResult<any> = {
      data,
      nextCursor: hasMore ? data[data.length - 1].id : null,
      hasMore,
    };

    if (!cursor) {
      const cacheKey = `${CHANNELS_CACHE_KEY}:${limit}`;
      this.channelCacheKeys.add(cacheKey);
      await this.cache.set(cacheKey, result, CHANNELS_CACHE_TTL);
    }

    return result;
  }

  async getMyChannels(userId: string): Promise<any[]> {
    const memberships = await this.prisma.channelMember.findMany({
      where: { userId },
      include: {
        channel: { include: { owner: { select: USER_SELECT } } },
      },
      orderBy: { joinedAt: 'desc' },
    });
    return memberships.map((m) => ({ ...m.channel, role: m.role }));
  }

  async invite(channelId: string, targetUserId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) throw new NotFoundException('User not found');

    try {
      const [member] = await this.prisma.$transaction([
        this.prisma.channelMember.create({
          data: { channelId, userId: targetUserId, role: 'MEMBER' },
        }),
        this.prisma.channel.update({
          where: { id: channelId },
          data: { memberCount: { increment: 1 } },
        }),
      ]);
      await this.invalidateChannelsCache();
      return member;
    } catch (e: any) {
      if (e.code === 'P2002') throw new ConflictException('Already a member');
      throw e;
    }
  }

  private async invalidateChannelsCache() {
    const deletes = [...this.channelCacheKeys].map((key) => this.cache.del(key));
    await Promise.all(deletes);
    this.channelCacheKeys.clear();
  }

  async getMemberRole(channelId: string, userId: string): Promise<string | null> {
    const member = await this.prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId, userId } },
    });
    return member?.role ?? null;
  }

  async updateChannel(channelId: string, userId: string, data: { name?: string; description?: string }) {
    const member = await this.prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId, userId } },
    });
    if (!member || (member.role !== 'OWNER' && member.role !== 'MODERATOR')) {
      throw new ForbiddenException('Not enough permissions');
    }

    const updated = await this.prisma.channel.update({ where: { id: channelId }, data });
    await this.invalidateChannelsCache();
    return updated;
  }

  async updateChannelDirect(channelId: string, data: { name?: string; description?: string }) {
    const updated = await this.prisma.channel.update({ where: { id: channelId }, data });
    await this.invalidateChannelsCache();
    return updated;
  }

  async join(channelId: string, userId: string) {
    try {
      const [member] = await this.prisma.$transaction([
        this.prisma.channelMember.create({
          data: { channelId, userId, role: 'MEMBER' },
        }),
        this.prisma.channel.update({
          where: { id: channelId },
          data: { memberCount: { increment: 1 } },
        }),
      ]);
      await this.invalidateChannelsCache();
      return member;
    } catch (e: any) {
      if (e.code === 'P2002') throw new ConflictException('Already a member');
      if (e.code === 'P2003') throw new NotFoundException('Channel not found');
      throw e;
    }
  }

  async leave(channelId: string, userId: string) {
    const member = await this.prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId, userId } },
    });
    if (!member) throw new NotFoundException('Not a member');
    if (member.role === 'OWNER') throw new ForbiddenException('Owner cannot leave');

    await this.prisma.$transaction([
      this.prisma.channelMember.delete({
        where: { channelId_userId: { channelId, userId } },
      }),
      this.prisma.channel.update({
        where: { id: channelId },
        data: { memberCount: { decrement: 1 } },
      }),
    ]);
    await this.invalidateChannelsCache();
  }

  async setMemberRole(channelId: string, targetUserId: string, role: 'MODERATOR' | 'MEMBER') {
    const member = await this.prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId, userId: targetUserId } },
    });
    if (!member) throw new NotFoundException('Member not found');
    if (member.role === 'OWNER') throw new ForbiddenException('Cannot change owner role');

    return this.prisma.channelMember.update({
      where: { channelId_userId: { channelId, userId: targetUserId } },
      data: { role },
      include: { user: { select: USER_SELECT } },
    });
  }

  async kick(channelId: string, targetUserId: string) {
    const member = await this.prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId, userId: targetUserId } },
    });
    if (!member) throw new NotFoundException('Member not found');
    if (member.role === 'OWNER') throw new ForbiddenException('Cannot kick the owner');

    await this.prisma.$transaction([
      this.prisma.channelMember.delete({
        where: { channelId_userId: { channelId, userId: targetUserId } },
      }),
      this.prisma.channel.update({
        where: { id: channelId },
        data: { memberCount: { decrement: 1 } },
      }),
    ]);
    await this.invalidateChannelsCache();
  }

  async isMember(channelId: string, userId: string): Promise<boolean> {
    const member = await this.prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId, userId } },
    });
    return !!member;
  }

  async getMembers(channelId: string, cursor?: string, limit = 20): Promise<PaginatedResult<any>> {
    const members = await this.prisma.channelMember.findMany({
      where: { channelId },
      include: { user: { select: USER_SELECT } },
      orderBy: { joinedAt: 'asc' },
      take: limit + 1,
      ...(cursor && {
        cursor: { channelId_userId: { channelId, userId: cursor } },
        skip: 1,
      }),
    });

    const hasMore = members.length > limit;
    const data = hasMore ? members.slice(0, limit) : members;

    return {
      data,
      nextCursor: hasMore ? data[data.length - 1].userId : null,
      hasMore,
    };
  }
}
