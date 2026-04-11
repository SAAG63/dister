export interface User {
  id: string;
  username: string;
  email?: string;
  avatarUrl: string | null;
  createdAt: string;
}

export interface Post {
  id: string;
  author: User;
  content: string;
  parentId: string | null;
  createdAt: string;
  reactions: Reaction[];
  replyCount: number;
}

export interface Reaction {
  emoji: string;
  count: number;
  reacted: boolean;
}

export interface Channel {
  id: string;
  name: string;
  description: string;
  isPublic: boolean;
  owner: User;
  memberCount: number;
  createdAt: string;
}

export interface Message {
  id: string;
  author: User;
  content: string;
  createdAt: string;
  reactions: Reaction[];
}

export interface PaginatedResult<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}
