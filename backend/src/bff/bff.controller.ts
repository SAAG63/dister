import { Controller, Get, Param, Req } from '@nestjs/common';
import { BffService } from './bff.service';

@Controller('bff')
export class BffController {
  constructor(private readonly bffService: BffService) {}

  @Get('profile/:id')
  async getProfile(@Param('id') id: string, @Req() req: any) {
    return this.bffService.getProfile(id, req.user?.id);
  }

  @Get('channel/:id')
  async getChannelOverview(@Param('id') id: string, @Req() req: any) {
    return this.bffService.getChannelOverview(id, req.user?.id);
  }
}
