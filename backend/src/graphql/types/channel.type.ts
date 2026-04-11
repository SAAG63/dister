import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
export class ChannelType {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field(() => String, { nullable: true })
  description: string | null;

  @Field()
  isPublic: boolean;

  @Field(() => Int)
  memberCount: number;

  @Field()
  createdAt: Date;

  ownerId: string;
}
