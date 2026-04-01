import { channels } from '../mocks/data';
import type { Channel } from '../mocks/data';

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

export async function getChannels(): Promise<Channel[]> {
  await delay();
  return channels;
}

export async function getChannel(id: string): Promise<Channel | undefined> {
  await delay();
  return channels.find((c) => c.id === id);
}

export async function createChannel(_name: string, _description: string): Promise<Channel> {
  await delay();
  return channels[0];
}

export async function joinChannel(_id: string): Promise<void> {
  await delay();
}

export async function leaveChannel(_id: string): Promise<void> {
  await delay();
}
