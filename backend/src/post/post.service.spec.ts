import { Test } from '@nestjs/testing';
import { PostService } from './post.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';

describe('PostService', () => {
  let service: PostService;
  let prisma: any;

  const mockAuthor = { id: 'user-1', username: 'alice' };
  const mockPost = {
    id: 'post-1',
    content: 'Hello world',
    authorId: 'user-1',
    parentId: null,
    createdAt: new Date(),
    author: mockAuthor,
  };

  beforeEach(async () => {
    prisma = {
      post: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      reaction: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        PostService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(PostService);
  });

  describe('create', () => {
    it('should create a post', async () => {
      prisma.post.create.mockResolvedValue(mockPost);
      const result = await service.create('user-1', 'Hello world');
      expect(result.content).toBe('Hello world');
    });

    it('should create a thread reply', async () => {
      prisma.post.findUnique.mockResolvedValue(mockPost);
      const reply = { ...mockPost, id: 'post-2', parentId: 'post-1' };
      prisma.post.create.mockResolvedValue(reply);

      const result = await service.create('user-1', 'Reply', 'post-1');
      expect(result.parentId).toBe('post-1');
    });

    it('should throw NotFoundException for invalid parentId', async () => {
      prisma.post.findUnique.mockResolvedValue(null);
      await expect(service.create('user-1', 'Reply', 'bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getById', () => {
    it('should return post with reactions', async () => {
      prisma.post.findUnique.mockResolvedValue(mockPost);
      prisma.reaction.findMany.mockResolvedValue([{ emoji: '👍' }]);

      const result = await service.getById('post-1');
      expect(result.content).toBe('Hello world');
      expect(result.reactions).toHaveLength(1);
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.post.findUnique.mockResolvedValue(null);
      await expect(service.getById('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getThread', () => {
    it('should return paginated replies', async () => {
      prisma.post.findUnique.mockResolvedValue(mockPost);
      prisma.reaction.findMany.mockResolvedValue([]);
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
      prisma.post.findUnique.mockResolvedValue(mockPost);
      prisma.reaction.findMany.mockResolvedValue([]);
      const replies = Array.from({ length: 3 }, (_, i) => ({ id: `reply-${i}` }));
      prisma.post.findMany.mockResolvedValue(replies);

      const result = await service.getThread('post-1', undefined, 2);
      expect(result.data).toHaveLength(2);
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBe('reply-1');
    });
  });

  describe('delete', () => {
    it('should delete own post', async () => {
      prisma.post.findUnique.mockResolvedValue(mockPost);
      prisma.post.delete.mockResolvedValue(mockPost);

      await service.delete('post-1', 'user-1');
      expect(prisma.post.delete).toHaveBeenCalled();
    });

    it('should throw ForbiddenException for other user post', async () => {
      prisma.post.findUnique.mockResolvedValue(mockPost);
      await expect(service.delete('post-1', 'user-999')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('addReaction', () => {
    it('should add reaction', async () => {
      prisma.post.findUnique.mockResolvedValue(mockPost);
      prisma.reaction.findMany.mockResolvedValue([]);
      prisma.reaction.findUnique.mockResolvedValue(null);
      prisma.reaction.create.mockResolvedValue({ emoji: '👍' });

      const result = await service.addReaction('post-1', 'user-1', '👍');
      expect(result.emoji).toBe('👍');
    });

    it('should throw ConflictException for duplicate reaction', async () => {
      prisma.post.findUnique.mockResolvedValue(mockPost);
      prisma.reaction.findMany.mockResolvedValue([]);
      prisma.reaction.findUnique.mockResolvedValue({ id: 'r-1', emoji: '👍' });

      await expect(service.addReaction('post-1', 'user-1', '👍')).rejects.toThrow(ConflictException);
    });
  });

  describe('removeReaction', () => {
    it('should remove reaction', async () => {
      prisma.reaction.findUnique.mockResolvedValue({ id: 'r-1', emoji: '👍' });
      prisma.reaction.delete.mockResolvedValue({});

      await service.removeReaction('post-1', 'user-1', '👍');
      expect(prisma.reaction.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException when reaction not found', async () => {
      prisma.reaction.findUnique.mockResolvedValue(null);
      await expect(service.removeReaction('post-1', 'user-1', '👍')).rejects.toThrow(NotFoundException);
    });
  });
});
