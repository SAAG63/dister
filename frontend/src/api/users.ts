import { users, followers, following, posts } from '../mocks/data';
import type { User, Post } from '../mocks/data';

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

export async function getUser(id: string): Promise<User | undefined> {
  await delay();
  return users.find((u) => u.id === id);
}

export async function getUserPosts(userId: string): Promise<Post[]> {
  await delay();
  return posts.filter((p) => p.author.id === userId);
}

export async function getFollowers(_userId: string): Promise<User[]> {
  await delay();
  return followers;
}

export async function getFollowing(_userId: string): Promise<User[]> {
  await delay();
  return following;
}

export async function followUser(_userId: string): Promise<void> {
  await delay();
}

export async function unfollowUser(_userId: string): Promise<void> {
  await delay();
}

export async function updateProfile(_userId: string, _data: Partial<User>): Promise<User> {
  await delay();
  return users[0];
}
