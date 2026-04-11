import { Resolver, Query, Mutation, Args, ID, Int, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UserType } from '../types/user.type';
import { PaginatedUsers, PaginatedPosts } from '../types/paginated.types';
import { UserService } from '../../user/user.service';
import { PostService } from '../../post/post.service';
import { AuthGuard } from '../../auth/auth.guard';
import { GqlCurrentUser } from '../current-user.decorator';

@Resolver(() => UserType)
export class UserResolver {
  constructor(
    private readonly userService: UserService,
    private readonly postService: PostService,
  ) {}

  @Query(() => UserType)
  async user(@Args('id', { type: () => ID }) id: string) {
    return this.userService.getById(id);
  }

  @Query(() => PaginatedUsers)
  async users(
    @Args('cursor', { type: () => String, nullable: true }) cursor?: string,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit?: number,
  ) {
    return this.userService.getAll(cursor, limit);
  }

  @Mutation(() => UserType)
  @UseGuards(AuthGuard)
  async updateUser(
    @GqlCurrentUser() currentUser: { id: string },
    @Args('username', { nullable: true }) username?: string,
    @Args('email', { nullable: true }) email?: string,
    @Args('avatarUrl', { nullable: true }) avatarUrl?: string,
  ) {
    return this.userService.updateProfile(currentUser.id, { username, email, avatarUrl });
  }

  @Mutation(() => Boolean)
  @UseGuards(AuthGuard)
  async follow(
    @GqlCurrentUser() currentUser: { id: string },
    @Args('userId', { type: () => ID }) userId: string,
  ) {
    await this.userService.follow(currentUser.id, userId);
    return true;
  }

  @Mutation(() => Boolean)
  @UseGuards(AuthGuard)
  async unfollow(
    @GqlCurrentUser() currentUser: { id: string },
    @Args('userId', { type: () => ID }) userId: string,
  ) {
    await this.userService.unfollow(currentUser.id, userId);
    return true;
  }

  @ResolveField(() => PaginatedPosts)
  async posts(
    @Parent() user: UserType,
    @Args('cursor', { type: () => String, nullable: true }) cursor?: string,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit?: number,
  ) {
    return this.postService.getByAuthor(user.id, cursor, limit);
  }

  @ResolveField(() => PaginatedUsers)
  async followers(
    @Parent() user: UserType,
    @Args('cursor', { type: () => String, nullable: true }) cursor?: string,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit?: number,
  ) {
    return this.userService.getFollowers(user.id, cursor, limit);
  }

  @ResolveField(() => PaginatedUsers)
  async following(
    @Parent() user: UserType,
    @Args('cursor', { type: () => String, nullable: true }) cursor?: string,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit?: number,
  ) {
    return this.userService.getFollowing(user.id, cursor, limit);
  }
}
