'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Cookies from 'js-cookie';

import AnimeCard from '@/components/AnimeCard';
import { sourceAPI, userMediaAPI } from '@/lib/api';

// Popular filters — slugs must match phim.nguonc.com API
const GENRES = [
  { slug: 'hanh-dong', name: 'Hành Động' },
  { slug: 'tinh-cam', name: 'Tình Cảm' },
  { slug: 'hai-huoc', name: 'Hài Hước' },
  { slug: 'kinh-di', name: 'Kinh Dị' },
  { slug: 'co-trang', name: 'Cổ Trang' },
  { slug: 'vien-tuong', name: 'Viễn Tưởng' },
  { slug: 'tam-ly', name: 'Tâm Lý' },
  { slug: 'hoat-hinh', name: 'Hoạt Hình' },
  { slug: 'chien-tranh', name: 'Chiến Tranh' },
  { slug: 'bi-an', name: 'Bí Ẩn' },
  { slug: 'gia-dinh', name: 'Gia Đình' },
  { slug: 'vo-thuat', name: 'Võ Thuật' },
];

const COUNTRIES = [
  { slug: 'trung-quoc', name: 'Trung Quốc' },
  { slug: 'han-quoc', name: 'Hàn Quốc' },
  { slug: 'nhat-ban', name: 'Nhật Bản' },
  { slug: 'viet-nam', name: 'Việt Nam' },
  { slug: 'au-my', name: 'Âu Mỹ' },
  { slug: 'hong-kong', name: 'Hồng Kông' },
  { slug: 'thai-lan', name: 'Thái Lan' },
  { slug: 'dai-loan', name: 'Đài Loan' },
];

const YEARS = ['2025', '2024', '2023', '2022', '2021', '2020'];

type FilterTab = 'genre' | 'country' | 'year';

export default function HomeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = useMemo(() => {
    const raw = searchParams.get('page');
    const n = raw ? parseInt(raw, 10) : 1;
    return Number.isFinite(n) && n > 0 ? n : 1;
  }, [searchParams]);

  const keyword = searchParams.get('keyword') ?? '';
  const theLoai = searchParams.get('theLoai') ?? '';
  const quocGia = searchParams.get('quocGia') ?? '';
  const nam = searchParams.get('nam') ?? '';

  const [keywordInput, setKeywordInput] = useState(keyword);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterTab, setFilterTab] = useState<FilterTab>('genre');

  const filmsQuery = useQuery({
    queryKey: ['films', page, keyword, theLoai, quocGia, nam],
    queryFn: async () => {
      if (keyword.trim()) return sourceAPI.searchFilms(keyword.trim()).then((r) => r.data);
      if (theLoai) return sourceAPI.getFilmsTheLoai(theLoai, page).then((r) => r.data);
      if (quocGia) return sourceAPI.getFilmsQuocGia(quocGia, page).then((r) => r.data);
      if (nam) return sourceAPI.getFilmsNamPhatHanh(nam, page).then((r) => r.data);
      return sourceAPI.getFilmsUpdated(page).then((r) => r.data);
    },
    placeholderData: (prev) => prev,
    retry: 2,
  });

  const suggestionsQuery = useQuery({
    queryKey: ['film-suggestions', keywordInput],
    queryFn: () => sourceAPI.searchFilms(keywordInput.trim()).then((r) => r.data),
    enabled: keywordInput.trim().length >= 2 && keywordInput.trim() !== keyword.trim(),
    retry: 1,
  });

  const token = Cookies.get('token');

  const continueQuery = useQuery({
    queryKey: ['watch', 'continue'],
    queryFn: () => userMediaAPI.getContinueWatching({ limit: 6 }).then((r) => r.data),
    enabled: !!token,
    retry: 0,
  });

  const recsQuery = useQuery({
    queryKey: ['recommendations'],
    queryFn: () => userMediaAPI.getRecommendations(12).then((r) => r.data),
    enabled: !!token,
    retry: 0,
    staleTime: 10 * 60 * 1000,
  });

  const items = filmsQuery.data?.items ?? [];
  const paginate = filmsQuery.data?.paginate;

  // Build active filter label
  const activeFilterLabel = (() => {
    if (keyword.trim()) return `Kết quả: "${keyword.trim()}"`;
    if (theLoai) return `Thể loại: ${GENRES.find((g) => g.slug === theLoai)?.name ?? theLoai}`;
    if (quocGia) return `Quốc gia: ${COUNTRIES.find((c) => c.slug === quocGia)?.name ?? quocGia}`;
    if (nam) return `Năm: ${nam}`;
    return 'Phim mới cập nhật';
  })();

  function applyFilter(type: 'theLoai' | 'quocGia' | 'nam', slug: string) {
    const current = searchParams.get(type);
    const params = new URLSearchParams();
    params.set('page', '1');
    if (current !== slug) params.set(type, slug);
    router.push(`/?${params.toString()}`);
    setFilterOpen(false);
  }

  function clearFilters() {
    router.push('/');
    setKeywordInput('');
    setFilterOpen(false);
  }

  const hasActiveFilter = !!(keyword || theLoai || quocGia || nam);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">

        {/* Search + Filter row */}
        <div className="mb-6 flex gap-2">
          <div className="relative flex-1">
            <input
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && keywordInput.trim()) {
                  const params = new URLSearchParams();
                  params.set('keyword', keywordInput.trim());
                  params.set('page', '1');
                  router.push(`/?${params.toString()}`);
                }
              }}
              placeholder="Tìm phim... (Enter để tìm)"
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 border border-gray-700"
            />

            {suggestionsQuery.isFetching && (
              <div className="absolute right-3 top-3.5 text-xs text-gray-400">Đang tìm...</div>
            )}

            {suggestionsQuery.data?.items?.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg overflow-hidden shadow-xl">
                {suggestionsQuery.data.items.slice(0, 8).map((it: any) => (
                  <button
                    key={it.slug}
                    type="button"
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-700 flex items-center gap-3 border-b border-gray-700/50 last:border-0"
                    onClick={() => {
                      setKeywordInput(it.name);
                      const params = new URLSearchParams();
                      params.set('keyword', it.name);
                      params.set('page', '1');
                      router.push(`/?${params.toString()}`);
                    }}
                  >
                    <img
                      src={it.thumb_url}
                      alt={it.name}
                      className="w-10 h-14 object-cover rounded flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-semibold line-clamp-1 text-sm">{it.name}</div>
                      <div className="text-xs text-gray-400">{it.total_episodes ?? '-'} tập</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter toggle */}
          <button
            type="button"
            onClick={() => setFilterOpen((v) => !v)}
            className={`px-4 py-3 rounded-lg border transition-colors flex items-center gap-2 text-sm font-medium
              ${filterOpen ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-300 hover:text-white'}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M7 12h10M11 20h2" />
            </svg>
            Lọc
            {hasActiveFilter && !keyword && (
              <span className="w-2 h-2 rounded-full bg-blue-400" />
            )}
          </button>
        </div>

        {/* Filter panel */}
        {filterOpen && (
          <div className="mb-6 bg-gray-800 border border-gray-700 rounded-xl p-5">
            {/* Tab bar */}
            <div className="flex gap-1 mb-4 border-b border-gray-700 pb-3">
              {(['genre', 'country', 'year'] as FilterTab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilterTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                    ${filterTab === tab ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  {tab === 'genre' ? 'Thể loại' : tab === 'country' ? 'Quốc gia' : 'Năm'}
                </button>
              ))}
              {hasActiveFilter && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="ml-auto px-3 py-1.5 text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>

            {filterTab === 'genre' && (
              <div className="flex flex-wrap gap-2">
                {GENRES.map((g) => (
                  <button
                    key={g.slug}
                    type="button"
                    onClick={() => applyFilter('theLoai', g.slug)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors
                      ${theLoai === g.slug
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'}`}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            )}

            {filterTab === 'country' && (
              <div className="flex flex-wrap gap-2">
                {COUNTRIES.map((c) => (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() => applyFilter('quocGia', c.slug)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors
                      ${quocGia === c.slug
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'}`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}

            {filterTab === 'year' && (
              <div className="flex flex-wrap gap-2">
                {YEARS.map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => applyFilter('nam', y)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors
                      ${nam === y
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'}`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Continue watching */}
        {token && (continueQuery.data ?? []).length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">Tiếp tục xem</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {(continueQuery.data ?? []).map((it: any) => (
                <div key={`${it.slug}:${it.episodeNumber}`} className="relative">
                  <AnimeCard
                    anime={{ id: it.slug, title: it.title, poster: it.poster_url }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700 rounded-b">
                    <div
                      className="h-full bg-blue-500 rounded-b"
                      style={{ width: `${Math.round((it.progress ?? 0) * 100)}%` }}
                    />
                  </div>
                  <div className="absolute top-1 right-1 bg-black/70 text-xs text-white px-1.5 py-0.5 rounded">
                    Tập {it.episodeNumber}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Personalized recommendations */}
        {token && !hasActiveFilter && (recsQuery.data?.items ?? []).length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xl font-semibold">
                {recsQuery.data?.basis === 'personalized' ? 'Gợi ý cho bạn' : 'Phim nổi bật'}
              </h2>
              {recsQuery.data?.basis === 'personalized' && recsQuery.data?.topGenres?.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  {recsQuery.data.topGenres.slice(0, 3).map((g: { slug: string; name: string }) => (
                    <span key={g.slug} className="px-2 py-0.5 text-xs bg-blue-900/50 border border-blue-700/50 text-blue-300 rounded-full">
                      {g.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {recsQuery.isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-lg bg-gray-800 animate-pulse h-48" />
                  ))
                : (recsQuery.data?.items ?? []).slice(0, 12).map((film: any) => (
                    <AnimeCard
                      key={film.slug}
                      anime={{ id: film.slug, title: film.name, poster: film.poster_url }}
                    />
                  ))}
            </div>
          </section>
        )}

        {/* Main films grid */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">{activeFilterLabel}</h2>
            <div className="text-sm text-gray-400">
              Trang {paginate?.current_page ?? page} / {paginate?.total_page ?? '-'}
            </div>
          </div>

          {filmsQuery.isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, idx) => (
                <div key={idx} className="rounded-lg bg-gray-800 animate-pulse h-64" />
              ))}
            </div>
          ) : filmsQuery.isError ? (
            <div className="text-gray-300 bg-gray-800 border border-gray-700 rounded-lg p-4">
              Không tải được danh sách phim.{' '}
              <button
                type="button"
                className="underline hover:text-white"
                onClick={() => filmsQuery.refetch()}
              >
                Thử lại
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="text-gray-400 py-12 text-center">
              Không tìm thấy phim nào.{' '}
              <button type="button" className="underline hover:text-white" onClick={clearFilters}>
                Xóa bộ lọc
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {items.map((film: any) => (
                <AnimeCard
                  key={film.slug}
                  anime={{ id: film.slug, title: film.name, poster: film.poster_url }}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!filmsQuery.isError && items.length > 0 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                type="button"
                className="px-5 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-40 transition-colors"
                disabled={(paginate?.current_page ?? page) <= 1}
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set('page', String((paginate?.current_page ?? page) - 1));
                  router.push(`/?${params.toString()}`);
                }}
              >
                ← Trước
              </button>
              <span className="text-sm text-gray-400">
                {paginate?.current_page ?? page} / {paginate?.total_page ?? '?'}
              </span>
              <button
                type="button"
                className="px-5 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-40 transition-colors"
                disabled={(paginate?.current_page ?? page) >= (paginate?.total_page ?? page)}
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set('page', String((paginate?.current_page ?? page) + 1));
                  router.push(`/?${params.toString()}`);
                }}
              >
                Sau →
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
