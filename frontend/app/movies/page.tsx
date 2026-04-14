'use client';

import { Suspense } from 'react';
import BrowsePage from '@/components/BrowsePage';

export default function MoviesPage() {
  return (
    <Suspense>
      <BrowsePage
        title="Phim lẻ"
        subtitle="Bộ sưu tập phim điện ảnh, phim ngắn từ khắp nơi trên thế giới"
        baseRoute="/movies"
      />
    </Suspense>
  );
}
