import { Test } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import { FeedService } from '../feed/feed.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('UserService', () => {
  let service: UserService;
  let prisma: any;
  const mockFeedService = { invalidateAllFeeds: jest.fn() };

  const mockUser = {
    id: 'user-1',
    username: 'alice',
    email: 'alice@example.com',
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
        deleteMany: jest.fn(),
      },
    };

    mockFeedService.invalidateAllFeeds.mockReset();

    const module = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: prisma },
        { provide: FeedService, useValue: mockFeedService },
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

  describe('getProfileWithCounts', () => {
    it('should return user with counts', async () => {
      const userWithCounts = { ...mockUser, _count: { followers: 5, following: 3, posts: 10 } };
      prisma.user.findUnique.mockResolvedValue(userWithCounts);

      const result = await service.getProfileWithCounts('user-1');
      expect(result._count.followers).toBe(5);
      expect(result._count.posts).toBe(10);
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.getProfileWithCounts('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    it('should update and return user', async () => {
      const updated = { ...mockUser, username: 'alice2' };
      prisma.user.update.mockResolvedValue(updated);

      const result = await service.updateProfile('user-1', { username: 'alice2' });
      expect(result.username).toBe('alice2');
    });
  });

  describe('follow', () => {
    it('should create follow', async () => {
      prisma.follow.create.mockResolvedValue({ followerId: 'user-2', followingId: 'user-1' });

      const result = await service.follow('user-2', 'user-1');
      expect(result.followerId).toBe('user-2');
    });

    it('should throw ConflictException when following self', async () => {
      await expect(service.follow('user-1', 'user-1')).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when already following (P2002)', async () => {
      const error: any = new Error('Unique constraint');
      error.code = 'P2002';
      prisma.follow.create.mockRejectedValue(error);

      await expect(service.follow('user-2', 'user-1')).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException when user not found (P2003)', async () => {
      const error: any = new Error('FK constraint');
      error.code = 'P2003';
      prisma.follow.create.mockRejectedValue(error);

      await expect(service.follow('user-2', 'bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('unfollow', () => {
    it('should delete follow', async () => {
      prisma.follow.deleteMany.mockResolvedValue({ count: 1 });

      await service.unfollow('user-2', 'user-1');
      expect(prisma.follow.deleteMany).toHaveBeenCalled();
    });

    it('should throw NotFoundException when not following', async () => {
      prisma.follow.deleteMany.mockResolvedValue({ count: 0 });
      await expect(service.unfollow('user-2', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('isFollowing', () => {
    it('should return true when following', async () => {
      prisma.follow.findUnique.mockResolvedValue({ followerId: 'user-1', followingId: 'user-2' });
      const result = await service.isFollowing('user-1', 'user-2');
      expect(result).toBe(true);
    });

    it('should return false when not following', async () => {
      prisma.follow.findUnique.mockResolvedValue(null);
      const result = await service.isFollowing('user-1', 'user-2');
      expect(result).toBe(false);
    });
  });

  describe('getFollowers', () => {
    it('should return paginated list of followers', async () => {
      prisma.follow.findMany.mockResolvedValue([
        { follower: { id: 'user-2', username: 'bob' }, followerId: 'user-2' },
      ]);

      const result = await service.getFollowers('user-1');
      expect(result.data).toHaveLength(1);
      expect(result.data[0].username).toBe('bob');
      expect(result.hasMore).toBe(false);
    });
  });

  describe('getFollowing', () => {
    it('should return paginated list of following', async () => {
      prisma.follow.findMany.mockResolvedValue([
        { following: { id: 'user-3', username: 'charlie' }, followingId: 'user-3' },
      ]);

      const result = await service.getFollowing('user-1');
      expect(result.data).toHaveLength(1);
      expect(result.data[0].username).toBe('charlie');
      expect(result.hasMore).toBe(false);
    });
  });
});
