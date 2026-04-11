import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { PostService } from '../post/post.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthGuard } from '../auth/auth.guard';
import { transformPost } from '../common/helpers/transform-reactions';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly postService: PostService,
  ) {}

  @Get()
  async getAllUsers(@Query() { cursor, limit }: PaginationDto, @Query('search') search?: string, @CurrentUser('id') currentUserId?: string) {
    const result = await this.userService.getAll(cursor, limit, search);
    if (!currentUserId) return result;
    const followingSet = await this.userService.isFollowingBatch(currentUserId, result.data.map((u: any) => u.id));
    return {
      ...result,
      data: result.data.map((u: any) => ({ ...u, isFollowing: followingSet.has(u.id) })),
    };
  }

  @Get(':id')
  async getUser(@Param('id') id: string, @CurrentUser('id') currentUserId?: string) {
    const profile = await this.userService.getProfileWithCounts(id);
    const isFollowing = currentUserId ? await this.userService.isFollowing(currentUserId, id) : false;
    return { ...profile, isFollowing };
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  updateProfile(@Param('id') id: string, @Body() dto: UpdateProfileDto, @CurrentUser('id') currentUserId: string) {
    if (currentUserId !== id) throw new ForbiddenException('Not your profile');
    return this.userService.updateProfile(id, dto);
  }

  @Get(':id/posts')
  async getUserPosts(
    @Param('id') id: string,
    @Query() { cursor, limit }: PaginationDto,
    @CurrentUser('id') currentUserId?: string,
  ) {
    const result = await this.postService.getByAuthor(id, cursor, limit);
    const myReactions = currentUserId
      ? await this.postService.getMyReactions(currentUserId, result.data.map((p: any) => p.id))
      : [];
    return {
      ...result,
      data: result.data.map((p: any) => transformPost(p, myReactions)),
    };
  }

  @Get(':id/followers')
  async getFollowers(@Param('id') id: string, @Query() { cursor, limit }: PaginationDto, @CurrentUser('id') currentUserId?: string) {
    const result = await this.userService.getFollowers(id, cursor, limit);
    if (!currentUserId) return result;
    const followingSet = await this.userService.isFollowingBatch(currentUserId, result.data.map((u: any) => u.id));
    return {
      ...result,
      data: result.data.map((u: any) => ({ ...u, isFollowing: followingSet.has(u.id) })),
    };
  }

  @Get(':id/following')
  async getFollowing(@Param('id') id: string, @Query() { cursor, limit }: PaginationDto, @CurrentUser('id') currentUserId?: string) {
    const result = await this.userService.getFollowing(id, cursor, limit);
    if (!currentUserId) return result;
    const followingSet = await this.userService.isFollowingBatch(currentUserId, result.data.map((u: any) => u.id));
    return {
      ...result,
      data: result.data.map((u: any) => ({ ...u, isFollowing: followingSet.has(u.id) })),
    };
  }

  @Post(':id/follow')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  follow(@Param('id') id: string, @CurrentUser('id') currentUserId: string) {
    return this.userService.follow(currentUserId, id);
  }

  @Delete(':id/follow')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  unfollow(@Param('id') id: string, @CurrentUser('id') currentUserId: string) {
    return this.userService.unfollow(currentUserId, id);
  }
}
