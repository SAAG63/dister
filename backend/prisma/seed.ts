import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.reaction.deleteMany();
  await prisma.message.deleteMany();
  await prisma.channelMember.deleteMany();
  await prisma.channel.deleteMany();
  await prisma.post.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.user.deleteMany();

  const alice = await prisma.user.create({
    data: {
      username: 'alice',
      email: 'alice@example.com',
      passwordHash: 'placeholder_hash_alice',
    },
  });

  const bob = await prisma.user.create({
    data: {
      username: 'bob',
      email: 'bob@example.com',
      passwordHash: 'placeholder_hash_bob',
    },
  });

  const charlie = await prisma.user.create({
    data: {
      username: 'charlie',
      email: 'charlie@example.com',
      passwordHash: 'placeholder_hash_charlie',
    },
  });

  await prisma.follow.createMany({
    data: [
      { followerId: alice.id, followingId: bob.id },
      { followerId: alice.id, followingId: charlie.id },
      { followerId: bob.id, followingId: alice.id },
      { followerId: charlie.id, followingId: alice.id },
    ],
  });

  const post1 = await prisma.post.create({
    data: {
      content: 'Hello SocialHub! This is my first post.',
      authorId: alice.id,
      reactionCounts: { '👍': 1, '❤️': 1 },
      replyCount: 1,
    },
  });

  const post2 = await prisma.post.create({
    data: {
      content: 'Welcome to the platform!',
      authorId: bob.id,
      reactionCounts: { '🎉': 1 },
      replyCount: 1,
    },
  });

  await prisma.post.create({
    data: {
      content: 'Great to be here, Alice!',
      authorId: charlie.id,
      parentId: post1.id,
    },
  });

  await prisma.post.create({
    data: {
      content: 'Thanks for the welcome, Bob!',
      authorId: alice.id,
      parentId: post2.id,
    },
  });

  await prisma.reaction.createMany({
    data: [
      { userId: bob.id, targetType: 'POST', targetId: post1.id, emoji: '👍' },
      { userId: charlie.id, targetType: 'POST', targetId: post1.id, emoji: '❤️' },
      { userId: alice.id, targetType: 'POST', targetId: post2.id, emoji: '🎉' },
    ],
  });

  const general = await prisma.channel.create({
    data: {
      name: 'general',
      description: 'General discussion channel',
      isPublic: true,
      ownerId: alice.id,
      memberCount: 3,
    },
  });

  const dev = await prisma.channel.create({
    data: {
      name: 'dev',
      description: 'Developer talk',
      isPublic: false,
      ownerId: bob.id,
      memberCount: 2,
    },
  });

  await prisma.channelMember.createMany({
    data: [
      { channelId: general.id, userId: alice.id, role: 'OWNER' },
      { channelId: general.id, userId: bob.id, role: 'MODERATOR' },
      { channelId: general.id, userId: charlie.id, role: 'MEMBER' },
      { channelId: dev.id, userId: bob.id, role: 'OWNER' },
      { channelId: dev.id, userId: charlie.id, role: 'MEMBER' },
    ],
  });

  const msg1 = await prisma.message.create({
    data: {
      content: 'Welcome to #general!',
      channelId: general.id,
      authorId: alice.id,
      reactionCounts: { '👋': 2 },
    },
  });

  await prisma.message.create({
    data: {
      content: 'Hey everyone!',
      channelId: general.id,
      authorId: bob.id,
    },
  });

  await prisma.message.create({
    data: {
      content: 'Anyone working on the new feature?',
      channelId: dev.id,
      authorId: bob.id,
    },
  });

  await prisma.message.create({
    data: {
      content: 'Yes, I am on it!',
      channelId: dev.id,
      authorId: charlie.id,
    },
  });

  await prisma.reaction.createMany({
    data: [
      { userId: bob.id, targetType: 'MESSAGE', targetId: msg1.id, emoji: '👋' },
      { userId: charlie.id, targetType: 'MESSAGE', targetId: msg1.id, emoji: '👋' },
    ],
  });

  console.log('Seed done');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
