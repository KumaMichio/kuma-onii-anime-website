import { Controller, Get, Param, Post, Body, UseGuards, Request } from '@nestjs/common';
import { EpisodesService } from './episodes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('episodes')
export class EpisodesController {
  constructor(private episodesService: EpisodesService) {}

  @Get(':animeId/:episodeNumber')
  findOne(
    @Param('animeId') animeId: string,
    @Param('episodeNumber') episodeNumber: string,
  ) {
    return this.episodesService.findOne(animeId, parseInt(episodeNumber));
  }

  @UseGuards(JwtAuthGuard)
  @Post(':episodeId/progress')
  updateProgress(
    @Param('episodeId') episodeId: string,
    @Body() body: { progress: number },
    @Request() req,
  ) {
    return this.episodesService.updateProgress(
      req.user.id,
      episodeId,
      body.progress,
    );
  }
}

