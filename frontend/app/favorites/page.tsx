'use client';

import Cookies from 'js-cookie';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import AnimeCard from '@/components/AnimeCard';
import { userMediaAPI } from '@/lib/api';

export default function FavoritesPage() {
  const router = useRouter();
  const token = Cookies.get('token');

  const favoritesQuery = useQuery({
    queryKey: ['favorites'],
    queryFn: () => userMediaAPI.listFavorites().then((r) => r.data),
    enabled: !!token,
    retry: 0,
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Wishlist</h1>
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700"
            onClick={() => router.push('/')}
          >
            Trang chủ
          </button>
        </div>

        {!token ? (
          <div className="text-gray-300">Đăng nhập để xem wishlist.</div>
        ) : favoritesQuery.isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, idx) => (
              <div key={idx} className="rounded-lg bg-gray-800 animate-pulse h-72" />
            ))}
          </div>
        ) : (favoritesQuery.data ?? []).length === 0 ? (
          <div className="text-gray-300">Bạn chưa yêu thích phim nào.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {(favoritesQuery.data ?? []).map((f: any) => (
              <AnimeCard
                key={f.slug}
                anime={{
                  id: f.slug,
                  title: f.title,
                  poster: f.poster_url,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

