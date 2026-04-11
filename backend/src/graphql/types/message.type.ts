import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class MessageType {
  @Field(() => ID)
  id: string;

  @Field()
  content: string;

  @Field()
  createdAt: Date;

  @Field(() => ID)
  channelId: string;

  authorId: string;
  reactionCounts: Record<string, number>;
}
