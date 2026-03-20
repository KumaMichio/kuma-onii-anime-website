'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Cookies from 'js-cookie';

import AnimeCard from '@/components/AnimeCard';
import { sourceAPI, userMediaAPI } from '@/lib/api';

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
    queryFn: () => userMediaAPI.getContinueWatching({ limit: 12 }).then((r) => r.data),
    enabled: !!token,
    retry: 0,
  });

  const items = filmsQuery.data?.items ?? [];
  const paginate = filmsQuery.data?.paginate;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Anime Watch</h1>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <input
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              placeholder="Tìm phim... (gõ để gợi ý)"
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 outline-none"
            />

            {suggestionsQuery.isFetching && (
              <div className="absolute right-3 top-3 text-xs text-gray-400">Đang tìm...</div>
            )}

            {suggestionsQuery.data?.items?.length > 0 && (
              <div className="absolute z-10 mt-2 w-full bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                {suggestionsQuery.data.items.slice(0, 8).map((it: any) => (
                  <button
                    key={it.slug}
                    type="button"
                    className="w-full text-left px-4 py-3 hover:bg-gray-700 flex items-center gap-3"
                    onClick={() => {
                      const params = new URLSearchParams(searchParams.toString());
                      params.set('keyword', keywordInput.trim());
                      params.delete('theLoai');
                      params.delete('quocGia');
                      params.delete('nam');
                      params.set('page', '1');
                      router.push(`/?${params.toString()}`);
                    }}
                  >
                    <img
                      src={it.thumb_url}
                      alt={it.name}
                      className="w-10 h-14 object-cover rounded"
                    />
                    <div>
                      <div className="font-semibold line-clamp-1">{it.name}</div>
                      <div className="text-xs text-gray-400">/{it.total_episodes ?? '-'}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Continue watching */}
        {token && (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Tiếp tục xem</h2>
            {continueQuery.isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="h-48 rounded-lg bg-gray-800 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(continueQuery.data ?? []).map((it: any) => (
                  <AnimeCard
                    key={`${it.slug}:${it.episodeNumber}`}
                    anime={{
                      id: it.slug,
                      title: it.title,
                      poster: it.poster_url,
                    }}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Films grid */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">
              {keyword.trim()
                ? `Kết quả: "${keyword.trim()}"`
                : theLoai
                  ? 'Thể loại'
                  : quocGia
                    ? 'Quốc gia'
                    : nam
                      ? 'Năm'
                      : 'Phim mới cập nhật'}
            </h2>

            <div className="text-sm text-gray-400">
              Trang {paginate?.current_page ?? page} / {paginate?.total_page ?? '-'}
            </div>
          </div>

          {filmsQuery.isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, idx) => (
                <div key={idx} className="rounded-lg bg-gray-800 animate-pulse h-72" />
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
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {items.map((film: any) => (
                <AnimeCard
                  key={film.slug}
                  anime={{
                    id: film.slug,
                    title: film.name,
                    poster: film.poster_url,
                    rating: undefined,
                  }}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between mt-8">
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-50"
              disabled={(paginate?.current_page ?? page) <= 1}
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set('page', String((paginate?.current_page ?? page) - 1));
                router.push(`/?${params.toString()}`);
              }}
            >
              Trước
            </button>

            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-50"
              disabled={(paginate?.current_page ?? page) >= (paginate?.total_page ?? page)}
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set('page', String((paginate?.current_page ?? page) + 1));
                router.push(`/?${params.toString()}`);
              }}
            >
              Sau
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

