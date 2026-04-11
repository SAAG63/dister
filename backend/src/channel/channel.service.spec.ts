import { Test } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ChannelService } from './channel.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';

describe('ChannelService', () => {
  let service: ChannelService;
  let prisma: any;

  const mockChannel = {
    id: 'ch-1',
    name: 'general',
    description: 'General chat',
    isPublic: true,
    ownerId: 'user-1',
    memberCount: 1,
    createdAt: new Date(),
    owner: { id: 'user-1', username: 'alice' },
  };

  beforeEach(async () => {
    prisma = {
      channel: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      channelMember: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn((args) => {
        if (Array.isArray(args)) return Promise.all(args);
        return args(prisma);
      }),
    };

    const module = await Test.createTestingModule({
      providers: [
        ChannelService,
        { provide: PrismaService, useValue: prisma },
        { provide: CACHE_MANAGER, useValue: { get: jest.fn(), set: jest.fn(), del: jest.fn() } },
      ],
    }).compile();

    service = module.get(ChannelService);
  });

  describe('create', () => {
    it('should create channel and add owner as member in transaction', async () => {
      prisma.$transaction.mockResolvedValue([mockChannel, {}]);

      const result = await service.create('user-1', 'general', 'General chat');
      expect(result.name).toBe('general');
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should return channel', async () => {
      prisma.channel.findUnique.mockResolvedValue(mockChannel);
      const result = await service.getById('ch-1');
      expect(result.name).toBe('general');
    });

    it('should throw NotFoundException', async () => {
      prisma.channel.findUnique.mockResolvedValue(null);
      await expect(service.getById('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPublicChannels', () => {
    it('should return paginated public channels', async () => {
      prisma.channel.findMany.mockResolvedValue([mockChannel]);

      const result = await service.getPublicChannels();
      expect(result.data).toHaveLength(1);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('updateChannel', () => {
    it('should update when user is OWNER', async () => {
      prisma.channelMember.findUnique.mockResolvedValue({ role: 'OWNER' });
      prisma.channel.update.mockResolvedValue({ ...mockChannel, name: 'updated' });

      const result = await service.updateChannel('ch-1', 'user-1', { name: 'updated' });
      expect(result.name).toBe('updated');
    });

    it('should throw ForbiddenException for MEMBER role', async () => {
      prisma.channelMember.findUnique.mockResolvedValue({ role: 'MEMBER' });
      await expect(service.updateChannel('ch-1', 'user-2', { name: 'x' })).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException for non-member', async () => {
      prisma.channelMember.findUnique.mockResolvedValue(null);
      await expect(service.updateChannel('ch-1', 'user-99', { name: 'x' })).rejects.toThrow(ForbiddenException);
    });
  });

  describe('join', () => {
    it('should join channel in transaction', async () => {
      const member = { channelId: 'ch-1', userId: 'user-2', role: 'MEMBER' };
      prisma.$transaction.mockResolvedValue([member, {}]);

      const result = await service.join('ch-1', 'user-2');
      expect(result.role).toBe('MEMBER');
    });

    it('should throw ConflictException when already member (P2002)', async () => {
      const error: any = new Error('Unique constraint');
      error.code = 'P2002';
      prisma.$transaction.mockRejectedValue(error);

      await expect(service.join('ch-1', 'user-2')).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException when channel not found (P2003)', async () => {
      const error: any = new Error('FK constraint');
      error.code = 'P2003';
      prisma.$transaction.mockRejectedValue(error);

      await expect(service.join('ch-1', 'user-2')).rejects.toThrow(NotFoundException);
    });
  });

  describe('leave', () => {
    it('should leave channel in transaction', async () => {
      prisma.channelMember.findUnique.mockResolvedValue({ role: 'MEMBER' });
      prisma.$transaction.mockResolvedValue([]);

      await service.leave('ch-1', 'user-2');
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should throw ForbiddenException for OWNER', async () => {
      prisma.channelMember.findUnique.mockResolvedValue({ role: 'OWNER' });
      await expect(service.leave('ch-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when not member', async () => {
      prisma.channelMember.findUnique.mockResolvedValue(null);
      await expect(service.leave('ch-1', 'user-99')).rejects.toThrow(NotFoundException);
    });
  });

  describe('isMember', () => {
    it('should return true when member', async () => {
      prisma.channelMember.findUnique.mockResolvedValue({ role: 'MEMBER' });
      const result = await service.isMember('ch-1', 'user-1');
      expect(result).toBe(true);
    });

    it('should return false when not member', async () => {
      prisma.channelMember.findUnique.mockResolvedValue(null);
      const result = await service.isMember('ch-1', 'user-99');
      expect(result).toBe(false);
    });
  });

  describe('getMembers', () => {
    it('should return paginated members list', async () => {
      prisma.channelMember.findMany.mockResolvedValue([
        { userId: 'user-1', role: 'OWNER', user: { username: 'alice' } },
      ]);

      const result = await service.getMembers('ch-1');
      expect(result.data).toHaveLength(1);
      expect(result.data[0].role).toBe('OWNER');
      expect(result.hasMore).toBe(false);
    });
  });
});
