import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { PostService } from '../post/post.service';
import { ChannelService } from '../channel/channel.service';
import { MessageService } from '../message/message.service';
import { transformPost, transformMessage } from '../common/helpers/transform-reactions';

@Injectable()
export class BffService {
  constructor(
    private readonly userService: UserService,
    private readonly postService: PostService,
    private readonly channelService: ChannelService,
    private readonly messageService: MessageService,
  ) {}

  async getProfile(userId: string, currentUserId?: string) {
    const [profile, posts, isFollowing] = await Promise.all([
      this.userService.getProfileWithCounts(userId),
      this.postService.getByAuthor(userId, undefined, 10),
      currentUserId && currentUserId !== userId
        ? this.userService.isFollowing(currentUserId, userId)
        : Promise.resolve(false),
    ]);

    const myReactions = currentUserId
      ? await this.postService.getMyReactions(currentUserId, posts.data.map((p: any) => p.id))
      : [];

    return {
      ...profile,
      posts: {
        ...posts,
        data: posts.data.map((p: any) => transformPost(p, myReactions)),
      },
      isFollowing,
    };
  }

  async getChannelOverview(channelId: string, currentUserId?: string) {
    const [channel, messages, role] = await Promise.all([
      this.channelService.getById(channelId),
      this.messageService.getByChannel(channelId, undefined, 20),
      currentUserId
        ? this.channelService.getMemberRole(channelId, currentUserId)
        : Promise.resolve(null),
    ]);

    const myReactions = currentUserId
      ? await this.messageService.getMyReactions(currentUserId, messages.data.map((m: any) => m.id))
      : [];

    return {
      ...channel,
      messages: {
        ...messages,
        data: messages.data.map((m: any) => transformMessage(m, myReactions)),
      },
      role,
      isMember: role !== null,
    };
  }
}
