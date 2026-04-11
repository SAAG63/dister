import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
export class PostType {
  @Field(() => ID)
  id: string;

  @Field()
  content: string;

  @Field()
  createdAt: Date;

  @Field(() => ID, { nullable: true })
  parentId: string | null;

  @Field(() => Int)
  replyCount: number;

  authorId: string;
  reactionCounts: Record<string, number>;
}
