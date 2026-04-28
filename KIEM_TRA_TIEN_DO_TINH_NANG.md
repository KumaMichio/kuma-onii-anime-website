# KIỂM TRA TIẾN ĐỘ HOÀN THÀNH TÍNH NĂNG

Project: **kuma-onii-anime-website**
Thời điểm kiểm tra: `2026-04-28`

## Legend
- `[x]` Hoàn thành — hoạt động đúng end-to-end
- `[~]` Một phần — có code nhưng chưa đầy đủ hoặc có vấn đề
- `[ ]` Chưa triển khai

---

## 1. Authentication

| Tính năng | Trạng thái | Ghi chú |
|---|---|---|
| Đăng ký (email, username, password) | `[x]` | DTO `RegisterDto` + bcrypt |
| Đăng nhập (email, password) | `[x]` | Passport Local + JWT |
| JWT guard bảo vệ route | `[x]` | `JwtAuthGuard` dùng trên tất cả `/user-media/*` |
| Lưu token vào cookie | `[x]` | Cookie `token`, 7 ngày |
| Auto-restore session khi reload | `[x]` | Đọc từ cookie + localStorage |
| Đăng xuất | `[x]` | Xoá cookie + localStorage |
| Social login (Google, v.v.) | `[ ]` | Chỉ có nút UI, chưa tích hợp |

---

## 2. Trang chủ (Home)

| Tính năng | Trạng thái | Ghi chú |
|---|---|---|
| Hero banner phim nổi bật | `[x]` | |
| Tìm kiếm với gợi ý dropdown | `[x]` | Live search gọi API |
| Lọc theo thể loại / quốc gia / năm | `[x]` | Tab + dropdown filters |
| Grid phim với pagination | `[x]` | |
| Row "Tiếp tục xem" (Continue Watching) | `[~]` | UI có, nhưng không lưu progress nữa → luôn rỗng |
| Row gợi ý phim (Recommendations) | `[x]` | Dùng API `/user-media/recommendations` hoặc popular |
| Genre quick-pills | `[x]` | |

---

## 3. Trang chi tiết phim (`/anime/[id]`)

| Tính năng | Trạng thái | Ghi chú |
|---|---|---|
| Hero backdrop + poster | `[x]` | |
| Tiêu đề, mô tả, badge chất lượng | `[x]` | |
| Nút "Xem ngay" | `[x]` | |
| Toggle yêu thích | `[x]` | Yêu cầu đăng nhập |
| Category chips (click để lọc) | `[x]` | |
| Danh sách tập | `[x]` | |
| Row phim tương tự | `[x]` | Lấy theo thể loại đầu tiên |
| Nút quay lại | `[x]` | |

---

## 4. Trang xem phim (`/watch/[slug]`)

| Tính năng | Trạng thái | Ghi chú |
|---|---|---|
| Phát video qua iframe embed | `[x]` | Dùng `embed` URL từ streamc.xyz — hoạt động |
| Custom VideoPlayer (HLS.js) | `[~]` | Fallback khi không có embed; CDN `sing.phimmoi.net` hiện bị block |
| Stream proxy qua backend | `[~]` | Endpoint `/source/stream/proxy` có, nhưng CDN upstream từ chối |
| Nút quay lại + tiêu đề tập | `[x]` | |
| Danh sách tập bên dưới player | `[x]` | |
| CTA tập tiếp theo | `[x]` | |
| Lưu tiến độ xem (watch progress) | `[ ]` | Đã xoá khỏi frontend theo yêu cầu |

---

## 5. Yêu thích (Favorites)

| Tính năng | Trạng thái | Ghi chú |
|---|---|---|
| Toggle yêu thích từ trang chi tiết | `[x]` | |
| Danh sách yêu thích (`/favorites`) | `[x]` | |
| Kiểm tra trạng thái đã yêu thích | `[x]` | |
| Xoá yêu thích | `[x]` | Gọi lại toggle |

---

## 6. Browse (Movies / Shows)

| Tính năng | Trạng thái | Ghi chú |
|---|---|---|
| Trang phim lẻ (`/movies`) | `[x]` | Dùng `BrowsePage` component |
| Trang phim bộ/hoạt hình (`/shows`) | `[x]` | Default genre `hoat-hinh` |
| Lọc theo thể loại / quốc gia / năm | `[x]` | Dropdown trong BrowsePage |
| Pagination | `[x]` | |
| Xoá bộ lọc | `[x]` | |

---

## 7. Trang Profile (`/profile`)

| Tính năng | Trạng thái | Ghi chú |
|---|---|---|
| Hiển thị avatar, username, email | `[x]` | |
| Thống kê (yêu thích, tập đã xem) | `[~]` | Số liệu từ backend đúng; "tập đã xem" sẽ là 0 vì không lưu progress |
| Top genre preferences | `[~]` | Tính từ watch_history + favorites; nếu không có progress thì chỉ dựa vào favorites |
| Row "Tiếp tục xem" | `[~]` | Luôn rỗng vì không lưu progress |
| Showcase yêu thích (6 phim) | `[x]` | |
| Row gợi ý | `[x]` | |
| Nút đăng xuất | `[x]` | |

---

## 8. Profiles Selector (`/profiles`)

| Tính năng | Trạng thái | Ghi chú |
|---|---|---|
| UI chọn profile | `[~]` | Chỉ có UI tĩnh |
| Thêm/xoá profile | `[ ]` | Chưa có backend hỗ trợ multi-profile |

---

## 9. Backend — Source Proxy

| Tính năng | Trạng thái | Ghi chú |
|---|---|---|
| Proxy API `phim.nguonc.com` | `[x]` | Redis cache TTL 4-5 phút |
| Retry + exponential backoff | `[x]` | 3 lần, 300ms/600ms/1200ms |
| Tìm kiếm phim | `[x]` | |
| Lọc theo thể loại / quốc gia / năm | `[x]` | |
| Chi tiết phim | `[x]` | |
| Stream proxy (M3U8 rewrite) | `[~]` | Code xong; CDN upstream (`sing.phimmoi.net`) không accessible |

---

## 10. Backend — User Media

| Tính năng | Trạng thái | Ghi chú |
|---|---|---|
| Toggle / list / status favorites | `[x]` | |
| Lưu / lấy watch progress | `[x]` | Backend hoàn chỉnh; frontend đã bỏ |
| Continue watching list | `[x]` | Backend hoàn chỉnh; frontend không dùng |
| Thống kê người dùng | `[x]` | |
| Gợi ý theo genre (personalized) | `[x]` | |
| `ensureAnimeBySlug` / `ensureEpisodeBySlug` | `[x]` | Auto-upsert từ external API |

---

## 11. Kỹ thuật / Infrastructure

| Tính năng | Trạng thái | Ghi chú |
|---|---|---|
| Redis caching | `[x]` | |
| Rate limiting (global) | `[x]` | 100 req/60s |
| DTO validation (auth + user-media) | `[x]` | `RegisterDto`, `LoginDto`, `UpdateProgressDto` đã wired |
| Toast notifications | `[x]` | |
| Navbar responsive | `[x]` | |
| AnimeCard component | `[x]` | |
| Admin panel | `[ ]` | Chỉ có field `role` trong DB |
| Unit/E2E tests | `[ ]` | Chưa viết |
| CI/CD | `[ ]` | |

---

## Tóm tắt

| Nhóm | Hoàn thành | Một phần | Chưa làm |
|---|---|---|---|
| Authentication | 6/7 | 0 | 1 (social login) |
| Home | 5/7 | 2 | 0 |
| Anime Detail | 8/8 | 0 | 0 |
| Watch / Player | 4/7 | 2 | 1 (progress) |
| Favorites | 4/4 | 0 | 0 |
| Browse | 5/5 | 0 | 0 |
| Profile | 3/5 | 2 | 0 |
| Profiles Selector | 0/2 | 1 | 1 |
| Source Proxy | 5/6 | 1 | 0 |
| User Media Backend | 6/6 | 0 | 0 |
| Infrastructure | 5/11 | 0 | 3 |

**Mức độ hoàn thành tổng thể: ~80%** — Core tính năng người dùng cuối hoạt động ổn định. Các phần còn thiếu chủ yếu là watch progress (đã bỏ có chủ ý), social login, admin panel và tests.
