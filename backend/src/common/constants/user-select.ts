import { Prisma } from '@prisma/client';

export const USER_SELECT = {
  id: true,
  username: true,
  avatarUrl: true,
  createdAt: true,
} satisfies Prisma.UserSelect;
