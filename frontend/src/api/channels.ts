import client from './client';

export async function getChannels(cursor?: string, limit?: number) {
  const { data } = await client.get('/channels', { params: { cursor, limit } });
  return data;
}

export async function getChannel(id: string) {
  const { data } = await client.get(`/channels/${id}`);
  return data;
}

export async function createChannel(name: string, description: string, isPublic = true) {
  const { data } = await client.post('/channels', { name, description, isPublic });
  return data;
}

export async function deleteChannel(id: string) {
  await client.delete(`/channels/${id}`);
}

export async function joinChannel(id: string) {
  await client.post(`/channels/${id}/join`);
}

export async function leaveChannel(id: string) {
  await client.delete(`/channels/${id}/leave`);
}

export async function getMembers(channelId: string) {
  const { data } = await client.get(`/channels/${channelId}/members`);
  return data;
}

export async function updateChannel(id: string, body: { name?: string; description?: string }) {
  const { data } = await client.patch(`/channels/${id}`, body);
  return data;
}

export async function setMemberRole(channelId: string, userId: string, role: 'MODERATOR' | 'MEMBER') {
  const { data } = await client.patch(`/channels/${channelId}/members/${userId}/role`, { role });
  return data;
}

export async function kickMember(channelId: string, userId: string) {
  await client.delete(`/channels/${channelId}/members/${userId}`);
}

export async function inviteMember(channelId: string, userId: string) {
  const { data } = await client.post(`/channels/${channelId}/members/${userId}`);
  return data;
}

export async function getMyChannels() {
  const { data } = await client.get('/channels/my');
  return data;
}

export async function getBffChannel(id: string) {
  const { data } = await client.get(`/bff/channel/${id}`);
  return data;
}

export async function getBffProfile(id: string) {
  const { data } = await client.get(`/bff/profile/${id}`);
  return data;
}
