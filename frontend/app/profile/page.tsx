'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Cookies from 'js-cookie';
import Link from 'next/link';

import { useAuth } from '@/contexts/AuthContext';
import { userMediaAPI } from '@/lib/api';
import AnimeCard from '@/components/AnimeCard';

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 text-center">
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const token = Cookies.get('token');

  const statsQuery = useQuery({
    queryKey: ['user', 'stats'],
    queryFn: () => userMediaAPI.getStats().then((r) => r.data),
    enabled: !!token,
    retry: 0,
  });

  const recsQuery = useQuery({
    queryKey: ['recommendations'],
    queryFn: () => userMediaAPI.getRecommendations(8).then((r) => r.data),
    enabled: !!token,
    retry: 0,
  });

  const continueQuery = useQuery({
    queryKey: ['watch', 'continue'],
    queryFn: () => userMediaAPI.getContinueWatching({ limit: 6 }).then((r) => r.data),
    enabled: !!token,
    retry: 0,
  });

  const favoritesQuery = useQuery({
    queryKey: ['favorites'],
    queryFn: () => userMediaAPI.listFavorites().then((r) => r.data),
    enabled: !!token,
    retry: 0,
  });

  if (!token || !user) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Vui lòng đăng nhập để xem hồ sơ</p>
          <Link href="/login" className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-500">
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  const stats = statsQuery.data;
  const topGenres: Array<{ slug: string; name: string }> = recsQuery.data?.topGenres ?? [];

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-5xl">

        {/* User header */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-8 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-bold flex-shrink-0">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold truncate">{user.username}</h1>
            <p className="text-gray-400 text-sm">{user.email}</p>
            {user.role === 'ADMIN' && (
              <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-purple-700 rounded-full">Admin</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => { logout(); router.push('/'); }}
            className="px-4 py-2 text-sm text-red-400 border border-red-800 rounded-lg hover:bg-red-900/30 transition-colors flex-shrink-0"
          >
            Đăng xuất
          </button>
        </div>

        {/* Stats */}
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Thống kê</h2>
        <div className="grid grid-cols-3 gap-4 mb-10">
          {statsQuery.isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-gray-800 rounded-xl h-24 animate-pulse" />
            ))
          ) : (
            <>
              <StatCard label="Phim đã xem" value={stats?.uniqueAnimeWatchedCount ?? 0} />
              <StatCard label="Tập đã xem" value={stats?.watchedEpisodesCount ?? 0} />
              <StatCard label="Yêu thích" value={stats?.favoritesCount ?? 0} />
            </>
          )}
        </div>

        {/* Genre preferences */}
        {topGenres.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-semibold mb-3 text-gray-200">Thể loại yêu thích của bạn</h2>
            <div className="flex flex-wrap gap-2">
              {topGenres.map((g) => (
                <Link
                  key={g.slug}
                  href={`/?theLoai=${g.slug}&page=1`}
                  className="px-4 py-2 bg-blue-700/40 border border-blue-600/50 rounded-full text-sm text-blue-300 hover:bg-blue-600/50 transition-colors"
                >
                  {g.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Continue watching */}
        {(continueQuery.data ?? []).length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-200">Đang xem dở</h2>
              <Link href="/" className="text-sm text-blue-400 hover:text-blue-300">Trang chủ</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {(continueQuery.data ?? []).map((it: any) => (
                <div key={`${it.slug}:${it.episodeNumber}`} className="relative">
                  <AnimeCard
                    anime={{ id: it.slug, title: it.title, poster: it.poster_url }}
                  />
                  {/* Progress bar */}
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
          </div>
        )}

        {/* Favorites */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-200">Phim yêu thích</h2>
            {(favoritesQuery.data ?? []).length > 6 && (
              <Link href="/favorites" className="text-sm text-blue-400 hover:text-blue-300">
                Xem tất cả ({(favoritesQuery.data ?? []).length})
              </Link>
            )}
          </div>
          {favoritesQuery.isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-lg bg-gray-800 animate-pulse h-48" />
              ))}
            </div>
          ) : (favoritesQuery.data ?? []).length === 0 ? (
            <p className="text-gray-500 text-sm">Chưa có phim yêu thích nào.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {(favoritesQuery.data ?? []).slice(0, 6).map((f: any) => (
                <AnimeCard
                  key={f.slug}
                  anime={{ id: f.slug, title: f.title, poster: f.poster_url }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Recommendations */}
        {(recsQuery.data?.items ?? []).length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 text-gray-200">
              {recsQuery.data?.basis === 'personalized' ? 'Gợi ý dựa trên thói quen của bạn' : 'Phim nổi bật'}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(recsQuery.data?.items ?? []).map((film: any) => (
                <AnimeCard
                  key={film.slug}
                  anime={{ id: film.slug, title: film.name, poster: film.poster_url }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
