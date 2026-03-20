'use client';

import { useAnime } from '@/hooks/useAnime';
import { useMutation, useQuery } from '@tanstack/react-query';
import Cookies from 'js-cookie';
import { userMediaAPI } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';

export default function AnimeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const filmSlug = params.id as string;

  const { data: filmDetail, isLoading } = useAnime(filmSlug);
  if (isLoading) return <div className="min-h-screen bg-gray-900 text-white p-8">Loading...</div>;
  if (!filmDetail?.movie) return <div className="min-h-screen bg-gray-900 text-white p-8">Phim không tồn tại</div>;

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
      if (/th\u1ec3 lo\u1ea1i/i.test(groupName)) typeParam = 'theLoai';
      else if (/qu\u1ed1c gia/i.test(groupName)) typeParam = 'quocGia';
      else if (/\u0111\u1ebfn/i.test(groupName) || /n\u0103m/i.test(groupName)) typeParam = 'nam';

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

  const token = Cookies.get('token');

  const favoriteStatusQuery = useQuery({
    queryKey: ['favorite', filmSlug],
    queryFn: () => userMediaAPI.getFavoriteStatus(filmSlug).then((r) => r.data),
    enabled: !!token,
    retry: 0,
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: () => userMediaAPI.toggleFavorite(filmSlug).then((r) => r.data),
    onSuccess: () => {
      favoriteStatusQuery.refetch();
    },
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="rounded-xl overflow-hidden border border-gray-700 bg-gray-800">
            {poster && (
              <div className="w-full h-64">
                <img src={poster} alt={movie.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-6">
              <h1 className="text-4xl font-bold mb-3">{movie.name}</h1>
              <p className="text-gray-300 mb-4">{movie.description}</p>

              <div className="flex flex-wrap gap-2 mb-4">
                {categoryChips.slice(0, 20).map((chip, idx) => (
                  <button
                    key={`${chip.typeParam}:${chip.slug}:${idx}`}
                    type="button"
                    className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700"
                    onClick={() => {
                      const params = new URLSearchParams();
                      params.set('page', '1');
                      params.delete('keyword');
                      params.delete('theLoai');
                      params.delete('quocGia');
                      params.delete('nam');
                      params.set(chip.typeParam, chip.slug);
                      router.push(`/?${params.toString()}`);
                    }}
                  >
                    {chip.name}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                {token ? (
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 hover:bg-gray-800"
                    disabled={toggleFavoriteMutation.isPending}
                    onClick={() => toggleFavoriteMutation.mutate()}
                  >
                    {favoriteStatusQuery.data?.favorited ? 'Đã yêu thích' : 'Yêu thích'}
                  </button>
                ) : (
                  <div className="text-sm text-gray-400">Đăng nhập để dùng wishlist.</div>
                )}

                <button
                  type="button"
                  className="px-5 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold"
                  onClick={() => router.push(`/watch/${movie.slug}?ep=${defaultEpisodeNumber}`)}
                >
                  Xem ngay
                </button>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl mb-4">Danh Sách Tập</h3>
          <div className="grid grid-cols-4 md:grid-cols-10 gap-2">
            {episodes.map((ep: any) => (
              <button
                key={ep.episodeNumber}
                type="button"
                className={`p-2 text-center rounded ${
                  ep.episodeNumber === defaultEpisodeNumber
                    ? 'bg-blue-600'
                    : 'bg-gray-800 hover:bg-gray-700'
                }`}
                onClick={() => router.push(`/watch/${movie.slug}?ep=${ep.episodeNumber}`)}
              >
                {ep.episodeNumber}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

