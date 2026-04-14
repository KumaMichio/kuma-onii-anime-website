'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Cookies from 'js-cookie';
import Link from 'next/link';

import { useAuth } from '@/contexts/AuthContext';
import { userMediaAPI } from '@/lib/api';
import AnimeCard from '@/components/AnimeCard';

function StatCard({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div
      className="rounded p-5 flex items-center gap-4"
      style={{ background: '#1f1f1f', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(229,9,20,0.15)' }}>
        <span style={{ color: '#E50914' }}>{icon}</span>
      </div>
      <div>
        <div className="text-2xl font-black text-white">{value}</div>
        <div className="text-xs" style={{ color: '#808080' }}>{label}</div>
      </div>
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#141414' }}>
        <div className="text-center">
          <p className="mb-4" style={{ color: '#808080' }}>Vui lòng đăng nhập để xem hồ sơ</p>
          <Link
            href="/login"
            className="px-6 py-3 font-bold text-white text-sm rounded hover:opacity-90 transition-all"
            style={{ background: '#E50914' }}
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  const stats = statsQuery.data;
  const topGenres: Array<{ slug: string; name: string }> = recsQuery.data?.topGenres ?? [];

  return (
    <div className="min-h-screen pt-20 pb-16" style={{ background: '#141414' }}>

      {/* ── PROFILE HEADER ── */}
      <div
        className="px-6 md:px-12 py-8 mb-8"
        style={{ background: 'linear-gradient(to bottom, rgba(229,9,20,0.08), transparent)' }}
      >
        <div className="max-w-5xl mx-auto flex items-center gap-5">
          <div
            className="w-16 h-16 md:w-20 md:h-20 rounded-lg flex items-center justify-center text-2xl md:text-3xl font-black text-white flex-shrink-0"
            style={{ background: '#E50914' }}
          >
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-0.5">
              <h1 className="text-2xl font-black text-white truncate">{user.username}</h1>
              {user.role === 'ADMIN' && (
                <span
                  className="px-2 py-0.5 text-xs font-bold rounded"
                  style={{ background: 'rgba(229,9,20,0.2)', color: '#E50914', border: '1px solid #E50914' }}
                >
                  ADMIN
                </span>
              )}
            </div>
            <p className="text-sm" style={{ color: '#808080' }}>{user.email}</p>
          </div>
          <button
            type="button"
            onClick={() => { logout(); router.push('/'); }}
            className="flex items-center gap-2 px-4 py-2 rounded text-sm transition-all hover:bg-white/5 flex-shrink-0"
            style={{ border: '1px solid rgba(255,255,255,0.15)', color: '#808080' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Đăng xuất
          </button>
        </div>
      </div>

      <div className="px-6 md:px-12 max-w-5xl mx-auto">

        {/* ── STATS ── */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-white mb-4">Thống kê</h2>
          {statsQuery.isLoading ? (
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 rounded animate-pulse" style={{ background: '#1f1f1f' }} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <StatCard
                label="Phim đã xem"
                value={stats?.uniqueAnimeWatchedCount ?? 0}
                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.361a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                </svg>}
              />
              <StatCard
                label="Tập đã xem"
                value={stats?.watchedEpisodesCount ?? 0}
                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>}
              />
              <StatCard
                label="Yêu thích"
                value={stats?.favoritesCount ?? 0}
                icon={<svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>}
              />
            </div>
          )}
        </section>

        {/* ── GENRE PREFERENCES ── */}
        {topGenres.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-bold text-white mb-4">Thể loại yêu thích</h2>
            <div className="flex flex-wrap gap-2">
              {topGenres.map((g) => (
                <Link
                  key={g.slug}
                  href={`/?theLoai=${g.slug}&page=1`}
                  className="px-4 py-2 rounded-full text-sm font-medium transition-all hover:text-white"
                  style={{
                    background: 'rgba(229,9,20,0.12)',
                    border: '1px solid rgba(229,9,20,0.3)',
                    color: '#E50914',
                  }}
                >
                  {g.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── CONTINUE WATCHING ── */}
        {(continueQuery.data ?? []).length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-bold text-white mb-4">Đang xem dở</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {(continueQuery.data ?? []).map((it: any) => (
                <AnimeCard
                  key={`${it.slug}:${it.episodeNumber}`}
                  anime={{ id: it.slug, title: it.title, poster: it.poster_url }}
                  progress={it.progress}
                  episodeNumber={it.episodeNumber}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── FAVORITES ── */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Phim yêu thích</h2>
            {(favoritesQuery.data ?? []).length > 6 && (
              <Link
                href="/favorites"
                className="text-sm font-medium transition-colors"
                style={{ color: '#E50914' }}
              >
                Xem tất cả ({(favoritesQuery.data ?? []).length})
              </Link>
            )}
          </div>
          {favoritesQuery.isLoading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] rounded-sm animate-pulse" style={{ background: '#1f1f1f' }} />
              ))}
            </div>
          ) : (favoritesQuery.data ?? []).length === 0 ? (
            <p className="text-sm" style={{ color: '#808080' }}>Chưa có phim yêu thích nào.</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {(favoritesQuery.data ?? []).slice(0, 6).map((f: any) => (
                <AnimeCard
                  key={f.slug}
                  anime={{ id: f.slug, title: f.title, poster: f.poster_url }}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── RECOMMENDATIONS ── */}
        {(recsQuery.data?.items ?? []).length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-white mb-4">
              {recsQuery.data?.basis === 'personalized' ? 'Gợi ý dựa trên sở thích của bạn' : 'Phim nổi bật'}
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {(recsQuery.data?.items ?? []).map((film: any) => (
                <AnimeCard
                  key={film.slug}
                  anime={{ id: film.slug, title: film.name, poster: film.poster_url }}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
