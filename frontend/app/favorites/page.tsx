'use client';

import Cookies from 'js-cookie';
import { useQuery } from '@tanstack/react-query';

import AnimeCard from '@/components/AnimeCard';
import { userMediaAPI } from '@/lib/api';
import Link from 'next/link';

export default function FavoritesPage() {
  const token = Cookies.get('token');

  const favoritesQuery = useQuery({
    queryKey: ['favorites'],
    queryFn: () => userMediaAPI.listFavorites().then((r) => r.data),
    enabled: !!token,
    retry: 0,
  });

  return (
    <div className="min-h-screen pt-20 pb-16 px-6 md:px-12" style={{ background: '#141414' }}>

      <div className="mb-8">
        <h1 className="text-3xl font-black text-white mb-1">Danh sách yêu thích</h1>
        {(favoritesQuery.data ?? []).length > 0 && (
          <p className="text-sm" style={{ color: '#808080' }}>
            {(favoritesQuery.data ?? []).length} phim
          </p>
        )}
      </div>

      {!token ? (
        <div className="flex flex-col items-center justify-center py-24">
          <svg className="w-16 h-16 mb-4" style={{ color: '#333' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <p className="text-lg font-semibold text-white mb-2">Bạn chưa đăng nhập</p>
          <p className="text-sm mb-6" style={{ color: '#808080' }}>Đăng nhập để lưu phim yêu thích</p>
          <Link
            href="/login"
            className="px-6 py-3 font-bold text-white text-sm rounded transition-all hover:opacity-90"
            style={{ background: '#E50914' }}
          >
            Đăng nhập
          </Link>
        </div>

      ) : favoritesQuery.isLoading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
          {Array.from({ length: 14 }).map((_, idx) => (
            <div key={idx} className="aspect-[2/3] rounded-sm animate-pulse" style={{ background: '#1f1f1f' }} />
          ))}
        </div>

      ) : (favoritesQuery.data ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <svg className="w-16 h-16 mb-4" style={{ color: '#333' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <p className="text-lg font-semibold text-white mb-2">Chưa có phim yêu thích</p>
          <p className="text-sm mb-6" style={{ color: '#808080' }}>Khám phá và thêm phim vào danh sách</p>
          <Link
            href="/"
            className="px-6 py-3 font-bold text-white text-sm rounded transition-all hover:bg-white/10"
            style={{ background: 'rgba(109,109,110,0.7)' }}
          >
            Khám phá phim
          </Link>
        </div>

      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
          {(favoritesQuery.data ?? []).map((f: any) => (
            <AnimeCard
              key={f.slug}
              anime={{ id: f.slug, title: f.title, poster: f.poster_url }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
