import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PostModule } from '../post/post.module';
import { FeedModule } from '../feed/feed.module';

@Module({
  imports: [PostModule, FeedModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
