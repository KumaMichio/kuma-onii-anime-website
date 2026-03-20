import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SourceService } from '../source/source.service';
import { randomUUID } from 'crypto';

function parseEpisodeNumber(raw: any): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw !== 'string') return null;
  const m = raw.match(/(\d+)/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) ? n : null;
}

function computeAnimeStatus(currentEpisode: any): 'ONGOING' | 'COMPLETED' | 'UPCOMING' {
  const s = String(currentEpisode ?? '');
  if (/hoan tat|hoàn tất|complete|completed/i.test(s)) return 'COMPLETED';
  return 'ONGOING';
}

@Injectable()
export class UserMediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sourceService: SourceService,
  ) {}

  private getDefaultEpisodes(detail: any) {
    const episodesServers = Array.isArray(detail?.movie?.episodes) ? detail.movie.episodes : [];
    const firstServer = episodesServers[0];
    const items = Array.isArray(firstServer?.items) ? firstServer.items : [];
    return items;
  }

  private async ensureAnimeBySlug(filmSlug: string) {
    const detail = await this.sourceService.getFilmDetail(filmSlug);
    const movie = detail.movie;
    if (!movie?.slug) throw new NotFoundException('Film not found');

    const id = movie.slug as string;
    const status = computeAnimeStatus(movie.current_episode);

    // Minimal upsert: store only fields used by UI and foreign keys.
    return this.prisma.anime.upsert({
      where: { id },
      update: {
        title: movie.name ?? movie.original_name ?? id,
        titleEn: null,
        description: movie.description ?? null,
        poster: movie.poster_url ?? movie.thumb_url ?? '',
        banner: null,
        status: status as any,
        type: 'TV' as any,
      },
      create: {
        id,
        title: movie.name ?? movie.original_name ?? id,
        titleEn: null,
        description: movie.description ?? null,
        poster: movie.poster_url ?? movie.thumb_url ?? '',
        banner: null,
        status: status as any,
        type: 'TV' as any,
        rating: null,
        views: 0,
      },
    });
  }

  private async ensureEpisodeBySlug(filmSlug: string, episodeNumber: number) {
    const detail = await this.sourceService.getFilmDetail(filmSlug);
    const movie = detail.movie;
    if (!movie?.slug) throw new NotFoundException('Film not found');

    const animeId = movie.slug as string;
    const episodesItems = this.getDefaultEpisodes(detail);
    const match = episodesItems.find((it: any) => parseEpisodeNumber(it?.name) === episodeNumber);
    if (!match) throw new NotFoundException('Episode not found');

    const episodeSlug = String(match?.slug ?? episodeNumber);
    const episodeId = `${animeId}:${episodeSlug}`;

    return this.prisma.episode.upsert({
      where: {
        animeId_episodeNumber: {
          animeId,
          episodeNumber,
        },
      },
      create: {
        id: episodeId,
        animeId,
        episodeNumber,
        title: match?.name ? String(match.name) : null,
        description: null,
        thumbnail: null,
        videoUrl: match?.m3u8,
        duration: null,
        views: 0,
      },
      update: {
        title: match?.name ? String(match.name) : null,
        videoUrl: match?.m3u8,
        updatedAt: new Date(),
      },
    });
  }

  async toggleFavorite(userId: string, filmSlug: string) {
    // Ensure foreign key exists.
    const anime = await this.ensureAnimeBySlug(filmSlug);

    const compositeKey = { userId, animeId: anime.id };
    const existing = await this.prisma.favorite.findUnique({
      where: { userId_animeId: compositeKey },
    });

    if (existing) {
      await this.prisma.favorite.delete({ where: { id: existing.id } });
      return { favorited: false };
    }

    await this.prisma.favorite.create({
      data: {
        id: randomUUID(),
        userId,
        animeId: anime.id,
      },
    });
    return { favorited: true };
  }

  async getFavoriteStatus(userId: string, filmSlug: string) {
    const existing = await this.prisma.favorite.findUnique({
      where: { userId_animeId: { userId, animeId: filmSlug } },
    });
    return { favorited: !!existing };
  }

  async listFavorites(userId: string) {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { anime: true },
    });

    return favorites.map((f) => ({
      slug: f.anime.id,
      title: f.anime.title,
      poster_url: f.anime.poster,
      description: f.anime.description,
      createdAt: f.createdAt,
    }));
  }

  async updateProgress(userId: string, filmSlug: string, episodeNumber: number, progress: number) {
    const p = Math.max(0, Math.min(1, progress));
    await this.ensureAnimeBySlug(filmSlug);
    const episode = await this.ensureEpisodeBySlug(filmSlug, episodeNumber);

    await this.prisma.watchHistory.upsert({
      where: {
        userId_episodeId: {
          userId,
          episodeId: episode.id,
        },
      },
      update: { progress: p, updatedAt: new Date(), watchedAt: new Date() },
      create: { id: randomUUID(), userId, episodeId: episode.id, progress: p, watchedAt: new Date() },
    });

    return { ok: true };
  }

  async getProgress(userId: string, filmSlug: string, episodeNumber: number) {
    await this.ensureAnimeBySlug(filmSlug);
    const episode = await this.ensureEpisodeBySlug(filmSlug, episodeNumber);
    const history = await this.prisma.watchHistory.findUnique({
      where: { userId_episodeId: { userId, episodeId: episode.id } },
    });
    return { progress: history?.progress ?? 0 };
  }

  async getContinueWatching(userId: string, limit = 20) {
    const rows = await this.prisma.watchHistory.findMany({
      where: { userId },
      orderBy: { watchedAt: 'desc' },
      take: Math.max(1, Math.min(100, limit)),
      include: {
        episode: {
          include: {
            anime: true,
          },
        },
      },
    });

    return rows.map((w) => ({
      slug: w.episode.anime.id,
      title: w.episode.anime.title,
      poster_url: w.episode.anime.poster,
      episodeNumber: w.episode.episodeNumber,
      progress: w.progress,
      watchedAt: w.watchedAt,
    }));
  }
}

