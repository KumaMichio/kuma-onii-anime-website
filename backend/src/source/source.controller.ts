import { Controller, Get, Param, Query } from '@nestjs/common';
import { SourceService } from './source.service';

@Controller('source')
export class SourceController {
  constructor(private readonly sourceService: SourceService) {}

  @Get('films/phim-moi-cap-nhat')
  getFilmsUpdated(@Query('page') page?: string) {
    const p = page ? parseInt(page, 10) : 1;
    return this.sourceService.getFilmListUpdated(p);
  }

  @Get('films/danh-sach/:slug')
  getFilmsDanhSach(@Param('slug') slug: string, @Query('page') page?: string) {
    const p = page ? parseInt(page, 10) : 1;
    return this.sourceService.getFilmListByDanhSach(slug, p);
  }

  @Get('films/the-loai/:slug')
  getFilmsTheLoai(@Param('slug') slug: string, @Query('page') page?: string) {
    const p = page ? parseInt(page, 10) : 1;
    return this.sourceService.getFilmListByTheLoai(slug, p);
  }

  @Get('films/quoc-gia/:slug')
  getFilmsQuocGia(@Param('slug') slug: string, @Query('page') page?: string) {
    const p = page ? parseInt(page, 10) : 1;
    return this.sourceService.getFilmListByQuocGia(slug, p);
  }

  @Get('films/nam-phat-hanh/:slug')
  getFilmsNamPhatHanh(@Param('slug') slug: string, @Query('page') page?: string) {
    const p = page ? parseInt(page, 10) : 1;
    return this.sourceService.getFilmListByNamPhatHanh(slug, p);
  }

  @Get('films/search')
  searchFilms(@Query('keyword') keyword: string) {
    return this.sourceService.searchFilms(keyword);
  }

  @Get('film/:slug')
  getFilmDetail(@Param('slug') slug: string) {
    return this.sourceService.getFilmDetail(slug);
  }
}

