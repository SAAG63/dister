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
  total: number;
}


export const users: User[] = [
  {
    id: '1',
    username: 'artemdev',
    email: 'artem@example.com',
    avatarUrl: null,
    createdAt: '2025-12-01T10:00:00Z',
  },
  {
    id: '2',
    username: 'marina_k',
    email: 'marina@example.com',
    avatarUrl: null,
    createdAt: '2025-12-05T14:30:00Z',
  },
  {
    id: '3',
    username: 'devops_igor',
    email: 'igor@example.com',
    avatarUrl: null,
    createdAt: '2025-12-10T09:15:00Z',
  },
  {
    id: '4',
    username: 'lena.frontend',
    email: 'lena@example.com',
    avatarUrl: null,
    createdAt: '2025-12-15T16:45:00Z',
  },
  {
    id: '5',
    username: 'maxcode',
    email: 'max@example.com',
    avatarUrl: null,
    createdAt: '2025-12-20T11:00:00Z',
  },
];

export const currentUser = users[0];


export const posts: Post[] = [
  {
    id: '1',
    author: users[1],
    content: 'Только что задеплоила новый UI для дашборда. Tailwind + Framer Motion — огонь 🔥',
    parentId: null,
    createdAt: '2026-03-31T18:30:00Z',
    reactions: [
      { emoji: '🔥', count: 5, reacted: true },
      { emoji: '👏', count: 3, reacted: false },
    ],
    replyCount: 2,
  },
  {
    id: '2',
    author: users[2],
    content: 'Кто-нибудь настраивал GitHub Actions для монорепо с Turborepo? Нужен совет по кэшированию.',
    parentId: null,
    createdAt: '2026-03-31T16:00:00Z',
    reactions: [
      { emoji: '🤔', count: 2, reacted: false },
    ],
    replyCount: 4,
  },
  {
    id: '3',
    author: users[3],
    content: 'React 19 Server Components — это будущее или оверинжиниринг? Спорим в треде 👇',
    parentId: null,
    createdAt: '2026-03-31T12:00:00Z',
    reactions: [
      { emoji: '💬', count: 8, reacted: false },
      { emoji: '🧠', count: 4, reacted: true },
    ],
    replyCount: 7,
  },
  {
    id: '4',
    author: users[4],
    content: 'Написал CLI-тулзу на Rust для автоматической генерации OpenAPI спек из TypeScript типов. Ссылка в профиле.',
    parentId: null,
    createdAt: '2026-03-30T22:00:00Z',
    reactions: [
      { emoji: '⭐', count: 12, reacted: false },
      { emoji: '🚀', count: 6, reacted: true },
    ],
    replyCount: 3,
  },
  {
    id: '5',
    author: users[0],
    content: 'Сегодня разобрался с Prisma + PostgreSQL. Миграции работают как часы.',
    parentId: null,
    createdAt: '2026-03-30T15:00:00Z',
    reactions: [
      { emoji: '👍', count: 3, reacted: false },
    ],
    replyCount: 1,
  },
];

export const threadReplies: Post[] = [
  {
    id: '101',
    author: users[0],
    content: 'Согласен, Tailwind + Framer — топовая связка!',
    parentId: '1',
    createdAt: '2026-03-31T18:45:00Z',
    reactions: [{ emoji: '👍', count: 1, reacted: false }],
    replyCount: 0,
  },
  {
    id: '102',
    author: users[4],
    content: 'А какие анимации использовала? layoutId?',
    parentId: '1',
    createdAt: '2026-03-31T19:00:00Z',
    reactions: [],
    replyCount: 0,
  },
];


export const channels: Channel[] = [
  {
    id: '1',
    name: 'general',
    description: 'Общий чат для всех участников',
    isPublic: true,
    owner: users[0],
    memberCount: 42,
    createdAt: '2025-12-01T10:00:00Z',
  },
  {
    id: '2',
    name: 'frontend',
    description: 'React, Vue, Angular и всё что в браузере',
    isPublic: true,
    owner: users[3],
    memberCount: 28,
    createdAt: '2025-12-05T14:30:00Z',
  },
  {
    id: '3',
    name: 'backend',
    description: 'NestJS, Express, базы данных, инфра',
    isPublic: true,
    owner: users[2],
    memberCount: 35,
    createdAt: '2025-12-10T09:15:00Z',
  },
  {
    id: '4',
    name: 'devops',
    description: 'CI/CD, Docker, Kubernetes, мониторинг',
    isPublic: true,
    owner: users[2],
    memberCount: 19,
    createdAt: '2025-12-15T16:45:00Z',
  },
  {
    id: '5',
    name: 'random',
    description: 'Мемы, оффтоп и всё подряд',
    isPublic: true,
    owner: users[4],
    memberCount: 50,
    createdAt: '2025-12-20T11:00:00Z',
  },
];


export const messages: Message[] = [
  {
    id: '1',
    author: users[1],
    content: 'Привет всем! Кто сегодня на созвоне?',
    createdAt: '2026-03-31T09:00:00Z',
    reactions: [{ emoji: '👋', count: 3, reacted: false }],
  },
  {
    id: '2',
    author: users[2],
    content: 'Я буду. Надо обсудить деплой на стейджинг.',
    createdAt: '2026-03-31T09:05:00Z',
    reactions: [],
  },
  {
    id: '3',
    author: users[0],
    content: 'Присоединюсь через 10 минут, доделаю PR.',
    createdAt: '2026-03-31T09:07:00Z',
    reactions: [{ emoji: '👍', count: 1, reacted: true }],
  },
  {
    id: '4',
    author: users[3],
    content: 'Кстати, кто-нибудь смотрел новый доклад с React Conf? Там про compiler рассказывали.',
    createdAt: '2026-03-31T09:15:00Z',
    reactions: [
      { emoji: '👀', count: 2, reacted: false },
      { emoji: '🔗', count: 1, reacted: false },
    ],
  },
  {
    id: '5',
    author: users[4],
    content: 'Да, compiler выглядит мощно. Но пока в бету не пойду — подожду стабильного релиза.',
    createdAt: '2026-03-31T09:20:00Z',
    reactions: [],
  },
  {
    id: '6',
    author: users[1],
    content: 'Согласна. Давайте начинать созвон, линк в календаре.',
    createdAt: '2026-03-31T09:25:00Z',
    reactions: [{ emoji: '🫡', count: 4, reacted: true }],
  },
];


export const followers = [users[1], users[2], users[3]];
export const following = [users[1], users[4]];
