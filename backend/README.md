# Anime Watch Backend API

Backend API for Anime Watch website built with NestJS, PostgreSQL, Prisma, Redis, and JWT.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Setup environment variables:
```bash
# Copy .env.example to .env and update with your values
```

3. Run database migrations:
```bash
npx prisma migrate dev
npx prisma generate
```

4. Start development server:
```bash
npm run start:dev
```

## Tech Stack

- NestJS
- PostgreSQL
- Prisma ORM
- Redis
- JWT Authentication
- Passport
