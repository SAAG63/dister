import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { PostModule } from './post/post.module';
import { ChannelModule } from './channel/channel.module';
import { MessageModule } from './message/message.module';
import { FeedModule } from './feed/feed.module';

@Module({
  imports: [PrismaModule, UserModule, PostModule, ChannelModule, MessageModule, FeedModule],
})
export class AppModule {}
