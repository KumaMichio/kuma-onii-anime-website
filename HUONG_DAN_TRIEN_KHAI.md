# Hướng Dẫn Triển Khai Website Xem Anime

## Mục Lục
1. [Tổng Quan Kiến Trúc](#tổng-quan-kiến-trúc)
2. [Cài Đặt Môi Trường](#cài-đặt-môi-trường)
3. [Backend API (NestJS)](#backend-api-nestjs)
4. [Frontend (Next.js)](#frontend-nextjs)
5. [Tích Hợp và Kết Nối](#tích-hợp-và-kết-nối)
6. [Deployment](#deployment)

---

## Tổng Quan Kiến Trúc

### Tech Stack
- **Frontend**: Next.js 14+ (App Router), React, Tailwind CSS, hls.js, TanStack Query
- **Backend**: Node.js, NestJS, PostgreSQL, Prisma ORM, Redis, JWT
- **Video Streaming**: HLS (HTTP Live Streaming) với hls.js

### Cấu Trúc Thư Mục
```
anime-watch-website/
├── backend/                 # NestJS API
│   ├── src/
│   │   ├── auth/
│   │   ├── anime/
│   │   ├── episodes/
│   │   ├── users/
│   │   └── common/
│   ├── prisma/
│   └── package.json
├── frontend/               # Next.js App
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── package.json
└── README.md
```

---

## Cài Đặt Môi Trường

### Yêu Cầu Hệ Thống
- Node.js >= 18.x
- PostgreSQL >= 14.x
- Redis >= 6.x
- npm hoặc yarn

### Cài Đặt Dependencies
```bash
# Cài đặt PostgreSQL
# Windows: Download từ https://www.postgresql.org/download/windows/
# Mac: brew install postgresql
# Linux: sudo apt-get install postgresql

# Cài đặt Redis
# Windows: Download từ https://github.com/microsoftarchive/redis/releases
# Mac: brew install redis
# Linux: sudo apt-get install redis-server
```

---

## Backend API (NestJS)

### Bước 1: Khởi Tạo Project NestJS

```bash
# Tạo thư mục backend
mkdir backend
cd backend

# Cài đặt NestJS CLI (nếu chưa có)
npm i -g @nestjs/cli

# Tạo project NestJS
nest new . --package-manager npm

# Cài đặt các dependencies cần thiết
npm install @nestjs/jwt @nestjs/passport @nestjs/config @nestjs/cache-manager
npm install passport passport-jwt passport-local bcrypt
npm install @prisma/client prisma
npm install cache-manager cache-manager-redis-store redis
npm install class-validator class-transformer
npm install @nestjs/throttler

# Dev dependencies
npm install -D @types/passport-jwt @types/passport-local @types/bcrypt
```

### Bước 2: Cấu Hình Prisma

```bash
# Khởi tạo Prisma
npx prisma init
```

**File: `prisma/schema.prisma`**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  username  String   @unique
  password  String
  avatar    String?
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  watchHistory WatchHistory[]
  favorites    Favorite[]
  
  @@map("users")
}

enum Role {
  USER
  ADMIN
}

model Anime {
  id          String    @id @default(uuid())
  title       String
  titleEn     String?
  description String?
  poster      String
  banner      String?
  status      AnimeStatus @default(ONGOING)
  type        AnimeType   @default(TV)
  releaseDate DateTime?
  rating      Float?
  views       Int        @default(0)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  
  genres      Genre[]
  episodes    Episode[]
  favorites   Favorite[]
  
  @@map("animes")
}

enum AnimeStatus {
  ONGOING
  COMPLETED
  UPCOMING
}

enum AnimeType {
  TV
  MOVIE
  OVA
  ONA
}

model Genre {
  id        String   @id @default(uuid())
  name      String   @unique
  slug      String   @unique
  animes    Anime[]
  
  @@map("genres")
}

model Episode {
  id          String   @id @default(uuid())
  animeId     String
  episodeNumber Int
  title       String?
  description String?
  thumbnail   String?
  videoUrl    String
  duration    Int?     // seconds
  views       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  anime       Anime    @relation(fields: [animeId], references: [id], onDelete: Cascade)
  watchHistory WatchHistory[]
  
  @@unique([animeId, episodeNumber])
  @@map("episodes")
}

model Favorite {
  id        String   @id @default(uuid())
  userId    String
  animeId   String
  createdAt DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  anime     Anime    @relation(fields: [animeId], references: [id], onDelete: Cascade)
  
  @@unique([userId, animeId])
  @@map("favorites")
}

model WatchHistory {
  id         String   @id @default(uuid())
  userId     String
  episodeId  String
  progress   Float    @default(0) // 0-1
  watchedAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  episode   Episode  @relation(fields: [episodeId], references: [id], onDelete: Cascade)
  
  @@unique([userId, episodeId])
  @@map("watch_history")
}
```

**File: `.env` (Backend)**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/anime_db?schema=public"
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
PORT=3001
```

Chạy migration:
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### Bước 3: Cấu Hình NestJS Modules

**File: `src/app.module.ts`**
```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AnimeModule } from './anime/anime.module';
import { EpisodeModule } from './episodes/episodes.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.register({
      isGlobal: true,
      store: 'redis',
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
    }),
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 100,
    }),
    PrismaModule,
    AuthModule,
    AnimeModule,
    EpisodeModule,
    UsersModule,
  ],
})
export class AppModule {}
```

**File: `src/prisma/prisma.module.ts`**
```typescript
import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

**File: `src/prisma/prisma.service.ts`**
```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

### Bước 4: Authentication Module

**File: `src/auth/auth.module.ts`**
```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN') },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

**File: `src/auth/auth.service.ts`**
```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    };
  }

  async register(email: string, username: string, password: string) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.usersService.create({
      email,
      username,
      password: hashedPassword,
    });
    return this.login(user);
  }
}
```

**File: `src/auth/auth.controller.ts`**
```typescript
import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(
    @Body() body: { email: string; username: string; password: string },
  ) {
    return this.authService.register(body.email, body.username, body.password);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile')
  async getProfile(@Request() req) {
    return req.user;
  }
}
```

**File: `src/auth/strategies/jwt.strategy.ts`**
```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findById(payload.sub);
    return { id: user.id, email: user.email, username: user.username, role: user.role };
  }
}
```

**File: `src/auth/strategies/local.strategy.ts`**
```typescript
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
```

**File: `src/auth/guards/jwt-auth.guard.ts`**
```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

**File: `src/auth/guards/local-auth.guard.ts`**
```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
```

### Bước 5: Anime Module

**File: `src/anime/anime.module.ts`**
```typescript
import { Module } from '@nestjs/common';
import { AnimeController } from './anime.controller';
import { AnimeService } from './anime.service';

@Module({
  controllers: [AnimeController],
  providers: [AnimeService],
  exports: [AnimeService],
})
export class AnimeModule {}
```

**File: `src/anime/anime.service.ts`**
```typescript
import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';

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
    const where = search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { titleEn: { contains: search, mode: 'insensitive' } },
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
```

**File: `src/anime/anime.controller.ts`**
```typescript
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
```

### Bước 6: Episodes Module

**File: `src/episodes/episodes.module.ts`**
```typescript
import { Module } from '@nestjs/common';
import { EpisodesController } from './episodes.controller';
import { EpisodesService } from './episodes.service';

@Module({
  controllers: [EpisodesController],
  providers: [EpisodesService],
})
export class EpisodeModule {}
```

**File: `src/episodes/episodes.service.ts`**
```typescript
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
```

**File: `src/episodes/episodes.controller.ts`**
```typescript
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
```

### Bước 7: Users Module

**File: `src/users/users.module.ts`**
```typescript
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';

@Module({
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

**File: `src/users/users.service.ts`**
```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(data: { email: string; username: string; password: string }) {
    return this.prisma.user.create({ data });
  }
}
```

### Bước 8: Main Entry Point

**File: `src/main.ts`**
```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe());

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Backend API running on http://localhost:${port}`);
}
bootstrap();
```

---

## Frontend (Next.js)

### Bước 1: Khởi Tạo Next.js Project

```bash
# Tạo thư mục frontend
cd ..
mkdir frontend
cd frontend

# Tạo Next.js project với TypeScript và Tailwind
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir

# Cài đặt dependencies
npm install @tanstack/react-query @tanstack/react-query-devtools
npm install axios
npm install hls.js
npm install js-cookie
npm install @types/js-cookie
```

### Bước 2: Cấu Hình TanStack Query

**File: `lib/react-query.ts`**
```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});
```

**File: `app/layout.tsx`**
```typescript
'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/react-query';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>
        <QueryClientProvider client={queryClient}>
          {children}
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </body>
    </html>
  );
}
```

### Bước 3: API Client Setup

**File: `lib/api.ts`**
```typescript
import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor để thêm JWT token
api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (email: string, username: string, password: string) =>
    api.post('/auth/register', { email, username, password }),
  getProfile: () => api.post('/auth/profile'),
};

// Anime API
export const animeAPI = {
  getAll: (page = 1, limit = 20, search?: string) =>
    api.get('/anime', { params: { page, limit, search } }),
  getOne: (id: string) => api.get(`/anime/${id}`),
  getPopular: (limit = 10) => api.get('/anime/popular', { params: { limit } }),
};

// Episodes API
export const episodesAPI = {
  getOne: (animeId: string, episodeNumber: number) =>
    api.get(`/episodes/${animeId}/${episodeNumber}`),
  updateProgress: (episodeId: string, progress: number) =>
    api.post(`/episodes/${episodeId}/progress`, { progress }),
};
```

### Bước 4: Custom Hooks với TanStack Query

**File: `hooks/useAnime.ts`**
```typescript
import { useQuery } from '@tanstack/react-query';
import { animeAPI } from '@/lib/api';

export const useAnimes = (page = 1, limit = 20, search?: string) => {
  return useQuery({
    queryKey: ['animes', page, limit, search],
    queryFn: () => animeAPI.getAll(page, limit, search).then((res) => res.data),
  });
};

export const useAnime = (id: string) => {
  return useQuery({
    queryKey: ['anime', id],
    queryFn: () => animeAPI.getOne(id).then((res) => res.data),
    enabled: !!id,
  });
};

export const usePopularAnimes = (limit = 10) => {
  return useQuery({
    queryKey: ['animes', 'popular', limit],
    queryFn: () => animeAPI.getPopular(limit).then((res) => res.data),
  });
};
```

**File: `hooks/useEpisode.ts`**
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { episodesAPI } from '@/lib/api';

export const useEpisode = (animeId: string, episodeNumber: number) => {
  return useQuery({
    queryKey: ['episode', animeId, episodeNumber],
    queryFn: () =>
      episodesAPI.getOne(animeId, episodeNumber).then((res) => res.data),
    enabled: !!animeId && !!episodeNumber,
  });
};

export const useUpdateProgress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ episodeId, progress }: { episodeId: string; progress: number }) =>
      episodesAPI.updateProgress(episodeId, progress).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['episode'] });
    },
  });
};
```

### Bước 5: Video Player Component với hls.js

**File: `components/VideoPlayer.tsx`**
```typescript
'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

interface VideoPlayerProps {
  src: string;
  onProgress?: (progress: number) => void;
  initialProgress?: number;
}

export default function VideoPlayer({
  src,
  onProgress,
  initialProgress = 0,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Khởi tạo HLS
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      hlsRef.current = hls;

      // Khôi phục progress
      if (initialProgress > 0) {
        video.addEventListener('loadedmetadata', () => {
          video.currentTime = video.duration * initialProgress;
        });
      }

      // Track progress
      const handleTimeUpdate = () => {
        if (video.duration) {
          const progress = video.currentTime / video.duration;
          onProgress?.(progress);
        }
      };
      video.addEventListener('timeupdate', handleTimeUpdate);

      return () => {
        hls.destroy();
        video.removeEventListener('timeupdate', handleTimeUpdate);
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = src;
    }
  }, [src, initialProgress, onProgress]);

  return (
    <div className="relative w-full bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        className="w-full h-auto"
        controls
        playsInline
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
    </div>
  );
}
```

### Bước 6: Anime Pages

**File: `app/page.tsx`**
```typescript
import { usePopularAnimes, useAnimes } from '@/hooks/useAnime';
import AnimeCard from '@/components/AnimeCard';
import Link from 'next/link';

export default function HomePage() {
  const { data: popularAnimes, isLoading: popularLoading } = usePopularAnimes(10);
  const { data: animesData, isLoading: animesLoading } = useAnimes(1, 20);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Anime Watch</h1>

        {/* Popular Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Phổ Biến</h2>
          {popularLoading ? (
            <div>Loading...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {popularAnimes?.map((anime: any) => (
                <AnimeCard key={anime.id} anime={anime} />
              ))}
            </div>
          )}
        </section>

        {/* All Animes */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Tất Cả Anime</h2>
          {animesLoading ? (
            <div>Loading...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {animesData?.data?.map((anime: any) => (
                <AnimeCard key={anime.id} anime={anime} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
```

**File: `components/AnimeCard.tsx`**
```typescript
import Link from 'next/link';
import Image from 'next/image';

interface AnimeCardProps {
  anime: {
    id: string;
    title: string;
    poster: string;
    rating?: number;
  };
}

export default function AnimeCard({ anime }: AnimeCardProps) {
  return (
    <Link href={`/anime/${anime.id}`}>
      <div className="group cursor-pointer">
        <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-2">
          <Image
            src={anime.poster}
            alt={anime.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform"
          />
        </div>
        <h3 className="text-sm font-medium line-clamp-2">{anime.title}</h3>
        {anime.rating && (
          <p className="text-xs text-gray-400">⭐ {anime.rating.toFixed(1)}</p>
        )}
      </div>
    </Link>
  );
}
```

**File: `app/anime/[id]/page.tsx`**
```typescript
import { useAnime } from '@/hooks/useAnime';
import { useEpisode } from '@/hooks/useEpisode';
import VideoPlayer from '@/components/VideoPlayer';
import { useParams, useSearchParams } from 'next/navigation';

export default function AnimeDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const animeId = params.id as string;
  const episodeNumber = parseInt(searchParams.get('ep') || '1');

  const { data: anime, isLoading } = useAnime(animeId);
  const { data: episode } = useEpisode(animeId, episodeNumber);

  if (isLoading) return <div>Loading...</div>;
  if (!anime) return <div>Anime not found</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Anime Info */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{anime.title}</h1>
          <p className="text-gray-300 mb-4">{anime.description}</p>
          <div className="flex gap-4">
            {anime.genres?.map((genre: any) => (
              <span key={genre.id} className="px-3 py-1 bg-blue-600 rounded">
                {genre.name}
              </span>
            ))}
          </div>
        </div>

        {/* Video Player */}
        {episode && (
          <div className="mb-8">
            <h2 className="text-2xl mb-4">
              Episode {episode.episodeNumber}: {episode.title}
            </h2>
            <VideoPlayer src={episode.videoUrl} />
          </div>
        )}

        {/* Episodes List */}
        <div>
          <h3 className="text-xl mb-4">Danh Sách Tập</h3>
          <div className="grid grid-cols-4 md:grid-cols-10 gap-2">
            {anime.episodes?.map((ep: any) => (
              <a
                key={ep.id}
                href={`/anime/${animeId}?ep=${ep.episodeNumber}`}
                className={`p-2 text-center rounded ${
                  ep.episodeNumber === episodeNumber
                    ? 'bg-blue-600'
                    : 'bg-gray-800 hover:bg-gray-700'
                }`}
              >
                {ep.episodeNumber}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Bước 7: Authentication

**File: `app/login/page.tsx`**
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import Cookies from 'js-cookie';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await authAPI.login(email, password);
      Cookies.set('token', response.data.access_token, { expires: 7 });
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 p-8 rounded-lg w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-6 text-white">Đăng Nhập</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 mb-4 bg-gray-700 text-white rounded"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 mb-4 bg-gray-700 text-white rounded"
          required
        />
        <button
          type="submit"
          className="w-full p-3 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Đăng Nhập
        </button>
      </form>
    </div>
  );
}
```

### Bước 8: Environment Variables

**File: `.env.local` (Frontend)**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## Tích Hợp và Kết Nối

### 1. Chạy Backend
```bash
cd backend
npm run start:dev
```

### 2. Chạy Frontend
```bash
cd frontend
npm run dev
```

### 3. Khởi Động Services
```bash
# PostgreSQL
# Windows: pg_ctl -D "C:\Program Files\PostgreSQL\14\data" start
# Mac/Linux: sudo service postgresql start

# Redis
# Windows: redis-server
# Mac/Linux: redis-server
```

---

## Deployment

### Backend Deployment (Vercel/Railway/Render)

1. **Environment Variables**:
   - `DATABASE_URL`
   - `REDIS_HOST`, `REDIS_PORT`
   - `JWT_SECRET`
   - `FRONTEND_URL`

2. **Build Command**: `npm run build`
3. **Start Command**: `npm run start:prod`

### Frontend Deployment (Vercel)

1. **Environment Variables**:
   - `NEXT_PUBLIC_API_URL`

2. **Build**: Tự động build khi deploy

### Database Migration
```bash
# Production migration
npx prisma migrate deploy
```

---

## Tính Năng Bổ Sung

### 1. Search Functionality
- Implement search với debounce
- Full-text search trong PostgreSQL

### 2. Favorites System
- Thêm/ xóa favorite
- Lưu vào database

### 3. Watch History
- Lưu progress tự động
- Hiển thị lịch sử xem

### 4. Recommendations
- Dựa trên genres và views
- Sử dụng Redis cache

### 5. Rate Limiting
- Đã có ThrottlerModule trong NestJS

---

## Lưu Ý Quan Trọng

1. **Security**:
   - Luôn validate input
   - Sử dụng HTTPS trong production
   - Bảo vệ JWT secret
   - Rate limiting

2. **Performance**:
   - Redis caching cho queries thường dùng
   - Image optimization với Next.js Image
   - Lazy loading cho video player

3. **Video Streaming**:
   - Đảm bảo HLS files được serve đúng cách
   - CORS configuration cho video files
   - CDN cho video content

4. **Database**:
   - Indexes cho các trường thường query
   - Connection pooling
   - Regular backups

---

## Tài Liệu Tham Khảo

- [NestJS Documentation](https://docs.nestjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TanStack Query](https://tanstack.com/query/latest)
- [hls.js Documentation](https://github.com/video-dev/hls.js/)

---

Chúc bạn triển khai thành công! 🚀

