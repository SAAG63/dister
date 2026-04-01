import { posts, threadReplies } from '../mocks/data';
import type { Post, PaginatedResult } from '../mocks/data';

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

export async function getFeed(): Promise<PaginatedResult<Post>> {
  await delay();
  return { data: posts, nextCursor: null, total: posts.length };
}

export async function getPost(id: string): Promise<Post | undefined> {
  await delay();
  return posts.find((p) => p.id === id);
}

export async function getThread(postId: string): Promise<Post[]> {
  await delay();
  return threadReplies.filter((r) => r.parentId === postId);
}

export async function createPost(content: string, parentId?: string): Promise<Post> {
  await delay();
  return {
    id: String(Date.now()),
    author: posts[0].author,
    content,
    parentId: parentId ?? null,
    createdAt: new Date().toISOString(),
    reactions: [],
    replyCount: 0,
  };
}

export async function deletePost(_id: string): Promise<void> {
  await delay();
}

export async function addReaction(_postId: string, _emoji: string): Promise<void> {
  await delay();
}

export async function removeReaction(_postId: string, _emoji: string): Promise<void> {
  await delay();
}
