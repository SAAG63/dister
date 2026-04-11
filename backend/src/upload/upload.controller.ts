import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { UploadService } from './upload.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Get('avatar-url')
  @UseGuards(AuthGuard)
  async getAvatarUploadUrl(@Req() req: any) {
    return this.uploadService.getPresignedUploadUrl(req.user.id);
  }
}
