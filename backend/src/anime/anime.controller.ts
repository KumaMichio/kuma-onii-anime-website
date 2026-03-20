import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AnimeService } from './anime.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('anime')
export class AnimeController {
  constructor(private animeService: AnimeService) {}

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.animeService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      search,
    );
  }

  @Get('popular')
  getPopular(@Query('limit') limit?: string) {
    return this.animeService.getPopular(limit ? parseInt(limit) : 10);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.animeService.findOne(id);
  }
}

