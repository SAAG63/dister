import { Controller, Get, Post, Param, Req, Res, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import multer from 'multer';
import { UploadService } from './upload.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('avatar')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('file', { storage: multer.memoryStorage() }))
  async uploadAvatar(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    const objectName = await this.uploadService.uploadFile(req.user.id, file.buffer, file.mimetype);
    const avatarUrl = `/api/upload/avatars/${objectName}`;
    return { avatarUrl };
  }

  @Get('avatars/:name')
  async getAvatar(@Param('name') name: string, @Res() res: Response) {
    const { stream, contentType } = await this.uploadService.getFile(name);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    stream.pipe(res);
  }
}
