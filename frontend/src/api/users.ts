import client from './client';

export async function getAllUsers(cursor?: string, limit?: number, search?: string) {
  const { data } = await client.get('/users', { params: { cursor, limit, search: search || undefined } });
  return data;
}

export async function getUser(id: string) {
  const { data } = await client.get(`/users/${id}`);
  return data;
}

export async function getUserPosts(userId: string, cursor?: string, limit?: number) {
  const { data } = await client.get(`/users/${userId}/posts`, { params: { cursor, limit } });
  return data;
}

export async function getFollowers(userId: string, cursor?: string, limit?: number) {
  const { data } = await client.get(`/users/${userId}/followers`, { params: { cursor, limit } });
  return data;
}

export async function getFollowing(userId: string, cursor?: string, limit?: number) {
  const { data } = await client.get(`/users/${userId}/following`, { params: { cursor, limit } });
  return data;
}

export async function followUser(userId: string) {
  await client.post(`/users/${userId}/follow`);
}

export async function unfollowUser(userId: string) {
  await client.delete(`/users/${userId}/follow`);
}

export async function updateProfile(userId: string, data: { username?: string; email?: string; avatarUrl?: string }) {
  const res = await client.patch(`/users/${userId}`, data);
  return res.data;
}

export async function uploadAvatar(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await client.post('/upload/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.avatarUrl;
}
