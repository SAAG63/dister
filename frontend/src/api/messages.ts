import client from './client';

export async function getMessages(channelId: string, cursor?: string, limit?: number) {
  const { data } = await client.get(`/channels/${channelId}/messages`, { params: { cursor, limit } });
  return data;
}

export async function sendMessage(channelId: string, content: string) {
  const { data } = await client.post(`/channels/${channelId}/messages`, { content });
  return data;
}

export async function deleteMessage(channelId: string, id: string) {
  await client.delete(`/channels/${channelId}/messages/${id}`);
}

export async function addMessageReaction(channelId: string, messageId: string, emoji: string) {
  await client.post(`/channels/${channelId}/messages/${messageId}/reactions`, { emoji });
}

export async function removeMessageReaction(channelId: string, messageId: string, emoji: string) {
  await client.delete(`/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`);
}
