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
    <div className="min-h-[calc(100vh-3.5rem)] bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Phim yêu thích</h1>

        {!token ? (
          <div className="text-center py-16">
            <p className="text-gray-400 mb-4">Đăng nhập để xem danh sách yêu thích.</p>
            <Link href="/login" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors">
              Đăng nhập
            </Link>
          </div>
        ) : favoritesQuery.isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, idx) => (
              <div key={idx} className="rounded-lg bg-gray-800 animate-pulse h-64" />
            ))}
          </div>
        ) : (favoritesQuery.data ?? []).length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 mb-4">Bạn chưa yêu thích phim nào.</p>
            <Link href="/" className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm">
              Khám phá phim
            </Link>
          </div>
        ) : (
          <>
            <p className="text-gray-400 text-sm mb-4">{(favoritesQuery.data ?? []).length} phim</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {(favoritesQuery.data ?? []).map((f: any) => (
                <AnimeCard
                  key={f.slug}
                  anime={{ id: f.slug, title: f.title, poster: f.poster_url }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
