import client from './client';

export async function getFeed(cursor?: string, limit?: number) {
  const { data } = await client.get('/posts/feed', { params: { cursor, limit } });
  return data;
}

export async function getPost(id: string) {
  const { data } = await client.get(`/posts/${id}`);
  return data;
}

export async function getThread(postId: string, cursor?: string, limit?: number) {
  const { data } = await client.get(`/posts/${postId}/thread`, { params: { cursor, limit } });
  return data;
}

export async function createPost(content: string, parentId?: string) {
  const { data } = await client.post('/posts', { content, parentId });
  return data;
}

export async function deletePost(id: string) {
  await client.delete(`/posts/${id}`);
}

export async function addReaction(postId: string, emoji: string) {
  await client.post(`/posts/${postId}/reactions`, { emoji });
}

export async function removeReaction(postId: string, emoji: string) {
  await client.delete(`/posts/${postId}/reactions/${encodeURIComponent(emoji)}`);
}
