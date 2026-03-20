import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EpisodesService {
  constructor(private prisma: PrismaService) {}

  async findOne(animeId: string, episodeNumber: number) {
    return this.prisma.episode.findUnique({
      where: {
        animeId_episodeNumber: {
          animeId,
          episodeNumber,
        },
      },
      include: {
        anime: {
          include: { genres: true },
        },
      },
    });
  }

  async updateProgress(
    userId: string,
    episodeId: string,
    progress: number,
  ) {
    return this.prisma.watchHistory.upsert({
      where: {
        userId_episodeId: {
          userId,
          episodeId,
        },
      },
      update: { progress, updatedAt: new Date() },
      create: {
        userId,
        episodeId,
        progress,
      },
    });
  }
}

