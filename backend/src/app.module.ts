import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PostModule } from './post/post.module';
import { ChannelModule } from './channel/channel.module';
import { MessageModule } from './message/message.module';
import { FeedModule } from './feed/feed.module';
import { SocialHubGraphQLModule } from './graphql/graphql.module';
import { RedisCacheModule } from './redis/redis-cache.module';
import { UploadModule } from './upload/upload.module';
import { BffModule } from './bff/bff.module';
import { JwtMiddleware } from './auth/jwt.middleware';

@Module({
  imports: [RedisCacheModule, PrismaModule, AuthModule, UserModule, PostModule, ChannelModule, MessageModule, FeedModule, SocialHubGraphQLModule, UploadModule, BffModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtMiddleware).forRoutes('*');
  }
}
