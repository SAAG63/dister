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
    reactionCounts: {},
    author: { id: 'user-1', username: 'alice', email: 'alice@test.com', avatarUrl: null, createdAt: new Date() },
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
        findMany: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn((args) => {
        if (Array.isArray(args)) return Promise.all(args);
        return args(prisma);
      }),
      $queryRaw: jest.fn(),
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
      prisma.message.findMany.mockResolvedValue([mockMessage]);

      const result = await service.getByChannel('ch-1');
      expect(result.data).toHaveLength(1);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete own message in transaction', async () => {
      prisma.message.findUnique.mockResolvedValue(mockMessage);
      prisma.$transaction.mockResolvedValue([]);

      await service.delete('msg-1', 'user-1');
      expect(prisma.$transaction).toHaveBeenCalled();
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
    const memberMsg = { channelId: 'ch-1', channel: { members: [{ role: 'MEMBER' }] } };
    const noMemberMsg = { channelId: 'ch-1', channel: { members: [] } };

    it('should add reaction in transaction', async () => {
      prisma.message.findUnique.mockResolvedValue(memberMsg);
      const reaction = { id: 'r-1', emoji: '👍', targetType: 'MESSAGE', targetId: 'msg-1', userId: 'user-1' };
      prisma.$transaction.mockResolvedValue([reaction, undefined]);

      const result = await service.addReaction('msg-1', 'user-1', '👍');
      expect(result.emoji).toBe('👍');
    });

    it('should throw ForbiddenException when not a member', async () => {
      prisma.message.findUnique.mockResolvedValue(noMemberMsg);
      await expect(service.addReaction('msg-1', 'user-99', '👍')).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException for duplicate (P2002)', async () => {
      prisma.message.findUnique.mockResolvedValue(memberMsg);
      const error: any = new Error('Unique constraint');
      error.code = 'P2002';
      prisma.$transaction.mockRejectedValue(error);

      await expect(service.addReaction('msg-1', 'user-1', '👍')).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException for non-existent message', async () => {
      prisma.message.findUnique.mockResolvedValue(null);
      await expect(service.addReaction('bad-id', 'user-1', '👍')).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeReaction', () => {
    const memberMsg = { channelId: 'ch-1', channel: { members: [{ role: 'MEMBER' }] } };
    const noMemberMsg = { channelId: 'ch-1', channel: { members: [] } };

    it('should remove reaction in transaction', async () => {
      prisma.message.findUnique.mockResolvedValue(memberMsg);
      prisma.reaction.findUnique.mockResolvedValue({ id: 'r-1', emoji: '👍' });
      prisma.$transaction.mockResolvedValue([]);

      await service.removeReaction('msg-1', 'user-1', '👍');
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when not a member', async () => {
      prisma.message.findUnique.mockResolvedValue(noMemberMsg);
      await expect(service.removeReaction('msg-1', 'user-99', '👍')).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when reaction not found', async () => {
      prisma.message.findUnique.mockResolvedValue(memberMsg);
      prisma.reaction.findUnique.mockResolvedValue(null);
      await expect(service.removeReaction('msg-1', 'user-1', '👍')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getMyReactions', () => {
    it('should return empty array for empty messageIds', async () => {
      const result = await service.getMyReactions('user-1', []);
      expect(result).toEqual([]);
    });

    it('should return reactions for given messageIds', async () => {
      const reactions = [
        { targetId: 'msg-1', emoji: '👍' },
        { targetId: 'msg-2', emoji: '❤️' },
      ];
      prisma.reaction.findMany.mockResolvedValue(reactions);

      const result = await service.getMyReactions('user-1', ['msg-1', 'msg-2']);
      expect(result).toHaveLength(2);
    });
  });
});
