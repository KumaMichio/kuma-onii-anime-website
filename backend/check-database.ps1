# Script kiểm tra và hướng dẫn setup PostgreSQL

Write-Host "=== Kiểm tra PostgreSQL ===" -ForegroundColor Cyan

# Kiểm tra PostgreSQL service
$pgServices = Get-Service -Name postgresql* -ErrorAction SilentlyContinue
if ($pgServices) {
    Write-Host "`n✅ Tìm thấy PostgreSQL services:" -ForegroundColor Green
    $pgServices | Format-Table Name, Status, DisplayName
} else {
    Write-Host "`n❌ Không tìm thấy PostgreSQL service" -ForegroundColor Red
    Write-Host "`nCó thể PostgreSQL chưa được cài đặt." -ForegroundColor Yellow
    Write-Host "Hãy cài đặt PostgreSQL từ: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
}

# Kiểm tra port 5432
Write-Host "`n=== Kiểm tra Port 5432 ===" -ForegroundColor Cyan
$portCheck = Test-NetConnection -ComputerName localhost -Port 5432 -WarningAction SilentlyContinue
if ($portCheck.TcpTestSucceeded) {
    Write-Host "✅ Port 5432 đang mở" -ForegroundColor Green
} else {
    Write-Host "❌ Port 5432 không mở hoặc PostgreSQL không chạy" -ForegroundColor Red
}

# Kiểm tra file .env
Write-Host "`n=== Kiểm tra .env file ===" -ForegroundColor Cyan
if (Test-Path .env) {
    Write-Host "✅ File .env tồn tại" -ForegroundColor Green
    $envContent = Get-Content .env
    if ($envContent -match "DATABASE_URL") {
        Write-Host "✅ DATABASE_URL đã được cấu hình" -ForegroundColor Green
        $dbUrl = ($envContent | Select-String "DATABASE_URL").Line
        Write-Host "   $dbUrl" -ForegroundColor Gray
    } else {
        Write-Host "❌ DATABASE_URL chưa được cấu hình trong .env" -ForegroundColor Red
    }
} else {
    Write-Host "❌ File .env không tồn tại" -ForegroundColor Red
    Write-Host "Hay tao file .env voi noi dung:" -ForegroundColor Yellow
    Write-Host 'DATABASE_URL="postgresql://postgres:your_password@localhost:5432/anime_db?schema=public"' -ForegroundColor Gray
    Write-Host 'REDIS_HOST=localhost' -ForegroundColor Gray
    Write-Host 'REDIS_PORT=6379' -ForegroundColor Gray
    Write-Host 'JWT_SECRET=d859c8148a0aefb41dc220ed226a421127d783eb439775239986a145ce4ddb395b7d2897d6c15c4adb11d368e55072b2918ebd338b1bc30f0217a3946555643a' -ForegroundColor Gray
    Write-Host 'JWT_EXPIRES_IN=7d' -ForegroundColor Gray
    Write-Host 'PORT=3001' -ForegroundColor Gray
    Write-Host 'FRONTEND_URL=http://localhost:3000' -ForegroundColor Gray
}

# Hướng dẫn tiếp theo
Write-Host "`n=== Hướng dẫn tiếp theo ===" -ForegroundColor Cyan
Write-Host "1. Đảm bảo PostgreSQL đã được cài đặt và đang chạy" -ForegroundColor Yellow
Write-Host "2. Tạo database: CREATE DATABASE anime_db;" -ForegroundColor Yellow
Write-Host "3. Cập nhật DATABASE_URL trong file .env với password đúng" -ForegroundColor Yellow
Write-Host "4. Chay migrations: npx prisma migrate dev" -ForegroundColor Yellow
Write-Host "`nXem file SETUP_DATABASE.md de biet chi tiet!" -ForegroundColor Cyan

