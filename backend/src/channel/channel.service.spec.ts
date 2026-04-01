import { Test } from '@nestjs/testing';
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
    };

    const module = await Test.createTestingModule({
      providers: [
        ChannelService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(ChannelService);
  });

  describe('create', () => {
    it('should create channel and add owner as member', async () => {
      prisma.channel.create.mockResolvedValue(mockChannel);
      prisma.channelMember.create.mockResolvedValue({});

      const result = await service.create('user-1', 'general', 'General chat');
      expect(result.name).toBe('general');
      expect(prisma.channelMember.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ role: 'OWNER' }),
        }),
      );
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
    it('should join channel', async () => {
      prisma.channel.findUnique.mockResolvedValue(mockChannel);
      prisma.channelMember.findUnique.mockResolvedValue(null);
      prisma.channelMember.create.mockResolvedValue({ role: 'MEMBER' });

      const result = await service.join('ch-1', 'user-2');
      expect(result.role).toBe('MEMBER');
    });

    it('should throw ConflictException when already member', async () => {
      prisma.channel.findUnique.mockResolvedValue(mockChannel);
      prisma.channelMember.findUnique.mockResolvedValue({ role: 'MEMBER' });

      await expect(service.join('ch-1', 'user-2')).rejects.toThrow(ConflictException);
    });
  });

  describe('leave', () => {
    it('should leave channel', async () => {
      prisma.channelMember.findUnique.mockResolvedValue({ role: 'MEMBER' });
      prisma.channelMember.delete.mockResolvedValue({});

      await service.leave('ch-1', 'user-2');
      expect(prisma.channelMember.delete).toHaveBeenCalled();
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

  describe('getMembers', () => {
    it('should return members list', async () => {
      prisma.channel.findUnique.mockResolvedValue(mockChannel);
      prisma.channelMember.findMany.mockResolvedValue([
        { userId: 'user-1', role: 'OWNER', user: { username: 'alice' } },
      ]);

      const result = await service.getMembers('ch-1');
      expect(result).toHaveLength(1);
    });
  });
});
