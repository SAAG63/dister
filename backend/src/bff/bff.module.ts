import { Module } from '@nestjs/common';
import { BffService } from './bff.service';
import { BffController } from './bff.controller';
import { UserModule } from '../user/user.module';
import { PostModule } from '../post/post.module';
import { ChannelModule } from '../channel/channel.module';
import { MessageModule } from '../message/message.module';

@Module({
  imports: [UserModule, PostModule, ChannelModule, MessageModule],
  controllers: [BffController],
  providers: [BffService],
})
export class BffModule {}
