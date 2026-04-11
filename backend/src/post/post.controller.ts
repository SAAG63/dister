import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PostService } from './post.service';
import { FeedService } from '../feed/feed.service';
import { CreatePostDto } from './dto/create-post.dto';
import { AddReactionDto } from '../common/dto/add-reaction.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthGuard } from '../auth/auth.guard';
import { transformPost } from '../common/helpers/transform-reactions';

@ApiTags('Posts')
@Controller('posts')
export class PostController {
  constructor(
    private readonly postService: PostService,
    private readonly feedService: FeedService,
  ) {}

  @Get('feed')
  @UseGuards(AuthGuard)
  async getFeed(
    @Query() { cursor, limit }: PaginationDto,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.feedService.getFeed(userId, cursor, limit);
    const myReactions = await this.postService.getMyReactions(userId, result.data.map((p: any) => p.id));
    return {
      ...result,
      data: result.data.map((p: any) => transformPost(p, myReactions)),
    };
  }

  @Get(':id')
  async getPost(@Param('id') id: string, @CurrentUser('id') userId?: string) {
    const post = await this.postService.getById(id);
    const myReactions = userId
      ? await this.postService.getMyReactions(userId, [post.id])
      : [];
    return transformPost(post, myReactions);
  }

  @Get(':id/thread')
  async getThread(
    @Param('id') id: string,
    @Query() { cursor, limit }: PaginationDto,
    @CurrentUser('id') userId?: string,
  ) {
    const result = await this.postService.getThread(id, cursor, limit);
    const myReactions = userId
      ? await this.postService.getMyReactions(userId, result.data.map((p: any) => p.id))
      : [];
    return {
      ...result,
      data: result.data.map((p: any) => transformPost(p, myReactions)),
    };
  }

  @Post()
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createPost(@Body() dto: CreatePostDto, @CurrentUser('id') userId: string) {
    const post = await this.postService.create(userId, dto.content, dto.parentId);
    return transformPost(post);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  deletePost(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.postService.delete(id, userId);
  }

  @Post(':id/reactions')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async addReaction(
    @Param('id') id: string,
    @Body() dto: AddReactionDto,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.postService.addReaction(id, userId, dto.emoji);
    await this.feedService.invalidateAllFeeds();
    return result;
  }

  @Delete(':id/reactions/:emoji')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeReaction(
    @Param('id') id: string,
    @Param('emoji') emoji: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.postService.removeReaction(id, userId, emoji);
    await this.feedService.invalidateAllFeeds();
  }
}
