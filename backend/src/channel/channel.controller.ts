import {
  Controller,
  Get,
  Post,
  Patch,
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
import { ChannelService } from './channel.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthGuard } from '../auth/auth.guard';
import { ChannelRolesGuard } from '../auth/channel-roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Channels')
@Controller('channels')
export class ChannelController {
  constructor(private readonly channelService: ChannelService) {}

  @Get()
  getPublicChannels(@Query() { cursor, limit }: PaginationDto) {
    return this.channelService.getPublicChannels(cursor, limit);
  }

  @Get('my')
  @UseGuards(AuthGuard)
  getMyChannels(@CurrentUser('id') userId: string) {
    return this.channelService.getMyChannels(userId);
  }

  @Get(':id')
  async getChannel(@Param('id') id: string, @CurrentUser('id') userId?: string) {
    const channel = await this.channelService.getById(id);
    const role = userId ? await this.channelService.getMemberRole(id, userId) : null;
    return { ...channel, isMember: role !== null, role };
  }

  @Post()
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  createChannel(@Body() dto: CreateChannelDto, @CurrentUser('id') userId: string) {
    return this.channelService.create(userId, dto.name, dto.description, dto.isPublic);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, ChannelRolesGuard)
  @Roles('OWNER', 'MODERATOR')
  updateChannel(
    @Param('id') id: string,
    @Body() dto: UpdateChannelDto,
  ) {
    return this.channelService.updateChannelDirect(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, ChannelRolesGuard)
  @Roles('OWNER')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteChannel(@Param('id') id: string) {
    return this.channelService.delete(id);
  }

  @Post(':id/join')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  join(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.channelService.join(id, userId);
  }

  @Delete(':id/leave')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  leave(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.channelService.leave(id, userId);
  }

  @Patch(':id/members/:userId/role')
  @UseGuards(AuthGuard, ChannelRolesGuard)
  @Roles('OWNER')
  setMemberRole(
    @Param('id') id: string,
    @Param('userId') targetUserId: string,
    @Body('role') role: 'MODERATOR' | 'MEMBER',
  ) {
    return this.channelService.setMemberRole(id, targetUserId, role);
  }

  @Post(':id/members/:userId')
  @UseGuards(AuthGuard, ChannelRolesGuard)
  @Roles('OWNER', 'MODERATOR')
  @HttpCode(HttpStatus.CREATED)
  inviteMember(@Param('id') id: string, @Param('userId') targetUserId: string) {
    return this.channelService.invite(id, targetUserId);
  }

  @Delete(':id/members/:userId')
  @UseGuards(AuthGuard, ChannelRolesGuard)
  @Roles('OWNER')
  @HttpCode(HttpStatus.NO_CONTENT)
  kickMember(@Param('id') id: string, @Param('userId') targetUserId: string) {
    return this.channelService.kick(id, targetUserId);
  }

  @Get(':id/members')
  @UseGuards(AuthGuard)
  async getMembers(
    @Param('id') id: string,
    @Query() { cursor, limit }: PaginationDto,
    @CurrentUser('id') userId: string,
  ) {
    const channel = await this.channelService.getById(id);
    if (!channel.isPublic) {
      const isMember = await this.channelService.isMember(id, userId);
      if (!isMember) throw new ForbiddenException('Not a channel member');
    }
    return this.channelService.getMembers(id, cursor, limit);
  }
}
