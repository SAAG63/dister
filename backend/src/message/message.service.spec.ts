import { Test } from '@nestjs/testing';
import { MessageService } from './message.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';

describe('MessageService', () => {
  let service: MessageService;
  let prisma: any;

  const mockMessage = {
    id: 'msg-1',
    content: 'Hello',
    channelId: 'ch-1',
    authorId: 'user-1',
    createdAt: new Date(),
    author: { id: 'user-1', username: 'alice' },
  };

  beforeEach(async () => {
    prisma = {
      channel: { findUnique: jest.fn() },
      channelMember: { findUnique: jest.fn() },
      message: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      reaction: {
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        MessageService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(MessageService);
  });

  describe('send', () => {
    it('should send message when user is member', async () => {
      prisma.channelMember.findUnique.mockResolvedValue({ role: 'MEMBER' });
      prisma.message.create.mockResolvedValue(mockMessage);

      const result = await service.send('ch-1', 'user-1', 'Hello');
      expect(result.content).toBe('Hello');
    });

    it('should throw ForbiddenException when not member', async () => {
      prisma.channelMember.findUnique.mockResolvedValue(null);
      await expect(service.send('ch-1', 'user-99', 'Hello')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getByChannel', () => {
    it('should return paginated messages', async () => {
      prisma.channel.findUnique.mockResolvedValue({ id: 'ch-1' });
      prisma.message.findMany.mockResolvedValue([mockMessage]);

      const result = await service.getByChannel('ch-1');
      expect(result.data).toHaveLength(1);
      expect(result.hasMore).toBe(false);
    });

    it('should throw NotFoundException for invalid channel', async () => {
      prisma.channel.findUnique.mockResolvedValue(null);
      await expect(service.getByChannel('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete own message', async () => {
      prisma.message.findUnique.mockResolvedValue(mockMessage);
      prisma.message.delete.mockResolvedValue(mockMessage);

      await service.delete('msg-1', 'user-1');
      expect(prisma.message.delete).toHaveBeenCalled();
    });

    it('should throw ForbiddenException for other user', async () => {
      prisma.message.findUnique.mockResolvedValue(mockMessage);
      await expect(service.delete('msg-1', 'user-99')).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.message.findUnique.mockResolvedValue(null);
      await expect(service.delete('bad-id', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('addReaction', () => {
    it('should add reaction to message', async () => {
      prisma.message.findUnique.mockResolvedValue(mockMessage);
      prisma.reaction.findUnique.mockResolvedValue(null);
      prisma.reaction.create.mockResolvedValue({ emoji: '👍' });

      const result = await service.addReaction('msg-1', 'user-1', '👍');
      expect(result.emoji).toBe('👍');
    });

    it('should throw ConflictException for duplicate', async () => {
      prisma.message.findUnique.mockResolvedValue(mockMessage);
      prisma.reaction.findUnique.mockResolvedValue({ id: 'r-1' });

      await expect(service.addReaction('msg-1', 'user-1', '👍')).rejects.toThrow(ConflictException);
    });
  });

  describe('removeReaction', () => {
    it('should remove reaction', async () => {
      prisma.reaction.findUnique.mockResolvedValue({ id: 'r-1' });
      prisma.reaction.delete.mockResolvedValue({});

      await service.removeReaction('msg-1', 'user-1', '👍');
      expect(prisma.reaction.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.reaction.findUnique.mockResolvedValue(null);
      await expect(service.removeReaction('msg-1', 'user-1', '👍')).rejects.toThrow(NotFoundException);
    });
  });
});
