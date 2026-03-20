import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AnimeService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async findAll(page: number = 1, limit: number = 20, search?: string) {
    const cacheKey = `animes:${page}:${limit}:${search || ''}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const skip = (page - 1) * limit;
    const where: Prisma.AnimeWhereInput = search
      ? {
          OR: [
            { title: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { titleEn: { contains: search, mode: Prisma.QueryMode.insensitive } },
          ],
        }
      : {};

    const [animes, total] = await Promise.all([
      this.prisma.anime.findMany({
        where,
        skip,
        take: limit,
        include: { genres: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.anime.count({ where }),
    ]);

    const result = {
      data: animes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    await this.cacheManager.set(cacheKey, result, 300); // 5 minutes
    return result;
  }

  async findOne(id: string) {
    const cacheKey = `anime:${id}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const anime = await this.prisma.anime.findUnique({
      where: { id },
      include: {
        genres: true,
        episodes: {
          orderBy: { episodeNumber: 'asc' },
        },
      },
    });

    if (anime) {
      await this.cacheManager.set(cacheKey, anime, 300);
    }
    return anime;
  }

  async getPopular(limit: number = 10) {
    const cacheKey = `animes:popular:${limit}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const animes = await this.prisma.anime.findMany({
      take: limit,
      orderBy: { views: 'desc' },
      include: { genres: true },
    });

    await this.cacheManager.set(cacheKey, animes, 600); // 10 minutes
    return animes;
  }
}

