import { Resolver, Query, Mutation, Args, ID, Int, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { MessageType } from '../types/message.type';
import { ReactionType } from '../types/reaction.type';
import { UserType } from '../types/user.type';
import { PaginatedMessages } from '../types/paginated.types';
import { MessageService } from '../../message/message.service';
import { AuthGuard } from '../../auth/auth.guard';
import { GqlCurrentUser } from '../current-user.decorator';

@Resolver(() => MessageType)
export class MessageResolver {
  constructor(private readonly messageService: MessageService) {}

  @Query(() => PaginatedMessages)
  @UseGuards(AuthGuard)
  async messages(
    @Args('channelId', { type: () => ID }) channelId: string,
    @Args('cursor', { type: () => String, nullable: true }) cursor?: string,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit?: number,
  ) {
    return this.messageService.getByChannel(channelId, cursor, limit);
  }

  @Mutation(() => MessageType)
  @UseGuards(AuthGuard)
  async sendMessage(
    @GqlCurrentUser() currentUser: { id: string },
    @Args('channelId', { type: () => ID }) channelId: string,
    @Args('content') content: string,
  ) {
    return this.messageService.send(channelId, currentUser.id, content);
  }

  @Mutation(() => Boolean)
  @UseGuards(AuthGuard)
  async deleteMessage(
    @GqlCurrentUser() currentUser: { id: string },
    @Args('id', { type: () => ID }) id: string,
  ) {
    await this.messageService.delete(id, currentUser.id);
    return true;
  }

  @Mutation(() => Boolean)
  @UseGuards(AuthGuard)
  async addMessageReaction(
    @GqlCurrentUser() currentUser: { id: string },
    @Args('messageId', { type: () => ID }) messageId: string,
    @Args('emoji') emoji: string,
  ) {
    await this.messageService.addReaction(messageId, currentUser.id, emoji);
    return true;
  }

  @Mutation(() => Boolean)
  @UseGuards(AuthGuard)
  async removeMessageReaction(
    @GqlCurrentUser() currentUser: { id: string },
    @Args('messageId', { type: () => ID }) messageId: string,
    @Args('emoji') emoji: string,
  ) {
    await this.messageService.removeReaction(messageId, currentUser.id, emoji);
    return true;
  }

  @ResolveField(() => UserType)
  author(@Parent() message: any) {
    return message.author;
  }

  @ResolveField(() => [ReactionType])
  reactions(@Parent() message: any): ReactionType[] {
    const counts: Record<string, number> = message.reactionCounts ?? {};
    return Object.entries(counts).map(([emoji, count]) => ({
      emoji,
      count: Number(count),
      reacted: false,
    }));
  }
}
