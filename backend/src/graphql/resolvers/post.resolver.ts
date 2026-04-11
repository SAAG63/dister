import { Resolver, Query, Mutation, Args, ID, Int, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PostType } from '../types/post.type';
import { ReactionType } from '../types/reaction.type';
import { UserType } from '../types/user.type';
import { PaginatedPosts } from '../types/paginated.types';
import { PostService } from '../../post/post.service';
import { FeedService } from '../../feed/feed.service';
import { AuthGuard } from '../../auth/auth.guard';
import { GqlCurrentUser } from '../current-user.decorator';

@Resolver(() => PostType)
export class PostResolver {
  constructor(
    private readonly postService: PostService,
    private readonly feedService: FeedService,
  ) {}

  @Query(() => PostType)
  async post(@Args('id', { type: () => ID }) id: string) {
    return this.postService.getById(id);
  }

  @Query(() => PaginatedPosts)
  @UseGuards(AuthGuard)
  async feed(
    @GqlCurrentUser() currentUser: { id: string },
    @Args('cursor', { type: () => String, nullable: true }) cursor?: string,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit?: number,
  ) {
    return this.feedService.getFeed(currentUser.id, cursor, limit);
  }

  @Mutation(() => PostType)
  @UseGuards(AuthGuard)
  async createPost(
    @GqlCurrentUser() currentUser: { id: string },
    @Args('content') content: string,
    @Args('parentId', { type: () => ID, nullable: true }) parentId?: string,
  ) {
    return this.postService.create(currentUser.id, content, parentId);
  }

  @Mutation(() => Boolean)
  @UseGuards(AuthGuard)
  async deletePost(
    @GqlCurrentUser() currentUser: { id: string },
    @Args('id', { type: () => ID }) id: string,
  ) {
    await this.postService.delete(id, currentUser.id);
    return true;
  }

  @Mutation(() => Boolean)
  @UseGuards(AuthGuard)
  async addPostReaction(
    @GqlCurrentUser() currentUser: { id: string },
    @Args('postId', { type: () => ID }) postId: string,
    @Args('emoji') emoji: string,
  ) {
    await this.postService.addReaction(postId, currentUser.id, emoji);
    return true;
  }

  @Mutation(() => Boolean)
  @UseGuards(AuthGuard)
  async removePostReaction(
    @GqlCurrentUser() currentUser: { id: string },
    @Args('postId', { type: () => ID }) postId: string,
    @Args('emoji') emoji: string,
  ) {
    await this.postService.removeReaction(postId, currentUser.id, emoji);
    return true;
  }

  @ResolveField(() => UserType)
  author(@Parent() post: any) {
    return post.author;
  }

  @ResolveField(() => [ReactionType])
  reactions(@Parent() post: any): ReactionType[] {
    const counts: Record<string, number> = post.reactionCounts ?? {};
    return Object.entries(counts).map(([emoji, count]) => ({
      emoji,
      count: Number(count),
      reacted: false,
    }));
  }

  @ResolveField(() => PaginatedPosts)
  async replies(
    @Parent() post: PostType,
    @Args('cursor', { type: () => String, nullable: true }) cursor?: string,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit?: number,
  ) {
    return this.postService.getThread(post.id, cursor, limit);
  }
}
