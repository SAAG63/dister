import { Test } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('UserService', () => {
  let service: UserService;
  let prisma: any;

  const mockUser = {
    id: 'user-1',
    username: 'alice',
    email: 'alice@example.com',
    passwordHash: 'hash',
    avatarUrl: null,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      follow: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(UserService);
  });

  describe('getById', () => {
    it('should return user when found', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      const result = await service.getById('user-1');
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.getById('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getByUsername', () => {
    it('should return user when found', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      const result = await service.getByUsername('alice');
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.getByUsername('nobody')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    it('should update and return user', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      const updated = { ...mockUser, username: 'alice2' };
      prisma.user.update.mockResolvedValue(updated);

      const result = await service.updateProfile('user-1', { username: 'alice2' });
      expect(result.username).toBe('alice2');
    });
  });

  describe('follow', () => {
    it('should create follow', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.follow.findUnique.mockResolvedValue(null);
      prisma.follow.create.mockResolvedValue({ followerId: 'user-2', followingId: 'user-1' });

      const result = await service.follow('user-2', 'user-1');
      expect(result.followerId).toBe('user-2');
    });

    it('should throw ConflictException when following self', async () => {
      await expect(service.follow('user-1', 'user-1')).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when already following', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.follow.findUnique.mockResolvedValue({ followerId: 'user-2', followingId: 'user-1' });

      await expect(service.follow('user-2', 'user-1')).rejects.toThrow(ConflictException);
    });
  });

  describe('unfollow', () => {
    it('should delete follow', async () => {
      prisma.follow.findUnique.mockResolvedValue({ followerId: 'user-2', followingId: 'user-1' });
      prisma.follow.delete.mockResolvedValue({});

      await service.unfollow('user-2', 'user-1');
      expect(prisma.follow.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException when not following', async () => {
      prisma.follow.findUnique.mockResolvedValue(null);
      await expect(service.unfollow('user-2', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getFollowers', () => {
    it('should return list of followers', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.follow.findMany.mockResolvedValue([
        { follower: { id: 'user-2', username: 'bob' } },
      ]);

      const result = await service.getFollowers('user-1');
      expect(result).toHaveLength(1);
      expect(result[0].username).toBe('bob');
    });
  });

  describe('getFollowing', () => {
    it('should return list of following', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.follow.findMany.mockResolvedValue([
        { following: { id: 'user-3', username: 'charlie' } },
      ]);

      const result = await service.getFollowing('user-1');
      expect(result).toHaveLength(1);
      expect(result[0].username).toBe('charlie');
    });
  });
});
