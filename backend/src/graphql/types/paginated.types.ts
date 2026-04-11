import { ObjectType, Field } from '@nestjs/graphql';
import { UserType } from './user.type';
import { PostType } from './post.type';
import { MessageType } from './message.type';
import { ChannelType } from './channel.type';

@ObjectType()
export class PaginatedUsers {
  @Field(() => [UserType])
  data: UserType[];

  @Field(() => String, { nullable: true })
  nextCursor: string | null;

  @Field()
  hasMore: boolean;
}

@ObjectType()
export class PaginatedPosts {
  @Field(() => [PostType])
  data: PostType[];

  @Field(() => String, { nullable: true })
  nextCursor: string | null;

  @Field()
  hasMore: boolean;
}

@ObjectType()
export class PaginatedMessages {
  @Field(() => [MessageType])
  data: MessageType[];

  @Field(() => String, { nullable: true })
  nextCursor: string | null;

  @Field()
  hasMore: boolean;
}

@ObjectType()
export class PaginatedChannels {
  @Field(() => [ChannelType])
  data: ChannelType[];

  @Field(() => String, { nullable: true })
  nextCursor: string | null;

  @Field()
  hasMore: boolean;
}
