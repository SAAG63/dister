import { Test } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { FeedService } from './feed.service';
import { PrismaService } from '../prisma/prisma.service';

describe('FeedService', () => {
  let service: FeedService;
  let prisma: any;

  const mockCache = { get: jest.fn(), set: jest.fn(), del: jest.fn() };

  beforeEach(async () => {
    mockCache.get.mockReset();
    mockCache.set.mockReset();
    mockCache.del.mockReset();

    prisma = {
      follow: { findMany: jest.fn() },
      post: { findMany: jest.fn() },
    };

    const module = await Test.createTestingModule({
      providers: [
        FeedService,
        { provide: PrismaService, useValue: prisma },
        { provide: CACHE_MANAGER, useValue: mockCache },
      ],
    }).compile();

    service = module.get(FeedService);
  });

  describe('getFeed', () => {
    it('should return posts from followed users and self', async () => {
      prisma.follow.findMany.mockResolvedValue([
        { followingId: 'user-2' },
        { followingId: 'user-3' },
      ]);
      const posts = [
        { id: 'post-1', authorId: 'user-2' },
        { id: 'post-2', authorId: 'user-1' },
      ];
      prisma.post.findMany.mockResolvedValue(posts);

      const result = await service.getFeed('user-1');
      expect(result.data).toHaveLength(2);
      expect(result.hasMore).toBe(false);

      const whereArg = prisma.post.findMany.mock.calls[0][0].where;
      expect(whereArg.authorId.in).toContain('user-1');
      expect(whereArg.authorId.in).toContain('user-2');
      expect(whereArg.authorId.in).toContain('user-3');
      expect(whereArg.parentId).toBeNull();
    });

    it('should handle pagination with hasMore', async () => {
      prisma.follow.findMany.mockResolvedValue([]);
      const posts = Array.from({ length: 3 }, (_, i) => ({ id: `post-${i}` }));
      prisma.post.findMany.mockResolvedValue(posts);

      const result = await service.getFeed('user-1', undefined, 2);
      expect(result.data).toHaveLength(2);
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBe('post-1');
    });

    it('should return empty feed when no follows and no own posts', async () => {
      prisma.follow.findMany.mockResolvedValue([]);
      prisma.post.findMany.mockResolvedValue([]);

      const result = await service.getFeed('user-1');
      expect(result.data).toHaveLength(0);
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBeNull();
    });
  });
});
