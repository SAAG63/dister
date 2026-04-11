import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class ReactionType {
  @Field()
  emoji: string;

  @Field(() => Int)
  count: number;

  @Field()
  reacted: boolean;
}
