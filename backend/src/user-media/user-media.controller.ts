import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserMediaService } from './user-media.service';
import { UpdateProgressDto } from './dto/update-progress.dto';
import type { Request } from 'express';

type AuthUser = {
  id: string;
};

@UseGuards(JwtAuthGuard)
@Controller('user-media')
export class UserMediaController {
  constructor(private readonly userMediaService: UserMediaService) {}

  private getUserId(req: Request): string {
    const user = (req as any).user as AuthUser | undefined;
    if (!user?.id) throw new Error('Unauthorized');
    return user.id;
  }

  @Post('favorites/:filmSlug')
  toggleFavorite(@Req() req: Request, @Param('filmSlug') filmSlug: string) {
    const userId = this.getUserId(req);
    return this.userMediaService.toggleFavorite(userId, filmSlug);
  }

  @Get('favorites')
  listFavorites(@Req() req: Request) {
    const userId = this.getUserId(req);
    return this.userMediaService.listFavorites(userId);
  }

  @Get('favorites/:filmSlug/status')
  getFavoriteStatus(@Req() req: Request, @Param('filmSlug') filmSlug: string) {
    const userId = this.getUserId(req);
    return this.userMediaService.getFavoriteStatus(userId, filmSlug);
  }

  @Post('watch/progress')
  updateProgress(@Req() req: Request, @Body() body: UpdateProgressDto) {
    const userId = this.getUserId(req);
    return this.userMediaService.updateProgress(userId, body.filmSlug, body.episodeNumber, body.progress);
  }

  @Get('watch/progress')
  getProgress(
    @Req() req: Request,
    @Query('filmSlug') filmSlug: string,
    @Query('episodeNumber') episodeNumber: string,
  ) {
    const userId = this.getUserId(req);
    const ep = parseInt(episodeNumber, 10);
    return this.userMediaService.getProgress(userId, filmSlug, ep);
  }

  @Get('watch/continue')
  getContinue(@Req() req: Request, @Query('limit') limit?: string) {
    const userId = this.getUserId(req);
    const l = limit ? parseInt(limit, 10) : 20;
    return this.userMediaService.getContinueWatching(userId, l);
  }

  @Get('stats')
  getStats(@Req() req: Request) {
    const userId = this.getUserId(req);
    return this.userMediaService.getStats(userId);
  }

  @Get('recommendations')
  getRecommendations(@Req() req: Request, @Query('limit') limit?: string) {
    const userId = this.getUserId(req);
    const l = limit ? Math.min(parseInt(limit, 10), 24) : 12;
    return this.userMediaService.getRecommendations(userId, l);
  }
}
