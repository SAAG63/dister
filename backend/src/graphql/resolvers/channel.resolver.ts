import { Resolver, Query, Mutation, Args, ID, Int, ResolveField, Parent, ObjectType, Field } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ChannelType } from '../types/channel.type';
import { UserType } from '../types/user.type';
import { PaginatedChannels } from '../types/paginated.types';
import { ChannelService } from '../../channel/channel.service';
import { AuthGuard } from '../../auth/auth.guard';
import { GqlCurrentUser } from '../current-user.decorator';

@ObjectType()
class ChannelMemberType {
  @Field(() => UserType)
  user: UserType;

  @Field()
  role: string;

  @Field()
  joinedAt: Date;
}

@ObjectType()
class PaginatedChannelMembers {
  @Field(() => [ChannelMemberType])
  data: ChannelMemberType[];

  @Field(() => String, { nullable: true })
  nextCursor: string | null;

  @Field()
  hasMore: boolean;
}

@Resolver(() => ChannelType)
export class ChannelResolver {
  constructor(private readonly channelService: ChannelService) {}

  @Query(() => ChannelType)
  async channel(@Args('id', { type: () => ID }) id: string) {
    return this.channelService.getById(id);
  }

  @Query(() => PaginatedChannels)
  async channels(
    @Args('cursor', { type: () => String, nullable: true }) cursor?: string,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit?: number,
  ) {
    return this.channelService.getPublicChannels(cursor, limit);
  }

  @Mutation(() => ChannelType)
  @UseGuards(AuthGuard)
  async createChannel(
    @GqlCurrentUser() currentUser: { id: string },
    @Args('name') name: string,
    @Args('description', { nullable: true }) description?: string,
    @Args('isPublic', { defaultValue: true }) isPublic?: boolean,
  ) {
    return this.channelService.create(currentUser.id, name, description, isPublic);
  }

  @Mutation(() => ChannelType)
  @UseGuards(AuthGuard)
  async updateChannel(
    @GqlCurrentUser() currentUser: { id: string },
    @Args('id', { type: () => ID }) id: string,
    @Args('name', { nullable: true }) name?: string,
    @Args('description', { nullable: true }) description?: string,
  ) {
    return this.channelService.updateChannel(id, currentUser.id, { name, description });
  }

  @Mutation(() => Boolean)
  @UseGuards(AuthGuard)
  async joinChannel(
    @GqlCurrentUser() currentUser: { id: string },
    @Args('channelId', { type: () => ID }) channelId: string,
  ) {
    await this.channelService.join(channelId, currentUser.id);
    return true;
  }

  @Mutation(() => Boolean)
  @UseGuards(AuthGuard)
  async leaveChannel(
    @GqlCurrentUser() currentUser: { id: string },
    @Args('channelId', { type: () => ID }) channelId: string,
  ) {
    await this.channelService.leave(channelId, currentUser.id);
    return true;
  }

  @ResolveField(() => UserType)
  owner(@Parent() channel: any) {
    return channel.owner;
  }

  @ResolveField(() => PaginatedChannelMembers)
  @UseGuards(AuthGuard)
  async members(
    @Parent() channel: ChannelType,
    @Args('cursor', { type: () => String, nullable: true }) cursor?: string,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit?: number,
  ) {
    return this.channelService.getMembers(channel.id, cursor, limit);
  }
}
