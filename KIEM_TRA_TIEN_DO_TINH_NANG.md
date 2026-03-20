# KIỂM TRA TIẾN ĐỘ HOÀN THÀNH TÍNH NĂNG

Project: *Anime Watch Website*  
Thời điểm kiểm tra: `2026-03-20`  

## Legend trạng thái
- `[x]` Có triển khai đủ phần chính (backend/frontend tương ứng)
- `[~]` Có một phần / chưa tích hợp hoàn chỉnh
- `[ ]` Chưa triển khai (hoặc thiếu phần quan trọng)

## Checklist tính năng (kèm bằng chứng trong code)

| Tính năng | Trạng thái | Bằng chứng trong code | Còn thiếu / ghi chú |
|---|---:|---|---|
| Prisma schema & mô hình dữ liệu (User/Anime/Episode/Favorite/WatchHistory) | [x] | `backend/prisma/schema.prisma` (`User`, `Anime`, `Episode`, `Favorite`, `WatchHistory`) | - |
| Backend Auth: `POST /auth/register` | [x] | `backend/src/auth/auth.controller.ts` + `backend/src/auth/auth.service.ts` | Frontend hiện chỉ có `frontend/app/login/page.tsx` (chưa có trang Register/Profile) |
| Backend Auth: `POST /auth/login` (Local strategy) | [x] | `backend/src/auth/auth.controller.ts` + `backend/src/auth/strategies/local.strategy.ts` | - |
| Backend Auth: `POST /auth/profile` (JWT) | [x] | `backend/src/auth/auth.controller.ts` + `backend/src/auth/strategies/jwt.strategy.ts` | - |
| Throttler rate limiting module cấu hình | [~] | `backend/src/app.module.ts` (`ThrottlerModule.forRoot(...)`) | Chưa thấy `ThrottlerGuard`/decorator áp vào route cụ thể |
| Proxy phim + Cache + Retry | [x] | `backend/src/source/source.service.ts` + `backend/src/source/source.controller.ts` | Chưa có invalidation nâng cao theo sự kiện |
| Danh sách phim (updated/danh-sach/the-loai/quoc-gia/nam) | [x] | `/source/...` controllers + source service | UI filter dropdown cho các slug chưa có (mới có search + chip filter từ trang detail) |
| Tìm kiếm phim (gợi ý) | [x] | `GET /source/films/search` | Gợi ý hiện phụ thuộc endpoint search (MVP) |
| Lưu favorites theo user | [x] | `/user-media/favorites` + `/user-media/favorites/:filmSlug/status` | Chưa có trang “Wishlist” theo style nâng cao (nhưng có page `/favorites`) |
| Watch progress + Continue Watching theo user | [x] | `/user-media/watch/progress` + `/user-media/watch/continue` | Chưa có trang “watch history đầy đủ” (chỉ có continue watching) |
| Trang chủ: grid/list phim + skeleton + fallback | [x] | `frontend/components/HomeClient.tsx` + `frontend/app/page.tsx` | - |
| Trang chủ: Search + gợi ý khi gõ | [x] | `frontend/components/HomeClient.tsx` (calls `sourceAPI.searchFilms`) | Lọc theo genre/country/year trong UI home chưa có control riêng |
| Pagination (theo `paginate.current_page/total_page`) | [x] | `frontend/components/HomeClient.tsx` | - |
| Responsive + lazy load ảnh | [x] | `frontend/components/AnimeCard.tsx` dùng `<img loading="lazy" />` | - |
| Trang chi tiết phim + Banner/Poster + chips Thể loại/Quốc gia/Năm + Nút “Xem ngay” | [x] | `frontend/app/anime/[id]/page.tsx` | - |
| Trang chi tiết: Wishlist toggle | [x] | `frontend/app/anime/[id]/page.tsx` (`userMediaAPI.getFavoriteStatus` + `toggleFavorite`) | - |
| Route xem phim riêng | [x] | `frontend/app/watch/[slug]/page.tsx` | - |
| VideoPlayer: play/pause + fullscreen + resume progress | [x] | `frontend/components/VideoPlayer.tsx` + `frontend/app/watch/[slug]/page.tsx` | Chưa tối ưu “seek” chính xác theo framework player events (MVP) |
| Cache data để tránh gọi API liên tục | [x] | `backend/src/source/source.service.ts` (cache-manager) | - |
| Retry khi API lỗi | [x] | `backend/src/source/source.service.ts` (`fetchJsonWithRetry`) | - |
| Recommendations | [ ] | (chưa thấy endpoint/component recommendations) | - |
| Validation/DTO cho request | [~] | `backend/src/main.ts` (ValidationPipe) | Một số controller dùng inline type thay vì DTO class |

## Gợi ý kiểm thử nhanh (để tick `[x]/[~]/[ ]`)
1. Backend:
   - Gọi `GET /source/films/phim-moi-cap-nhat?page=1`
   - Gọi `GET /source/film/hoa-thien-cot`
   - Đăng nhập rồi gọi `POST /user-media/favorites/:filmSlug`
   - Gọi `POST /user-media/watch/progress` và kiểm tra `GET /user-media/watch/continue`
2. Frontend:
   - Vào `/` để xem danh sách + search + pagination
   - Vào `/anime/[slug]` để xem poster/banner, danh sách tập, và toggle wishlist
   - Vào `/watch/[slug]?ep=1` để test resume + fullscreen + lưu progress

