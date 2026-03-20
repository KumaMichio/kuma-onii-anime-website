# Hướng Dẫn Setup Database

## Lỗi hiện tại
```
Can't reach database server at `localhost:5432`
```

## Giải pháp

### Bước 1: Kiểm tra PostgreSQL đã được cài đặt

Kiểm tra PostgreSQL đã được cài đặt:
```powershell
# Kiểm tra PostgreSQL service
Get-Service -Name postgresql*
```

### Bước 2: Khởi động PostgreSQL Service

**Trên Windows:**

1. **Cách 1: Qua Services**
   - Mở `Services` (Win + R, gõ `services.msc`)
   - Tìm service `postgresql-x64-XX` (XX là version)
   - Click chuột phải → Start

2. **Cách 2: Qua Command Line**
   ```powershell
   # Khởi động PostgreSQL service
   Start-Service postgresql-x64-14
   # Hoặc thay 14 bằng version của bạn
   ```

3. **Cách 3: Qua pg_ctl (nếu biết đường dẫn)**
   ```powershell
   # Tìm đường dẫn PostgreSQL (thường là C:\Program Files\PostgreSQL\14\bin)
   cd "C:\Program Files\PostgreSQL\14\bin"
   .\pg_ctl.exe -D "C:\Program Files\PostgreSQL\14\data" start
   ```

### Bước 3: Tạo Database

1. **Kết nối đến PostgreSQL:**
   ```powershell
   # Sử dụng psql
   psql -U postgres
   # Hoặc nếu có password
   psql -U postgres -W
   ```

2. **Tạo database:**
   ```sql
   CREATE DATABASE anime_db;
   ```

3. **Tạo user (tùy chọn):**
   ```sql
   CREATE USER anime_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE anime_db TO anime_user;
   ```

### Bước 4: Cấu hình .env

Tạo hoặc cập nhật file `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/anime_db?schema=public"
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=d859c8148a0aefb41dc220ed226a421127d783eb439775239986a145ce4ddb395b7d2897d6c15c4adb11d368e55072b2918ebd338b1bc30f0217a3946555643a
JWT_EXPIRES_IN=7d
PORT=3001
FRONTEND_URL=http://localhost:3000
```

**Lưu ý:** Thay `your_password` bằng password PostgreSQL của bạn.

### Bước 5: Chạy Migrations

Sau khi database đã được tạo và PostgreSQL đang chạy:

```powershell
cd backend
npx prisma migrate dev
npx prisma generate
```

### Bước 6: Kiểm tra kết nối

Test kết nối database:
```powershell
cd backend
npx prisma db pull
```

Nếu không có lỗi, database đã kết nối thành công!

## Troubleshooting

### Nếu PostgreSQL chưa được cài đặt:

1. **Download PostgreSQL:**
   - Truy cập: https://www.postgresql.org/download/windows/
   - Download PostgreSQL Installer
   - Cài đặt và nhớ password cho user `postgres`

2. **Hoặc dùng Docker:**
   ```powershell
   docker run --name postgres-anime -e POSTGRES_PASSWORD=your_password -e POSTGRES_DB=anime_db -p 5432:5432 -d postgres
   ```

### Nếu port 5432 đã được sử dụng:

1. Kiểm tra process đang dùng port:
   ```powershell
   netstat -ano | findstr :5432
   ```

2. Hoặc đổi port trong PostgreSQL config và cập nhật DATABASE_URL

### Nếu quên password PostgreSQL:

1. Reset password trong file `pg_hba.conf`
2. Hoặc tạo user mới với quyền admin

## Kiểm tra nhanh

```powershell
# Kiểm tra PostgreSQL đang chạy
Get-Service postgresql*

# Kiểm tra port 5432
Test-NetConnection -ComputerName localhost -Port 5432

# Test kết nối với psql
psql -U postgres -h localhost -p 5432 -d postgres
```

