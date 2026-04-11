import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class UserType {
  @Field(() => ID)
  id: string;

  @Field()
  username: string;

  @Field(() => String, { nullable: true })
  avatarUrl: string | null;

  @Field()
  createdAt: Date;
}
