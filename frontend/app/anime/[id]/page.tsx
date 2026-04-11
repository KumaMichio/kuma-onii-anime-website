'use client';

import { useAnime } from '@/hooks/useAnime';
import { useMutation, useQuery } from '@tanstack/react-query';
import { userMediaAPI } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

export default function AnimeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const filmSlug = params.id as string;

  const { data: filmDetail, isLoading } = useAnime(filmSlug);

  // Hooks must be called unconditionally
  const favoriteStatusQuery = useQuery({
    queryKey: ['favorite', filmSlug],
    queryFn: () => userMediaAPI.getFavoriteStatus(filmSlug).then((r) => r.data),
    enabled: !!user && !!filmSlug,
    retry: 0,
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: () => userMediaAPI.toggleFavorite(filmSlug).then((r) => r.data),
    onSuccess: (data) => {
      favoriteStatusQuery.refetch();
      showToast(
        data.favorited ? 'Đã thêm vào yêu thích' : 'Đã xóa khỏi yêu thích',
        data.favorited ? 'success' : 'info',
      );
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-gray-900 text-white p-8">
        <div className="container mx-auto max-w-5xl">
          <div className="h-64 bg-gray-800 rounded-xl animate-pulse mb-6" />
          <div className="h-8 bg-gray-800 rounded animate-pulse w-1/2 mb-4" />
          <div className="h-4 bg-gray-800 rounded animate-pulse mb-2" />
          <div className="h-4 bg-gray-800 rounded animate-pulse w-3/4" />
        </div>
      </div>
    );
  }

  if (!filmDetail?.movie) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center text-gray-400">Phim không tồn tại</div>
      </div>
    );
  }

  const movie = filmDetail.movie;
  const poster = movie.poster_url ?? movie.thumb_url;
  const episodesServers = Array.isArray(movie?.episodes) ? movie.episodes : [];
  const firstServer = episodesServers[0];
  const episodeItems = Array.isArray(firstServer?.items) ? firstServer.items : [];

  const defaultEpisodeNumber = (() => {
    const s = String(movie?.current_episode ?? '');
    const m = s.match(/(\d+)/);
    if (!m) return 1;
    const n = parseInt(m[1], 10);
    return Number.isFinite(n) && n > 0 ? n : 1;
  })();

  const categoryChips = (() => {
    const category = movie?.category ?? {};
    const chips: Array<{ typeParam: 'theLoai' | 'quocGia' | 'nam'; slug: string; name: string }> = [];
    for (const key of Object.keys(category)) {
      const group = category[key]?.group;
      const list = category[key]?.list;
      const groupName = String(group?.name ?? '');
      let typeParam: 'theLoai' | 'quocGia' | 'nam' | null = null;
      if (/thể loại/i.test(groupName)) typeParam = 'theLoai';
      else if (/quốc gia/i.test(groupName)) typeParam = 'quocGia';
      else if (/đến/i.test(groupName) || /năm/i.test(groupName)) typeParam = 'nam';

      if (!typeParam || !Array.isArray(list)) continue;

      for (const it of list) {
        chips.push({
          typeParam,
          slug: String(it?.id ?? ''),
          name: String(it?.name ?? ''),
        });
      }
    }
    return chips;
  })();

  const episodes = episodeItems
    .map((it: any) => ({
      episodeNumber: (() => {
        const n = Number(String(it?.name ?? '').match(/(\d+)/)?.[1] ?? NaN);
        return Number.isFinite(n) ? (n as number) : null;
      })(),
      slug: String(it?.slug ?? ''),
      label: String(it?.name ?? ''),
    }))
    .filter((x: any) => x.episodeNumber !== null);

  const isFavorited = favoriteStatusQuery.data?.favorited ?? false;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-5xl">

        {/* Film header card */}
        <div className="mb-8 rounded-xl overflow-hidden border border-gray-700 bg-gray-800">
          {poster && (
            <div className="w-full h-56 md:h-72 relative">
              <img src={poster} alt={movie.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-800 via-transparent to-transparent" />
            </div>
          )}

          <div className="p-6">
            <h1 className="text-3xl md:text-4xl font-bold mb-1">{movie.name}</h1>
            {movie.original_name && movie.original_name !== movie.name && (
              <p className="text-gray-400 text-sm mb-3">{movie.original_name}</p>
            )}

            {/* Meta badges */}
            <div className="flex flex-wrap gap-2 text-xs mb-4">
              {movie.current_episode && (
                <span className="px-2 py-0.5 bg-gray-700 text-gray-300 rounded">{movie.current_episode}</span>
              )}
              {movie.quality && (
                <span className="px-2 py-0.5 bg-green-900/60 text-green-400 rounded">{movie.quality}</span>
              )}
              {movie.language && (
                <span className="px-2 py-0.5 bg-gray-700 text-gray-300 rounded">{movie.language}</span>
              )}
            </div>

            {movie.description && (
              <p className="text-gray-300 mb-5 text-sm leading-relaxed line-clamp-4">{movie.description}</p>
            )}

            {/* Category chips */}
            <div className="flex flex-wrap gap-2 mb-5">
              {categoryChips.slice(0, 20).map((chip, idx) => (
                <button
                  key={`${chip.typeParam}:${chip.slug}:${idx}`}
                  type="button"
                  className="px-3 py-1 text-xs bg-gray-700 hover:bg-blue-600 rounded-full transition-colors"
                  onClick={() => {
                    const p = new URLSearchParams();
                    p.set('page', '1');
                    p.set(chip.typeParam, chip.slug);
                    router.push(`/?${p.toString()}`);
                  }}
                >
                  {chip.name}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                className="px-6 py-2.5 bg-green-600 hover:bg-green-500 rounded-lg font-semibold transition-colors"
                onClick={() => router.push(`/watch/${movie.slug}?ep=${defaultEpisodeNumber}`)}
              >
                ▶ Xem ngay
              </button>

              {user ? (
                <button
                  type="button"
                  className={`px-4 py-2.5 rounded-lg border font-medium transition-colors
                    ${isFavorited
                      ? 'bg-yellow-900/40 border-yellow-700 text-yellow-400 hover:bg-yellow-900/60'
                      : 'bg-gray-700 border-gray-600 text-gray-300 hover:text-white hover:bg-gray-600'}`}
                  disabled={toggleFavoriteMutation.isPending}
                  onClick={() => toggleFavoriteMutation.mutate()}
                >
                  {isFavorited ? '♥ Đã yêu thích' : '♡ Yêu thích'}
                </button>
              ) : (
                <button
                  type="button"
                  className="px-4 py-2.5 rounded-lg border border-gray-600 text-gray-400 text-sm hover:text-white transition-colors"
                  onClick={() => router.push('/login')}
                >
                  Đăng nhập để yêu thích
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Episode list */}
        {episodes.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">
              Danh sách tập{' '}
              <span className="text-sm text-gray-400 font-normal">({episodes.length} tập)</span>
            </h3>
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-12 gap-2">
              {episodes.map((ep: any) => (
                <button
                  key={ep.episodeNumber}
                  type="button"
                  className={`py-2 text-center rounded text-sm font-medium transition-colors
                    ${ep.episodeNumber === defaultEpisodeNumber
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 hover:bg-gray-700 text-gray-300'}`}
                  onClick={() => router.push(`/watch/${movie.slug}?ep=${ep.episodeNumber}`)}
                >
                  {ep.episodeNumber}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
