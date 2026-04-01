import { messages } from '../mocks/data';
import type { Message, PaginatedResult } from '../mocks/data';
import { currentUser } from '../mocks/data';

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

export async function getMessages(_channelId: string): Promise<PaginatedResult<Message>> {
  await delay();
  return { data: messages, nextCursor: null, total: messages.length };
}

export async function sendMessage(_channelId: string, content: string): Promise<Message> {
  await delay();
  return {
    id: String(Date.now()),
    author: currentUser,
    content,
    createdAt: new Date().toISOString(),
    reactions: [],
  };
}

export async function deleteMessage(_id: string): Promise<void> {
  await delay();
}
