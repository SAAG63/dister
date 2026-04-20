import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { UserResolver } from './resolvers/user.resolver';
import { PostResolver } from './resolvers/post.resolver';
import { ChannelResolver } from './resolvers/channel.resolver';
import { MessageResolver } from './resolvers/message.resolver';
import { UserModule } from '../user/user.module';
import { PostModule } from '../post/post.module';
import { ChannelModule } from '../channel/channel.module';
import { MessageModule } from '../message/message.module';
import { FeedModule } from '../feed/feed.module';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      playground: true,
      sortSchema: true,
      csrfPrevention: false,
    }),
    UserModule,
    PostModule,
    ChannelModule,
    MessageModule,
    FeedModule,
  ],
  providers: [UserResolver, PostResolver, ChannelResolver, MessageResolver],
})
export class SocialHubGraphQLModule {}
