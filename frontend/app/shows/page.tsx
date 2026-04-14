'use client';

import { Suspense } from 'react';
import BrowsePage from '@/components/BrowsePage';

export default function ShowsPage() {
  return (
    <Suspense>
      <BrowsePage
        title="Phim bộ"
        subtitle="Phim truyền hình, anime và series dài tập hấp dẫn"
        defaultGenre="hoat-hinh"
        baseRoute="/shows"
      />
    </Suspense>
  );
}
