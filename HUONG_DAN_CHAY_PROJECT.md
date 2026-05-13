# HƯỚNG DẪN CHẠY PROJECT (LOCAL)

Project: `Anime_watch_website` (Next.js + NestJS + PostgreSQL + Redis)

## 1) Chuẩn bị
1. Node.js >= 18
2. PostgreSQL (khuyến nghị >= 14)
3. Redis (khuyến nghị >= 6)

## 2) Cấu hình môi trường

### Backend (`backend/.env`)
Mở `backend/.env` và đảm bảo có các biến sau:
- `DATABASE_URL` (ví dụ: `postgresql://postgres:1@localhost:5432/anime_db?schema=public`)
- `REDIS_HOST`, `REDIS_PORT` (ví dụ `localhost:6379`)
- `JWT_SECRET`, `JWT_EXPIRES_IN` (ví dụ `7d`)
- `PORT` (mặc định `3001`)
- `FRONTEND_URL` (nếu bạn muốn CORS theo domain frontend; backend hiện cho phép mặc định `http://localhost:3000`)
- `NGUONPHIM_API_BASE_URL` (tuỳ chọn; nếu không có thì mặc định dùng `https://phim.nguonc.com/api`)

> Lưu ý: nếu PostgreSQL chưa có database `anime_db`, hãy tạo trước (xem phần 3).

### Frontend (`frontend/.env.local`)
Mở `frontend/.env.local` và đảm bảo:
- `NEXT_PUBLIC_API_URL=http://localhost:3001`

## 3) Tạo database & chạy migration
1. Tạo database PostgreSQL tên `anime_db` (tên phải khớp với `DATABASE_URL`)
2. Chạy migration:
```powershell
cd e:\Pet_project\Anime_watch_website\backend
npm install
npx prisma migrate dev
```

## 4) Khởi động Redis
Redis cần chạy trước khi backend dùng cache store redis:
```powershell
# Cách nhanh (tuỳ máy của bạn): đảm bảo service redis-server đã chạy
```

## 5) Chạy backend
```powershell
cd e:\Pet_project\Anime_watch_website\backend
npm run start:dev
```
Backend sẽ chạy tại `http://localhost:3001`.

## 6) Chạy frontend
```powershell
cd e:\Pet_project\Anime_watch_website\frontend
npm install
npm run dev
```
Frontend chạy tại `http://localhost:3000`.

## 7) Test nhanh
1. Mở `http://localhost:3000` để xem danh sách phim, search, pagination.
2. Vào trang login `http://localhost:3000/login`.
3. Sau khi login (JWT token lưu cookie `token`), test:
   - Toggle wishlist ở trang chi tiết `/anime/[slug]`
   - Xem phim riêng `/watch/[slug]?ep=1` để kiểm tra resume + lưu progress.

## Troubleshooting (nếu lỗi)
- Lỗi connect DB: kiểm tra `DATABASE_URL`, port PostgreSQL (5432), và database `anime_db`.
- Lỗi cache/redis: kiểm tra Redis đang chạy và đúng `REDIS_HOST/REDIS_PORT`.
- Lỗi Prisma env không đọc: đảm bảo chạy `npx prisma ...` từ đúng thư mục `backend` và file `.env` nằm trong `backend/`.

---

# CHẠY BẰNG DOCKER

Project đã có sẵn `docker-compose.yml`, `backend/Dockerfile` và `frontend/Dockerfile`. Chạy toàn bộ stack (PostgreSQL + Redis + Backend + Frontend) chỉ với một lệnh.

## Yêu cầu

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/Mac) hoặc Docker Engine + Docker Compose plugin (Linux)
- Không cần cài Node.js, PostgreSQL hay Redis trên máy

## 1) Chạy local (localhost)

```powershell
# Tại thư mục gốc của project
cd e:\Pet_project\Anime_watch_website

docker compose up --build -d
```

Sau khi build xong (lần đầu mất 2–5 phút):

| Service   | URL                     |
|-----------|-------------------------|
| Frontend  | http://localhost:3000   |
| Backend   | http://localhost:3001   |
| PostgreSQL| localhost:5432          |
| Redis     | localhost:6379          |

> **Migration tự động:** Backend tự chạy `prisma migrate deploy` khi khởi động, không cần làm thủ công.

## 2) Biến môi trường

Tạo file `.env` tại thư mục gốc (cùng cấp `docker-compose.yml`) để override giá trị mặc định:

```env
# Bắt buộc đổi trong production
JWT_SECRET=your_strong_secret_here

# URL backend mà BROWSER của client sẽ gọi tới
# Local: giữ nguyên localhost:3001
# Server/VPS: đổi thành IP hoặc domain thực
NEXT_PUBLIC_API_URL=http://localhost:3001

# CORS cho backend (domain frontend)
FRONTEND_URL=http://localhost:3000
```

> ⚠️ `NEXT_PUBLIC_API_URL` được bake vào bundle Next.js lúc build. Nếu deploy lên server, phải đặt đúng IP/domain **trước khi** chạy `docker compose up --build`.

## 3) Chạy trên server / VPS

```bash
# Ví dụ: server có IP 123.45.67.89, backend expose port 3001
export JWT_SECRET=your_strong_secret
export NEXT_PUBLIC_API_URL=http://123.45.67.89:3001
export FRONTEND_URL=http://123.45.67.89:3000

docker compose up --build -d
```

Hoặc tạo file `.env` rồi chạy:

```bash
docker compose --env-file .env up --build -d
```

## 4) Các lệnh quản lý thường dùng

```powershell
# Xem log realtime tất cả service
docker compose logs -f

# Xem log của một service cụ thể
docker compose logs -f backend
docker compose logs -f frontend

# Dừng tất cả (giữ data)
docker compose stop

# Dừng và xóa container (giữ volume data)
docker compose down

# Dừng, xóa container VÀ xóa toàn bộ data (reset sạch)
docker compose down -v

# Rebuild một service sau khi sửa code
docker compose up --build -d backend
docker compose up --build -d frontend

# Chạy migration thủ công (nếu cần)
docker compose exec backend npx prisma migrate deploy

# Mở psql vào database
docker compose exec postgres psql -U postgres -d anime_db
```

## 5) Cấu trúc Docker

```
docker-compose.yml
├── postgres    — PostgreSQL 16 Alpine, volume: postgres_data
├── redis       — Redis 7 Alpine, volume: redis_data
├── backend     — NestJS build từ backend/Dockerfile (multi-stage)
│                 tự chạy prisma migrate deploy khi start
└── frontend    — Next.js build từ frontend/Dockerfile (standalone output)
                  NEXT_PUBLIC_API_URL được truyền qua build arg
```

## Troubleshooting Docker

- **Frontend không gọi được backend:** Kiểm tra `NEXT_PUBLIC_API_URL` đã đúng IP/domain chưa. Biến này phải đúng lúc `docker compose build`, không thể đổi sau khi build xong.
- **Backend lỗi migration:** Chạy `docker compose logs backend` để xem chi tiết. Thường do postgres chưa ready — thử `docker compose restart backend`.
- **Port đã bị dùng:** Đổi port trong `docker-compose.yml`, ví dụ `"3002:3001"` để map cổng ngoài 3002 vào trong 3001.
- **Xóa cache build Docker:** `docker compose build --no-cache`

