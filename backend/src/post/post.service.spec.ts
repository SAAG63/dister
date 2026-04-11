import { Test } from '@nestjs/testing';
import { PostService } from './post.service';
import { PrismaService } from '../prisma/prisma.service';
import { FeedService } from '../feed/feed.service';
import { NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';

describe('PostService', () => {
  let service: PostService;
  let prisma: any;
  const mockFeedService = { invalidateAllFeeds: jest.fn() };

  const mockAuthor = { id: 'user-1', username: 'alice', email: 'alice@test.com', avatarUrl: null, createdAt: new Date() };
  const mockPost = {
    id: 'post-1',
    content: 'Hello world',
    authorId: 'user-1',
    parentId: null,
    createdAt: new Date(),
    reactionCounts: {},
    replyCount: 0,
    author: mockAuthor,
  };

  beforeEach(async () => {
    prisma = {
      post: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      reaction: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
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

    mockFeedService.invalidateAllFeeds.mockReset();

    const module = await Test.createTestingModule({
      providers: [
        PostService,
        { provide: PrismaService, useValue: prisma },
        { provide: FeedService, useValue: mockFeedService },
      ],
    }).compile();

    service = module.get(PostService);
  });

  describe('create', () => {
    it('should create a post', async () => {
      prisma.$transaction.mockResolvedValue([mockPost]);
      const result = await service.create('user-1', 'Hello world');
      expect(result.content).toBe('Hello world');
    });

    it('should create a thread reply and increment parent replyCount', async () => {
      prisma.post.findUnique.mockResolvedValue(mockPost);
      const reply = { ...mockPost, id: 'post-2', parentId: 'post-1' };
      prisma.$transaction.mockResolvedValue([reply]);

      const result = await service.create('user-1', 'Reply', 'post-1');
      expect(result.parentId).toBe('post-1');
    });

    it('should throw NotFoundException for invalid parentId', async () => {
      prisma.post.findUnique.mockResolvedValue(null);
      await expect(service.create('user-1', 'Reply', 'bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getById', () => {
    it('should return post with reactionCounts', async () => {
      const postWithCounts = { ...mockPost, reactionCounts: { '👍': 1 } };
      prisma.post.findUnique.mockResolvedValue(postWithCounts);

      const result = await service.getById('post-1');
      expect(result.content).toBe('Hello world');
      expect(result.reactionCounts).toEqual({ '👍': 1 });
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.post.findUnique.mockResolvedValue(null);
      await expect(service.getById('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getThread', () => {
    it('should return paginated replies', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 'post-1' });
      const replies = [
        { id: 'reply-1', content: 'Reply 1' },
        { id: 'reply-2', content: 'Reply 2' },
      ];
      prisma.post.findMany.mockResolvedValue(replies);

      const result = await service.getThread('post-1');
      expect(result.data).toHaveLength(2);
      expect(result.hasMore).toBe(false);
    });

    it('should detect hasMore when more results exist', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 'post-1' });
      const replies = Array.from({ length: 3 }, (_, i) => ({ id: `reply-${i}` }));
      prisma.post.findMany.mockResolvedValue(replies);

      const result = await service.getThread('post-1', undefined, 2);
      expect(result.data).toHaveLength(2);
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBe('reply-1');
    });

    it('should throw NotFoundException when post does not exist', async () => {
      prisma.post.findUnique.mockResolvedValue(null);
      await expect(service.getThread('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getByAuthor', () => {
    it('should return paginated posts by author', async () => {
      const posts = [mockPost];
      prisma.post.findMany.mockResolvedValue(posts);

      const result = await service.getByAuthor('user-1');
      expect(result.data).toHaveLength(1);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete own post in transaction', async () => {
      prisma.post.findUnique.mockResolvedValue(mockPost);
      prisma.post.findMany.mockResolvedValue([]); // no replies
      prisma.$transaction.mockResolvedValue([]);

      await service.delete('post-1', 'user-1');
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should throw ForbiddenException for other user post', async () => {
      prisma.post.findUnique.mockResolvedValue(mockPost);
      await expect(service.delete('post-1', 'user-999')).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when post not found', async () => {
      prisma.post.findUnique.mockResolvedValue(null);
      await expect(service.delete('bad-id', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('addReaction', () => {
    it('should add reaction in transaction', async () => {
      const reaction = { id: 'r-1', emoji: '👍', targetType: 'POST', targetId: 'post-1', userId: 'user-1' };
      prisma.$transaction.mockResolvedValue([reaction, undefined]);

      const result = await service.addReaction('post-1', 'user-1', '👍');
      expect(result.emoji).toBe('👍');
    });

    it('should throw ConflictException for duplicate reaction (P2002)', async () => {
      const error: any = new Error('Unique constraint');
      error.code = 'P2002';
      prisma.$transaction.mockRejectedValue(error);

      await expect(service.addReaction('post-1', 'user-1', '👍')).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException for non-existent post (P2003)', async () => {
      const error: any = new Error('FK constraint');
      error.code = 'P2003';
      prisma.$transaction.mockRejectedValue(error);

      await expect(service.addReaction('bad-id', 'user-1', '👍')).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeReaction', () => {
    it('should remove reaction in transaction', async () => {
      prisma.reaction.findUnique.mockResolvedValue({ id: 'r-1', emoji: '👍' });
      prisma.$transaction.mockResolvedValue([]);

      await service.removeReaction('post-1', 'user-1', '👍');
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException when reaction not found', async () => {
      prisma.reaction.findUnique.mockResolvedValue(null);
      await expect(service.removeReaction('post-1', 'user-1', '👍')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getMyReactions', () => {
    it('should return empty array for empty postIds', async () => {
      const result = await service.getMyReactions('user-1', []);
      expect(result).toEqual([]);
    });

    it('should return reactions for given postIds', async () => {
      const reactions = [
        { targetId: 'post-1', emoji: '👍' },
        { targetId: 'post-2', emoji: '❤️' },
      ];
      prisma.reaction.findMany.mockResolvedValue(reactions);

      const result = await service.getMyReactions('user-1', ['post-1', 'post-2']);
      expect(result).toHaveLength(2);
    });
  });
});
