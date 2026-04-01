import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChannelService {
  constructor(private readonly prisma: PrismaService) {}

  async create(ownerId: string, name: string, description?: string, isPublic = true) {
    const channel = await this.prisma.channel.create({
      data: { name, description, isPublic, ownerId },
    });

    await this.prisma.channelMember.create({
      data: { channelId: channel.id, userId: ownerId, role: 'OWNER' },
    });

    return channel;
  }

  async getById(id: string) {
    const channel = await this.prisma.channel.findUnique({
      where: { id },
      include: { owner: true },
    });
    if (!channel) throw new NotFoundException('Channel not found');
    return channel;
  }

  async getPublicChannels() {
    return this.prisma.channel.findMany({
      where: { isPublic: true },
      include: { owner: true, _count: { select: { members: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateChannel(channelId: string, userId: string, data: { name?: string; description?: string }) {
    const member = await this.prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId, userId } },
    });
    if (!member || (member.role !== 'OWNER' && member.role !== 'MODERATOR')) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return this.prisma.channel.update({ where: { id: channelId }, data });
  }

  async join(channelId: string, userId: string) {
    await this.getById(channelId);

    const existing = await this.prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId, userId } },
    });
    if (existing) throw new ConflictException('Already a member');

    return this.prisma.channelMember.create({
      data: { channelId, userId, role: 'MEMBER' },
    });
  }

  async leave(channelId: string, userId: string) {
    const member = await this.prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId, userId } },
    });
    if (!member) throw new NotFoundException('Not a member');
    if (member.role === 'OWNER') throw new ForbiddenException('Owner cannot leave');

    return this.prisma.channelMember.delete({
      where: { channelId_userId: { channelId, userId } },
    });
  }

  async getMembers(channelId: string) {
    await this.getById(channelId);
    return this.prisma.channelMember.findMany({
      where: { channelId },
      include: { user: true },
      orderBy: { joinedAt: 'asc' },
    });
  }
}
