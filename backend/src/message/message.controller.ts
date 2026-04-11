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
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MessageService } from './message.service';
import { ChannelService } from '../channel/channel.service';
import { SendMessageDto } from './dto/send-message.dto';
import { AddReactionDto } from '../common/dto/add-reaction.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthGuard } from '../auth/auth.guard';
import { transformMessage } from '../common/helpers/transform-reactions';

@ApiTags('Messages')
@Controller('channels/:channelId/messages')
export class MessageController {
  constructor(
    private readonly messageService: MessageService,
    private readonly channelService: ChannelService,
  ) {}

  @Get()
  @UseGuards(AuthGuard)
  async getMessages(
    @Param('channelId') channelId: string,
    @Query() { cursor, limit }: PaginationDto,
    @CurrentUser('id') userId: string,
  ) {
    const channel = await this.channelService.getById(channelId);
    if (!channel.isPublic) {
      const isMember = await this.channelService.isMember(channelId, userId);
      if (!isMember) throw new ForbiddenException('Not a channel member');
    }

    const result = await this.messageService.getByChannel(channelId, cursor, limit);
    const myReactions = await this.messageService.getMyReactions(userId, result.data.map((m: any) => m.id));
    return {
      ...result,
      data: result.data.map((m: any) => transformMessage(m, myReactions)),
    };
  }

  @Post()
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async sendMessage(
    @Param('channelId') channelId: string,
    @Body() dto: SendMessageDto,
    @CurrentUser('id') userId: string,
  ) {
    const message = await this.messageService.send(channelId, userId, dto.content);
    return transformMessage(message);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteMessage(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.messageService.delete(id, userId);
  }

  @Post(':id/reactions')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  addReaction(
    @Param('id') id: string,
    @Body() dto: AddReactionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.messageService.addReaction(id, userId, dto.emoji);
  }

  @Delete(':id/reactions/:emoji')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  removeReaction(
    @Param('id') id: string,
    @Param('emoji') emoji: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.messageService.removeReaction(id, userId, emoji);
  }
}
