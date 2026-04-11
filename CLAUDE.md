# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**kuma-onii-anime-website** is an anime streaming website with a Next.js frontend and NestJS backend. Content (anime metadata, episodes, streams) is proxied from the external `phim.nguonc.com` API — the local PostgreSQL database only stores user data (accounts, favorites, watch history). Redis is used for caching external API responses.

## Prerequisites

- Node.js >= 18
- PostgreSQL >= 14 (database: `anime_db`)
- Redis >= 6

## Environment Setup

**`backend/.env`** requires:
```
DATABASE_URL=postgresql://postgres:1@localhost:5432/anime_db?schema=public
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=<secret>
JWT_EXPIRES_IN=7d
PORT=3001
FRONTEND_URL=http://localhost:3000
NGUONPHIM_API_BASE_URL=https://phim.nguonc.com/api   # optional, this is the default
```

**`frontend/.env.local`** requires:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Commands

### Backend (`cd backend`)
```bash
npm install
npx prisma migrate dev          # run DB migrations
npm run start:dev               # dev server with watch (port 3001)
npm run build                   # compile
npm run start:prod              # run compiled build
npm run lint                    # ESLint --fix
npm run format                  # Prettier
npm test                        # unit tests (Jest)
npm run test:e2e                # end-to-end tests
npm run test:cov                # coverage report
```

Run a single test file:
```bash
npx jest src/app.controller.spec.ts
```

### Frontend (`cd frontend`)
```bash
npm install
npm run dev     # dev server (port 3000)
npm run build   # production build
npm run lint    # ESLint
```

## Architecture

### Backend (NestJS + Prisma)

`backend/src/` modules:

| Module | Purpose |
|---|---|
| `auth` | JWT + Passport local strategy; `POST /auth/login`, `/auth/register`, `/auth/profile` |
| `source` | Proxies and Redis-caches calls to `phim.nguonc.com` API; all endpoints under `/source/` |
| `user-media` | Favorites and watch-progress persistence; requires JWT; auto-upserts anime/episode rows from the external API on first interaction |
| `anime` | CRUD for the local `animes` table (rarely used directly; content comes from `source`) |
| `episodes` | CRUD for the local `episodes` table |
| `users` | User lookups used internally by `auth` |
| `prisma` | Singleton `PrismaService` injected app-wide |

**Key design pattern — `UserMediaService`**: when a user favorites a film or saves watch progress, `ensureAnimeBySlug` / `ensureEpisodeBySlug` fetch the external API via `SourceService` and upsert minimal rows into PostgreSQL so foreign keys are satisfied. The Anime `id` is the film slug string (not a UUID).

Rate limiting: `ThrottlerModule` — 100 requests per 60 seconds globally.

### Frontend (Next.js 16 + React 19)

`frontend/`:
- **`lib/api.ts`** — Axios instance with JWT bearer token interceptor (reads `token` cookie). Three API groups: `authAPI`, `sourceAPI`, `userMediaAPI`.
- **`lib/react-query.ts`** — shared `QueryClient`.
- **`hooks/`** — `useAnime.ts`, `useEpisode.ts` wrap React Query calls.
- **`app/`** — Next.js App Router pages:
  - `/` — home (film list, search, pagination via `sourceAPI`)
  - `/anime/[id]` — film detail + favorite toggle
  - `/watch/[slug]` — video player with watch progress resume
  - `/favorites` — user's saved films (requires login)
  - `/login` — auth form
- **`components/VideoPlayer.tsx`** — HLS.js-based player; reads/writes watch progress via `userMediaAPI`.
- JWT token is stored in the `token` cookie and attached to every API request.

### Database Schema (Prisma)

- `users` — email/username/password (bcrypt), role (USER/ADMIN)
- `animes` — keyed by slug string as `id`; populated on-demand by `UserMediaService`
- `episodes` — composite unique on `(animeId, episodeNumber)`; `id` is `"${animeId}:${episodeSlug}"`
- `favorites` — composite unique on `(userId, animeId)`
- `watch_history` — composite unique on `(userId, episodeId)`; `progress` is 0–1 float
