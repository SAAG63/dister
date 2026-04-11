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

export async function getAvatarUploadUrl(): Promise<{ uploadUrl: string; avatarUrl: string }> {
  const { data } = await client.get('/upload/avatar-url');
  return data;
}

export async function uploadAvatar(file: File): Promise<string> {
  const { uploadUrl, avatarUrl } = await getAvatarUploadUrl();
  await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  });
  return avatarUrl;
}
