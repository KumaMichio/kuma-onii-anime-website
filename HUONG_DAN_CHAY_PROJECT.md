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

